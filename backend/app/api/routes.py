import io
import json
import os
import asyncio
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Optional, Any
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, BackgroundTasks
from fastapi.responses import StreamingResponse
import pandas as pd

from backend.app.models.schemas import (
    ObservationRaw, AnalysisResponse, StationStatus, SensorHealthScore,
    AnomalyInjectionRequest, DemoScenario, FusionResult
)
from backend.app.core.config import settings
from backend.app.services.ingestion import AnalysisPipeline
from backend.app.simulation.generator import AWSDataGenerator
from backend.app.simulation.injector import AnomalyInjector
from backend.app.ml.benchmarks import ModelBenchmarkSuite
from backend.app.simulation.streamer import RealTimeStreamer
from backend.app.api.websocket import ws_manager

router = APIRouter()

# Instantiate singleton pipeline and streamer
pipeline = AnalysisPipeline(model_dir=settings.MODEL_DIR)
streamer = RealTimeStreamer(pipeline=pipeline)

# In-memory storage for detected anomaly events & recent observations
stored_events: List[Dict[str, Any]] = []
recent_observations: Dict[str, List[ObservationRaw]] = {}

# Register WebSocket broadcaster with streamer
async def broadcast_tick(analysis: AnalysisResponse):
    sid = analysis.observation.station_id
    if sid not in recent_observations:
        recent_observations[sid] = []
    recent_observations[sid].append(analysis.observation)
    if len(recent_observations[sid]) > 100:
        recent_observations[sid] = recent_observations[sid][-100:]

    if analysis.fusion.classification != "NORMAL":
        event = {
            "id": len(stored_events) + 1,
            "station_id": sid,
            "timestamp": analysis.observation.timestamp,
            "parameter": "temperature",
            "raw_value": analysis.observation.temperature,
            "classification": analysis.fusion.classification,
            "root_cause": analysis.fusion.root_cause,
            "severity": analysis.fusion.severity,
            "confidence": analysis.fusion.confidence,
            "final_anomaly_score": analysis.fusion.final_anomaly_score,
            "sensor_fault_prob": analysis.fusion.sensor_fault_probability,
            "weather_event_prob": analysis.fusion.weather_event_probability,
            "uncertainty_score": analysis.fusion.uncertainty_score,
            "summary": analysis.explainability.summary,
            "reasoning": analysis.explainability.reasoning,
            "action": analysis.fusion.recommended_action,
            "evidence": analysis.explainability.evidence_checklist,
            "shap": analysis.explainability.feature_attributions
        }
        stored_events.append(event)
        if len(stored_events) > 500:
            stored_events.pop(0)

    # Broadcast to WebSocket
    await ws_manager.broadcast({
        "type": "telemetry_tick",
        "data": analysis.model_dump()
    })

streamer.register_listener(broadcast_tick)

# Seed historical baseline on startup
def seed_initial_history():
    gen = AWSDataGenerator(random_seed=42)
    start_dt = datetime(2026, 6, 1, 8, 0)
    for sid in settings.DEFAULT_STATIONS.keys():
        series = gen.generate_series(sid, start_dt, num_steps=24, step_minutes=5)
        for obs in series:
            pipeline.process_observation(obs)
            if sid not in recent_observations:
                recent_observations[sid] = []
            recent_observations[sid].append(obs)

seed_initial_history()

# =============================================================================
# CORE API ENDPOINTS
# =============================================================================

@router.get("/health")
def get_health():
    return {
        "status": "healthy",
        "system": settings.PROJECT_NAME,
        "tagline": "When weather data looks wrong, determine whether the atmosphere changed — or the sensor did.",
        "models_loaded": {
            "isolation_forest": pipeline.iforest_engine.model is not None,
            "lstm_autoencoder": pipeline.lstm_engine.trained
        },
        "simulator_active": streamer.is_running,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@router.get("/stations", response_model=List[StationStatus])
def get_stations():
    result = []
    for sid, cfg in settings.DEFAULT_STATIONS.items():
        hist = pipeline.get_history(sid)
        last_obs = hist[-1] if hist else None
        
        # Calculate latest health
        health = pipeline.health_engine.update_and_calculate_health(
            last_obs or ObservationRaw(timestamp=datetime.now(timezone.utc).isoformat(), station_id=sid, temperature=28.0, pressure=1000.0, humidity=60.0),
            hist,
            is_anomaly=False
        )

        status_str = "HEALTHY"
        if health.overall_health < 70.0 or health.drift_detected:
            status_str = "WARNING"
        if health.overall_health < 50.0:
            status_str = "CRITICAL"

        result.append(StationStatus(
            station_id=sid,
            station_name=cfg.station_name,
            latitude=cfg.latitude,
            longitude=cfg.longitude,
            elevation=cfg.elevation,
            climate_zone=cfg.climate_zone,
            status=status_str,
            health=health,
            last_observation=last_obs
        ))
    return result

@router.get("/stations/{station_id}", response_model=StationStatus)
def get_station_detail(station_id: str):
    cfg = settings.DEFAULT_STATIONS.get(station_id)
    if not cfg:
        raise HTTPException(status_code=404, detail="Station not found")

    hist = pipeline.get_history(station_id)
    last_obs = hist[-1] if hist else None
    health = pipeline.health_engine.update_and_calculate_health(
        last_obs or ObservationRaw(timestamp=datetime.now(timezone.utc).isoformat(), station_id=station_id, temperature=28.0, pressure=1000.0, humidity=60.0),
        hist,
        is_anomaly=False
    )
    status_str = "HEALTHY"
    if health.overall_health < 70.0 or health.drift_detected:
        status_str = "WARNING"
    if health.overall_health < 50.0:
        status_str = "CRITICAL"

    return StationStatus(
        station_id=station_id,
        station_name=cfg.station_name,
        latitude=cfg.latitude,
        longitude=cfg.longitude,
        elevation=cfg.elevation,
        climate_zone=cfg.climate_zone,
        status=status_str,
        health=health,
        last_observation=last_obs
    )

@router.get("/observations")
def get_observations(
    station_id: Optional[str] = None,
    limit: int = Query(50, ge=1, le=500)
):
    if station_id:
        obs_list = recent_observations.get(station_id, [])
        return obs_list[-limit:]
    # All stations combined
    all_obs = []
    for sid, l in recent_observations.items():
        all_obs.extend(l[-limit:])
    return sorted(all_obs, key=lambda x: x.timestamp)[-limit:]

@router.post("/observations", response_model=AnalysisResponse)
def ingest_observation(obs: ObservationRaw):
    resp = pipeline.process_observation(obs)
    sid = obs.station_id
    if sid not in recent_observations:
        recent_observations[sid] = []
    recent_observations[sid].append(obs)
    return resp

@router.post("/analyze", response_model=AnalysisResponse)
def analyze_payload(obs: ObservationRaw):
    resp = pipeline.process_observation(obs)
    return resp

@router.get("/anomalies")
def get_anomalies(
    station_id: Optional[str] = None,
    severity: Optional[str] = None,
    classification: Optional[str] = None,
    limit: int = 50
):
    filtered = list(stored_events)
    if station_id:
        filtered = [e for e in filtered if e["station_id"] == station_id]
    if severity:
        filtered = [e for e in filtered if e["severity"] == severity]
    if classification:
        filtered = [e for e in filtered if e["classification"] == classification]
    return filtered[-limit:][::-1]

@router.get("/explanations/{event_id}")
def get_explanation_by_id(event_id: int):
    for e in stored_events:
        if e["id"] == event_id:
            return e
    raise HTTPException(status_code=404, detail="Anomaly event not found")

@router.get("/sensor-health", response_model=List[SensorHealthScore])
def get_all_sensor_health():
    scores = []
    for sid in settings.DEFAULT_STATIONS.keys():
        hist = pipeline.get_history(sid)
        last_obs = hist[-1] if hist else ObservationRaw(timestamp=datetime.now(timezone.utc).isoformat(), station_id=sid, temperature=25.0, pressure=1000.0, humidity=50.0)
        h = pipeline.health_engine.update_and_calculate_health(last_obs, hist, is_anomaly=False)
        scores.append(h)
    return scores

@router.get("/model/metrics")
def get_model_metrics():
    metrics_path = os.path.join(settings.MODEL_DIR, "metrics.json")
    if os.path.exists(metrics_path):
        with open(metrics_path, "r") as f:
            return json.load(f)
    suite = ModelBenchmarkSuite(model_dir=settings.MODEL_DIR)
    results = suite.run_benchmark()
    return results["models"]

@router.post("/anomaly/inject")
def inject_anomaly(req: AnomalyInjectionRequest):
    if streamer.is_running:
        streamer.inject_live_fault(
            station_id=req.station_id,
            fault_type=req.fault_type,
            parameter=req.parameter,
            duration_steps=req.duration_steps,
            severity=req.severity
        )
        return {"status": "injected_into_live_stream", "details": req.model_dump()}
    else:
        # Offline simulation return
        gen = AWSDataGenerator(random_seed=42)
        injector = AnomalyInjector(random_seed=42)
        base = gen.generate_series(req.station_id, datetime(2026, 6, 1, 12, 0), num_steps=24, step_minutes=5)
        injected = injector.inject(
            base,
            fault_type=req.fault_type,
            parameter=req.parameter,
            start_idx=req.start_offset_steps or 12,
            duration=req.duration_steps,
            severity=req.severity,
            custom_val=req.custom_value
        )
        # Analyze injected series
        test_pipe = AnalysisPipeline()
        analyzed = [test_pipe.process_observation(o).model_dump() for o in injected]
        return {
            "status": "simulated_offline",
            "station_id": req.station_id,
            "fault_type": req.fault_type,
            "observations": analyzed
        }

@router.get("/simulation/status")
def get_simulation_status():
    return {
        "is_running": streamer.is_running,
        "current_sim_time": streamer.current_sim_time.isoformat(),
        "tick_interval_seconds": streamer.tick_interval_seconds,
        "sim_step_minutes": streamer.sim_step_minutes,
        "active_injections": streamer.active_injections
    }

@router.post("/simulation/start")
def start_simulation(background_tasks: BackgroundTasks):
    if not streamer.is_running:
        background_tasks.add_task(streamer.run_loop)
    return {"status": "started", "is_running": True}

@router.post("/simulation/stop")
def stop_simulation():
    streamer.stop()
    return {"status": "stopped", "is_running": False}

# =============================================================================
# DEMO SCENARIO RUNNERS
# =============================================================================

DEMO_SCENARIO_LIST: List[DemoScenario] = [
    DemoScenario(
        id="scenario-1-normal",
        title="Nominal Station Baseline",
        description="Standard diurnal cycle with verified thermodynamic coupling and clean QC flags.",
        station_id="AWS-DEL-001",
        fault_type="HEATWAVE",  # Will use NORMAL
        expected_classification="NORMAL",
        expected_root_cause="NORMAL"
    ),
    DemoScenario(
        id="scenario-2-spike",
        title="Temperature Transducer Spike",
        description="Single-interval +12.5°C impulse jump without thermodynamic moisture coupling.",
        station_id="AWS-DEL-001",
        fault_type="SPIKE",
        expected_classification="SENSOR_ANOMALY",
        expected_root_cause="SPIKE"
    ),
    DemoScenario(
        id="scenario-3-frozen",
        title="Frozen Humidity Sensor",
        description="Sensor ADC registers constant value for 8 consecutive periods while T/P fluctuate.",
        station_id="AWS-MUM-003",
        fault_type="FROZEN",
        expected_classification="SENSOR_ANOMALY",
        expected_root_cause="FROZEN_SENSOR"
    ),
    DemoScenario(
        id="scenario-4-drift",
        title="Slow Calibration Drift",
        description="Progressive systematic sensor bias accumulating at +0.6°C/day over 24 intervals.",
        station_id="AWS-CHN-004",
        fault_type="DRIFT",
        expected_classification="SENSOR_ANOMALY",
        expected_root_cause="CALIBRATION_DRIFT"
    ),
    DemoScenario(
        id="scenario-5-heatwave",
        title="Genuine Heatwave (Atmospheric Protection)",
        description="Sustained extreme temperature (+8°C) accompanied by physical RH decline and regional consensus.",
        station_id="AWS-JOD-002",
        fault_type="HEATWAVE",
        expected_classification="GENUINE_WEATHER_EVENT",
        expected_root_cause="GENUINE_WEATHER_EVENT"
    ),
    DemoScenario(
        id="scenario-6-comm-gap",
        title="Telemetry Communication Outage",
        description="Telemetry transmission dropped for 45 minutes between reporting packets.",
        station_id="AWS-SHM-005",
        fault_type="COMMUNICATION_GAP",
        expected_classification="DATA_QUALITY_ISSUE",
        expected_root_cause="COMMUNICATION_GAP"
    )
]

@router.get("/demo/scenarios", response_model=List[DemoScenario])
def get_demo_scenarios():
    return DEMO_SCENARIO_LIST

@router.post("/demo/run-scenario/{scenario_id}")
def run_scenario(scenario_id: str):
    gen = AWSDataGenerator(random_seed=42)
    injector = AnomalyInjector(random_seed=42)

    sc_map = {
        "scenario-1-normal": ("AWS-DEL-001", "NORMAL", "temperature", 14, 20),
        "scenario-2-spike": ("AWS-DEL-001", "SPIKE", "temperature", 14, 14),
        "scenario-3-frozen": ("AWS-MUM-003", "FROZEN", "temperature", 8, 15),
        "scenario-4-drift": ("AWS-CHN-004", "DRIFT", "temperature", 12, 36),
        "scenario-5-heatwave": ("AWS-JOD-002", "HEATWAVE", "temperature", 8, 16),
        "scenario-6-comm-gap": ("AWS-SHM-005", "COMMUNICATION_GAP", None, 14, 14)
    }

    if scenario_id not in sc_map:
        raise HTTPException(status_code=404, detail="Scenario ID not recognized")

    sid, fault, param, s_idx, target_idx = sc_map[scenario_id]
    n_steps = max(target_idx + 4, 30)
    base_series = gen.generate_series(sid, datetime(2026, 6, 1, 12, 0), num_steps=n_steps, step_minutes=5)
    
    if fault != "NORMAL":
        test_series = injector.inject(base_series, fault, parameter=param or "temperature", start_idx=s_idx, duration=24, severity=1.5)
    else:
        test_series = base_series

    pipe = AnalysisPipeline()
    analyzed_series = []
    target_resp = None

    for k, obs in enumerate(test_series):
        r = pipe.process_observation(obs)
        analyzed_series.append(r.model_dump())
        if k == target_idx:
            target_resp = r

    return {
        "scenario_id": scenario_id,
        "station_id": sid,
        "target_analysis": target_resp.model_dump() if target_resp else None,
        "timeline": analyzed_series
    }

@router.get("/demo/side-by-side")
@router.post("/demo/side-by-side")
def get_side_by_side_demo():
    gen = AWSDataGenerator(random_seed=42)
    injector = AnomalyInjector(random_seed=42)

    # Left: Genuine Heatwave (Jodhpur)
    left_series = gen.generate_series("AWS-JOD-002", datetime(2026, 6, 1, 10, 0), num_steps=20, step_minutes=5)
    left_injected = injector.inject(left_series, "HEATWAVE", parameter="temperature", start_idx=6, duration=12, severity=1.6)
    left_pipe = AnalysisPipeline()
    left_timeline = []
    left_target = None
    for k, obs in enumerate(left_injected):
        r = left_pipe.process_observation(obs)
        left_timeline.append(r.model_dump())
        if k == 12:
            left_target = r

    # Right: Sensor Spike (Delhi)
    right_series = gen.generate_series("AWS-DEL-001", datetime(2026, 6, 1, 10, 0), num_steps=20, step_minutes=5)
    right_injected = injector.inject(right_series, "SPIKE", parameter="temperature", start_idx=6, duration=1, severity=1.85)
    right_pipe = AnalysisPipeline()
    right_timeline = []
    right_target = None
    for k, obs in enumerate(right_injected):
        r = right_pipe.process_observation(obs)
        right_timeline.append(r.model_dump())
        if k == 6:
            right_target = r

    return {
        "left_genuine_weather": {
            "title": "Genuine Heatwave (Atmospheric Event)",
            "station_id": "AWS-JOD-002",
            "target": left_target.model_dump() if left_target else None,
            "timeline": left_timeline
        },
        "right_sensor_fault": {
            "title": "Faulty Temperature Sensor (Electrical Spike)",
            "station_id": "AWS-DEL-001",
            "target": right_target.model_dump() if right_target else None,
            "timeline": right_timeline
        },
        "core_comparison": {
            "peak_temperature_both": "~47.0°C - 48.5°C",
            "left_classification": left_target.fusion.classification if left_target else "GENUINE_WEATHER_EVENT",
            "right_classification": right_target.fusion.classification if right_target else "SENSOR_ANOMALY",
            "left_weather_prob": left_target.fusion.weather_event_probability if left_target else 0.70,
            "right_sensor_fault_prob": right_target.fusion.sensor_fault_probability if right_target else 0.91,
            "why": "Left exhibits continuous thermodynamic coupling where Relative Humidity falls in accordance with Clausius-Clapeyron saturation expansion. Right exhibits an uncoupled single-timestep jump with flat humidity and broken temporal persistence."
        }
    }

# =============================================================================
# DATA EXPLORER & CSV IMPORT/EXPORT
# =============================================================================

@router.get("/export/csv")
def export_csv(station_id: Optional[str] = None):
    obs_list = recent_observations.get(station_id, []) if station_id else []
    if not obs_list:
        # Fallback to Delhi
        obs_list = recent_observations.get("AWS-DEL-001", [])

    rows = []
    for obs in obs_list:
        rows.append(obs.model_dump())

    df = pd.DataFrame(rows)
    stream = io.StringIO()
    df.to_csv(stream, index=False)
    stream.seek(0)

    filename = f"skyguard_{station_id or 'all'}_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M')}.csv"
    return StreamingResponse(
        iter([stream.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.post("/upload/csv")
async def upload_csv(file: UploadFile = File(...)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")

    content = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV: {e}")

    # Validate required columns
    required_cols = {"timestamp", "station_id", "temperature", "pressure", "humidity"}
    if not required_cols.issubset(set(df.columns)):
        raise HTTPException(
            status_code=400,
            detail=f"CSV missing mandatory columns. Required: {required_cols}"
        )

    analyzed = []
    pipe = AnalysisPipeline()
    for _, row in df.head(150).iterrows():
        try:
            obs = ObservationRaw(
                timestamp=str(row["timestamp"]),
                station_id=str(row["station_id"]),
                temperature=float(row["temperature"]) if pd.notnull(row["temperature"]) else None,
                pressure=float(row["pressure"]) if pd.notnull(row["pressure"]) else None,
                humidity=float(row["humidity"]) if pd.notnull(row["humidity"]) else None,
                latitude=float(row.get("latitude", 28.5)) if "latitude" in row and pd.notnull(row["latitude"]) else None,
                longitude=float(row.get("longitude", 77.2)) if "longitude" in row and pd.notnull(row["longitude"]) else None
            )
            r = pipe.process_observation(obs)
            analyzed.append(r.model_dump())
        except Exception:
            continue

    return {
        "status": "processed",
        "records_analyzed": len(analyzed),
        "results": analyzed
    }
