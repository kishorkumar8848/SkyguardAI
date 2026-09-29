import os
import sys
import numpy as np
from datetime import datetime

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.simulation.generator import AWSDataGenerator
from backend.app.ml.lstm_autoencoder import LSTMAutoencoderEngine

def main():
    print("[1/3] Generating clean time-series training sequences for LSTM Autoencoder...")
    gen = AWSDataGenerator(random_seed=42)
    # Generate continuous series for core stations (Delhi, Jodhpur, Mumbai)
    stations = ["AWS-DEL-001", "AWS-JOD-002", "AWS-MUM-003"]
    all_points = []
    for s_id in stations:
        series = gen.generate_series(s_id, datetime(2026, 5, 1, 0, 0), num_steps=1440, step_minutes=5)
        for obs in series:
            all_points.append([obs.temperature, obs.pressure, obs.humidity])

    data_mat = np.array(all_points, dtype=np.float32)
    print(f"[2/3] Sequence training array shape: {data_mat.shape}")

    print("[3/3] Training PyTorch LSTM Autoencoder...")
    engine = LSTMAutoencoderEngine(model_dir="./models/saved", seq_len=24)
    engine.train_model(data_mat, epochs=10, batch_size=64, lr=0.003)
    print(f"[SUCCESS] LSTM Autoencoder trained! Calibrated MSE threshold: {engine.threshold:.6f}")

if __name__ == "__main__":
    main()
