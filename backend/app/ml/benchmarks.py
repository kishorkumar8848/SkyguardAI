import time
import numpy as np
from typing import Dict, List, Any, Tuple
from sklearn.metrics import precision_score, recall_score, f1_score, roc_auc_score, average_precision_score, confusion_matrix
from datetime import datetime
from backend.app.simulation.generator import AWSDataGenerator
from backend.app.simulation.injector import AnomalyInjector
from backend.app.models.schemas import ObservationRaw
from backend.app.qc.deterministic import DeterministicQCEngine
from backend.app.ml.features import TemporalFeatureExtractor
from backend.app.ml.isolation_forest import IsolationForestEngine
from backend.app.ml.lstm_autoencoder import LSTMAutoencoderEngine
from backend.app.services.fusion import DecisionFusionEngine
from backend.app.qc.physics import PhysicsInformedEngine

class ModelBenchmarkSuite:
    """
    Rigorously benchmarks and compares:
    1. Deterministic Rule-based QC
    2. Unsupervised Isolation Forest
    3. Deep LSTM Autoencoder
    4. SkyGuard AI Hybrid Fusion Engine
    """

    def __init__(self, model_dir: str = "./models/saved"):
        self.model_dir = model_dir
        self.qc_engine = DeterministicQCEngine()
        self.extractor = TemporalFeatureExtractor()
        self.physics = PhysicsInformedEngine()
        self.iforest = IsolationForestEngine(model_dir=model_dir)
        self.lstm = LSTMAutoencoderEngine(model_dir=model_dir)
        self.fusion = DecisionFusionEngine()
        self.generator = AWSDataGenerator(random_seed=101)
        self.injector = AnomalyInjector(random_seed=101)

    def generate_evaluation_dataset(self, n_points: int = 600) -> Tuple[List[ObservationRaw], List[int]]:
        """
        Creates a continuous dataset with injected faults and genuine weather events.
        y_true = 1 for sensor/data anomalies, 0 for normal AND genuine weather events!
        (Evaluating ability to catch sensor faults without false-flagging genuine weather).
        """
        base_series = self.generator.generate_series("AWS-DEL-001", datetime(2026, 6, 1, 0, 0), num_steps=n_points)
        y_true = [0] * n_points

        # Inject various fault types
        # 1. Spikes at step 50-52
        base_series = self.injector.inject(base_series, "SPIKE", parameter="temperature", start_idx=50, duration=3, severity=1.2)
        for i in range(50, 52): y_true[i] = 1

        # 2. Frozen sensor at step 120-132
        base_series = self.injector.inject(base_series, "FROZEN", parameter="temperature", start_idx=120, duration=12)
        for i in range(126, 132): y_true[i] = 1  # Flagged after persistence limit

        # 3. Calibration drift at step 200-240
        base_series = self.injector.inject(base_series, "DRIFT", parameter="temperature", start_idx=200, duration=40, severity=1.0)
        for i in range(215, 240): y_true[i] = 1

        # 4. Genuine Heatwave at step 300-330 (GROUND TRUTH = 0 for sensor fault!)
        base_series = self.injector.inject(base_series, "HEATWAVE", parameter="temperature", start_idx=300, duration=30, severity=1.3)
        # y_true stays 0 because this is a genuine meteorological event!

        # 5. Pressure Spike at step 400-402
        base_series = self.injector.inject(base_series, "SPIKE", parameter="pressure", start_idx=400, duration=2, severity=1.5)
        for i in range(400, 402): y_true[i] = 1

        # 6. Communication gap at step 480
        base_series = self.injector.inject(base_series, "COMMUNICATION_GAP", start_idx=480, duration=1)
        y_true[480] = 1

        return base_series, y_true

    def run_benchmark(self) -> Dict[str, Any]:
        data, y_true = self.generate_evaluation_dataset(600)
        n = len(data)

        preds_rule = []
        preds_iforest = []
        preds_lstm = []
        preds_hybrid = []

        scores_iforest = []
        scores_lstm = []
        scores_hybrid = []

        latencies_rule = []
        latencies_iforest = []
        latencies_lstm = []
        latencies_hybrid = []

        history: List[ObservationRaw] = []

        for i in range(n):
            obs = data[i]

            # 1. Rule-based QC
            t0 = time.perf_counter()
            qc_res = self.qc_engine.validate_observation(obs, history)
            latencies_rule.append((time.perf_counter() - t0) * 1000.0)
            preds_rule.append(0 if qc_res.is_clean else 1)

            # 2. Isolation Forest
            feats = self.extractor.extract_features(obs, history)
            t0 = time.perf_counter()
            iforest_res = self.iforest.predict_features(feats)
            latencies_iforest.append((time.perf_counter() - t0) * 1000.0)
            preds_iforest.append(1 if iforest_res["is_anomaly"] else 0)
            scores_iforest.append(iforest_res["score"])

            # 3. LSTM Autoencoder
            t0 = time.perf_counter()
            lstm_res = self.lstm.predict_sequence(obs, history)
            latencies_lstm.append((time.perf_counter() - t0) * 1000.0)
            preds_lstm.append(1 if lstm_res["is_anomaly"] else 0)
            scores_lstm.append(lstm_res["score"])

            # 4. Hybrid Fusion
            t0 = time.perf_counter()
            phys_res = self.physics.validate_physics(obs, history)
            from backend.app.models.schemas import MLResult
            ml_wrap = MLResult(
                isolation_forest_score=iforest_res["score"],
                isolation_forest_anomaly=iforest_res["is_anomaly"],
                lstm_recon_error=lstm_res["recon_error"],
                lstm_anomaly=lstm_res["is_anomaly"],
                lstm_var_errors=lstm_res.get("var_errors", {})
            )
            fusion_res = self.fusion.fuse_evidence(
                current=obs,
                history=history,
                qc=qc_res,
                physics=phys_res,
                ml=ml_wrap,
                spatial=None
            )
            latencies_hybrid.append((time.perf_counter() - t0) * 1000.0)
            
            # Hybrid classifies as sensor fault or data quality issue (not normal and not genuine weather event)
            is_hybrid_fault = fusion_res.classification in ["SENSOR_ANOMALY", "DATA_QUALITY_ISSUE"]
            preds_hybrid.append(1 if is_hybrid_fault else 0)
            scores_hybrid.append(fusion_res.sensor_fault_probability)

            history.append(obs)
            if len(history) > 48:
                history = history[-48:]

        # Metric calculation helper
        def calc_metrics(y_p, y_s, lat_arr):
            tn, fp, fn, tp = confusion_matrix(y_true, y_p).ravel()
            precision = float(precision_score(y_true, y_p, zero_division=0))
            recall = float(recall_score(y_true, y_p, zero_division=0))
            f1 = float(f1_score(y_true, y_p, zero_division=0))
            fpr = float(fp / max(1, fp + tn))
            fnr = float(fn / max(1, fn + tp))
            try:
                roc_auc = float(roc_auc_score(y_true, y_s)) if y_s is not None else 0.0
                pr_auc = float(average_precision_score(y_true, y_s)) if y_s is not None else 0.0
            except Exception:
                roc_auc = 0.0
                pr_auc = 0.0

            return {
                "precision": round(precision, 4),
                "recall": round(recall, 4),
                "f1": round(f1, 4),
                "roc_auc": round(roc_auc, 4),
                "pr_auc": round(pr_auc, 4),
                "false_positive_rate": round(fpr, 4),
                "false_negative_rate": round(fnr, 4),
                "confusion_matrix": {"tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp)},
                "avg_inference_latency_ms": round(float(np.mean(lat_arr)), 3),
                "p95_latency_ms": round(float(np.percentile(lat_arr, 95)), 3)
            }

        results = {
            "dataset_info": {
                "total_observations": n,
                "sensor_anomalies_count": sum(y_true),
                "genuine_weather_events_tested": 30
            },
            "models": {
                "rule_based": calc_metrics(preds_rule, preds_rule, latencies_rule),
                "isolation_forest": calc_metrics(preds_iforest, scores_iforest, latencies_iforest),
                "lstm_autoencoder": calc_metrics(preds_lstm, scores_lstm, latencies_lstm),
                "skyguard_hybrid": calc_metrics(preds_hybrid, scores_hybrid, latencies_hybrid)
            }
        }
        return results
