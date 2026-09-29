import numpy as np
from typing import Dict, List, Optional
from backend.app.models.schemas import ObservationRaw, CorrectionResult, SpatialResult

class ValueCorrectionEngine:
    """
    Estimates non-destructive reconstructed values for corrupted or anomalous AWS observations.
    Never mutates or overwrites raw operational telemetry.
    """

    def __init__(self):
        pass

    def estimate_corrections(
        self,
        current: ObservationRaw,
        history: List[ObservationRaw],
        spatial: Optional[SpatialResult] = None,
        model_recon: Optional[Dict[str, float]] = None
    ) -> Dict[str, CorrectionResult]:
        corrections: Dict[str, CorrectionResult] = {}

        # 1. Temperature Correction
        if current.temperature is not None:
            corrected_t = current.temperature
            method = "PASSTHROUGH"
            confidence = 1.0

            # If spatial neighbors available, blend spatial median with temporal autoregression
            if spatial and spatial.spatial_median_temp is not None:
                corrected_t = round(spatial.spatial_median_temp, 2)
                method = "SPATIAL_NEIGHBOR_CONSENSUS"
                confidence = round(spatial.neighborhood_consensus, 2)
            elif history and len(history) >= 3:
                # Temporal autoregressive extrapolation using rolling baseline + diurnal trend
                valid_recent = [h.temperature for h in history[-6:] if h.temperature is not None]
                if valid_recent:
                    baseline = float(np.mean(valid_recent))
                    slope = float(valid_recent[-1] - valid_recent[0]) / max(1, len(valid_recent) - 1)
                    corrected_t = round(baseline + slope, 2)
                    method = "TEMPORAL_AUTOREGRESSIVE_BASELINE"
                    confidence = 0.85

            corrections["temperature"] = CorrectionResult(
                parameter="temperature",
                raw_value=current.temperature,
                corrected_value=corrected_t,
                correction_method=method,
                correction_confidence=confidence
            )

        # 2. Pressure Correction
        if current.pressure is not None:
            corrected_p = current.pressure
            method = "PASSTHROUGH"
            confidence = 1.0

            if history and len(history) >= 2:
                valid_p = [h.pressure for h in history[-6:] if h.pressure is not None]
                if valid_p:
                    corrected_p = round(float(np.median(valid_p)), 2)
                    method = "ROLLING_BAROMETRIC_MEDIAN"
                    confidence = 0.90

            corrections["pressure"] = CorrectionResult(
                parameter="pressure",
                raw_value=current.pressure,
                corrected_value=corrected_p,
                correction_method=method,
                correction_confidence=confidence
            )

        # 3. Humidity Correction
        if current.humidity is not None:
            corrected_rh = current.humidity
            method = "PASSTHROUGH"
            confidence = 1.0

            if history and len(history) >= 2:
                valid_rh = [h.humidity for h in history[-6:] if h.humidity is not None]
                if valid_rh:
                    corrected_rh = round(float(np.mean(valid_rh)), 1)
                    method = "ROLLING_HYGROMETRIC_MEAN"
                    confidence = 0.88

            corrections["humidity"] = CorrectionResult(
                parameter="humidity",
                raw_value=current.humidity,
                corrected_value=corrected_rh,
                correction_method=method,
                correction_confidence=confidence
            )

        return corrections
