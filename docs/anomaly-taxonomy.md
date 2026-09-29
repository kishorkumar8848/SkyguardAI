# SkyGuard AI: Anomaly Taxonomy & Fault Signature Reference

SkyGuard AI defines a rigorous taxonomy of Automatic Weather Station (AWS) physical defects, telemetry anomalies, and severe atmospheric phenomena.

---

## 1. Classification Classes

| Class | Definition | Operational Protocol |
| :--- | :--- | :--- |
| `NORMAL` | All parameters conform to certified IMD/WMO limits, temporal persistence, and thermodynamic coupling. | Nominal archiving. |
| `GENUINE_WEATHER_EVENT` | Statistically unusual value confirmed by thermodynamic coupling (Magnus law), temporal continuity, or regional consensus. | Issue meteorological warning bulletin. Do not dispatch repair crew. |
| `SENSOR_ANOMALY` | Isolated transducer defect, electrical spike, calibration drift, or physical inconsistency. | Flag record, estimate non-destructive correction, schedule technician. |
| `DATA_QUALITY_ISSUE` | Corrupted packet, missing timestamps, format error, or telemetry communication drop. | Telemetry modem and packet logger review. |
| `UNCERTAIN` | Conflicting evidence between statistical models and physical constraints. | Flag for human meteorologist manual review. |

---

## 2. Root Cause Taxonomy & Physical Manifestations

### 1. `SPIKE` (Transducer / Impulse Anomaly)
- **Physical Cause:** Transient voltage surges, ADC bit-flip, lightning induction, or inductive motor noise near AWS mast.
- **Signature:** Single-interval abrupt change ($|\Delta T| > 3.5^\circ\text{C}$ in 5 min) that immediately reverts or fails thermodynamic coupling with RH and Pressure.

### 2. `DROP` (Signal Short / Line Loss)
- **Physical Cause:** Intermittent wire disconnection, loose screw terminal, or ground fault.
- **Signature:** Sudden step plunge below expected diurnal baseline.

### 3. `FROZEN_SENSOR` (Mechanical / Register Sticking)
- **Physical Cause:** Sensor transducer stuck (icing, debris, spider web in aspirated shield) or digital microcontroller register locked.
- **Signature:** Exact or near-identical values ($|\Delta x| \le 0.04$) across $\ge 6$ consecutive intervals while companion channels continue normal diurnal fluctuations.

### 4. `CALIBRATION_DRIFT` (Slow Sensor Degradation)
- **Physical Cause:** Aging of platinum resistance element (RTD), hygroscopic contamination on capacitive RH film, or micro-cracks in piezoresistive barometric diaphragm.
- **Signature:** Progressive systematic bias accumulating over days/weeks ($\text{slope} \ge 0.02^\circ\text{C}/\text{day}$ or persistent non-zero rolling residual).

### 5. `COMMUNICATION_GAP` (Telemetry Outage)
- **Physical Cause:** Cellular modem signal loss, solar panel battery under-voltage during monsoon overcast, or satellite uplink failure.
- **Signature:** Elapsed interval $> 15$ minutes between consecutive data packets.

### 6. `POWER_FLUCTUATION` (Brownout Instability)
- **Physical Cause:** Degrading 12V lead-acid battery or unstable solar MPPT charge controller.
- **Signature:** Erratic oscillation between missing values, impossible registers, and nominal readings.

### 7. `DATA_CORRUPTION` (Malformed Payload)
- **Physical Cause:** Serial baud rate mismatch, buffer overrun, or corrupted CRC packet.
- **Signature:** Impossible numeric registers ($999.9$, $-99.9$, NaN, Inf).

### 8. `MULTIVARIATE_INCONSISTENCY` (Thermodynamic Law Violation)
- **Physical Cause:** Disconnected or cross-wired sensor channels.
- **Signature:** Dew point $T_d$ significantly exceeds air temperature ($T_d > T + 0.5^\circ\text{C}$), or sharp temperature jump with simultaneously exploding RH without pressure depression.

### 9. `GENUINE_WEATHER_EVENT` (Atmospheric Dynamics)
- **Phenomena:** Heatwaves, cold fronts, thunderstorm squall lines, convective downdrafts.
- **Signature:** Extreme rate of change or magnitude accompanied by physical thermodynamic coupling (e.g. sharp warming accompanied by Magnus RH drop; or squall cooling accompanied by RH jump to saturation and barometric pressure gust). Supported by neighboring stations.
