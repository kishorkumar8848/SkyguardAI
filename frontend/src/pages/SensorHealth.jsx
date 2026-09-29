import React from 'react';
import { StatusBadge } from '../components/StatusBadge';
import { HeartPulse, Wrench, AlertTriangle, CheckCircle, TrendingDown, Clock } from 'lucide-react';

export function SensorHealth({ stations }) {
  return (
    <div>
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">
            <HeartPulse size={18} color="#10b981" />
            <span>Continuous Sensor Health & Predictive Maintenance Intelligence</span>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Tracking EWMA degradation, cumulative bias drift, and telemetry reliability
          </span>
        </div>
        <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          SkyGuard AI tracks slow calibration degradation before sensors fail completely.
          If health continuously drops across consecutive reporting cycles, early warnings are dispatched to regional maintenance engineers.
        </p>
      </div>

      {/* Station Health Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
        {stations.map(st => {
          const h = st.health || {};
          const isWarning = h.early_maintenance_warning || h.drift_detected;

          return (
            <div key={st.station_id} className="panel" style={{
              borderTop: `4px solid ${isWarning ? '#f59e0b' : '#10b981'}`,
              marginBottom: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>{st.station_name}</div>
                  <div className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {st.station_id} • {st.climate_zone}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="font-mono" style={{ fontSize: '1.5rem', fontWeight: 700, color: (h.overall_health || 95) > 80 ? '#10b981' : '#f59e0b' }}>
                    {h.overall_health || 95}%
                  </div>
                  <StatusBadge status={st.status} />
                </div>
              </div>

              {/* Maintenance Warning Banner if active */}
              {h.early_maintenance_warning && (
                <div style={{
                  background: 'rgba(245, 158, 11, 0.12)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  padding: '0.5rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  marginBottom: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: '#fbbf24'
                }}>
                  <Wrench size={16} />
                  <span>{h.warning_message || 'Progressive calibration drift detected. Recalibration advised.'}</span>
                </div>
              )}

              {/* Channel Health Bars */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                  <span style={{ color: '#f59e0b' }}>Temperature Transducer</span>
                  <span className="font-mono">{h.temperature_health || 94}%</span>
                </div>
                <div className="meter-bar">
                  <div className="meter-fill" style={{ width: `${h.temperature_health || 94}%`, backgroundColor: '#f59e0b' }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.2rem', marginTop: '0.5rem' }}>
                  <span style={{ color: '#a855f7' }}>Barometric Pressure Sensor</span>
                  <span className="font-mono">{h.pressure_health || 98}%</span>
                </div>
                <div className="meter-bar">
                  <div className="meter-fill" style={{ width: `${h.pressure_health || 98}%`, backgroundColor: '#a855f7' }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.2rem', marginTop: '0.5rem' }}>
                  <span style={{ color: '#38bdf8' }}>Relative Humidity Sensor</span>
                  <span className="font-mono">{h.humidity_health || 91}%</span>
                </div>
                <div className="meter-bar">
                  <div className="meter-fill" style={{ width: `${h.humidity_health || 91}%`, backgroundColor: '#38bdf8' }} />
                </div>
              </div>

              {/* Health Metrics Summary */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.5rem',
                fontSize: '0.725rem',
                background: 'var(--bg-subtle)',
                padding: '0.5rem',
                borderRadius: 'var(--radius-sm)'
              }}>
                <div>
                  <div style={{ color: 'var(--text-muted)' }}>CALIBRATION DRIFT</div>
                  <div className="font-mono" style={{ fontWeight: 600, color: h.drift_detected ? '#f59e0b' : 'var(--text-primary)' }}>
                    {h.drift_detected ? `${h.drift_rate}°C/day` : '0.00°C/d'}
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)' }}>COMM RELIABILITY</div>
                  <div className="font-mono" style={{ fontWeight: 600 }}>{h.communication_reliability || 99.8}%</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)' }}>24H FAULT COUNT</div>
                  <div className="font-mono" style={{ fontWeight: 600 }}>{h.anomaly_frequency_24h || 0}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
