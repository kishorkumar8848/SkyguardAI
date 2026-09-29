import os
import json
import joblib
import numpy as np
import torch
import torch.nn as nn
from typing import List, Dict, Any, Optional, Tuple
from sklearn.preprocessing import StandardScaler
from backend.app.models.schemas import ObservationRaw

class LSTMEncoder(nn.Module):
    def __init__(self, input_dim: int, hidden_dim: int, latent_dim: int):
        super().__init__()
        self.lstm = nn.LSTM(input_dim, hidden_dim, batch_first=True)
        self.linear = nn.Linear(hidden_dim, latent_dim)

    def forward(self, x):
        _, (hn, _) = self.lstm(x)
        latent = self.linear(hn[-1])
        return latent

class LSTMDecoder(nn.Module):
    def __init__(self, latent_dim: int, hidden_dim: int, output_dim: int, seq_len: int):
        super().__init__()
        self.seq_len = seq_len
        self.linear = nn.Linear(latent_dim, hidden_dim)
        self.lstm = nn.LSTM(hidden_dim, hidden_dim, batch_first=True)
        self.out = nn.Linear(hidden_dim, output_dim)

    def forward(self, latent):
        h = self.linear(latent).unsqueeze(1).repeat(1, self.seq_len, 1)
        out, _ = self.lstm(h)
        recon = self.out(out)
        return recon

class LSTMAutoencoderNet(nn.Module):
    def __init__(self, input_dim: int = 3, hidden_dim: int = 32, latent_dim: int = 16, seq_len: int = 24):
        super().__init__()
        self.seq_len = seq_len
        self.input_dim = input_dim
        self.encoder = LSTMEncoder(input_dim, hidden_dim, latent_dim)
        self.decoder = LSTMDecoder(latent_dim, hidden_dim, input_dim, seq_len)

    def forward(self, x):
        latent = self.encoder(x)
        recon = self.decoder(latent)
        return recon

class LSTMAutoencoderEngine:
    """
    Temporal Sequence Reconstruction Autoencoder for AWS time-series.
    Detects dynamic temporal and multi-sensor sequence anomalies.
    """

    def __init__(self, model_dir: str = "./models/saved", seq_len: int = 24):
        self.model_dir = model_dir
        self.seq_len = seq_len
        self.model_path = os.path.join(model_dir, "lstm_autoencoder.pth")
        self.scaler_path = os.path.join(model_dir, "scaler_lstm.joblib")
        self.meta_path = os.path.join(model_dir, "lstm_meta.json")

        self.device = torch.device("cpu")
        self.net = LSTMAutoencoderNet(input_dim=3, hidden_dim=32, latent_dim=16, seq_len=seq_len).to(self.device)
        self.scaler: Optional[StandardScaler] = None
        self.threshold: float = 0.08
        self.trained: bool = False

        self.load()

    def train_model(
        self,
        series_data: np.ndarray, # shape (N, 3) where columns are [temp, pressure, humidity]
        epochs: int = 15,
        batch_size: int = 64,
        lr: float = 0.003
    ):
        """Trains LSTM Autoencoder on clean continuous time-series."""
        os.makedirs(self.model_dir, exist_ok=True)
        self.scaler = StandardScaler()
        scaled_data = self.scaler.fit_transform(series_data)

        # Generate overlapping sequences of length seq_len
        sequences = []
        for i in range(len(scaled_data) - self.seq_len + 1):
            sequences.append(scaled_data[i:i + self.seq_len])
        
        X = np.array(sequences, dtype=np.float32)
        tensor_x = torch.from_numpy(X).to(self.device)

        dataset = torch.utils.data.TensorDataset(tensor_x)
        loader = torch.utils.data.DataLoader(dataset, batch_size=batch_size, shuffle=True)

        optimizer = torch.optim.Adam(self.net.parameters(), lr=lr)
        criterion = nn.MSELoss()

        self.net.train()
        for epoch in range(epochs):
            total_loss = 0.0
            for batch in loader:
                x_b = batch[0]
                optimizer.zero_grad()
                recon = self.net(x_b)
                loss = criterion(recon, x_b)
                loss.backward()
                optimizer.step()
                total_loss += loss.item() * len(x_b)

        # Calibrate threshold on training data (e.g. 98th percentile reconstruction error)
        self.net.eval()
        with torch.no_grad():
            recon_all = self.net(tensor_x)
            mse_per_seq = torch.mean((recon_all - tensor_x)**2, dim=(1, 2)).cpu().numpy()
            self.threshold = float(np.percentile(mse_per_seq, 98.0))

        self.trained = True

        # Save artifacts
        torch.save(self.net.state_dict(), self.model_path)
        joblib.dump(self.scaler, self.scaler_path)
        with open(self.meta_path, "w") as f:
            json.dump({
                "threshold": self.threshold,
                "seq_len": self.seq_len,
                "input_dim": 3,
                "latent_dim": 16,
                "n_samples": len(sequences)
            }, f, indent=2)

    def load(self) -> bool:
        """Loads weights and scaler."""
        if os.path.exists(self.model_path) and os.path.exists(self.scaler_path):
            try:
                self.net.load_state_dict(torch.load(self.model_path, map_location=self.device, weights_only=True))
                self.net.eval()
                self.scaler = joblib.load(self.scaler_path)
                if os.path.exists(self.meta_path):
                    with open(self.meta_path, "r") as f:
                        meta = json.load(f)
                        self.threshold = meta.get("threshold", 0.08)
                self.trained = True
                return True
            except Exception as e:
                print(f"Warning: Failed loading LSTM Autoencoder: {e}")
        return False

    def predict_sequence(
        self,
        current: ObservationRaw,
        history: List[ObservationRaw]
    ) -> Dict[str, Any]:
        """
        Calculates sequence reconstruction error for the recent window.
        """
        if not self.trained or self.scaler is None:
            return {
                "recon_error": 0.02,
                "is_anomaly": False,
                "score": 0.1,
                "var_errors": {"temp": 0.01, "pressure": 0.01, "humidity": 0.01},
                "trained": False
            }

        # Assemble sequence of length self.seq_len
        full_seq = list(history) + [current]
        pts = full_seq[-self.seq_len:]

        # Pad with earliest point if sequence is shorter than seq_len
        while len(pts) < self.seq_len:
            pts.insert(0, pts[0] if pts else current)

        raw_mat = []
        for p in pts:
            raw_mat.append([
                p.temperature if p.temperature is not None else 25.0,
                p.pressure if p.pressure is not None else 1000.0,
                p.humidity if p.humidity is not None else 50.0
            ])
        raw_mat = np.array(raw_mat, dtype=np.float32)

        scaled_mat = self.scaler.transform(raw_mat)
        tensor_in = torch.from_numpy(scaled_mat).unsqueeze(0).to(self.device)

        self.net.eval()
        with torch.no_grad():
            recon_tensor = self.net(tensor_in)
            # MSE per variable at current timestep (last step)
            err_matrix = (recon_tensor - tensor_in)**2 # (1, seq_len, 3)
            current_step_err = err_matrix[0, -1, :].cpu().numpy()
            total_mse = float(torch.mean(err_matrix).cpu().item())

        t_err = float(current_step_err[0])
        p_err = float(current_step_err[1])
        rh_err = float(current_step_err[2])

        is_anomaly = total_mse > self.threshold
        # Calibrate score to [0, 1] using sigmoid
        diff = total_mse - self.threshold
        score = float(1.0 / (1.0 + np.exp(-12.0 * diff)))

        return {
            "recon_error": round(total_mse, 5),
            "is_anomaly": is_anomaly,
            "score": round(score, 4),
            "var_errors": {
                "temperature": round(t_err, 4),
                "pressure": round(p_err, 4),
                "humidity": round(rh_err, 4)
            },
            "reconstruction_breakdown": {
                "temperature": round(t_err / max(1e-5, t_err + p_err + rh_err) * 100, 1),
                "pressure": round(p_err / max(1e-5, t_err + p_err + rh_err) * 100, 1),
                "humidity": round(rh_err / max(1e-5, t_err + p_err + rh_err) * 100, 1)
            },
            "trained": True
        }
