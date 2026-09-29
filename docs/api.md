# SkyGuard AI: API Reference & Contract

Base URL: `http://localhost:8000/api`
Live WebSocket Stream: `ws://localhost:8000/ws/live`
Interactive Swagger Docs: `http://localhost:8000/docs`

---

## REST Endpoints

### 1. System Health
- **`GET /api/health`**
  - Returns backend operational state, loaded models, simulator status.

### 2. AWS Stations
- **`GET /api/stations`**
  - Returns list of all active stations, climate zones, elevation, latest observation, and 0-100% sensor health scores.
- **`GET /api/stations/{station_id}`**
  - Returns detailed station configuration, physical thresholds, and latest telemetry.

### 3. Observation Telemetry
- **`GET /api/observations`**
  - Query parameters: `station_id` (optional), `limit` (default: 50).
- **`POST /api/observations`**
  - Ingests raw observation, processes it through QC, ML, and Fusion engines, persists it to DB, and returns `AnalysisResponse`.
- **`POST /api/analyze`**
  - Analyzes observation payload statelessly without persisting to historical DB.

### 4. Anomaly Events & Explainability
- **`GET /api/anomalies`**
  - Query parameters: `station_id`, `severity`, `classification`, `limit`.
- **`GET /api/explanations/{event_id}`**
  - Returns evidence checklist, SHAP feature attributions, LSTM reconstruction breakdown, and human-readable operational reasoning.

### 5. Sensor Health & Predictive Maintenance
- **`GET /api/sensor-health`**
  - Returns health breakdown (T, P, RH), drift rate (°C/day), communication reliability, and early maintenance warnings for all stations.

### 6. Fault Injection Laboratory
- **`POST /api/anomaly/inject`**
  - Injects simulated or live fault (`SPIKE`, `DROP`, `FROZEN`, `DRIFT`, `HEATWAVE`, etc.) and returns real-time detection latency and ground-truth comparison.

### 7. Evaluation & Demonstration
- **`GET /api/model/metrics`**
  - Returns comparative benchmark metrics across Rule-based, Isolation Forest, LSTM Autoencoder, and Hybrid Fusion.
- **`GET /api/demo/scenarios`**
  - Lists 6 pre-configured operational demonstration scenarios.
- **`POST /api/demo/run-scenario/{scenario_id}`**
  - Executes complete scenario and returns full timeline analysis.
- **`POST /api/demo/side-by-side`**
  - Executes core side-by-side demonstration (Genuine Heatwave vs Sensor Spike).

### 8. Data Adapter & CSV Import/Export
- **`GET /api/export/csv`**
  - Exports observation history as downloadable CSV file.
- **`POST /api/upload/csv`**
  - Uploads external historical AWS CSV file and returns automated quality control report.

---

## WebSocket Stream: `/ws/live`
Broadcasts real-time events as JSON:
```json
{
  "type": "telemetry_tick",
  "data": {
    "observation": { ... },
    "qc": { ... },
    "physics": { ... },
    "ml": { ... },
    "fusion": {
      "classification": "GENUINE_WEATHER_EVENT",
      "root_cause": "GENUINE_WEATHER_EVENT",
      "confidence": 0.85,
      "recommended_action": "..."
    },
    "explainability": { ... }
  }
}
```
