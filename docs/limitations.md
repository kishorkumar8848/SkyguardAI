# SkyGuard AI: Operational Limitations & Future Research

## 1. Important Positioning
**SkyGuard AI is positioned as an intelligent automated decision-support and quality-control layer for Automatic Weather Station (AWS) observations.**
It is designed to augment and accelerate operational meteorologists and field maintenance crews, NOT to unilaterally displace certified human meteorological judgment or statutory disaster declaration procedures.

---

## 2. Technical Limitations

1. **Spatial Consensus Availability:**
   - Spatial consensus requires neighboring stations within a ~350 km radius.
   - For isolated island stations (e.g. Lakshadweep, Andaman & Nicobar) or deep Himalayan mountain valleys, spatial consensus falls back gracefully to single-station temporal-thermodynamic QC.

2. **Microclimate Topography:**
   - Steep orographic gradients (e.g. sharp valley temperature inversions or sea-breeze fronts) can produce localized genuine microclimate differences between closely spaced stations.

3. **Remaining Useful Life (RUL) Modeling:**
   - The platform generates actionable *Predictive Maintenance Early Warnings* when persistent drift ($\ge 0.8^\circ\text{C}/\text{day}$) or continuous health decline is detected.
   - It does *not* claim exact remaining useful life down to the hour, as mechanical fatigue and random lightning strikes depend on stochastic environmental factors.

---

## 3. Future Roadmap

1. **Multi-Modal Radar / Satellite Ground-Truthing:**
   - Integrating Doppler Weather Radar (DWR) reflectivity to cross-validate thunderstorm gust front detections.
2. **LoRaWAN / Satellite Telemetry Edge RTU Port:**
   - Quantizing the lightweight deterministic and compact ML module to micro-controllers (ESP32 / ARM Cortex-M4) for direct deployment on solar-powered AWS dataloggers in remote districts.
