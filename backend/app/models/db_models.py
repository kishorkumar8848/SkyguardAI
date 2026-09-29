from datetime import datetime
from sqlalchemy import Column, Integer, Float, String, Boolean, DateTime, Text, JSON
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class DBStation(Base):
    __tablename__ = "stations"

    station_id = Column(String(64), primary_key=True, index=True)
    station_name = Column(String(128), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    elevation = Column(Float, nullable=False)
    climate_zone = Column(String(128), nullable=False)
    status = Column(String(32), default="HEALTHY")
    config_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class DBObservation(Base):
    __tablename__ = "observations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    station_id = Column(String(64), index=True, nullable=False)
    timestamp = Column(String(64), index=True, nullable=False)
    temperature = Column(Float, nullable=True)
    pressure = Column(Float, nullable=True)
    humidity = Column(Float, nullable=True)
    is_valid = Column(Boolean, default=True)
    flags_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class DBAnomalyEvent(Base):
    __tablename__ = "anomaly_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    station_id = Column(String(64), index=True, nullable=False)
    timestamp = Column(String(64), index=True, nullable=False)
    parameter = Column(String(32), nullable=True)
    raw_value = Column(Float, nullable=True)
    expected_value = Column(Float, nullable=True)
    classification = Column(String(64), nullable=False)
    root_cause = Column(String(64), nullable=False)
    severity = Column(String(32), nullable=False)
    confidence = Column(Float, nullable=False)
    final_anomaly_score = Column(Float, nullable=False)
    sensor_fault_prob = Column(Float, nullable=False)
    weather_event_prob = Column(Float, nullable=False)
    uncertainty_score = Column(Float, nullable=False)
    explanation_summary = Column(Text, nullable=True)
    evidence_json = Column(JSON, nullable=True)
    recommended_action = Column(Text, nullable=True)
    corrected_value = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class DBSensorHealth(Base):
    __tablename__ = "sensor_health"

    id = Column(Integer, primary_key=True, autoincrement=True)
    station_id = Column(String(64), index=True, nullable=False)
    timestamp = Column(String(64), index=True, nullable=False)
    overall_health = Column(Float, nullable=False)
    temperature_health = Column(Float, nullable=False)
    pressure_health = Column(Float, nullable=False)
    humidity_health = Column(Float, nullable=False)
    drift_detected = Column(Boolean, default=False)
    drift_rate = Column(Float, default=0.0)
    drift_direction = Column(String(16), nullable=True)
    early_maintenance_warning = Column(Boolean, default=False)
    warning_message = Column(Text, nullable=True)
    details_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class DBAlert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    station_id = Column(String(64), index=True, nullable=False)
    timestamp = Column(String(64), index=True, nullable=False)
    severity = Column(String(32), nullable=False)
    classification = Column(String(64), nullable=False)
    root_cause = Column(String(64), nullable=False)
    message = Column(Text, nullable=False)
    is_acknowledged = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class DBInjectedAnomaly(Base):
    __tablename__ = "injected_anomalies"

    id = Column(Integer, primary_key=True, autoincrement=True)
    station_id = Column(String(64), nullable=False)
    parameter = Column(String(32), nullable=False)
    fault_type = Column(String(64), nullable=False)
    start_timestamp = Column(String(64), nullable=False)
    duration_steps = Column(Integer, nullable=False)
    severity = Column(Float, nullable=False)
    ground_truth = Column(String(64), nullable=False)
    detected = Column(Boolean, default=False)
    ai_classification = Column(String(64), nullable=True)
    ai_root_cause = Column(String(64), nullable=True)
    detection_latency_steps = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class DBModelRun(Base):
    __tablename__ = "model_runs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    model_type = Column(String(64), nullable=False)
    run_timestamp = Column(String(64), nullable=False)
    version = Column(String(32), nullable=False)
    metrics_json = Column(JSON, nullable=False)
    thresholds_json = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
