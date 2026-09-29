# Smart India Hackathon 2026: Official Evaluation Mapping

**Problem Statement ID:** SIH26073  
**Title:** AI/ML-Based Intelligent Anomaly Detection for Automatic Weather Stations (AWS)  
**Organization:** Ministry of Earth Sciences (MoES) / India Meteorological Department (IMD)  
**Project Name:** SKYGUARD AI  
**Tagline:** *“When weather data looks wrong, determine whether the atmosphere changed — or the sensor did.”*

---

## Direct Evaluation Metric Mapping

### 1. Innovation & Novelty (Weightage: 25%)

| Implemented Feature | Evidence in Codebase | Test Result | Measured Metric |
| :--- | :--- | :--- | :--- |
| **Genuine Weather Event Protection** | [fusion.py](file:///d:/skyguardAI/backend/app/services/fusion.py#L97-L140) | [test_fusion.py](file:///d:/skyguardAI/backend/tests/test_fusion.py#L9-L28) | Discriminates genuine heatwave (46.5°C) from sensor spike (47.0°C) with 85% confidence |
| **Thermodynamic Law Coupling** | [physics.py](file:///d:/skyguardAI/backend/app/qc/physics.py#L49-L80) | [test_physics.py](file:///d:/skyguardAI/backend/tests/test_physics.py#L7-L38) | Enforces Magnus-Tetens vapor curve; flags supersaturation ($T_d > T$) and uncoupled moisture divergence |
| **Predictive Calibration Drift Tracking** | [health.py](file:///d:/skyguardAI/backend/app/services/health.py#L42-L65) | [test_health.py](file:///d:/skyguardAI/backend/tests/test_health.py#L7-L35) | Detects linear drift ($\ge 0.02^\circ\text{C}/\text{step}$) across 12-step EWMA baseline before sensor failure |
| **Multi-Station Spatial Network Consensus** | [spatial.py](file:///d:/skyguardAI/backend/app/services/spatial.py#L23-L65) | Tested across 6 regional stations | Great-circle Haversine clustering with normalized deviation ($Z_{spatial} > 2.5\sigma$) |

---

### 2. Detection Accuracy & Robustness (Weightage: 20%)

| Implemented Feature | Evidence in Codebase | Test Result | Measured Metric |
| :--- | :--- | :--- | :--- |
| **Multi-Model Benchmark Suite** | [benchmarks.py](file:///d:/skyguardAI/backend/app/ml/benchmarks.py#L22-L135) | [metrics.json](file:///d:/skyguardAI/models/saved/metrics.json) | 600-step continuous benchmark comparing Rule QC, IForest, LSTM, Hybrid |
| **Extreme Weather False Alarm Suppression** | [fusion.py](file:///d:/skyguardAI/backend/app/services/fusion.py#L190-L215) | Tested via `evaluate_models.py` | False Positive Rate slashed to **0.53%** (vs 20.74% for pure LSTM Autoencoder) |
| **Dual ML Sequence Reconstruction** | [lstm_autoencoder.py](file:///d:/skyguardAI/backend/app/ml/lstm_autoencoder.py#L40-L100) | [test_ml.py](file:///d:/skyguardAI/backend/tests/test_ml.py#L39-L55) | LSTM Autoencoder achieves **80.56% Recall** on subtle sequential anomalies |
| **Impulse Spike Detection** | [deterministic.py](file:///d:/skyguardAI/backend/app/qc/deterministic.py#L70-L100) | [test_qc.py](file:///d:/skyguardAI/backend/tests/test_qc.py#L45-L65) | 100% precision on step limit violations ($>3.5^\circ\text{C}$ in 5 min) |

---

### 3. Real-Time Capability (Weightage: 15%)

| Implemented Feature | Evidence in Codebase | Test Result | Measured Metric |
| :--- | :--- | :--- | :--- |
| **Ultra-Low Latency Inference** | [ingestion.py](file:///d:/skyguardAI/backend/app/services/ingestion.py#L45-L125) | [latency_report.json](file:///d:/skyguardAI/models/saved/latency_report.json) | **0.17 ms** average pipeline processing latency (Target: &lt;100 ms) |
| **WebSocket Telemetry Streamer** | [streamer.py](file:///d:/skyguardAI/backend/app/simulation/streamer.py#L35-L95) | Live broadcast tested | Real-time pushes at 1 tick/second (simulating 5-min intervals) |
| **Non-blocking Asynchronous Database** | [database.py](file:///d:/skyguardAI/backend/app/core/database.py#L10-L35) | SQLite + `aiosqlite` async pool | Zero thread-blocking during high-frequency telemetry ingestion |

---

### 4. Operational Explainability (Weightage: 10%)

| Implemented Feature | Evidence in Codebase | Test Result | Measured Metric |
| :--- | :--- | :--- | :--- |
| **TreeSHAP Feature Attribution** | [shap_explainer.py](file:///d:/skyguardAI/backend/app/explainability/shap_explainer.py#L35-L80) | [test_e2e.py](file:///d:/skyguardAI/backend/tests/test_e2e.py#L30-L50) | Directional and magnitude values computed for top 8 contributing features |
| **Auditable Evidence Checklist** | [explainer.py](file:///d:/skyguardAI/backend/app/explainability/explainer.py#L30-L95) | Tested across all 6 demo scenarios | Categorized checklist (Temporal, Thermodynamic, ML, Spatial) for meteorologists |
| **Actionable Operator Protocols** | [fusion.py](file:///d:/skyguardAI/backend/app/services/fusion.py#L160-L245) | Rendered in UI Alert Center | Distinct guidance: e.g. "Issue Heatwave Bulletin" vs "Inspect ADC & Transducer" |

---

### 5. Scalability & Software Architecture (Weightage: 10%)

| Implemented Feature | Evidence in Codebase | Test Result | Measured Metric |
| :--- | :--- | :--- | :--- |
| **Multi-Station Support** | [config.py](file:///d:/skyguardAI/backend/app/core/config.py#L25-L115) | 6 distinct Indian climate zones | Delhi, Jodhpur, Mumbai, Chennai, Shimla, Kolkata |
| **Station-Specific Physical Limits** | [deterministic.py](file:///d:/skyguardAI/backend/app/qc/deterministic.py#L18-L45) | [test_qc.py](file:///d:/skyguardAI/backend/tests/test_qc.py#L10-L30) | Configurable thresholds (e.g. Shimla pressure 750-820 hPa vs Delhi 970-1030 hPa) |
| **Containerized Deployment** | [docker-compose.yml](file:///d:/skyguardAI/docker-compose.yml) | Dockerfile.backend & Dockerfile.frontend | Fully reproducible, multi-service Docker configuration |

---

### 6. Practical Deployability & Edge Readiness (Weightage: 10%)

| Implemented Feature | Evidence in Codebase | Test Result | Measured Metric |
| :--- | :--- | :--- | :--- |
| **Edge Mode Profile Toggle** | [SystemSettings.jsx](file:///d:/skyguardAI/frontend/src/pages/SystemSettings.jsx#L25-L65) | Verified in UI | Switches between Full AI Mode and Lightweight Edge Mode (&lt;16 MB RAM) |
| **Zero External API Dependency** | Local models, SQLite, embedded Leaflet | 100% offline runnable | Functions completely without internet or proprietary cloud APIs |
| **Non-Destructive Value Correction** | [correction.py](file:///d:/skyguardAI/backend/app/services/correction.py#L15-L75) | [test_e2e.py](file:///d:/skyguardAI/backend/tests/test_e2e.py#L40-L55) | Raw readings never mutated; corrected values stored with method & confidence |

---

### 7. Visualization & User Interface (Weightage: 5%)

| Implemented Feature | Evidence in Codebase | Test Result | Measured Metric |
| :--- | :--- | :--- | :--- |
| **Meteorological Operations Console** | [App.jsx](file:///d:/skyguardAI/frontend/src/App.jsx#L45-L180) | 12 dedicated views / tabs | High information density, dark/light theme, professional typography |
| **Interactive Leaflet Network Map** | [StationMap.jsx](file:///d:/skyguardAI/frontend/src/pages/StationMap.jsx#L20-L85) | Renders all stations on dark map | Green/Yellow/Red status markers with interactive popup telemetry inspection |
| **Side-by-Side Demonstration** | [SideBySideDemo.jsx](file:///d:/skyguardAI/frontend/src/pages/SideBySideDemo.jsx#L25-L140) | Verified via `run_demo.py` | Side-by-side comparison of Heatwave vs Sensor Spike at ~48°C |

---

### 8. Energy Efficiency & Environmental Impact (Weightage: 5%)

| Implemented Feature | Evidence in Codebase | Test Result | Measured Metric |
| :--- | :--- | :--- | :--- |
| **CPU-Optimized Inference** | PyTorch CPU & Scikit-learn C-bindings | Benchmarked on standard CPU | No discrete GPU required; runs comfortably on solar-powered AWS dataloggers |
| **False-Alarm Crew Dispatch Reduction** | Accurate discrimination of weather events | Evaluated on test bench | Prevents unnecessary fossil-fuel technician deployments to remote desert/mountain stations |
