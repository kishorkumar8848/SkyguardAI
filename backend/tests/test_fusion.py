import pytest
from datetime import datetime
from backend.app.models.schemas import ObservationRaw
from backend.app.simulation.generator import AWSDataGenerator
from backend.app.simulation.injector import AnomalyInjector
from backend.app.services.ingestion import AnalysisPipeline

def test_genuine_weather_event_protection():
    pipeline = AnalysisPipeline()
    gen = AWSDataGenerator(random_seed=42)
    injector = AnomalyInjector(random_seed=42)

    # Generate heatwave series
    series = gen.generate_series("AWS-JOD-002", datetime(2026, 6, 1, 10, 0), num_steps=20, step_minutes=5)
    injected = injector.inject(series, "HEATWAVE", parameter="temperature", start_idx=6, duration=12, severity=1.6)

    target_resp = None
    for k, obs in enumerate(injected):
        r = pipeline.process_observation(obs)
        if k == 12:
            target_resp = r

    assert target_resp is not None
    assert target_resp.fusion.classification == "GENUINE_WEATHER_EVENT"
    assert target_resp.fusion.weather_event_probability > target_resp.fusion.sensor_fault_probability
    assert "meteorological event" in target_resp.explainability.summary.lower()

def test_sensor_spike_detection():
    pipeline = AnalysisPipeline()
    gen = AWSDataGenerator(random_seed=42)
    injector = AnomalyInjector(random_seed=42)

    series = gen.generate_series("AWS-DEL-001", datetime(2026, 6, 1, 10, 0), num_steps=15, step_minutes=5)
    injected = injector.inject(series, "SPIKE", parameter="temperature", start_idx=6, duration=1, severity=1.8)

    target_resp = None
    for k, obs in enumerate(injected):
        r = pipeline.process_observation(obs)
        if k == 6:
            target_resp = r

    assert target_resp is not None
    assert target_resp.fusion.classification == "SENSOR_ANOMALY"
    assert target_resp.fusion.root_cause == "SPIKE"
    assert target_resp.fusion.sensor_fault_probability > 0.8
    assert "spike" in target_resp.explainability.reasoning.lower() or "spike" in target_resp.fusion.recommended_action.lower()
