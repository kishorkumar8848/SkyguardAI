import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from backend.app.models.schemas import ObservationRaw, AnalysisResponse
from backend.app.simulation.generator import AWSDataGenerator
from backend.app.simulation.injector import AnomalyInjector
from backend.app.services.ingestion import AnalysisPipeline
from backend.app.core.config import settings

class RealTimeStreamer:
    """
    Simulates real-time telemetry streaming from multiple AWS stations.
    Supports dynamic fault injection into the live stream and WebSocket broadcasting.
    """

    def __init__(self, pipeline: AnalysisPipeline):
        self.pipeline = pipeline
        self.generator = AWSDataGenerator(random_seed=42)
        self.injector = AnomalyInjector(random_seed=42)
        self.is_running = False
        self.current_sim_time = datetime(2026, 6, 1, 11, 30)
        self.active_injections: List[Dict] = []
        self.listeners = []
        self.tick_interval_seconds = 1.0
        self.sim_step_minutes = 5
        self.synoptic_offsets = {sid: 0.0 for sid in settings.DEFAULT_STATIONS.keys()}

    def register_listener(self, callback):
        self.listeners.append(callback)

    def unregister_listener(self, callback):
        if callback in self.listeners:
            self.listeners.remove(callback)

    def inject_live_fault(
        self,
        station_id: str,
        fault_type: str,
        parameter: str = "temperature",
        duration_steps: int = 6,
        severity: float = 1.3
    ):
        """Schedules a fault injection on the active streaming station."""
        self.active_injections.append({
            "station_id": station_id,
            "fault_type": fault_type,
            "parameter": parameter,
            "remaining_steps": duration_steps,
            "severity": severity,
            "total_steps": duration_steps
        })

    async def run_loop(self):
        self.is_running = True
        stations = list(settings.DEFAULT_STATIONS.keys())

        while self.is_running:
            self.current_sim_time += timedelta(minutes=self.sim_step_minutes)

            # Generate simultaneous observations for all active stations
            batch_obs: Dict[str, ObservationRaw] = {}
            for sid in stations:
                obs = self.generator.generate_point(
                    sid,
                    self.current_sim_time,
                    synoptic_t_offset=self.synoptic_offsets[sid]
                )
                batch_obs[sid] = obs

            # Check if any active injections need to modify the current batch
            for inj in list(self.active_injections):
                sid = inj["station_id"]
                if sid in batch_obs:
                    raw_list = [batch_obs[sid]]
                    modified = self.injector.inject(
                        raw_list,
                        fault_type=inj["fault_type"],
                        parameter=inj["parameter"],
                        start_idx=0,
                        duration=1,
                        severity=inj["severity"]
                    )
                    batch_obs[sid] = modified[0]
                    inj["remaining_steps"] -= 1
                    if inj["remaining_steps"] <= 0:
                        self.active_injections.remove(inj)

            # Process observations through SkyGuard AI Pipeline
            for sid, obs in batch_obs.items():
                analysis: AnalysisResponse = self.pipeline.process_observation(
                    current=obs,
                    peer_obs=batch_obs
                )

                # Broadcast to connected WebSocket clients
                for callback in list(self.listeners):
                    try:
                        await callback(analysis)
                    except Exception:
                        pass

            await asyncio.sleep(self.tick_interval_seconds)

    def stop(self):
        self.is_running = False
