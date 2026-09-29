import pytest
from datetime import datetime
from backend.app.simulation.generator import AWSDataGenerator
from backend.app.simulation.injector import AnomalyInjector
from backend.app.services.ingestion import AnalysisPipeline

def test_full_e2e_pipeline():
    # 1. Synthetic stream generation
    gen = AWSDataGenerator(random_seed=999)
    raw_series = gen.generate_series("AWS-DEL-001", datetime(2026, 6, 1, 10, 0), num_steps=20, step_minutes=5)
    assert len(raw_series) == 20

    # 2. Anomaly Injection (Spike on Temperature at step 10)
    injector = AnomalyInjector(random_seed=999)
    injected_series = injector.inject(raw_series, "SPIKE", parameter="temperature", start_idx=10, duration=1, severity=1.8)

    # 3. Stream through Analysis Pipeline
    pipeline = AnalysisPipeline()
    responses = []
    for obs in injected_series:
        resp = pipeline.process_observation(obs)
        responses.append(resp)

    # 4. Assert normal baseline before injection
    normal_step = responses[5]
    assert normal_step.fusion.classification == "NORMAL"
    assert normal_step.fusion.final_anomaly_score < 0.35

    # 5. Assert anomaly detection at injection point
    anomaly_step = responses[10]
    assert anomaly_step.fusion.classification == "SENSOR_ANOMALY"
    assert anomaly_step.fusion.root_cause == "SPIKE"
    assert anomaly_step.fusion.severity in ["MEDIUM", "HIGH"]
    assert anomaly_step.fusion.confidence >= 0.85

    # 6. Assert explainability output
    explain = anomaly_step.explainability
    assert len(explain.evidence_checklist) > 0
    assert len(explain.feature_attributions) > 0
    assert "spike" in explain.headline.lower() or "spike" in explain.summary.lower()

    # 7. Assert Non-destructive Corrected Value Estimation
    corrections = anomaly_step.corrections
    assert "temperature" in corrections
    corr_t = corrections["temperature"]
    assert corr_t.raw_value == anomaly_step.observation.temperature
    assert corr_t.corrected_value is not None
    # Corrected value should be near nominal (~34-36°C) rather than the spiked 48°C
    assert corr_t.corrected_value < 38.0
    assert corr_t.correction_confidence > 0.70
