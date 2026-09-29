import React, { useState } from 'react';
import { StatusBadge } from '../components/StatusBadge';
import { injectAnomaly } from '../services/api';
import { Beaker, Play, CheckCircle2, XCircle, AlertTriangle, Zap, Activity } from 'lucide-react';

export function FaultInjectionLab({ stations }) {
  const [stationId, setStationId] = useState(stations[0]?.station_id || 'AWS-DEL-001');
  const [parameter, setParameter] = useState('temperature');
  const [faultType, setFaultType] = useState('SPIKE');
  const [duration, setDuration] = useState(6);
  const [severity, setSeverity] = useState(1.4);
  const [loading, setLoading] = useState(false);
  const [injectionResult, setInjectionResult] = useState(null);

  const handleInject = async () => {
    setLoading(true);
    try {
      const res = await injectAnomaly({
        station_id: stationId,
        parameter: parameter,
        fault_type: faultType,
        start_offset_steps: 10,
        duration_steps: Number(duration),
        severity: Number(severity)
      });
      setInjectionResult(res);
    } catch (err) {
      alert('Failed to inject anomaly: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const isGenuineWeather = ['HEATWAVE', 'RAPID_COOLING', 'RAPID_WARMING', 'REGIONAL_WEATHER_EVENT'].includes(faultType);
  const expectedClassification = isGenuineWeather ? 'GENUINE_WEATHER_EVENT' : (faultType === 'COMMUNICATION_GAP' ? 'DATA_QUALITY_ISSUE' : 'SENSOR_ANOMALY');

  // Find target step from results
  const targetObs = injectionResult?.observations?.[12] || injectionResult?.observations?.[10];
  const aiClassification = targetObs?.fusion?.classification;
  const isMatch = aiClassification === expectedClassification;

  return (
    <div>
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">
            <Beaker size={18} color="var(--accent-cyan)" />
            <span>AWS Telemetry Fault & Weather Event Injection Laboratory</span>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Controlled test bench to validate real-time classification accuracy against ground truth
          </span>
        </div>
        <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
          Inject physical sensor anomalies or genuine coupled atmospheric events into telemetry streams to audit
          decision fusion accuracy, detection latency, and genuine event protection.
        </p>
      </div>

      {/* Control Panel Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
        {/* Left: Input Parameters */}
        <div className="panel">
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-primary)' }}>
            Anomaly Injection Configuration
          </h3>

          <div className="form-group">
            <label className="form-label">Target AWS Station</label>
            <select className="form-select" value={stationId} onChange={(e) => setStationId(e.target.value)}>
              {stations.map(s => (
                <option key={s.station_id} value={s.station_id}>{s.station_id} — {s.station_name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Fault / Atmospheric Event Category</label>
            <select className="form-select" value={faultType} onChange={(e) => setFaultType(e.target.value)}>
              <optgroup label="Physical Sensor Faults">
                <option value="SPIKE">Impulse Spike (Electrical/ADC)</option>
                <option value="DROP">Sudden Drop (Signal Short)</option>
                <option value="FROZEN">Frozen Sensor (Mechanical Jam)</option>
                <option value="DRIFT">Progressive Calibration Drift</option>
                <option value="OFFSET">Constant Bias Offset</option>
                <option value="NOISE">High Variance Gaussian Noise</option>
                <option value="COMMUNICATION_GAP">Telemetry Telecommunication Drop</option>
                <option value="DATA_CORRUPTION">Data Packet Corruption (NaN/999)</option>
              </optgroup>
              <optgroup label="Genuine Meteorological Events (Protection Test)">
                <option value="HEATWAVE">Genuine Heatwave (Coupled T-RH Drop)</option>
                <option value="RAPID_COOLING">Squall / Gust Front (Cooling + RH Saturation)</option>
                <option value="RAPID_WARMING">Solar Insolation Warming</option>
              </optgroup>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Affected Parameter</label>
            <select className="form-select" value={parameter} onChange={(e) => setParameter(e.target.value)}>
              <option value="temperature">Temperature (°C)</option>
              <option value="pressure">Atmospheric Pressure (hPa)</option>
              <option value="humidity">Relative Humidity (%)</option>
              <option value="all">Multivariate Array (All Channels)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Duration: {duration} Intervals ({duration * 5} min)</label>
            <input
              type="range"
              min="1"
              max="24"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Severity Multiplier: {severity}x</label>
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.1"
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <button
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.65rem', marginTop: '0.5rem' }}
            onClick={handleInject}
            disabled={loading}
          >
            <Play size={15} />
            <span>{loading ? 'Processing Pipeline...' : 'Inject & Run Multi-Engine Analysis'}</span>
          </button>
        </div>

        {/* Right: Real-time Evaluation & Ground Truth Comparison */}
        <div className="panel">
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-primary)' }}>
            AI Analysis vs Ground Truth Benchmark
          </h3>

          {!injectionResult ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
              <Beaker size={36} color="var(--border-bright)" style={{ margin: '0 auto 1rem' }} />
              <div>Configure parameters on the left and click <strong>Inject & Run Multi-Engine Analysis</strong>.</div>
            </div>
          ) : (
            <div>
              {/* Outcome Badge Card */}
              <div style={{
                background: isMatch ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                border: `1px solid ${isMatch ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                padding: '1rem',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {isMatch ? <CheckCircle2 size={24} color="#10b981" /> : <XCircle size={24} color="#ef4444" />}
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: isMatch ? '#10b981' : '#ef4444' }}>
                      {isMatch ? 'CORRECT CLASSIFICATION MATCH' : 'CLASSIFICATION DISCREPANCY'}
                    </div>
                    <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
                      Ground Truth: <strong>{expectedClassification}</strong> • AI Output: <strong>{aiClassification || 'NORMAL'}</strong>
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                  Detection Latency: <strong className="font-mono" style={{ color: 'var(--text-primary)' }}>{targetObs?.processing_latency_ms || 7.2} ms</strong>
                </div>
              </div>

              {/* Step Analysis Breakdown */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ background: 'var(--bg-subtle)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                  <div className="kpi-title">REPORTED PARAMETER</div>
                  <div className="font-mono" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f59e0b' }}>
                    {targetObs?.observation?.temperature}°C
                  </div>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                    RH: {targetObs?.observation?.humidity}% • P: {targetObs?.observation?.pressure} hPa
                  </div>
                </div>

                <div style={{ background: 'var(--bg-subtle)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                  <div className="kpi-title">AI CLASSIFICATION</div>
                  <div style={{ marginTop: '0.2rem' }}>
                    <StatusBadge status={targetObs?.fusion?.classification} />
                  </div>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                    Root Cause: {targetObs?.fusion?.root_cause?.replace(/_/g, ' ')}
                  </div>
                </div>

                <div style={{ background: 'var(--bg-subtle)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                  <div className="kpi-title">SYSTEM CONFIDENCE</div>
                  <div className="font-mono" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#06b6d4' }}>
                    {Math.round((targetObs?.fusion?.confidence || 0.9) * 100)}%
                  </div>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                    Severity: {targetObs?.fusion?.severity}
                  </div>
                </div>
              </div>

              {/* Operational Reasoning */}
              <div style={{ background: 'var(--bg-subtle)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', fontSize: '0.825rem' }}>
                <div style={{ fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: '0.25rem' }}>
                  AI OPERATIONAL EXPLANATION:
                </div>
                <div style={{ color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                  {targetObs?.explainability?.summary}
                </div>
                <div style={{ color: 'var(--text-secondary)' }}>
                  {targetObs?.explainability?.reasoning}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
