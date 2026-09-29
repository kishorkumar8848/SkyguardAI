import math
from datetime import datetime
from typing import List, Dict, Any, Optional
from backend.app.models.schemas import ObservationRaw, QCResult, StationConfig
from backend.app.core.config import settings

class DeterministicQCEngine:
    """
    Deterministic Quality Control Engine conforming to WMO Guide to Meteorological Instruments
    and Methods of Observation (WMO-No. 8) and IMD operational standards.
    """

    def __init__(self, station_configs: Optional[Dict[str, StationConfig]] = None):
        self.station_configs = station_configs or settings.DEFAULT_STATIONS

    def get_config(self, station_id: str) -> StationConfig:
        return self.station_configs.get(
            station_id,
            self.station_configs.get("AWS-DEL-001")
        )

    def validate_observation(
        self,
        current: ObservationRaw,
        history: List[ObservationRaw]  # ordered chronologically, up to 12-24 past observations
    ) -> QCResult:
        cfg = self.get_config(current.station_id)
        flagged_reasons: List[str] = []

        range_check = {"temperature": True, "pressure": True, "humidity": True}
        rate_of_change_check = {"temperature": True, "pressure": True, "humidity": True}
        frozen_sensor_check = {"temperature": True, "pressure": True, "humidity": True}
        persistence_check = {"temperature": True, "pressure": True, "humidity": True}
        comm_gap = False

        # 1. Null / Missing Value Check
        if current.temperature is None or math.isnan(current.temperature):
            range_check["temperature"] = False
            flagged_reasons.append("MISSING_OR_NAN_TEMPERATURE")
        if current.pressure is None or math.isnan(current.pressure):
            range_check["pressure"] = False
            flagged_reasons.append("MISSING_OR_NAN_PRESSURE")
        if current.humidity is None or math.isnan(current.humidity):
            range_check["humidity"] = False
            flagged_reasons.append("MISSING_OR_NAN_HUMIDITY")

        # 2. Extreme Physical Range Validation (station-specific)
        if current.temperature is not None:
            if current.temperature < cfg.temp_min or current.temperature > cfg.temp_max:
                range_check["temperature"] = False
                flagged_reasons.append(
                    f"TEMP_OUT_OF_RANGE: {current.temperature}°C (Limit: [{cfg.temp_min}, {cfg.temp_max}]°C)"
                )

        if current.pressure is not None:
            if current.pressure < cfg.pressure_min or current.pressure > cfg.pressure_max:
                range_check["pressure"] = False
                flagged_reasons.append(
                    f"PRESSURE_OUT_OF_RANGE: {current.pressure} hPa (Limit: [{cfg.pressure_min}, {cfg.pressure_max}] hPa)"
                )

        if current.humidity is not None:
            if current.humidity < cfg.humidity_min or current.humidity > cfg.humidity_max:
                range_check["humidity"] = False
                flagged_reasons.append(
                    f"HUMIDITY_OUT_OF_RANGE: {current.humidity}% (Limit: [{cfg.humidity_min}, {cfg.humidity_max}]%)"
                )

        # 3. Temporal Rate-of-Change / Step Check
        if history:
            prev = history[-1]
            try:
                curr_dt = datetime.fromisoformat(current.timestamp)
                prev_dt = datetime.fromisoformat(prev.timestamp)
                dt_minutes = max(0.1, (curr_dt - prev_dt).total_seconds() / 60.0)
            except Exception:
                dt_minutes = 5.0

            # Communication gap (> 15 minutes between consecutive reports)
            if dt_minutes > 15.0:
                comm_gap = True
                flagged_reasons.append(f"COMMUNICATION_GAP: {round(dt_minutes, 1)} minutes elapsed since last report")

            # Duplicate timestamp check
            if dt_minutes <= 0.0:
                flagged_reasons.append("DUPLICATE_OR_REVERSED_TIMESTAMP")

            # Normalized step checks (scaled to 10-minute intervals)
            time_scale = max(0.5, dt_minutes / 10.0)

            if current.temperature is not None and prev.temperature is not None:
                delta_t = abs(current.temperature - prev.temperature)
                max_delta_t = cfg.temp_rate_max * time_scale
                if delta_t > max_delta_t:
                    rate_of_change_check["temperature"] = False
                    flagged_reasons.append(
                        f"TEMP_STEP_LIMIT_EXCEEDED: ΔT={round(delta_t, 2)}°C in {round(dt_minutes, 1)}m (Max allowed: {round(max_delta_t, 2)}°C)"
                    )

            if current.pressure is not None and prev.pressure is not None:
                delta_p = abs(current.pressure - prev.pressure)
                max_delta_p = cfg.pressure_rate_max * time_scale
                if delta_p > max_delta_p:
                    rate_of_change_check["pressure"] = False
                    flagged_reasons.append(
                        f"PRESSURE_STEP_LIMIT_EXCEEDED: ΔP={round(delta_p, 2)} hPa in {round(dt_minutes, 1)}m (Max allowed: {round(max_delta_p, 2)} hPa)"
                    )

            if current.humidity is not None and prev.humidity is not None:
                delta_rh = abs(current.humidity - prev.humidity)
                max_delta_rh = cfg.humidity_rate_max * time_scale
                if delta_rh > max_delta_rh:
                    rate_of_change_check["humidity"] = False
                    flagged_reasons.append(
                        f"HUMIDITY_STEP_LIMIT_EXCEEDED: ΔRH={round(delta_rh, 1)}% in {round(dt_minutes, 1)}m (Max allowed: {round(max_delta_rh, 1)}%)"
                    )

        # 4. Frozen Sensor / Persistence Check across recent history (e.g. >= 6 steps)
        if len(history) >= 5 and current.temperature is not None:
            recent_t = [h.temperature for h in history[-5:] if h.temperature is not None] + [current.temperature]
            recent_p = [h.pressure for h in history[-5:] if h.pressure is not None] + [current.pressure]
            recent_rh = [h.humidity for h in history[-5:] if h.humidity is not None] + [current.humidity]

            # Check if Temperature is completely frozen (identical values or < 0.03 range over 6 periods)
            if len(recent_t) >= 6:
                var_t = float(max(recent_t) - min(recent_t))
                var_p = float(max(recent_p) - min(recent_p)) if len(recent_p) >= 6 else 0.0
                var_rh = float(max(recent_rh) - min(recent_rh)) if len(recent_rh) >= 6 else 0.0

                if var_t <= 0.04 and (var_p > 0.15 or var_rh > 0.8 or len(set(recent_t)) <= 2):
                    frozen_sensor_check["temperature"] = False
                    flagged_reasons.append(f"FROZEN_TEMPERATURE_SENSOR: Constant reading {recent_t[-1]}°C (range {round(var_t, 3)}°C) over 6 periods")

                if var_p <= 0.04 and (var_t > 0.2 or var_rh > 0.8 or len(set(recent_p)) <= 2):
                    frozen_sensor_check["pressure"] = False
                    flagged_reasons.append(f"FROZEN_PRESSURE_SENSOR: Constant reading {recent_p[-1]} hPa (range {round(var_p, 3)} hPa) over 6 periods")

                if var_rh <= 0.08 and (var_t > 0.2 or var_p > 0.15 or len(set(recent_rh)) <= 2):
                    frozen_sensor_check["humidity"] = False
                    flagged_reasons.append(f"FROZEN_HUMIDITY_SENSOR: Constant reading {recent_rh[-1]}% (range {round(var_rh, 3)}%) over 6 periods")

        is_clean = len(flagged_reasons) == 0

        return QCResult(
            is_clean=is_clean,
            range_check=range_check,
            rate_of_change_check=rate_of_change_check,
            frozen_sensor_check=frozen_sensor_check,
            persistence_check=persistence_check,
            communication_gap_detected=comm_gap,
            flagged_reasons=flagged_reasons
        )
