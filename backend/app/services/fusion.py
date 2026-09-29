import math
from typing import Dict, Any, Optional, List
from backend.app.models.schemas import (
    ObservationRaw, QCResult, PhysicsResult, MLResult, SpatialResult,
    FusionResult, ClassificationType, RootCauseType, SeverityType
)

class DecisionFusionEngine:
    """
    Adaptive Bayesian-heuristic Decision Fusion Engine.
    Synthesizes deterministic QC, thermodynamic physics consistency,
    Isolation Forest anomaly scores, LSTM sequence reconstruction error,
    and spatial neighborhood consensus.
    """

    def __init__(self):
        pass

    def fuse_evidence(
        self,
        current: ObservationRaw,
        history: List[ObservationRaw],
        qc: QCResult,
        physics: PhysicsResult,
        ml: MLResult,
        spatial: Optional[SpatialResult],
        drift_score: float = 0.0
    ) -> FusionResult:
        # 1. Deterministic Hard Failures
        if qc.communication_gap_detected:
            return FusionResult(
                final_anomaly_score=0.90,
                sensor_fault_probability=0.20,
                weather_event_probability=0.05,
                data_quality_probability=0.95,
                uncertainty_score=0.05,
                classification="DATA_QUALITY_ISSUE",
                root_cause="COMMUNICATION_GAP",
                severity="MEDIUM",
                confidence=0.95,
                recommended_action="Check telemetry modem, solar battery charging, and remote cellular link."
            )

        # Missing or extreme physical range violation
        has_missing = any("MISSING" in f for f in qc.flagged_reasons)
        if has_missing:
            return FusionResult(
                final_anomaly_score=1.0,
                sensor_fault_probability=0.40,
                weather_event_probability=0.0,
                data_quality_probability=1.0,
                uncertainty_score=0.0,
                classification="DATA_QUALITY_ISSUE",
                root_cause="DATA_CORRUPTION",
                severity="HIGH",
                confidence=0.99,
                recommended_action="Inspect sensor wiring, ADC conversion circuit, and data logger serial stream."
            )

        # Frozen Sensor Check
        is_frozen = not all(qc.frozen_sensor_check.values())
        if is_frozen:
            return FusionResult(
                final_anomaly_score=0.95,
                sensor_fault_probability=0.95,
                weather_event_probability=0.0,
                data_quality_probability=0.30,
                uncertainty_score=0.05,
                classification="SENSOR_ANOMALY",
                root_cause="FROZEN_SENSOR",
                severity="HIGH",
                confidence=0.94,
                recommended_action="Inspect sensor transducer for mechanical blockage, icing, or frozen ADC register."
            )

        # 2. Accumulate Evidence Weights for ML + Physics + Spatial
        ml_score = max(ml.isolation_forest_score, ml.lstm_recon_error * 4.0, ml.lstm_anomaly and 0.85 or 0.0)
        ml_score = min(1.0, ml_score)
        
        physics_inconsistency = physics.physics_inconsistency_score
        
        # Check Step Check Violation
        step_violated = not all(qc.rate_of_change_check.values())

        # Check whether the anomaly is an isolated 1-step impulse (SPIKE)
        is_impulse_spike = False
        if history and current.temperature is not None and history[-1].temperature is not None:
            delta_t = abs(current.temperature - history[-1].temperature)
            if delta_t > 3.5: # Exceeds physical rate of change
                # Isolated jump if preceding steps were calm or if RH did not couple
                if len(history) < 2 or abs(history[-1].temperature - history[-2].temperature) < 1.5:
                    is_impulse_spike = True

        # 3. GENUINE WEATHER EVENT PROTECTION
        # Criteria for genuine extreme atmospheric event:
        # A) Spatial support: neighboring stations also elevated / not an outlier
        # B) Thermodynamic consistency: T-RH coupled sensibly (no supersaturation, physics inconsistency is low)
        # C) Sustained trend: not an isolated 1-timestep impulse spike
        # D) Plausible atmospheric evolution (e.g. heatwave gradual escalation or front passage)
        weather_event_score = 0.0
        sensor_fault_score = 0.0
        data_quality_score = 0.0

        if spatial and spatial.regional_event_support:
            weather_event_score += 0.50
            sensor_fault_score -= 0.40

        if spatial and spatial.is_spatial_outlier:
            sensor_fault_score += 0.45
            weather_event_score -= 0.35

        if physics_inconsistency > 0.35:
            sensor_fault_score += 0.55
            weather_event_score -= 0.45
        else:
            weather_event_score += 0.30

        if is_impulse_spike:
            sensor_fault_score += 0.80
            weather_event_score -= 0.70
        elif step_violated:
            # Sustained step change could be squall or cold front
            weather_event_score += 0.25
            sensor_fault_score += 0.20

        if ml_score > 0.60:
            if physics_inconsistency < 0.25 and (spatial is None or not spatial.is_spatial_outlier) and not is_impulse_spike:
                weather_event_score += 0.40
            else:
                sensor_fault_score += 0.50

        if drift_score > 0.60:
            sensor_fault_score += 0.60

        # Bound probabilities using soft evidence combination
        p_weather = max(0.01, min(0.99, (weather_event_score + 0.3) / 1.5))
        p_sensor = max(0.01, min(0.99, (sensor_fault_score + 0.3) / 1.5))
        p_dq = max(0.01, min(0.99, (data_quality_score + 0.1) / 1.2))

        # Normalize probabilities
        prob_sum = p_weather + p_sensor + p_dq
        p_weather = p_weather / prob_sum
        p_sensor = p_sensor / prob_sum
        p_dq = p_dq / prob_sum

        # Calculate Shannon entropy / uncertainty
        probs = [p for p in [p_weather, p_sensor, p_dq] if p > 0]
        entropy = -sum(p * math.log2(p) for p in probs) # Max ~1.58
        uncertainty_score = round(min(1.0, entropy / 1.58), 3)

        # Baseline composite anomaly score
        final_anomaly_score = round(max(
            ml_score * 0.4 + physics_inconsistency * 0.4 + (1.0 - (spatial.neighborhood_consensus if spatial else 0.5)) * 0.2,
            0.85 if step_violated else 0.0,
            0.92 if is_impulse_spike else 0.0,
            0.80 if drift_score > 0.7 else 0.0
        ), 3)

        # 4. Final Classification Logic
        classification: ClassificationType = "NORMAL"
        root_cause: RootCauseType = "NORMAL"
        severity: SeverityType = "NORMAL"
        confidence = 0.90
        action = "Nominal operation. Continue automated monitoring."

        # If overall anomaly score is low and no QC flags
        if final_anomaly_score < 0.35 and qc.is_clean and physics_inconsistency < 0.25 and drift_score < 0.4:
            classification = "NORMAL"
            root_cause = "NORMAL"
            severity = "NORMAL"
            confidence = round(1.0 - final_anomaly_score, 2)
            action = "Sensor operating within certified WMO/IMD envelope."
            return FusionResult(
                final_anomaly_score=final_anomaly_score,
                sensor_fault_probability=round(p_sensor * 0.1, 3),
                weather_event_probability=round(p_weather * 0.1, 3),
                data_quality_probability=0.01,
                uncertainty_score=round(uncertainty_score * 0.2, 3),
                classification=classification,
                root_cause=root_cause,
                severity=severity,
                confidence=confidence,
                recommended_action=action
            )

        # Check for Calibration Drift (Sensor degradation)
        if drift_score > 0.65:
            classification = "SENSOR_ANOMALY"
            root_cause = "CALIBRATION_DRIFT"
            severity = "MEDIUM"
            confidence = round(min(0.95, drift_score), 2)
            action = "Sensor exhibiting progressive baseline drift. Schedule secondary recalibration against field reference standard."
            return FusionResult(
                final_anomaly_score=final_anomaly_score,
                sensor_fault_probability=round(p_sensor, 3),
                weather_event_probability=round(p_weather, 3),
                data_quality_probability=round(p_dq, 3),
                uncertainty_score=uncertainty_score,
                classification=classification,
                root_cause=root_cause,
                severity=severity,
                confidence=confidence,
                recommended_action=action
            )

        # Check for genuine heatwave / atmospheric event
        # If value is statistically extreme or high anomaly score, BUT physics is valid and spatial confirms
        is_genuine_weather = (
            (p_weather > p_sensor + 0.15) and
            (physics_inconsistency <= 0.30) and
            (not is_impulse_spike)
        )

        if is_genuine_weather:
            classification = "GENUINE_WEATHER_EVENT"
            root_cause = "GENUINE_WEATHER_EVENT"
            severity = "MEDIUM" if final_anomaly_score < 0.7 else "HIGH"
            confidence = round(min(0.96, p_weather + 0.15), 2)
            action = "Extreme meteorological event confirmed by thermodynamic coupling and regional consensus. Dispatch weather warning bulletin to forecasting desk."
            return FusionResult(
                final_anomaly_score=final_anomaly_score,
                sensor_fault_probability=round(p_sensor, 3),
                weather_event_probability=round(p_weather, 3),
                data_quality_probability=round(p_dq, 3),
                uncertainty_score=uncertainty_score,
                classification=classification,
                root_cause=root_cause,
                severity=severity,
                confidence=confidence,
                recommended_action=action
            )

        # Check for Spike / Sensor Anomaly
        if p_sensor > p_weather + 0.15 or is_impulse_spike or physics_inconsistency >= 0.5:
            classification = "SENSOR_ANOMALY"
            if is_impulse_spike:
                root_cause = "SPIKE"
                severity = "HIGH"
                action = "Single-timestep impulse spike detected. Verify transient noise filter and cable shielding."
            elif physics_inconsistency >= 0.5:
                root_cause = "MULTIVARIATE_INCONSISTENCY"
                severity = "HIGH"
                action = "Physical correlation between temperature, pressure, and humidity broken. Inspect sensor array."
            else:
                root_cause = "SPIKE"
                severity = "MEDIUM"
                action = "Sensor anomaly detected. Schedule inspection of telemetry junction box."

            confidence = round(min(0.98, max(p_sensor, 0.75)), 2)
            return FusionResult(
                final_anomaly_score=final_anomaly_score,
                sensor_fault_probability=round(p_sensor, 3),
                weather_event_probability=round(p_weather, 3),
                data_quality_probability=round(p_dq, 3),
                uncertainty_score=uncertainty_score,
                classification=classification,
                root_cause=root_cause,
                severity=severity,
                confidence=confidence,
                recommended_action=action
            )

        # UNCERTAINTY: Evidence is conflicting
        classification = "UNCERTAIN"
        root_cause = "UNKNOWN/UNCERTAIN"
        severity = "LOW"
        confidence = 0.50
        action = "Evidence is insufficient to reliably distinguish environmental change from sensor anomaly. Flag record for meteorologist review."

        return FusionResult(
            final_anomaly_score=final_anomaly_score,
            sensor_fault_probability=round(p_sensor, 3),
            weather_event_probability=round(p_weather, 3),
            data_quality_probability=round(p_dq, 3),
            uncertainty_score=uncertainty_score,
            classification=classification,
            root_cause=root_cause,
            severity=severity,
            confidence=confidence,
            recommended_action=action
        )
