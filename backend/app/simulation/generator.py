import math
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from backend.app.models.schemas import ObservationRaw
from backend.app.core.config import settings

def magnus_saturation_vapor_pressure(temp_c: float) -> float:
    """Calculates saturation vapor pressure e_s (hPa) using Magnus-Tetens formula."""
    return 6.112 * math.exp((17.67 * temp_c) / (temp_c + 243.5))

def dew_point_from_t_rh(temp_c: float, rh_pct: float) -> float:
    """Calculates dew point T_d (°C) using inverse Magnus formula."""
    rh_clipped = max(0.1, min(100.0, rh_pct))
    es = magnus_saturation_vapor_pressure(temp_c)
    e = (rh_clipped / 100.0) * es
    ln_term = math.log(max(e / 6.112, 1e-4))
    td = (243.5 * ln_term) / (17.67 - ln_term)
    return td

class AWSDataGenerator:
    """
    High-fidelity physical AWS meteorological time-series simulator.
    Simulates coupled Temperature, Atmospheric Pressure, and Relative Humidity
    governed by solar insolation, Magnus equation, and semi-diurnal barometric tides.
    """

    def __init__(self, random_seed: int = 42):
        self.rng = np.random.RandomState(random_seed)

        # Baseline parameters per station: (mean_temp, temp_diurnal_amp, mean_p, p_amp, mean_rh, rh_amp)
        self.station_profiles = {
            "AWS-DEL-001": {"t_mean": 28.0, "t_amp": 7.0, "p_mean": 998.0, "rh_mean": 55.0, "noise_t": 0.3, "noise_p": 0.2, "noise_rh": 1.0},
            "AWS-JOD-002": {"t_mean": 33.0, "t_amp": 9.5, "p_mean": 995.0, "rh_mean": 32.0, "noise_t": 0.4, "noise_p": 0.2, "noise_rh": 0.8},
            "AWS-MUM-003": {"t_mean": 29.0, "t_amp": 3.5, "p_mean": 1008.0, "rh_mean": 78.0, "noise_t": 0.2, "noise_p": 0.15, "noise_rh": 1.2},
            "AWS-CHN-004": {"t_mean": 30.5, "t_amp": 4.0, "p_mean": 1007.5, "rh_mean": 74.0, "noise_t": 0.2, "noise_p": 0.15, "noise_rh": 1.2},
            "AWS-SHM-005": {"t_mean": 16.0, "t_amp": 5.0, "p_mean": 786.0, "rh_mean": 65.0, "noise_t": 0.35, "noise_p": 0.25, "noise_rh": 1.5},
            "AWS-KOL-006": {"t_mean": 29.5, "t_amp": 5.0, "p_mean": 1009.0, "rh_mean": 76.0, "noise_t": 0.25, "noise_p": 0.15, "noise_rh": 1.2}
        }

    def generate_point(self, station_id: str, dt: datetime, synoptic_p_offset: float = 0.0, synoptic_t_offset: float = 0.0) -> ObservationRaw:
        profile = self.station_profiles.get(station_id, self.station_profiles["AWS-DEL-001"])
        cfg = settings.DEFAULT_STATIONS.get(station_id)

        hour = dt.hour + dt.minute / 60.0 + dt.second / 3600.0

        # 1. Diurnal solar cycle for Temperature (peak at 14:30, minimum at 05:30)
        # Solar thermal response lags solar noon (~12:00) by ~2.5 hours
        temp_diurnal = profile["t_amp"] * math.sin(2.0 * math.pi * (hour - 8.5) / 24.0)
        temp = profile["t_mean"] + temp_diurnal + synoptic_t_offset + self.rng.normal(0, profile["noise_t"])
        temp = round(temp, 2)

        # 2. Semi-diurnal atmospheric barometric tide (Lindzen-Chapman: 12-hour period, peaks at 10:00 & 22:00, troughs at 04:00 & 16:00)
        p_tide = 1.3 * math.sin(4.0 * math.pi * (hour - 7.0) / 24.0)
        # Diurnal 24-hr tide
        p_diurnal = 0.4 * math.sin(2.0 * math.pi * (hour - 9.0) / 24.0)
        pressure = profile["p_mean"] + p_tide + p_diurnal + synoptic_p_offset + self.rng.normal(0, profile["noise_p"])
        pressure = round(pressure, 2)

        # 3. Relative Humidity: coupled physically to temperature via saturation vapor pressure
        # Under near-constant specific humidity during afternoon, RH anti-correlates strongly with T
        # e_s expands as temperature increases
        base_es = magnus_saturation_vapor_pressure(profile["t_mean"])
        current_es = magnus_saturation_vapor_pressure(temp)
        # Constant baseline vapor pressure e_0
        e_0 = (profile["rh_mean"] / 100.0) * base_es
        # Physical RH
        rh_phys = (e_0 / current_es) * 100.0
        rh = rh_phys + self.rng.normal(0, profile["noise_rh"])
        rh = max(5.0, min(99.0, round(rh, 1)))

        return ObservationRaw(
            timestamp=dt.isoformat(),
            station_id=station_id,
            temperature=temp,
            pressure=pressure,
            humidity=rh,
            latitude=cfg.latitude if cfg else None,
            longitude=cfg.longitude if cfg else None,
            elevation=cfg.elevation if cfg else None,
            station_name=cfg.station_name if cfg else None
        )

    def generate_series(
        self,
        station_id: str,
        start_dt: datetime,
        num_steps: int = 288,  # 288 steps @ 5-min intervals = 24 hours
        step_minutes: int = 5
    ) -> List[ObservationRaw]:
        """Generates continuous physical time-series for a single station."""
        observations: List[ObservationRaw] = []
        synoptic_p = 0.0
        synoptic_t = 0.0

        for i in range(num_steps):
            dt = start_dt + timedelta(minutes=i * step_minutes)
            # Add slow multi-day synoptic wander (Gaussian random walk drift)
            synoptic_p += self.rng.normal(0, 0.03)
            synoptic_p = max(-8.0, min(8.0, synoptic_p))
            synoptic_t += self.rng.normal(0, 0.02)
            synoptic_t = max(-4.0, min(4.0, synoptic_t))

            obs = self.generate_point(station_id, dt, synoptic_p, synoptic_t)
            observations.append(obs)

        return observations

    def generate_multi_station_series(
        self,
        start_dt: datetime,
        num_steps: int = 288,
        step_minutes: int = 5
    ) -> Dict[str, List[ObservationRaw]]:
        """Generates synchronized observations across all active stations."""
        dataset = {}
        for station_id in self.station_profiles.keys():
            dataset[station_id] = self.generate_series(station_id, start_dt, num_steps, step_minutes)
        return dataset

    def export_to_dataframe(self, observations: List[ObservationRaw]) -> pd.DataFrame:
        data = [obs.model_dump() for obs in observations]
        df = pd.DataFrame(data)
        return df
