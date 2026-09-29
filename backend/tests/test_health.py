from datetime import datetime, timedelta, timezone
from backend.app.models.schemas import ObservationRaw
from backend.app.services.health import SensorHealthEngine

def test_sensor_health_nominal():
    engine = SensorHealthEngine()
    obs = ObservationRaw(
        timestamp=datetime.now(timezone.utc).isoformat(),
        station_id="AWS-DEL-001",
        temperature=30.0,
        pressure=1000.0,
        humidity=50.0
    )
    score = engine.update_and_calculate_health(obs, [], is_anomaly=False)
    assert score.overall_health >= 90.0
    assert score.drift_detected is False
    assert score.early_maintenance_warning is False

def test_sensor_health_degradation_and_warning():
    engine = SensorHealthEngine()
    # Inject multiple anomalies and missing reports
    for i in range(20):
        obs = ObservationRaw(
            timestamp=(datetime.now(timezone.utc) - timedelta(minutes=(20 - i)*5)).isoformat(),
            station_id="AWS-TEST-099",
            temperature=None if i % 3 == 0 else 30.0,
            pressure=1000.0,
            humidity=50.0
        )
        score = engine.update_and_calculate_health(obs, [], is_anomaly=(i % 2 == 0), anomaly_severity="HIGH")

    assert score.overall_health < 85.0
    assert score.anomaly_frequency_24h > 5
