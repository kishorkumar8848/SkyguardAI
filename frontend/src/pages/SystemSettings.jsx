import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  RefreshCw, 
  Cpu, 
  Database, 
  ShieldCheck, 
  CheckCircle2, 
  BrainCircuit, 
  Settings2, 
  Gauge, 
  Thermometer, 
  Save, 
  AlertCircle 
} from 'lucide-react';
import { 
  fetchSystemMode, 
  setSystemMode, 
  recalibrateModelThresholds, 
  triggerModelTraining, 
  updateStationLimits 
} from '../services/api';

export function SystemSettings({ stations = [] }) {
  const [edgeMode, setEdgeMode] = useState(false);
  const [modeLoading, setModeLoading] = useState(false);
  const [systemModeDesc, setSystemModeDesc] = useState('');

  // Threshold Recalibration
  const [recalibrating, setRecalibrating] = useState(false);
  const [recalibResult, setRecalibResult] = useState(null);
  const [recalibError, setRecalibError] = useState(null);

  // Model Training
  const [training, setTraining] = useState(false);
  const [trainResult, setTrainResult] = useState(null);
  const [trainError, setTrainError] = useState(null);

  // Station Physical QC Config
  const [selectedStationId, setSelectedStationId] = useState(stations[0]?.station_id || 'AWS-DEL-001');
  const [stationConfig, setStationConfig] = useState({
    temp_min: -5.0,
    temp_max: 52.0,
    pressure_min: 940.0,
    pressure_max: 1040.0,
    step_temp_max: 3.5,
    step_pressure_max: 3.5
  });
  const [savingConfig, setSavingConfig] = useState(false);
  const [configSaveMsg, setConfigSaveMsg] = useState(null);

  // Load initial system mode
  useEffect(() => {
    fetchSystemMode()
      .then(res => {
        if (res) {
          setEdgeMode(res.edge_mode || false);
          setSystemModeDesc(res.description || '');
        }
      })
      .catch(err => console.warn('Could not fetch system mode:', err));
  }, []);

  // Update station config inputs when station changes
  useEffect(() => {
    const st = stations.find(s => s.station_id === selectedStationId);
    if (st) {
      const isHighAltitude = (st.elevation || 0) > 1500;
      setStationConfig({
        temp_min: st.climate_zone === 'Himalayan Alpine' ? -35.0 : -5.0,
        temp_max: st.climate_zone === 'Hot Arid' ? 55.0 : 48.0,
        pressure_min: isHighAltitude ? 720.0 : 950.0,
        pressure_max: isHighAltitude ? 830.0 : 1045.0,
        step_temp_max: 3.5,
        step_pressure_max: 3.5
      });
    }
  }, [selectedStationId, stations]);

  const handleToggleMode = async () => {
    setModeLoading(true);
    try {
      const nextMode = !edgeMode;
      const res = await setSystemMode(nextMode);
      setEdgeMode(res.edge_mode);
      setSystemModeDesc(res.edge_mode 
        ? 'Lightweight deterministic QC + compact ML (<5ms latency, ESP32/ARM compatible)' 
        : 'Complete multi-engine pipeline: LSTM Autoencoder, Isolation Forest, SHAP explainability, Bayesian fusion'
      );
    } catch (e) {
      alert('Failed to switch system mode: ' + e.message);
    } finally {
      setModeLoading(false);
    }
  };

  const handleRecalibrate = async () => {
    setRecalibrating(true);
    setRecalibError(null);
    setRecalibResult(null);
    try {
      const res = await recalibrateModelThresholds();
      setRecalibResult(res);
    } catch (e) {
      setRecalibError(e.message || 'Recalibration failed');
    } finally {
      setRecalibrating(false);
    }
  };

  const handleTrainModels = async () => {
    setTraining(true);
    setTrainError(null);
    setTrainResult(null);
    try {
      const res = await triggerModelTraining();
      setTrainResult(res);
    } catch (e) {
      setTrainError(e.message || 'Model training failed');
    } finally {
      setTraining(false);
    }
  };

  const handleSaveStationConfig = async (e) => {
    e.preventDefault();
    setSavingConfig(true);
    setConfigSaveMsg(null);
    try {
      const res = await updateStationLimits(selectedStationId, stationConfig);
      setConfigSaveMsg(`Station ${selectedStationId} QC limits updated in operational pipeline!`);
      setTimeout(() => setConfigSaveMsg(null), 4000);
    } catch (e) {
      alert('Failed to update station config: ' + e.message);
    } finally {
      setSavingConfig(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Overview Banner */}
      <div className="panel" style={{ marginBottom: 0 }}>
        <div className="panel-header">
          <div className="panel-title">
            <Sliders size={18} color="var(--accent-cyan)" />
            <span>Operational System Settings, Calibration & Edge Readiness</span>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            SIH26073 Production Deployment Matrix
          </span>
        </div>
        <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
          Configure station-specific quality control limits, adapt anomaly detection thresholds, train continuous machine learning models, and switch runtime execution profiles.
        </p>
      </div>

      {/* Top 2 Columns: Edge Mode & Adaptive Thresholds */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        {/* Edge Readiness Mode */}
        <div className="panel" style={{ marginBottom: 0 }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Cpu size={16} color="var(--accent-cyan)" />
            <span>Inference Profile: Full AI vs Edge Deployment</span>
          </h3>

          <div style={{
            background: 'var(--bg-subtle)',
            padding: '1rem',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            border: `1px solid ${edgeMode ? 'rgba(245, 158, 11, 0.4)' : 'rgba(14, 165, 233, 0.4)'}`
          }}>
            <div style={{ maxWidth: '70%' }}>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                CURRENT PROFILE: <span style={{ color: edgeMode ? '#f59e0b' : 'var(--accent-cyan)' }}>{edgeMode ? 'COMPACT EDGE MODE' : 'FULL AI HYBRID MODE'}</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                {edgeMode
                  ? 'Lightweight deterministic QC + quantized compact ML (<5ms latency, ESP32/ARM compatible)'
                  : 'Complete multi-engine pipeline: LSTM Autoencoder, Isolation Forest, SHAP explainability, Bayesian fusion'}
              </div>
            </div>

            <button
              className={`btn ${edgeMode ? 'btn-primary' : 'btn-secondary'}`}
              onClick={handleToggleMode}
              disabled={modeLoading}
              style={{ minWidth: '130px', justifyContent: 'center' }}
            >
              {modeLoading ? 'Switching...' : `Switch to ${edgeMode ? 'Full AI' : 'Edge Mode'}`}
            </button>
          </div>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.6', background: 'var(--bg-subtle)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
            <div>✓ <strong>ONNX Export Path:</strong> PyTorch LSTM exportable to ONNX format for microcontroller runtime.</div>
            <div>✓ <strong>Memory Footprint:</strong> Edge Mode requires &lt;16 MB RAM for edge RTU telemetry loggers.</div>
            <div>✓ <strong>Sub-10ms Inference:</strong> Zero cloud dependency during communication blackouts.</div>
          </div>
        </div>

        {/* Adaptive Threshold Calibration */}
        <div className="panel" style={{ marginBottom: 0 }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <RefreshCw size={16} color="var(--accent-cyan)" />
            <span>Adaptive Anomaly Threshold Recalibration</span>
          </h3>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: '1.4' }}>
            Avoid static thresholds. Dynamically calibrates sensitivity based on seasonal variance (Monsoon vs Summer pre-convective regimes) using 98th percentile, 3-sigma, and robust Median Absolute Deviation (MAD).
          </p>

          <button
            className="btn btn-secondary"
            onClick={handleRecalibrate}
            disabled={recalibrating}
            style={{ width: '100%', padding: '0.65rem', marginBottom: '0.75rem', justifyContent: 'center' }}
          >
            <RefreshCw size={14} className={recalibrating ? 'spin' : ''} />
            <span>{recalibrating ? 'Calculating Multi-Distribution Baselines...' : 'Recalibrate Anomaly Baselines (P98 + MAD)'}</span>
          </button>

          {recalibResult && (
            <div style={{ fontSize: '0.775rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '0.75rem', borderRadius: '4px' }}>
              <div style={{ fontWeight: 700, marginBottom: '0.35rem' }}>✓ {recalibResult.message}</div>
              {recalibResult.calibrated_thresholds?.isolation_forest && (
                <div className="font-mono" style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                  Isolation Forest: P98 = {recalibResult.calibrated_thresholds.isolation_forest.percentile_98?.toFixed(4)} | MAD = {recalibResult.calibrated_thresholds.isolation_forest.robust_mad?.toFixed(4)}
                </div>
              )}
              {recalibResult.calibrated_thresholds?.lstm_autoencoder && (
                <div className="font-mono" style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                  LSTM Autoencoder: P98 = {recalibResult.calibrated_thresholds.lstm_autoencoder.percentile_98?.toFixed(4)} | MAD = {recalibResult.calibrated_thresholds.lstm_autoencoder.robust_mad?.toFixed(4)}
                </div>
              )}
            </div>
          )}

          {recalibError && (
            <div style={{ fontSize: '0.775rem', color: '#ef4444', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.5rem', borderRadius: '4px' }}>
              ✕ {recalibError}
            </div>
          )}
        </div>
      </div>

      {/* Middle 2 Columns: Full Model Retraining & Station Limits */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        {/* Retrain AI Models Panel */}
        <div className="panel" style={{ marginBottom: 0 }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BrainCircuit size={16} color="var(--accent-cyan)" />
            <span>Continuous ML Retraining Pipeline</span>
          </h3>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: '1.4' }}>
            Regenerates clean synthetic baseline telemetry across all meteorological zones, fits the Scikit-Learn Isolation Forest, trains PyTorch Sequence Autoencoder, and hot-reloads models in memory without downtime.
          </p>

          <button
            className="btn btn-primary"
            onClick={handleTrainModels}
            disabled={training}
            style={{ width: '100%', padding: '0.65rem', marginBottom: '0.75rem', justifyContent: 'center' }}
          >
            <BrainCircuit size={15} className={training ? 'spin' : ''} />
            <span>{training ? 'Training Isolation Forest & LSTM Sequence Models...' : 'Retrain & Hot-Reload AI Models'}</span>
          </button>

          {trainResult && (
            <div style={{ fontSize: '0.775rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '0.75rem', borderRadius: '4px' }}>
              <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>✓ {trainResult.message}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                Training Samples: <strong>{trainResult.training_samples}</strong> • Hot-reloaded: <strong>{new Date(trainResult.timestamp).toLocaleTimeString()}</strong>
              </div>
            </div>
          )}

          {trainError && (
            <div style={{ fontSize: '0.775rem', color: '#ef4444', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.5rem', borderRadius: '4px' }}>
              ✕ {trainError}
            </div>
          )}

          <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
            Continuous retraining prevents model drift over multi-year deployments as climatic baselines shift due to climate change.
          </div>
        </div>

        {/* Station Physical QC Envelope Configuration */}
        <div className="panel" style={{ marginBottom: 0 }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Settings2 size={16} color="var(--accent-cyan)" />
            <span>Station Physical QC Envelope Configuration</span>
          </h3>

          <div style={{ marginBottom: '0.75rem' }}>
            <label className="form-label">Select AWS Station</label>
            <select
              className="form-select"
              value={selectedStationId}
              onChange={(e) => setSelectedStationId(e.target.value)}
            >
              {stations.map(st => (
                <option key={st.station_id} value={st.station_id}>
                  {st.station_id} — {st.station_name} ({st.climate_zone})
                </option>
              ))}
            </select>
          </div>

          <form onSubmit={handleSaveStationConfig}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.72rem' }}>Min Temp (°C)</label>
                <input
                  type="number"
                  step="0.5"
                  className="form-select"
                  value={stationConfig.temp_min}
                  onChange={(e) => setStationConfig({ ...stationConfig, temp_min: parseFloat(e.target.value) })}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.72rem' }}>Max Temp (°C)</label>
                <input
                  type="number"
                  step="0.5"
                  className="form-select"
                  value={stationConfig.temp_max}
                  onChange={(e) => setStationConfig({ ...stationConfig, temp_max: parseFloat(e.target.value) })}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.72rem' }}>Min Pressure (hPa)</label>
                <input
                  type="number"
                  step="1"
                  className="form-select"
                  value={stationConfig.pressure_min}
                  onChange={(e) => setStationConfig({ ...stationConfig, pressure_min: parseFloat(e.target.value) })}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.72rem' }}>Max Pressure (hPa)</label>
                <input
                  type="number"
                  step="1"
                  className="form-select"
                  value={stationConfig.pressure_max}
                  onChange={(e) => setStationConfig({ ...stationConfig, pressure_max: parseFloat(e.target.value) })}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.72rem' }}>Max Step Temp (°C/10m)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-select"
                  value={stationConfig.step_temp_max}
                  onChange={(e) => setStationConfig({ ...stationConfig, step_temp_max: parseFloat(e.target.value) })}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.72rem' }}>Max Step Pressure (hPa/10m)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-select"
                  value={stationConfig.step_pressure_max}
                  onChange={(e) => setStationConfig({ ...stationConfig, step_pressure_max: parseFloat(e.target.value) })}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-secondary"
              disabled={savingConfig}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <Save size={14} />
              <span>{savingConfig ? 'Saving...' : 'Update Station QC Limits in Engine'}</span>
            </button>
          </form>

          {configSaveMsg && (
            <div style={{ marginTop: '0.75rem', fontSize: '0.775rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '0.5rem', borderRadius: '4px', textAlign: 'center' }}>
              ✓ {configSaveMsg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
