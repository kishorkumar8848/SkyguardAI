import copy
import math
import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from backend.app.models.schemas import ObservationRaw, FaultType

class AnomalyInjector:
    """
    Precision meteorological fault and extreme atmospheric event synthesizer.
    Used by the Fault Injection Laboratory and Benchmarking Suite.
    """

    def __init__(self, random_seed: int = 42):
        self.rng = np.random.RandomState(random_seed)

    def inject(
        self,
        observations: List[ObservationRaw],
        fault_type: FaultType,
        parameter: str = "temperature",  # "temperature", "pressure", "humidity", or "all"
        start_idx: int = 12,
        duration: int = 6,
        severity: float = 1.0,
        custom_val: Optional[float] = None
    ) -> List[ObservationRaw]:
        """
        Injects the specified anomaly into a deep copy of the observation stream.
        """
        injected = [obs.model_copy() for obs in observations]
        n = len(injected)
        start_idx = max(0, min(n - 1, start_idx))
        end_idx = min(n, start_idx + duration)

        if fault_type == "SPIKE":
            for i in range(start_idx, min(n, start_idx + max(1, duration // 3))):
                if parameter in ["temperature", "all"] and injected[i].temperature is not None:
                    injected[i].temperature += (8.5 * severity)
                if parameter in ["pressure", "all"] and injected[i].pressure is not None:
                    injected[i].pressure += (15.0 * severity)
                if parameter in ["humidity", "all"] and injected[i].humidity is not None:
                    injected[i].humidity = min(100.0, injected[i].humidity + (35.0 * severity))

        elif fault_type == "DROP":
            for i in range(start_idx, min(n, start_idx + max(1, duration // 3))):
                if parameter in ["temperature", "all"] and injected[i].temperature is not None:
                    injected[i].temperature -= (9.0 * severity)
                if parameter in ["pressure", "all"] and injected[i].pressure is not None:
                    injected[i].pressure -= (18.0 * severity)
                if parameter in ["humidity", "all"] and injected[i].humidity is not None:
                    injected[i].humidity = max(0.0, injected[i].humidity - (40.0 * severity))

        elif fault_type == "FROZEN":
            freeze_t = injected[start_idx].temperature
            freeze_p = injected[start_idx].pressure
            freeze_rh = injected[start_idx].humidity
            for i in range(start_idx, end_idx):
                if parameter in ["temperature", "all"]:
                    injected[i].temperature = freeze_t
                if parameter in ["pressure", "all"]:
                    injected[i].pressure = freeze_p
                if parameter in ["humidity", "all"]:
                    injected[i].humidity = freeze_rh

        elif fault_type == "DRIFT":
            # Linear accumulation: alpha * step
            alpha = (0.4 * severity)
            for step_k, i in enumerate(range(start_idx, end_idx)):
                delta = alpha * (step_k + 1)
                if parameter in ["temperature", "all"] and injected[i].temperature is not None:
                    injected[i].temperature += delta
                if parameter in ["pressure", "all"] and injected[i].pressure is not None:
                    injected[i].pressure += (delta * 0.8)
                if parameter in ["humidity", "all"] and injected[i].humidity is not None:
                    injected[i].humidity = max(0.0, min(100.0, injected[i].humidity + delta))

        elif fault_type == "OFFSET":
            bias = 6.0 * severity
            for i in range(start_idx, end_idx):
                if parameter in ["temperature", "all"] and injected[i].temperature is not None:
                    injected[i].temperature += bias
                if parameter in ["pressure", "all"] and injected[i].pressure is not None:
                    injected[i].pressure += (bias * 2.0)
                if parameter in ["humidity", "all"] and injected[i].humidity is not None:
                    injected[i].humidity = max(0.0, min(100.0, injected[i].humidity + (bias * 3.0)))

        elif fault_type == "NOISE":
            sigma = 3.5 * severity
            for i in range(start_idx, end_idx):
                if parameter in ["temperature", "all"] and injected[i].temperature is not None:
                    injected[i].temperature += float(self.rng.normal(0, sigma))
                if parameter in ["pressure", "all"] and injected[i].pressure is not None:
                    injected[i].pressure += float(self.rng.normal(0, sigma * 1.5))
                if parameter in ["humidity", "all"] and injected[i].humidity is not None:
                    injected[i].humidity = max(0.0, min(100.0, injected[i].humidity + float(self.rng.normal(0, sigma * 3.0))))

        elif fault_type == "COMMUNICATION_GAP":
            # Advance timestamps of subsequent points by 45 minutes to simulate telemetry gap
            gap_minutes = int(45 * severity)
            for i in range(start_idx, n):
                try:
                    dt = datetime.fromisoformat(injected[i].timestamp)
                    injected[i].timestamp = (dt + timedelta(minutes=gap_minutes)).isoformat()
                except Exception:
                    pass

        elif fault_type == "POWER_FLUCTUATION":
            # Brownout oscillation between None, extreme values, and nominal
            for i in range(start_idx, end_idx):
                if i % 2 == 0:
                    injected[i].temperature = None
                    injected[i].pressure = 600.0  # impossible low ADC register
                else:
                    if injected[i].humidity is not None:
                        injected[i].humidity = 100.0

        elif fault_type == "DATA_CORRUPTION":
            # Sentinel garbage values (-999.0 or 9999.0)
            for i in range(start_idx, end_idx):
                injected[i].temperature = 999.9 if custom_val is None else custom_val
                injected[i].pressure = -99.9
                injected[i].humidity = -10.0

        # GENUINE METEOROLOGICAL EVENTS (Thermodynamically Coupled)
        elif fault_type == "HEATWAVE":
            # Sustained adiabatic/advective warming + coupled RH drop
            warm_ramp = np.linspace(1.5, 7.0 * severity, duration)
            for k, i in enumerate(range(start_idx, end_idx)):
                dT = warm_ramp[k]
                if injected[i].temperature is not None:
                    orig_t = injected[i].temperature
                    new_t = orig_t + dT
                    injected[i].temperature = round(new_t, 2)
                    # Thermodynamically coupled RH drop (saturation vapor pressure increases)
                    if injected[i].humidity is not None:
                        rh_drop = dT * 2.8
                        injected[i].humidity = max(8.0, round(injected[i].humidity - rh_drop, 1))

        elif fault_type == "RAPID_COOLING":
            # Thunderstorm downdraft / gust front: abrupt cooling + RH surges towards 95% + pressure spike
            cool_ramp = np.linspace(2.0, 8.0 * severity, duration)
            for k, i in enumerate(range(start_idx, end_idx)):
                dC = cool_ramp[k]
                if injected[i].temperature is not None:
                    injected[i].temperature = round(injected[i].temperature - dC, 2)
                if injected[i].humidity is not None:
                    injected[i].humidity = min(98.0, round(injected[i].humidity + (dC * 3.5), 1))
                if injected[i].pressure is not None and k < 2:
                    injected[i].pressure = round(injected[i].pressure - 2.5, 2)

        elif fault_type == "RAPID_WARMING":
            warm_ramp = np.linspace(1.0, 5.0 * severity, duration)
            for k, i in enumerate(range(start_idx, end_idx)):
                if injected[i].temperature is not None:
                    injected[i].temperature = round(injected[i].temperature + warm_ramp[k], 2)
                if injected[i].humidity is not None:
                    injected[i].humidity = max(15.0, round(injected[i].humidity - (warm_ramp[k] * 2.2), 1))

        return injected
