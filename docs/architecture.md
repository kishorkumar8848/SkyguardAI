# SkyGuard AI: System Architecture Document

## 1. System Overview
**SkyGuard AI** is an explainable, physics-informed, multi-engine data-trust and sensor-health platform designed for Automatic Weather Stations (AWS) operated by the **India Meteorological Department (IMD)** and the **Ministry of Earth Sciences (MoES)**.

The primary mission is captured by its operational tagline:
> *“When weather data looks wrong, determine whether the atmosphere changed — or the sensor did.”*

---

## 2. End-to-End Pipeline Architecture

```
                      +---------------------------------------+
                      |   AWS TELEMETRY INGESTION STREAM     |
                      |   (REST, WebSocket, CSV, Simulator)   |
                      +-------------------+-------------------+
                                          |
                                          v
                      +---------------------------------------+
                      |       DETERMINISTIC QC GATE           |
                      | (Physical Range, Step Limit, Gaps)    |
                      +-------------------+-------------------+
                                          |
                     +--------------------+--------------------+
                     |                                         |
                     v                                         v
       +----------------------------+            +----------------------------+
       |   TEMPORAL INTELLIGENCE    |            |   MULTIVARIATE PHYSICS     |
       | Lags, Rates, Rolling Stats,|            | Magnus Saturation, Dewpoint|
       | EWMA Drift, Diurnal Cycle  |            | T-RH Coupling, Hydrostatic |
       +-------------+--------------+            +-------------+--------------+
                     |                                         |
                     +--------------------+--------------------+
                                          |
                                          v
                      +---------------------------------------+
                      |         ML ANOMALY ENGINES            |
                      |                                       |
                      |  [Model 1: Isolation Forest]          |
                      |  Fast unsupervised feature isolation  |
                      |                                       |
                      |  [Model 2: Deep LSTM Autoencoder]     |
                      |  Temporal sequence reconstruction MSE |
                      +-------------------+-------------------+
                                          |
                     +--------------------+--------------------+
                     |                                         |
                     v                                         v
       +----------------------------+            +----------------------------+
       |    SPATIAL CONSENSUS       |            |   CALIBRATION DRIFT        |
       | Multi-station neighborhood |            | Rolling residual tracking, |
       | correlation, outlier check |            | EWMA bias, early warning   |
       +-------------+--------------+            +-------------+--------------+
                     |                                         |
                     +--------------------+--------------------+
                                          |
                                          v
                      +---------------------------------------+
                      |        DECISION FUSION ENGINE         |
                      |  - Bayesian Evidence Synthesis        |
                      |  - Genuine Weather Event Protection   |
                      |  - Uncertainty Quantification         |
                      +-------------------+-------------------+
                                          |
            +-----------------------------+-----------------------------+
            |                             |                             |
            v                             v                             v
+-----------------------+     +-----------------------+     +-----------------------+
|  CLASSIFICATION &     |     | EXPLAINABILITY &      |     | VALUE CORRECTION      |
|  ROOT-CAUSE ENGINE    |     | SHAP ATTRIBUTION      |     | (Non-destructive      |
| Normal, Weather Event,|     | Evidence checklist,   |     | temporal/spatial      |
| Sensor Anomaly, Fault |     | feature attributions  |     | reconstruction)       |
+-----------+-----------+     +-----------+-----------+     +-----------+-----------+
            |                             |                             |
            +-----------------------------+-----------------------------+
                                          |
                                          v
                      +---------------------------------------+
                      |   OPERATIONAL MISSION CONSOLE (UI)    |
                      | Live stream, Leaflet map, Alert Center|
                      | Health scores, Fault lab, Side-by-side|
                      +---------------------------------------+
```

---

## 3. Core Engine Specifications

### 3.1 Parameter Boundaries
To ensure strict meteorological adherence, all intelligence models operate exclusively on the 3 fundamental automatic weather station parameters:
1. **Air Temperature ($T$)** in °C
2. **Atmospheric Pressure ($P$)** in hPa
3. **Relative Humidity ($RH$)** in %
Station metadata (latitude, longitude, elevation, timestamp) are utilized solely for temporal, spatial, and elevation-compensated context.

### 3.2 Deterministic Quality Control Gate
- **Physical Limits Check:** Station-specific min/max bounds (e.g. Western Himalayan Shimla AWS vs Thar Desert Jodhpur AWS).
- **Rate-of-Change / Step Test:** Limits maximum permissible parameter delta per 10-minute interval ($\le 3.5^\circ\text{C}$, $\le 3.5\text{ hPa}$, $\le 25\%\text{ RH}$).
- **Frozen Sensor Detection:** Identifies sensors repeating identical values ($< 0.04$ variance over $\ge 6$ consecutive reporting intervals) while companion sensors actively fluctuate.
- **Communication Gap Detector:** Flags telemetry lapses exceeding 15 minutes.

### 3.3 Thermodynamic Physics Engine
- **Magnus-Tetens Formula:** Computes saturation vapor pressure $e_s(T)$ and thermodynamic dew point $T_d$:
  $$e_s(T) = 6.112 \times \exp\left(\frac{17.67 \times T}{T + 243.5}\right)$$
- **Thermodynamic Consistency Checks:**
  - *No Supersaturation Violation:* Flags records where $T_d > T_{air} + 0.5^\circ\text{C}$ or $RH > 100\%$.
  - *Diurnal Coupling Law:* A sharp rise in temperature without rain cooling requires saturation vapor expansion; hence $RH$ must decline. Violations indicate instrument transducer decoupling.
  - *Pressure Tendency Dynamics:* Extreme pressure plunges must accompany squall downdrafts with cooling. Uncoupled pressure crashes indicate barometric transducer failure.

### 3.4 Machine Learning Anomaly Engines
- **Model 1: Isolation Forest (scikit-learn):** Fast unsupervised anomaly isolation trained on 29 temporal features (lags, rolling stats, acceleration, diurnal cyclic transforms).
- **Model 2: Deep LSTM Autoencoder (PyTorch):** Sequence-to-sequence temporal reconstruction (sequence length 24, hidden dimension 32, latent bottleneck 16). Detects multi-timestep dynamic disruptions and exposes per-variable reconstruction errors.
- **Adaptive Threshold Calibration:** 98th percentile, 3-sigma, and robust Median Absolute Deviation (MAD) calibration on clean seasonal baselines.

### 3.5 Decision Fusion & Genuine Weather Protection
- Combines deterministic checks, physics inconsistency scores, ML anomaly scores, spatial consensus, and calibration drift.
- Calculates posterior probabilities: $P_{weather}$, $P_{sensor}$, $P_{dq}$, and Shannon entropy uncertainty.
- **Genuine Weather Event Protection:** If an extreme change is detected, but physics coupling is valid, change is sustained, and spatial neighbors confirm the trend $\implies$ Classified as `GENUINE_WEATHER_EVENT` rather than a sensor fault.

### 3.6 Explainable AI & Sensor Health Engine
- **TreeSHAP Attributions:** Quantifies feature contribution directions and magnitudes.
- **Evidence Checklist:** Auditable checklist for operational meteorologists.
- **Sensor Health Scoring:** 0-100% health score per sensor and station composite, tracking progressive drift, telemetry uptime, and false alarm history across 24h, 7d, and 30d.
