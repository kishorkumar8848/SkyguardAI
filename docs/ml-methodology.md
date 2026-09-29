# SkyGuard AI: Machine Learning & Scientific Methodology

## 1. Algorithmic Selection Rationale

### Why Not Only Rule-Based QC?
Traditional deterministic rules (e.g. static WMO limits) fail to catch:
- Slow calibration drift within valid absolute bounds
- Multivariate thermodynamic decoupling
- Complex sequence disruptions

### Why Not Only Isolation Forest?
Isolation Forest is unsupervised and isolates outliers based on partition depth. However:
- Genuine severe meteorological events (heatwaves, squalls) are rare and appear as statistical outliers.
- An Isolation Forest treats all extreme outliers identically, creating unacceptable false-alarm rates during severe weather.

### Why Not Only LSTM Autoencoders?
Deep sequence autoencoders model temporal dependencies well, but:
- They require high computational overhead on edge RTUs.
- Reconstruction error alone cannot explain *why* an error occurred or whether the physics of the atmosphere remained valid.

### The SkyGuard AI Hybrid Solution
SkyGuard AI implements an evidence-weighted Bayesian decision fusion layer:
$$\text{Decision} = \mathcal{F}\Big(\text{QC}_{\text{det}}, \text{Physics}_{\text{thermo}}, \text{ML}_{\text{IForest}}, \text{ML}_{\text{LSTM}}, \text{Spatial}_{\text{consensus}}, \text{Health}_{\text{drift}}\Big)$$

---

## 2. Feature Engineering Pipeline (29 Features)

| Feature Group | Features | Meteorological Justification |
| :--- | :--- | :--- |
| **Core Variables** | `temp`, `pressure`, `humidity` | Core AWS observables |
| **Temporal Lags** | `temp_lag1, 3, 6`, `pressure_lag1, 3`, `humidity_lag1, 3` | Captures auto-regressive momentum |
| **Rolling Statistics (1h)** | `temp_roll_mean12`, `temp_roll_std12`, `range12`, `p_mean12`, `rh_mean12` | Adaptive local temporal baseline |
| **Dynamical Derivatives** | `temp_rate_of_change`, `temp_acceleration`, `p_rate`, `rh_rate` | Distinguishes impulse spikes from continuous trends |
| **Statistical Deviations** | `temp_z_score`, `pressure_z_score`, `humidity_z_score` | Standardized deviation from recent mean |
| **Diurnal Harmonics** | `hour_sin`, `hour_cos` | Cyclical time representation of solar day |
| **Physical Couplings** | `t_rh_ratio`, `dew_point_approx` | Magnus saturation proxy |

---

## 3. Deep LSTM Autoencoder Architecture

```
Input Sequence: (Batch, Seq_Len=24, Dim=3)
      │
      ▼
LSTM Encoder Layer:
  - Input Dim: 3 (Normalized T, P, RH)
  - Hidden Dim: 32
  - Return sequences: False
      │
      ▼
Latent Bottleneck:
  - Linear Layer: 32 -> 16
  - Compressed representation of diurnal atmospheric state
      │
      ▼
RepeatVector:
  - Latent vector repeated across Seq_Len=24 timesteps
      │
      ▼
LSTM Decoder Layer:
  - Hidden Dim: 32
  - Return sequences: True
      │
      ▼
Linear Reconstruction Head:
  - Output Dim: 3
      │
      ▼
Reconstruction Error: MSE = (1/N) * sum((X - X_recon)^2)
```

### Variable-Level Reconstruction Error Attribution
For each timestep, the squared error is partitioned into parameter channels:
$$\text{Attribution}_T = \frac{\text{MSE}_T}{\text{MSE}_T + \text{MSE}_P + \text{MSE}_{RH}} \times 100\%$$
This directly isolates whether the temperature, pressure, or humidity transducer caused the anomaly.

---

## 4. Explainable AI with TreeSHAP
For interpretable audit trails, SkyGuard AI integrates TreeSHAP (SHapley Additive exPlanations):
$$\phi_i = \sum_{S \subseteq F \setminus \{i\}} \frac{|S|!(|F| - |S| - 1)!}{|F|!} \Big(f(S \cup \{i\}) - f(S)\Big)$$
SHAP values provide directional evidence (+/– impact) for every flagged anomaly, ensuring non-black-box operation.
