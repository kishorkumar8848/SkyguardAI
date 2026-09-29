from typing import List, Dict, Any, Optional
from backend.app.models.schemas import (
    ObservationRaw, QCResult, PhysicsResult, MLResult, SpatialResult,
    FusionResult, ExplainabilityResult
)
from backend.app.explainability.shap_explainer import ShapExplainerEngine

class ExplainabilityEngine:
    """
    Translates complex multi-engine telemetry inferences into
    operational, human-auditable meteorological explanations.
    """

    def __init__(self, shap_engine: Optional[ShapExplainerEngine] = None):
        self.shap_engine = shap_engine or ShapExplainerEngine()

    def generate_explanation(
        self,
        current: ObservationRaw,
        history: List[ObservationRaw],
        qc: QCResult,
        physics: PhysicsResult,
        ml: MLResult,
        spatial: Optional[SpatialResult],
        fusion: FusionResult,
        feat_dict: Dict[str, float]
    ) -> ExplainabilityResult:
        checklist: List[Dict[str, Any]] = []

        # 1. Deterministic and Temporal Evidence
        if history and current.temperature is not None and history[-1].temperature is not None:
            delta_t = current.temperature - history[-1].temperature
            sign = "+" if delta_t >= 0 else ""
            checklist.append({
                "category": "Temporal",
                "text": f"Temperature rate of change: {sign}{round(delta_t, 2)}°C since last interval",
                "supported": bool(abs(delta_t) > 3.0),
                "importance": "high" if abs(delta_t) > 3.0 else "low"
            })

        if qc.communication_gap_detected:
            checklist.append({
                "category": "Data Quality",
                "text": "Data telemetry packet gap exceeded 15 minutes",
                "supported": True,
                "importance": "critical"
            })

        for flag in qc.flagged_reasons:
            checklist.append({
                "category": "QC Rules",
                "text": flag,
                "supported": True,
                "importance": "high"
            })

        # 2. Physics Evidence
        if physics.supersaturation_violation:
            checklist.append({
                "category": "Thermodynamics",
                "text": f"Supersaturation violation: Dew point ({physics.dew_point}°C) exceeds air temperature ({current.temperature}°C)",
                "supported": True,
                "importance": "critical"
            })
        elif physics.dew_point_depression is not None:
            checklist.append({
                "category": "Thermodynamics",
                "text": f"Dew point depression: {physics.dew_point_depression}°C (Magnus thermodynamic equilibrium)",
                "supported": bool(physics.dew_point_depression >= 0),
                "importance": "normal"
            })

        if physics.diurnal_rh_inconsistent:
            checklist.append({
                "category": "Multivariate Physics",
                "text": "Uncoupled T-RH thermodynamics: sharp temperature rise without corresponding vapor pressure expansion",
                "supported": True,
                "importance": "high"
            })

        # 3. Machine Learning Evidence
        if ml.isolation_forest_anomaly:
            checklist.append({
                "category": "ML Baseline",
                "text": f"Isolation Forest detected multi-feature subspace anomaly (Score: {ml.isolation_forest_score})",
                "supported": True,
                "importance": "high"
            })

        if ml.lstm_anomaly:
            top_var = max(ml.lstm_var_errors.items(), key=lambda x: x[1])[0] if ml.lstm_var_errors else "signal"
            checklist.append({
                "category": "Deep Learning",
                "text": f"LSTM Autoencoder sequence reconstruction error exceeded calibrated 98th percentile threshold (primary error: {top_var})",
                "supported": True,
                "importance": "high"
            })

        # 4. Spatial Evidence
        if spatial:
            if spatial.is_spatial_outlier:
                checklist.append({
                    "category": "Spatial Network",
                    "text": f"Single-station divergence: Diverges by {spatial.temp_spatial_diff}°C from regional median ({spatial.spatial_median_temp}°C)",
                    "supported": True,
                    "importance": "high"
                })
            elif spatial.regional_event_support:
                checklist.append({
                    "category": "Spatial Network",
                    "text": f"Regional consensus confirmed across {spatial.neighbor_count} neighboring stations (Consensus: {int(spatial.neighborhood_consensus*100)}%)",
                    "supported": True,
                    "importance": "high"
                })

        # Feature attributions using SHAP
        shap_attrs = self.shap_engine.explain_instance(feat_dict)

        # Reconstruction breakdown
        recon_breakdown = ml.lstm_var_errors

        # Formulate operational headline & summary
        if fusion.classification == "GENUINE_WEATHER_EVENT":
            headline = "CONFIRMED GENUINE METEOROLOGICAL EVENT"
            summary = "Extreme value detected, but evidence supports a genuine meteorological event with consistent thermodynamic coupling and regional network support."
            reasoning = "Multi-station spatial consensus and physical vapor equilibrium demonstrate that the sudden shift represents real atmospheric dynamics rather than sensor degradation."
        elif fusion.classification == "SENSOR_ANOMALY":
            headline = f"SENSOR FAULT DETECTED: {fusion.root_cause.replace('_', ' ')}"
            summary = f"Isolated physical inconsistency or sudden step impulse detected with high sensor-fault probability ({int(fusion.sensor_fault_probability*100)}%)."
            reasoning = f"The reading diverges sharply from atmospheric physics, historical rate limits, or spatial neighbors, pointing to an instrument transducer or ADC fault."
        elif fusion.classification == "DATA_QUALITY_ISSUE":
            headline = f"DATA QUALITY FAILURE: {fusion.root_cause.replace('_', ' ')}"
            summary = "Observation failed deterministic range, format, or telemetry transmission integrity checks."
            reasoning = "Deterministic rules detected missing variables, repeated records, or communication telemetry lapses."
        elif fusion.classification == "UNCERTAIN":
            headline = "UNCERTAIN / AMBIGUOUS OBSERVATION"
            summary = "Evidence is insufficient to reliably distinguish environmental change from sensor anomaly."
            reasoning = "Conflicting signals between statistical anomaly indicators and physical constraints require human meteorologist inspection."
        else:
            headline = "NOMINAL METEOROLOGICAL OBSERVATION"
            summary = "All parameters conform to certified IMD/WMO physical limits and temporal baselines."
            reasoning = "No sensor degradation, thermodynamic violations, or statistical anomalies detected."

        return ExplainabilityResult(
            headline=headline,
            summary=summary,
            evidence_checklist=checklist,
            feature_attributions=shap_attrs,
            reconstruction_breakdown=recon_breakdown,
            reasoning=reasoning
        )
