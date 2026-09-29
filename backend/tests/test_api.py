import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timezone
from backend.app.main import app

client = TestClient(app)

def test_api_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "SkyGuard" in data["system"]

def test_get_stations():
    res = client.get("/api/stations")
    assert res.status_code == 200
    stations = res.json()
    assert len(stations) >= 5
    station_ids = [s["station_id"] for s in stations]
    assert "AWS-DEL-001" in station_ids
    assert "AWS-SHM-005" in station_ids

def test_post_analyze():
    payload = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "station_id": "AWS-DEL-001",
        "temperature": 33.2,
        "pressure": 998.4,
        "humidity": 45.0
    }
    res = client.post("/api/analyze", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "qc" in data
    assert "physics" in data
    assert "fusion" in data
    assert "explainability" in data
    assert data["fusion"]["classification"] in ["NORMAL", "GENUINE_WEATHER_EVENT", "SENSOR_ANOMALY", "DATA_QUALITY_ISSUE", "UNCERTAIN"]

def test_demo_side_by_side_endpoint():
    res = client.post("/api/demo/side-by-side")
    assert res.status_code == 200
    data = res.json()
    assert "left_genuine_weather" in data
    assert "right_sensor_fault" in data
    assert "core_comparison" in data
    assert data["core_comparison"]["left_classification"] == "GENUINE_WEATHER_EVENT"
    assert data["core_comparison"]["right_classification"] == "SENSOR_ANOMALY"

def test_get_model_metrics():
    res = client.get("/api/model/metrics")
    assert res.status_code == 200
    data = res.json()
    assert "rule_based" in data
    assert "skyguard_hybrid" in data
