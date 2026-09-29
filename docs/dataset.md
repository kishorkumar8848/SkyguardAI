# SkyGuard AI: Dataset & Physical Climate Profiles

## 1. Meteorological Parameter Restriction
In accordance with SIH Problem Statement SIH26073 and IMD AWS operational specifications, the core models ingest only:
- **Temperature (°C)**
- **Atmospheric Pressure (hPa)**
- **Relative Humidity (%)**
Plus timestamp and station coordinates for temporal/spatial context. No additional sensor variables (such as wind speed or solar irradiance) are required or introduced.

---

## 2. Representative Indian AWS Agro-Climatic Stations

SkyGuard AI models 6 distinct regional climate regimes across India:

| Station ID | Station Name | Lat / Lon | Elevation | Climate Regime | Mean T (°C) | Mean P (hPa) | Mean RH (%) |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: | :---: |
| `AWS-DEL-001` | Delhi Safdarjung AWS | 28.58°N, 77.21°E | 216 m | Semi-Arid Continental | 28.0 | 998.0 | 55% |
| `AWS-JOD-002` | Jodhpur Desert AWS | 26.26°N, 73.05°E | 224 m | Hot Arid Thar Desert | 33.0 | 995.0 | 32% |
| `AWS-MUM-003` | Mumbai Santacruz AWS | 19.12°N, 72.86°E | 14 m | Coastal Tropical Wet-and-Dry | 29.0 | 1008.0 | 78% |
| `AWS-CHN-004` | Chennai Meenambakkam | 12.99°N, 80.18°E | 16 m | Coastal Maritime Tropical | 30.5 | 1007.5 | 74% |
| `AWS-SHM-005` | Shimla Ridge AWS | 31.10°N, 77.17°E | 2205 m | Highland Montane Subtropical | 16.0 | 786.0 | 65% |
| `AWS-KOL-006` | Kolkata Alipore AWS | 22.53°N, 88.32°E | 6 m | Gangetic Delta Humid Subtropical | 29.5 | 1009.0 | 76% |

---

## 3. Physical Coupling Principles in Synthetic Generation
1. **Solar Diurnal Heating Curve:** Air temperature peaks at ~14:30 local solar time, lagging solar noon by ~2.5 hours.
2. **Lindzen-Chapman Barometric Tides:** Semi-diurnal atmospheric thermal tides generate 1.2 hPa oscillations peaking at ~10:00 and 22:00 local time.
3. **Clausius-Clapeyron Vapor Equilibrium:** Relative humidity anti-correlates with afternoon solar heating as saturation vapor pressure expands exponentially according to the Magnus-Tetens relationship.
4. **Hypsometric Elevation Scaling:** Atmospheric pressure in highland Shimla (2205m) conforms to the barometric formula ($\approx 786$ hPa) and is never flagged as a low-pressure anomaly.
