import os
import sys
import numpy as np
from datetime import datetime

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.simulation.generator import AWSDataGenerator
from backend.app.ml.features import TemporalFeatureExtractor
from backend.app.ml.isolation_forest import IsolationForestEngine

def main():
    print("[1/3] Generating clean multi-station synthetic meteorological baseline...")
    gen = AWSDataGenerator(random_seed=42)
    extractor = TemporalFeatureExtractor()
    
    # 288 steps * 5 days = 1440 steps per station across 6 stations = 8,640 clean readings
    multi_data = gen.generate_multi_station_series(
        start_dt=datetime(2026, 5, 1, 0, 0),
        num_steps=1440,
        step_minutes=5
    )

    feature_matrix = []
    for station_id, series in multi_data.items():
        history = []
        for obs in series:
            feats = extractor.extract_features(obs, history)
            f_vec = extractor.feature_vector(feats)
            feature_matrix.append(f_vec)
            history.append(obs)
            if len(history) > 48:
                history = history[-48:]

    X = np.array(feature_matrix, dtype=np.float32)
    print(f"[2/3] Extracted feature matrix shape: {X.shape}")

    print("[3/3] Training Isolation Forest model...")
    engine = IsolationForestEngine(model_dir="./models/saved")
    engine.train(X, contamination=0.02)
    print(f"[SUCCESS] Isolation Forest trained! Calibrated threshold: {engine.threshold:.4f}")

if __name__ == "__main__":
    main()
