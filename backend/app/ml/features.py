import math
import numpy as np
from datetime import datetime
from typing import List, Dict, Any, Optional
from backend.app.models.schemas import ObservationRaw
from backend.app.simulation.generator import AWSDataGenerator

FEATURE_NAMES = [
    # Core variables
    "temp", "pressure", "humidity",
    # Lags
    "temp_lag1", "temp_lag3", "temp_lag6",
    "pressure_lag1", "pressure_lag3",
    "humidity_lag1", "humidity_lag3",
    # Rolling statistics (12-step window = 1 hour at 5-min intervals)
    "temp_roll_mean12", "temp_roll_std12", "temp_roll_range12",
    "pressure_roll_mean12", "pressure_roll_std12",
    "humidity_roll_mean12", "humidity_roll_std12",
    # Rates and acceleration
    "temp_rate_of_change", "temp_acceleration",
    "pressure_rate_of_change", "pressure_acceleration",
    "humidity_rate_of_change",
    # Baseline deviations (Z-scores)
    "temp_z_score", "pressure_z_score", "humidity_z_score",
    # Diurnal time encoding
    "hour_sin", "hour_cos",
    # Physical interaction proxy
    "t_rh_ratio", "dew_point_approx"
]

class TemporalFeatureExtractor:
    """
    Extracts high-dimensional temporal, statistical, and dynamical features
    from AWS meteorological time-series.
    """

    def __init__(self):
        pass

    def extract_features(
        self,
        current: ObservationRaw,
        history: List[ObservationRaw]  # chronologically sorted, up to 24-48 observations
    ) -> Dict[str, float]:
        """
        Extracts full feature vector as a dictionary of floats.
        Safe against missing history by using robust fallbacks.
        """
        feats: Dict[str, float] = {}

        t = current.temperature if current.temperature is not None else 25.0
        p = current.pressure if current.pressure is not None else 1000.0
        rh = current.humidity if current.humidity is not None else 50.0

        feats["temp"] = float(t)
        feats["pressure"] = float(p)
        feats["humidity"] = float(rh)

        # Diurnal cyclics
        try:
            dt = datetime.fromisoformat(current.timestamp)
            hour_dec = dt.hour + dt.minute / 60.0
        except Exception:
            hour_dec = 12.0

        feats["hour_sin"] = float(math.sin(2.0 * math.pi * hour_dec / 24.0))
        feats["hour_cos"] = float(math.cos(2.0 * math.pi * hour_dec / 24.0))

        # Lags
        def get_lag(param: str, lag_k: int) -> float:
            if len(history) >= lag_k:
                val = getattr(history[-lag_k], param, None)
                if val is not None:
                    return float(val)
            return float(getattr(current, param, 0.0) or 0.0)

        feats["temp_lag1"] = get_lag("temperature", 1)
        feats["temp_lag3"] = get_lag("temperature", 3)
        feats["temp_lag6"] = get_lag("temperature", 6)

        feats["pressure_lag1"] = get_lag("pressure", 1)
        feats["pressure_lag3"] = get_lag("pressure", 3)

        feats["humidity_lag1"] = get_lag("humidity", 1)
        feats["humidity_lag3"] = get_lag("humidity", 3)

        # Rolling statistics (last 12 history points + current)
        window = [h for h in history[-11:] if h is not None] + [current]
        
        t_vals = [h.temperature for h in window if h.temperature is not None]
        p_vals = [h.pressure for h in window if h.pressure is not None]
        rh_vals = [h.humidity for h in window if h.humidity is not None]

        if not t_vals: t_vals = [t]
        if not p_vals: p_vals = [p]
        if not rh_vals: rh_vals = [rh]

        feats["temp_roll_mean12"] = float(np.mean(t_vals))
        feats["temp_roll_std12"] = float(np.std(t_vals)) if len(t_vals) > 1 else 0.1
        feats["temp_roll_range12"] = float(np.max(t_vals) - np.min(t_vals))

        feats["pressure_roll_mean12"] = float(np.mean(p_vals))
        feats["pressure_roll_std12"] = float(np.std(p_vals)) if len(p_vals) > 1 else 0.1

        feats["humidity_roll_mean12"] = float(np.mean(rh_vals))
        feats["humidity_roll_std12"] = float(np.std(rh_vals)) if len(rh_vals) > 1 else 0.2

        # Rates and acceleration
        # Rate of change: delta per step
        feats["temp_rate_of_change"] = float(t - feats["temp_lag1"])
        t_prev_rate = float(feats["temp_lag1"] - get_lag("temperature", 2))
        feats["temp_acceleration"] = float(feats["temp_rate_of_change"] - t_prev_rate)

        feats["pressure_rate_of_change"] = float(p - feats["pressure_lag1"])
        p_prev_rate = float(feats["pressure_lag1"] - get_lag("pressure", 2))
        feats["pressure_acceleration"] = float(feats["pressure_rate_of_change"] - p_prev_rate)

        feats["humidity_rate_of_change"] = float(rh - feats["humidity_lag1"])

        # Z-scores
        feats["temp_z_score"] = float((t - feats["temp_roll_mean12"]) / max(feats["temp_roll_std12"], 0.05))
        feats["pressure_z_score"] = float((p - feats["pressure_roll_mean12"]) / max(feats["pressure_roll_std12"], 0.05))
        feats["humidity_z_score"] = float((rh - feats["humidity_roll_mean12"]) / max(feats["humidity_roll_std12"], 0.1))

        # Physical coupled proxy
        feats["t_rh_ratio"] = float(t / max(rh, 1.0))
        # Dew point approximation: Magnus
        try:
            es = 6.112 * math.exp((17.67 * t) / (t + 243.5))
            e = (max(0.1, rh) / 100.0) * es
            ln_e = math.log(max(e / 6.112, 1e-4))
            feats["dew_point_approx"] = float((243.5 * ln_e) / (17.67 - ln_e))
        except Exception:
            feats["dew_point_approx"] = float(t - (100.0 - rh) / 5.0)

        return feats

    def feature_vector(self, feats: Dict[str, float]) -> np.ndarray:
        """Converts extracted features into a fixed-ordered 1D float32 numpy array."""
        return np.array([feats.get(k, 0.0) for k in FEATURE_NAMES], dtype=np.float32)
