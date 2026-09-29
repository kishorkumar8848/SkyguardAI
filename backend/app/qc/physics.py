import math
import numpy as np
from typing import List, Dict, Any, Optional
from backend.app.models.schemas import ObservationRaw, PhysicsResult

class PhysicsInformedEngine:
    """
    Multivariate physics-informed meteorological consistency validator.
    Enforces thermodynamic laws (Clausius-Clapeyron, Magnus formula, dew-point depression)
    and empirical atmospheric boundary-layer coupled dynamics.
    """

    def __init__(self):
        # Baseline covariance for [Temp, Pressure, Humidity] in normalized units
        self.default_mean = np.array([28.0, 1000.0, 60.0])
        # Inverted covariance matrix prior (regularized)
        cov = np.array([
            [16.0, -1.2, -35.0],   # Temp vs RH negative correlation (-35.0)
            [-1.2, 9.0, 2.0],
            [-35.0, 2.0, 225.0]
        ])
        self.inv_cov = np.linalg.pinv(cov)

    def calculate_dew_point(self, temp_c: float, rh_pct: float) -> float:
        """Computes thermodynamic dew point T_d (°C) using Magnus-Tetens relationship."""
        rh_safe = max(0.1, min(100.0, rh_pct))
        es = 6.112 * math.exp((17.67 * temp_c) / (temp_c + 243.5))
        e = (rh_safe / 100.0) * es
        ln_term = math.log(max(e / 6.112, 1e-5))
        td = (243.5 * ln_term) / (17.67 - ln_term)
        return round(td, 2)

    def validate_physics(
        self,
        current: ObservationRaw,
        history: List[ObservationRaw]
    ) -> PhysicsResult:
        if current.temperature is None or current.pressure is None or current.humidity is None:
            return PhysicsResult(
                magnus_valid=False,
                physics_inconsistency_score=0.9,
                details={"error": "Missing parameter for physical validation"}
            )

        t = current.temperature
        p = current.pressure
        rh = current.humidity

        # 1. Magnus & Dew Point Calculation
        td = self.calculate_dew_point(t, rh)
        dew_point_depression = round(t - td, 2)

        # 2. Constraint: Dew point cannot significantly exceed air temperature (supersaturation violation)
        # In nature, cloud/fog droplets condense when RH=100% (Td = T). Td > T by > 0.5C is an instrument error.
        supersaturation_violation = bool((td > (t + 0.5)) or (rh > 102.0))

        # 3. Dynamic Temporal Coupling (Coupled T-RH and P-T dynamics)
        diurnal_rh_inconsistent = False
        pressure_tendency_plausible = True
        inconsistency_reasons = []

        if history:
            prev = history[-1]
            if prev.temperature is not None and prev.humidity is not None:
                delta_t = t - prev.temperature
                delta_rh = rh - prev.humidity

                # Atmospheric physics: During rapid diurnal warming (e.g. delta_t > 3°C),
                # saturation vapor pressure increases sharply. If absolute moisture is conserved or slowly changing,
                # RH MUST decrease. A large positive temperature spike WITH a large positive humidity spike
                # in the absence of a storm/rainfall (indicated by pressure drop) violates thermodynamics.
                if delta_t > 3.0 and delta_rh > 15.0 and (prev.pressure is not None and abs(p - prev.pressure) < 1.0):
                    diurnal_rh_inconsistent = True
                    inconsistency_reasons.append(
                        f"Thermodynamic violation: Simultaneous sharp rise in T (+{round(delta_t,1)}°C) and RH (+{round(delta_rh,1)}%) without pressure perturbation"
                    )

                # Sensor freeze in one channel while others vary
                if len(history) >= 4:
                    t_var = np.std([h.temperature for h in history[-4:] if h.temperature is not None] + [t])
                    rh_var = np.std([h.humidity for h in history[-4:] if h.humidity is not None] + [rh])
                    if t_var < 0.03 and rh_var > 4.0:
                        inconsistency_reasons.append("Uncoupled dynamics: Temperature static while Humidity fluctuates actively")

            if prev.pressure is not None:
                delta_p = p - prev.pressure
                # Extreme pressure plunge (> 3 hPa in 10 min) should accompany squall/gust front with cooling
                if delta_p < -3.0:
                    if prev.temperature is not None and t >= prev.temperature:
                        pressure_tendency_plausible = False
                        inconsistency_reasons.append(
                            f"Barometric inconsistency: Severe pressure drop ({round(delta_p, 1)} hPa) without downdraft cooling"
                        )

        # 4. Multivariate Mahalanobis Distance
        obs_vec = np.array([t, p, rh])
        diff = obs_vec - self.default_mean
        try:
            # Normalized Mahalanobis metric
            mahalanobis = float(np.sqrt(np.dot(np.dot(diff, self.inv_cov), diff)))
        except Exception:
            mahalanobis = 1.0

        # Physical inconsistency score (0.0 = completely consistent, 1.0 = physical violation)
        score = 0.0
        if supersaturation_violation:
            score += 0.6
        if diurnal_rh_inconsistent:
            score += 0.4
        if not pressure_tendency_plausible:
            score += 0.3
        if mahalanobis > 4.5:
            score += min(0.3, (mahalanobis - 4.5) * 0.1)

        physics_inconsistency_score = min(1.0, round(score, 3))

        return PhysicsResult(
            dew_point=td,
            dew_point_depression=dew_point_depression,
            magnus_valid=not supersaturation_violation,
            supersaturation_violation=supersaturation_violation,
            diurnal_rh_inconsistent=diurnal_rh_inconsistent,
            pressure_tendency_plausible=pressure_tendency_plausible,
            mahalanobis_distance=round(mahalanobis, 2),
            physics_inconsistency_score=physics_inconsistency_score,
            details={
                "inconsistency_reasons": inconsistency_reasons,
                "dew_point": td,
                "dew_point_depression": dew_point_depression
            }
        )
