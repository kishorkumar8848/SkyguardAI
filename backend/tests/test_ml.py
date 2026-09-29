from datetime import datetime, timezone
from backend.app.models.schemas import ObservationRaw
from backend.app.ml.features import TemporalFeatureExtractor
from backend.app.ml.isolation_forest import IsolationForestEngine
from backend.app.ml.lstm_autoencoder import LSTMAutoencoderEngine

def test_feature_extraction():
    extractor = TemporalFeatureExtractor()
    obs = ObservationRaw(
        timestamp=datetime(2026, 6, 1, 14, 0).isoformat(),
        station_id="AWS-DEL-001",
        temperature=35.0,
        pressure=998.0,
        humidity=42.0
    )
    feats = extractor.extract_features(obs, [])
    assert "temp" in feats
    assert "pressure" in feats
    assert "humidity" in feats
    assert "hour_sin" in feats
    assert "dew_point_approx" in feats
    vec = extractor.feature_vector(feats)
    assert len(vec) == 29

def test_isolation_forest_prediction():
    iforest = IsolationForestEngine(model_dir="./models/saved")
    assert iforest.model is not None
    extractor = TemporalFeatureExtractor()
    obs = ObservationRaw(
        timestamp=datetime.now(timezone.utc).isoformat(),
        station_id="AWS-DEL-001",
        temperature=32.0,
        pressure=1000.0,
        humidity=50.0
    )
    feats = extractor.extract_features(obs, [])
    res = iforest.predict_features(feats)
    assert "score" in res
    assert 0.0 <= res["score"] <= 1.0

def test_lstm_autoencoder_prediction():
    lstm = LSTMAutoencoderEngine(model_dir="./models/saved")
    assert lstm.trained is True
    obs = ObservationRaw(
        timestamp=datetime.now(timezone.utc).isoformat(),
        station_id="AWS-DEL-001",
        temperature=32.0,
        pressure=1000.0,
        humidity=50.0
    )
    res = lstm.predict_sequence(obs, [])
    assert "recon_error" in res
    assert "var_errors" in res
    assert "score" in res
