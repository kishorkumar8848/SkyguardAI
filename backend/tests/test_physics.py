import pytest
from datetime import datetime, timezone
from backend.app.models.schemas import ObservationRaw
from backend.app.qc.physics import PhysicsInformedEngine

def test_dew_point_calculation():
    engine = PhysicsInformedEngine()
    # At T=20°C and RH=50%, Magnus formula gives dew point ~9.3°C
    td = engine.calculate_dew_point(20.0, 50.0)
    assert 9.0 <= td <= 9.6

def test_supersaturation_violation():
    engine = PhysicsInformedEngine()
    # Humidity 105% should violate thermodynamic boundary
    obs = ObservationRaw(
        timestamp=datetime.now(timezone.utc).isoformat(),
        station_id="AWS-DEL-001",
        temperature=25.0,
        pressure=1000.0,
        humidity=106.0
    )
    res = engine.validate_physics(obs, [])
    assert res.supersaturation_violation is True
    assert res.physics_inconsistency_score > 0.5

def test_physical_uncoupled_t_rh():
    engine = PhysicsInformedEngine()
    prev = ObservationRaw(
        timestamp=datetime(2026, 6, 1, 12, 0).isoformat(),
        station_id="AWS-DEL-001",
        temperature=32.0,
        pressure=1000.0,
        humidity=40.0
    )
    # Simultaneous jump in Temp (+6°C) AND Humidity (+25%) with no pressure drop
    curr = ObservationRaw(
        timestamp=datetime(2026, 6, 1, 12, 5).isoformat(),
        station_id="AWS-DEL-001",
        temperature=38.0,
        pressure=1000.0,
        humidity=65.0
    )
    res = engine.validate_physics(curr, [prev])
    assert res.diurnal_rh_inconsistent is True
    assert res.physics_inconsistency_score >= 0.4
