import os
import json
import joblib
import numpy as np
from typing import Dict, Any, Optional
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from backend.app.ml.features import TemporalFeatureExtractor, FEATURE_NAMES

class IsolationForestEngine:
    """
    Unsupervised Isolation Forest anomaly detector for AWS time-series features.
    """

    def __init__(self, model_dir: str = "./models/saved"):
        self.model_dir = model_dir
        self.model_path = os.path.join(model_dir, "isolation_forest.joblib")
        self.scaler_path = os.path.join(model_dir, "scaler_iforest.joblib")
        self.meta_path = os.path.join(model_dir, "iforest_meta.json")

        self.model: Optional[IsolationForest] = None
        self.scaler: Optional[StandardScaler] = None
        self.threshold: float = 0.5
        self.feature_extractor = TemporalFeatureExtractor()

        self.load()

    def train(self, X: np.ndarray, contamination: float = 0.03, random_state: int = 42):
        """Trains Isolation Forest on feature matrix X."""
        os.makedirs(self.model_dir, exist_ok=True)
        self.scaler = StandardScaler()
        X_scaled = self.scaler.fit_transform(X)

        self.model = IsolationForest(
            n_estimators=100,
            contamination=contamination,
            random_state=random_state,
            n_jobs=-1
        )
        self.model.fit(X_scaled)

        # Calibrate score threshold: 97th percentile of normal training scores
        raw_scores = -self.model.score_samples(X_scaled)
        self.threshold = float(np.percentile(raw_scores, 97.0))

        # Save artifacts
        joblib.dump(self.model, self.model_path)
        joblib.dump(self.scaler, self.scaler_path)
        with open(self.meta_path, "w") as f:
            json.dump({
                "threshold": self.threshold,
                "feature_names": FEATURE_NAMES,
                "n_samples": len(X),
                "contamination": contamination
            }, f, indent=2)

    def load(self) -> bool:
        """Loads saved model and scaler if available."""
        if os.path.exists(self.model_path) and os.path.exists(self.scaler_path):
            try:
                self.model = joblib.load(self.model_path)
                self.scaler = joblib.load(self.scaler_path)
                if os.path.exists(self.meta_path):
                    with open(self.meta_path, "r") as f:
                        meta = json.load(f)
                        self.threshold = meta.get("threshold", 0.5)
                return True
            except Exception as e:
                print(f"Warning: Failed loading Isolation Forest model: {e}")
        return False

    def predict_features(self, feat_dict: Dict[str, float]) -> Dict[str, Any]:
        """Predicts anomaly score and flag for a single feature dictionary."""
        if self.model is None or self.scaler is None:
            # Fallback when model is not yet trained
            return {
                "score": 0.1,
                "is_anomaly": False,
                "trained": False
            }

        x_vec = self.feature_extractor.feature_vector(feat_dict).reshape(1, -1)
        x_scaled = self.scaler.transform(x_vec)

        # score_samples returns opposite of anomaly score (lower is more anomalous)
        raw_score = float(-self.model.score_samples(x_scaled)[0])

        # Normalize score into [0, 1] range using sigmoid around threshold
        diff = raw_score - self.threshold
        calibrated_score = float(1.0 / (1.0 + np.exp(-4.0 * diff)))

        is_anomaly = raw_score > self.threshold

        return {
            "score": round(calibrated_score, 4),
            "raw_score": round(raw_score, 4),
            "is_anomaly": is_anomaly,
            "trained": True
        }
