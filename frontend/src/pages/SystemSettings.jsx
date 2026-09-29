import React, { useState } from 'react';
import { Sliders, RefreshCw, Cpu, Database, ShieldCheck, CheckCircle2 } from 'lucide-react';

export function SystemSettings({ stations }) {
  const [edgeMode, setEdgeMode] = useState(false);
  const [recalibrating, setRecalibrating] = useState(false);
  const [recalibMsg, setRecalibMsg] = useState(null);

  const handleRecalibrate = async () => {
    setRecalibrating(true);
    setRecalibMsg(null);
    try {
      // Mock call to simulate recalibration
      await new Promise(r => setTimeout(r, 1200));
      setRecalibMsg('Anomaly thresholds recalibrated successfully across all stations using 98th percentile validation!');
    } catch (e) {
      setRecalibMsg('Failed to recalibrate: ' + e.message);
    } finally {
      setRecalibrating(false);
    }
  };

  return (
    <div>
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">
            <Sliders size={18} color="var(--accent-cyan)" />
            <span>System Settings, Calibration & Edge Readiness</span>
          </div>
        </div>
        <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
          Configure station-specific quality control limits, adapt anomaly detection thresholds, and configure edge deployment profiles.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Edge Readiness Mode */}
        <div className="panel">
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
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                CURRENT PROFILE: <span style={{ color: edgeMode ? '#f59e0b' : 'var(--accent-cyan)' }}>{edgeMode ? 'EDGE MODE' : 'FULL MODE'}</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {edgeMode
                  ? 'Lightweight deterministic QC + quantized compact ML (<5ms latency, ESP32/ARM compatible)'
                  : 'Complete multi-engine pipeline: LSTM Autoencoder, Isolation Forest, SHAP explainability, Bayesian fusion'}
              </div>
            </div>

            <button
              className={`btn ${edgeMode ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setEdgeMode(!edgeMode)}
            >
              Switch to {edgeMode ? 'Full Mode' : 'Edge Mode'}
            </button>
          </div>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            <div>✓ <strong>ONNX Export Path:</strong> PyTorch LSTM exportable to ONNX format for micro-controllers.</div>
            <div>✓ <strong>Memory Footprint:</strong> Edge Mode requires &lt;16 MB RAM for edge RTU telemetry loggers.</div>
          </div>
        </div>

        {/* Adaptive Threshold Calibration */}
        <div className="panel">
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <RefreshCw size={16} color="var(--accent-cyan)" />
            <span>Adaptive Anomaly Threshold Recalibration</span>
          </h3>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Avoid static thresholds. Calibrates sensitivity based on seasonal variance (Monsoon vs Summer pre-convective regimes).
          </p>

          <button
            className="btn btn-secondary"
            onClick={handleRecalibrate}
            disabled={recalibrating}
            style={{ width: '100%', padding: '0.65rem', marginBottom: '0.75rem' }}
          >
            <RefreshCw size={14} className={recalibrating ? 'spin' : ''} />
            <span>{recalibrating ? 'Calculating Thresholds...' : 'Recalibrate Anomaly Baselines'}</span>
          </button>

          {recalibMsg && (
            <div style={{ fontSize: '0.775rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '0.5rem', borderRadius: '4px' }}>
              {recalibMsg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
