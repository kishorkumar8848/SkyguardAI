from datetime import datetime, timedelta, timezone
from backend.app.models.schemas import ObservationRaw
from backend.app.qc.deterministic import DeterministicQCEngine

def test_range_validation_pass():
    qc = DeterministicQCEngine()
    obs = ObservationRaw(
        timestamp=datetime.now(timezone.utc).isoformat(),
        station_id="AWS-DEL-001",
        temperature=32.5,
        pressure=1005.0,
        humidity=55.0
    )
    res = qc.validate_observation(obs, [])
    assert res.is_clean is True
    assert len(res.flagged_reasons) == 0

def test_temperature_out_of_range():
    qc = DeterministicQCEngine()
    obs = ObservationRaw(
        timestamp=datetime.now(timezone.utc).isoformat(),
        station_id="AWS-DEL-001",
        temperature=65.0,  # Max allowed in Delhi is 49.5°C
        pressure=1005.0,
        humidity=55.0
    )
    res = qc.validate_observation(obs, [])
    assert res.is_clean is False
    assert any("TEMP_OUT_OF_RANGE" in flag for flag in res.flagged_reasons)

def test_missing_value_detection():
    qc = DeterministicQCEngine()
    obs = ObservationRaw(
        timestamp=datetime.now(timezone.utc).isoformat(),
        station_id="AWS-DEL-001",
        temperature=None,
        pressure=1005.0,
        humidity=55.0
    )
    res = qc.validate_observation(obs, [])
    assert res.is_clean is False
    assert any("MISSING_OR_NAN_TEMPERATURE" in flag for flag in res.flagged_reasons)

def test_rate_of_change_violation():
    qc = DeterministicQCEngine()
    t0 = datetime(2026, 6, 1, 12, 0)
    prev = ObservationRaw(
        timestamp=t0.isoformat(),
        station_id="AWS-DEL-001",
        temperature=30.0,
        pressure=1000.0,
        humidity=50.0
    )
    curr = ObservationRaw(
        timestamp=(t0 + timedelta(minutes=5)).isoformat(),
        station_id="AWS-DEL-001",
        temperature=38.0,  # 8.0°C jump in 5 min (limit ~3.5°C per 10 min)
        pressure=1000.0,
        humidity=50.0
    )
    res = qc.validate_observation(curr, [prev])
    assert res.is_clean is False
    assert any("TEMP_STEP_LIMIT_EXCEEDED" in flag for flag in res.flagged_reasons)

def test_communication_gap_detection():
    qc = DeterministicQCEngine()
    t0 = datetime(2026, 6, 1, 12, 0)
    prev = ObservationRaw(
        timestamp=t0.isoformat(),
        station_id="AWS-DEL-001",
        temperature=30.0,
        pressure=1000.0,
        humidity=50.0
    )
    curr = ObservationRaw(
        timestamp=(t0 + timedelta(minutes=45)).isoformat(),  # 45 min gap
        station_id="AWS-DEL-001",
        temperature=30.2,
        pressure=1000.0,
        humidity=50.0
    )
    res = qc.validate_observation(curr, [prev])
    assert res.communication_gap_detected is True
