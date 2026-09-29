from datetime import datetime
from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel, Field

# Event and Root Cause Categories
ClassificationType = Literal[
    "NORMAL",
    "GENUINE_WEATHER_EVENT",
    "SENSOR_ANOMALY",
    "DATA_QUALITY_ISSUE",
    "UNCERTAIN"
]

RootCauseType = Literal[
    "NORMAL",
    "SPIKE",
    "FROZEN_SENSOR",
    "COMMUNICATION_GAP",
    "CALIBRATION_DRIFT",
    "POWER_FLUCTUATION",
    "DATA_CORRUPTION",
    "MULTIVARIATE_INCONSISTENCY",
    "GENUINE_WEATHER_EVENT",
    "UNKNOWN/UNCERTAIN"
]

SeverityType = Literal["NORMAL", "LOW", "MEDIUM", "HIGH", "CRITICAL"]

FaultType = Literal[
    "SPIKE",
    "DROP",
    "FROZEN",
    "DRIFT",
    "OFFSET",
    "NOISE",
    "COMMUNICATION_GAP",
    "POWER_FLUCTUATION",
    "DATA_CORRUPTION",
    "HEATWAVE",
    "RAPID_COOLING",
    "RAPID_WARMING",
    "REGIONAL_WEATHER_EVENT"
]

class ObservationRaw(BaseModel):
    timestamp: str = Field(..., description="ISO 8601 timestamp string")
    station_id: str = Field(..., description="Unique AWS station identifier")
    temperature: Optional[float] = Field(None, description="Air temperature in Celsius")
    pressure: Optional[float] = Field(None, description="Atmospheric pressure in hPa")
    humidity: Optional[float] = Field(None, description="Relative humidity in percentage (0-100)")
    latitude: Optional[float] = Field(None, description="Station latitude")
    longitude: Optional[float] = Field(None, description="Station longitude")
    elevation: Optional[float] = Field(None, description="Station elevation in meters")
    station_name: Optional[str] = Field(None, description="Human readable station name")

class StationConfig(BaseModel):
    station_id: str
    station_name: str
    latitude: float
    longitude: float
    elevation: float
    climate_zone: str = "Subtropical Continental"
    temp_min: float = -10.0
    temp_max: float = 55.0
    temp_rate_max: float = 3.5  # max °C change per 10 min
    pressure_min: float = 850.0
    pressure_max: float = 1060.0
    pressure_rate_max: float = 4.0  # max hPa change per 10 min
    humidity_min: float = 0.0
    humidity_max: float = 100.0
    humidity_rate_max: float = 25.0  # max % change per 10 min
    frozen_tolerance: float = 0.05
    frozen_window: int = 6  # consecutive identical readings

class QualityFlag(BaseModel):
    is_valid: bool
    flags: List[str] = []
    details: Dict[str, Any] = {}

class QCResult(BaseModel):
    is_clean: bool
    range_check: Dict[str, bool] = {}
    rate_of_change_check: Dict[str, bool] = {}
    frozen_sensor_check: Dict[str, bool] = {}
    persistence_check: Dict[str, bool] = {}
    communication_gap_detected: bool = False
    flagged_reasons: List[str] = []

class PhysicsResult(BaseModel):
    dew_point: Optional[float] = None
    dew_point_depression: Optional[float] = None
    magnus_valid: bool = True
    supersaturation_violation: bool = False
    diurnal_rh_inconsistent: bool = False
    pressure_tendency_plausible: bool = True
    mahalanobis_distance: float = 0.0
    physics_inconsistency_score: float = 0.0
    details: Dict[str, Any] = {}

class MLResult(BaseModel):
    isolation_forest_score: float = 0.0
    isolation_forest_anomaly: bool = False
    lstm_recon_error: float = 0.0
    lstm_anomaly: bool = False
    lstm_var_errors: Dict[str, float] = {}
    feature_contributions: Dict[str, float] = {}

class SpatialResult(BaseModel):
    neighbor_count: int = 0
    spatial_median_temp: Optional[float] = None
    temp_spatial_diff: Optional[float] = None
    neighborhood_consensus: float = 0.0
    is_spatial_outlier: bool = False
    regional_event_support: bool = False

class FusionResult(BaseModel):
    final_anomaly_score: float
    sensor_fault_probability: float
    weather_event_probability: float
    data_quality_probability: float
    uncertainty_score: float
    classification: ClassificationType
    root_cause: RootCauseType
    severity: SeverityType
    confidence: float
    recommended_action: str

class ExplainabilityResult(BaseModel):
    headline: str
    summary: str
    evidence_checklist: List[Dict[str, Any]]
    feature_attributions: Dict[str, float]
    reconstruction_breakdown: Dict[str, float]
    reasoning: str

class CorrectionResult(BaseModel):
    parameter: str
    raw_value: Optional[float]
    corrected_value: Optional[float]
    correction_method: str
    correction_confidence: float

class AnalysisResponse(BaseModel):
    observation: ObservationRaw
    qc: QCResult
    physics: PhysicsResult
    ml: MLResult
    spatial: Optional[SpatialResult] = None
    fusion: FusionResult
    explainability: ExplainabilityResult
    corrections: Dict[str, CorrectionResult] = {}
    processing_latency_ms: float
    timestamp: str

class SensorHealthScore(BaseModel):
    station_id: str
    overall_health: float
    temperature_health: float
    pressure_health: float
    humidity_health: float
    drift_detected: bool
    drift_rate: float
    drift_direction: Optional[str] = None
    missing_data_rate_24h: float
    communication_reliability: float
    anomaly_frequency_24h: int
    early_maintenance_warning: bool
    warning_message: Optional[str] = None
    health_trend_24h: List[float] = []
    health_trend_7d: List[float] = []
    health_trend_30d: List[float] = []

class StationStatus(BaseModel):
    station_id: str
    station_name: str
    latitude: float
    longitude: float
    elevation: float
    climate_zone: str
    status: Literal["HEALTHY", "WARNING", "ANOMALOUS", "CRITICAL"]
    health: SensorHealthScore
    last_observation: Optional[ObservationRaw] = None
    last_analysis: Optional[AnalysisResponse] = None

class AnomalyInjectionRequest(BaseModel):
    station_id: str
    parameter: Literal["temperature", "pressure", "humidity", "all"]
    fault_type: FaultType
    start_offset_steps: int = 0
    duration_steps: int = 6
    severity: float = 1.0  # multiplier or absolute scale
    custom_value: Optional[float] = None

class DemoScenario(BaseModel):
    id: str
    title: str
    description: str
    station_id: str
    fault_type: FaultType
    expected_classification: ClassificationType
    expected_root_cause: RootCauseType
