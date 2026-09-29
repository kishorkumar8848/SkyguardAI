import time
from datetime import datetime, timezone
from typing import Dict, List, Optional
from backend.app.models.schemas import (
    ObservationRaw, QCResult, PhysicsResult, MLResult, SpatialResult,
    FusionResult, ExplainabilityResult, AnalysisResponse, SensorHealthScore,
    CorrectionResult
)
from backend.app.qc.deterministic import DeterministicQCEngine
from backend.app.qc.physics import PhysicsInformedEngine
from backend.app.ml.features import TemporalFeatureExtractor
from backend.app.ml.isolation_forest import IsolationForestEngine
from backend.app.ml.lstm_autoencoder import LSTMAutoencoderEngine
from backend.app.explainability.explainer import ExplainabilityEngine
from backend.app.services.fusion import DecisionFusionEngine
from backend.app.services.health import SensorHealthEngine
from backend.app.services.spatial import SpatialConsistencyEngine
from backend.app.services.correction import ValueCorrectionEngine

class AnalysisPipeline:
    """
    Central operational analysis coordinator integrating deterministic QC,
    thermodynamic physics, dual-ML models, spatial network, Bayesian fusion,
    explainability, and sensor health tracking.
    """

    def __init__(self, model_dir: str = "./models/saved"):
        self.qc_engine = DeterministicQCEngine()
        self.physics_engine = PhysicsInformedEngine()
        self.feature_extractor = TemporalFeatureExtractor()
        self.iforest_engine = IsolationForestEngine(model_dir=model_dir)
        self.lstm_engine = LSTMAutoencoderEngine(model_dir=model_dir)
        self.fusion_engine = DecisionFusionEngine()
        self.health_engine = SensorHealthEngine()
        self.spatial_engine = SpatialConsistencyEngine()
        self.correction_engine = ValueCorrectionEngine()
        self.explainer_engine = ExplainabilityEngine()

        # In-memory station observation buffers: {station_id: [ObservationRaw, ...]}
        self.station_buffers: Dict[str, List[ObservationRaw]] = {}
        # Latest peer observations: {station_id: ObservationRaw}
        self.latest_peer_obs: Dict[str, ObservationRaw] = {}

    def get_history(self, station_id: str) -> List[ObservationRaw]:
        return self.station_buffers.get(station_id, [])

    def process_observation(
        self,
        current: ObservationRaw,
        peer_obs: Optional[Dict[str, ObservationRaw]] = None
    ) -> AnalysisResponse:
        start_time = time.perf_counter()
        station_id = current.station_id

        # Update peer store
        self.latest_peer_obs[station_id] = current
        history = self.get_history(station_id)

        # 1. Deterministic QC Gate
        qc_result: QCResult = self.qc_engine.validate_observation(current, history)

        # 2. Extract Temporal Features
        feat_dict = self.feature_extractor.extract_features(current, history)

        # 3. Multivariate Physics Validation
        physics_result: PhysicsResult = self.physics_engine.validate_physics(current, history)

        # 4. Machine Learning Anomaly Detection
        iforest_res = self.iforest_engine.predict_features(feat_dict)
        lstm_res = self.lstm_engine.predict_sequence(current, history)

        ml_result = MLResult(
            isolation_forest_score=iforest_res["score"],
            isolation_forest_anomaly=iforest_res["is_anomaly"],
            lstm_recon_error=lstm_res["recon_error"],
            lstm_anomaly=lstm_res["is_anomaly"],
            lstm_var_errors=lstm_res.get("var_errors", {}),
            feature_contributions=iforest_res.get("feature_contributions", {})
        )

        # 5. Spatial Consistency Assessment (optional if peers present)
        peers = peer_obs or self.latest_peer_obs
        spatial_result: Optional[SpatialResult] = self.spatial_engine.evaluate_spatial_consistency(
            current, peers
        )

        # 6. Sensor Health & Drift Scoring
        temp_is_anomaly = not qc_result.is_clean or ml_result.isolation_forest_anomaly or ml_result.lstm_anomaly
        health_score: SensorHealthScore = self.health_engine.update_and_calculate_health(
            current, history, temp_is_anomaly
        )
        drift_score = 0.8 if health_score.drift_detected else 0.0

        # 7. Bayesian / Heuristic Decision Fusion
        fusion_result: FusionResult = self.fusion_engine.fuse_evidence(
            current=current,
            history=history,
            qc=qc_result,
            physics=physics_result,
            ml=ml_result,
            spatial=spatial_result,
            drift_score=drift_score
        )

        # 8. Human-auditable Operational Explainability
        explain_result: ExplainabilityResult = self.explainer_engine.generate_explanation(
            current=current,
            history=history,
            qc=qc_result,
            physics=physics_result,
            ml=ml_result,
            spatial=spatial_result,
            fusion=fusion_result,
            feat_dict=feat_dict
        )

        # 9. Corrected Value Estimation (if anomalous or bad quality)
        corrections: Dict[str, CorrectionResult] = {}
        if fusion_result.classification in ["SENSOR_ANOMALY", "DATA_QUALITY_ISSUE"]:
            corrections = self.correction_engine.estimate_corrections(
                current=current,
                history=history,
                spatial=spatial_result,
                model_recon=lstm_res.get("var_errors")
            )

        # 10. Update in-memory station history buffer (keep last 48 steps)
        if station_id not in self.station_buffers:
            self.station_buffers[station_id] = []
        self.station_buffers[station_id].append(current)
        if len(self.station_buffers[station_id]) > 72:
            self.station_buffers[station_id] = self.station_buffers[station_id][-72:]

        latency_ms = round((time.perf_counter() - start_time) * 1000.0, 2)

        return AnalysisResponse(
            observation=current,
            qc=qc_result,
            physics=physics_result,
            ml=ml_result,
            spatial=spatial_result,
            fusion=fusion_result,
            explainability=explain_result,
            corrections=corrections,
            processing_latency_ms=latency_ms,
            timestamp=datetime.now(timezone.utc).isoformat()
        )
