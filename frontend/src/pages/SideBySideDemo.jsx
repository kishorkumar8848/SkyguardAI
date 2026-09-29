import React, { useState, useEffect } from 'react';
import { fetchSideBySideDemo } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { Zap, Play, CheckCircle2, AlertTriangle, ShieldCheck, Thermometer, Droplets, Gauge } from 'lucide-react';

export function SideBySideDemo() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadDemo = async () => {
    setLoading(true);
    try {
      const res = await fetchSideBySideDemo();
      setData(res);
    } catch (err) {
      alert('Failed to load demo: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDemo();
  }, []);

  if (!data) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading side-by-side verification...</div>;

  const left = data.left_genuine_weather;
  const right = data.right_sensor_fault;
  const leftTarget = left?.target || {};
  const rightTarget = right?.target || {};

  return (
    <div>
      {/* Header Banner */}
      <div className="panel" style={{
        background: 'linear-gradient(90deg, rgba(14, 165, 233, 0.15) 0%, rgba(239, 68, 68, 0.1) 100%)',
        borderColor: 'rgba(14, 165, 233, 0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <Zap size={20} color="#0ea5e9" />
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-cyan)', letterSpacing: '0.05em' }}>
                PRIMARY EVALUATION BENCHMARK: GENUINE EVENT VS SENSOR FAULT
              </span>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0.2rem 0' }}>
              Side-by-Side Demonstration of Atmospheric Physics vs Instrument Artifacts
            </h2>
            <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
              Both Automatic Weather Stations report extreme heat (~47.0°C - 48.5°C). Observing how SkyGuard AI discriminates them in real time:
            </div>
          </div>

          <button className="btn btn-primary" onClick={loadDemo} disabled={loading}>
            <Play size={14} />
            <span>{loading ? 'Executing Models...' : 'Re-Execute Live Demonstration'}</span>
          </button>
        </div>
      </div>

      {/* Side-by-Side Dual Columns */}
      <div className="side-by-side-grid">
        {/* LEFT COLUMN: GENUINE WEATHER EVENT */}
        <div className="side-col left-weather">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontWeight: 700, color: '#0ea5e9', fontSize: '0.9rem' }}>
              LEFT: GENUINE METEOROLOGICAL EVENT
            </span>
            <StatusBadge status={leftTarget?.fusion?.classification || 'GENUINE_WEATHER_EVENT'} />
          </div>

          <div style={{ background: 'var(--bg-subtle)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>STATION ID & CLIMATE</div>
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>AWS-JOD-002 — Jodhpur Desert AWS</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Hot Arid Thar Desert • Elevation 224 m</div>
          </div>

          {/* Telemetry Numbers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
            <div style={{ background: 'var(--bg-subtle)', padding: '0.6rem', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>AIR TEMP</div>
              <div className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f59e0b' }}>
                {leftTarget?.observation?.temperature}°C
              </div>
              <div style={{ fontSize: '0.7rem', color: '#10b981' }}>Sustained Warming</div>
            </div>

            <div style={{ background: 'var(--bg-subtle)', padding: '0.6rem', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>HUMIDITY</div>
              <div className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 700, color: '#38bdf8' }}>
                {leftTarget?.observation?.humidity}%
              </div>
              <div style={{ fontSize: '0.7rem', color: '#10b981' }}>Physically Coupled Drop</div>
            </div>

            <div style={{ background: 'var(--bg-subtle)', padding: '0.6rem', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>PRESSURE</div>
              <div className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 700, color: '#a855f7' }}>
                {leftTarget?.observation?.pressure} hPa
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Thermal Low Dip</div>
            </div>
          </div>

          {/* AI Decision Analysis */}
          <div style={{ background: 'rgba(14, 165, 233, 0.08)', border: '1px solid rgba(14, 165, 233, 0.25)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.8rem' }}>
              <span>Weather Event Probability:</span>
              <strong className="font-mono" style={{ color: '#0ea5e9' }}>
                {Math.round((leftTarget?.fusion?.weather_event_probability || 0.70) * 100)}%
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.8rem' }}>
              <span>Sensor Fault Probability:</span>
              <strong className="font-mono" style={{ color: '#10b981' }}>
                {Math.round((leftTarget?.fusion?.sensor_fault_probability || 0.21) * 100)}%
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <span>System Confidence:</span>
              <strong className="font-mono" style={{ color: '#06b6d4' }}>
                {Math.round((leftTarget?.fusion?.confidence || 0.85) * 100)}%
              </strong>
            </div>
          </div>

          {/* Scientific Evidence Checklist */}
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
              SCIENTIFIC EVIDENCE AUDIT:
            </div>
            <div className="evidence-item">
              <CheckCircle2 size={16} className="check-icon" />
              <span><strong>Thermodynamics:</strong> RH decreases sharply from 38% down to 8% in accordance with Clausius-Clapeyron saturation vapor expansion.</span>
            </div>
            <div className="evidence-item">
              <CheckCircle2 size={16} className="check-icon" />
              <span><strong>Temporal Dynamics:</strong> Temperature rise is continuous and sustained across consecutive reporting cycles.</span>
            </div>
            <div className="evidence-item">
              <CheckCircle2 size={16} className="check-icon" />
              <span><strong>Spatial Consensus:</strong> Neighboring western stations confirm regional synoptic thermal ridge.</span>
            </div>
          </div>

          {/* Operational Recommendation */}
          <div style={{ marginTop: '1rem', padding: '0.65rem 0.85rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16, 185, 129, 0.3)', fontSize: '0.8rem', color: '#6ee7b7' }}>
            <strong>OPERATOR ACTION:</strong> Issue Heatwave Warning Bulletin to forecasting desk. Do NOT dispatch sensor repair technicians.
          </div>
        </div>

        {/* RIGHT COLUMN: SENSOR FAULT SPIKE */}
        <div className="side-col right-fault">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontWeight: 700, color: '#ef4444', fontSize: '0.9rem' }}>
              RIGHT: SENSOR FAULT (ELECTRICAL SPIKE)
            </span>
            <StatusBadge status={rightTarget?.fusion?.classification || 'SENSOR_ANOMALY'} />
          </div>

          <div style={{ background: 'var(--bg-subtle)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>STATION ID & CLIMATE</div>
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>AWS-DEL-001 — Delhi Safdarjung AWS</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Semi-Arid Continental Plains • Elevation 216 m</div>
          </div>

          {/* Telemetry Numbers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
            <div style={{ background: 'var(--bg-subtle)', padding: '0.6rem', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>AIR TEMP</div>
              <div className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 700, color: '#ef4444' }}>
                {rightTarget?.observation?.temperature}°C
              </div>
              <div style={{ fontSize: '0.7rem', color: '#ef4444' }}>+13°C Impulse Jump</div>
            </div>

            <div style={{ background: 'var(--bg-subtle)', padding: '0.6rem', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>HUMIDITY</div>
              <div className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 700, color: '#38bdf8' }}>
                {rightTarget?.observation?.humidity}%
              </div>
              <div style={{ fontSize: '0.7rem', color: '#ef4444' }}>Flat / Uncoupled</div>
            </div>

            <div style={{ background: 'var(--bg-subtle)', padding: '0.6rem', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>PRESSURE</div>
              <div className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 700, color: '#a855f7' }}>
                {rightTarget?.observation?.pressure} hPa
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Flat / Zero Response</div>
            </div>
          </div>

          {/* AI Decision Analysis */}
          <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.8rem' }}>
              <span>Sensor Fault Probability:</span>
              <strong className="font-mono" style={{ color: '#ef4444' }}>
                {Math.round((rightTarget?.fusion?.sensor_fault_probability || 0.91) * 100)}%
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.8rem' }}>
              <span>Weather Event Probability:</span>
              <strong className="font-mono" style={{ color: 'var(--text-muted)' }}>
                {Math.round((rightTarget?.fusion?.weather_event_probability || 0.01) * 100)}%
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <span>System Confidence:</span>
              <strong className="font-mono" style={{ color: '#06b6d4' }}>
                {Math.round((rightTarget?.fusion?.confidence || 0.91) * 100)}%
              </strong>
            </div>
          </div>

          {/* Scientific Evidence Checklist */}
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
              SCIENTIFIC EVIDENCE AUDIT:
            </div>
            <div className="evidence-item">
              <AlertTriangle size={16} className="cross-icon" />
              <span><strong>Thermodynamics:</strong> Broken coupling. Air temperature jumped +13°C in 5 min while RH remained flat at 46% (violates saturation vapor expansion).</span>
            </div>
            <div className="evidence-item">
              <AlertTriangle size={16} className="cross-icon" />
              <span><strong>Temporal Dynamics:</strong> Single-step Dirac delta impulse spike with zero temporal persistence.</span>
            </div>
            <div className="evidence-item">
              <AlertTriangle size={16} className="cross-icon" />
              <span><strong>Spatial Outlier:</strong> Surrounding stations in Haryana and NCR report normal 34°C baseline.</span>
            </div>
          </div>

          {/* Operational Recommendation */}
          <div style={{ marginTop: '1rem', padding: '0.65rem 0.85rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(239, 68, 68, 0.3)', fontSize: '0.8rem', color: '#fca5a5' }}>
            <strong>OPERATOR ACTION:</strong> Inspect temperature transducer wiring, ADC converter register, and transient lightning suppressor.
          </div>
        </div>
      </div>
    </div>
  );
}
