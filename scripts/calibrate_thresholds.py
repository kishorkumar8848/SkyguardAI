import os
import sys
import json
import numpy as np
from datetime import datetime

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.simulation.generator import AWSDataGenerator
from backend.app.ml.features import TemporalFeatureExtractor
from backend.app.ml.isolation_forest import IsolationForestEngine
from backend.app.ml.lstm_autoencoder import LSTMAutoencoderEngine

def main():
    print("Calibrating adaptive multi-method anomaly thresholds...")
    gen = AWSDataGenerator(random_seed=777)
    extractor = TemporalFeatureExtractor()
    iforest = IsolationForestEngine(model_dir="./models/saved")
    lstm = LSTMAutoencoderEngine(model_dir="./models/saved")

    # Generate validation sequence
    val_series = gen.generate_series("AWS-DEL-001", datetime(2026, 7, 1, 0, 0), num_steps=576)

    history = []
    iforest_scores = []
    lstm_mses = []

    for obs in val_series:
        feats = extractor.extract_features(obs, history)
        if iforest.model is not None and iforest.scaler is not None:
            x_vec = extractor.feature_vector(feats).reshape(1, -1)
            x_scaled = iforest.scaler.transform(x_vec)
            raw_s = float(-iforest.model.score_samples(x_scaled)[0])
            iforest_scores.append(raw_s)

        lstm_res = lstm.predict_sequence(obs, history)
        lstm_mses.append(lstm_res["recon_error"])

        history.append(obs)
        if len(history) > 48:
            history = history[-48:]

    # Calibration strategies:
    # 1. Percentile (98th percentile)
    # 2. K-Sigma (mean + 3 * std)
    # 3. Robust Median Absolute Deviation (MAD)
    calib = {}
    if iforest_scores:
        arr_if = np.array(iforest_scores)
        calib["isolation_forest"] = {
            "percentile_98": float(np.percentile(arr_if, 98.0)),
            "three_sigma": float(np.mean(arr_if) + 3.0 * np.std(arr_if)),
            "robust_mad": float(np.median(arr_if) + 3.5 * np.median(np.abs(arr_if - np.median(arr_if)))),
            "selected_threshold": float(np.percentile(arr_if, 98.0))
        }

    if lstm_mses:
        arr_lstm = np.array(lstm_mses)
        calib["lstm_autoencoder"] = {
            "percentile_98": float(np.percentile(arr_lstm, 98.0)),
            "three_sigma": float(np.mean(arr_lstm) + 3.0 * np.std(arr_lstm)),
            "robust_mad": float(np.median(arr_lstm) + 3.5 * np.median(np.abs(arr_lstm - np.median(arr_lstm)))),
            "selected_threshold": float(np.percentile(arr_lstm, 98.0))
        }

    os.makedirs("./models/saved", exist_ok=True)
    out_path = "./models/saved/calibrated_thresholds.json"
    with open(out_path, "w") as f:
        json.dump(calib, f, indent=2)

    print(f"[SUCCESS] Calibrated thresholds saved to {out_path}:")
    print(json.dumps(calib, indent=2))

if __name__ == "__main__":
    main()
