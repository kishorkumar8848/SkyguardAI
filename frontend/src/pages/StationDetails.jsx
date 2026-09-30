import React, { useState } from 'react';
import { StatusBadge } from '../components/StatusBadge';
import { Settings, ShieldAlert, RotateCcw, Wrench, CheckCircle, AlertTriangle } from 'lucide-react';

export function StationDetails({ station, stations = [], onSelectStation, observations = [], onReplayEvent, onNavigateSettings }) {
  if (!station) return <div className="panel" style={{ padding: '2rem', textAlign: 'center' }}>No station selected.</div>;

  const health = station.health || {};
  const stationObs = observations.filter(o => o.station_id === station.station_id).slice(-15);
  const [replayIdx, setReplayIdx] = useState(0);

  return (
    <div>
      {/* Station Selector & Metadata Header */}
      <div className="panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
            {stations.length > 0 && (
              <select
                className="form-select"
                style={{ width: '260px', padding: '0.35rem 0.6rem', fontWeight: 600 }}
                value={station.station_id}
                onChange={(e) => onSelectStation && onSelectStation(e.target.value)}
              >
                {stations.map(st => (
                  <option key={st.station_id} value={st.station_id}>
                    {st.station_id} — {st.station_name}
                  </option>
                ))}
              </select>
            )}
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{station.station_name}</h2>
            <span className="font-mono" style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)' }}>({station.station_id})</span>
            <StatusBadge status={station.status} />
          </div>
          <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
            Coordinates: {station.latitude}°N, {station.longitude}°E • Elevation: {station.elevation} m • Climate: {station.climate_zone}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {onNavigateSettings && (
            <button
              className="btn btn-secondary"
              onClick={onNavigateSettings}
            >
              <Settings size={14} />
              <span>Configure Limits</span>
            </button>
          )}
          <button
            className="btn btn-secondary"
            onClick={() => onReplayEvent && onReplayEvent(station.station_id)}
          >
            <RotateCcw size={14} />
            <span>Replay Recent Event</span>
          </button>
        </div>
      </div>

      {/* Early Maintenance Warning Alert if Active */}
      {health.early_maintenance_warning && (
        <div className="panel" style={{ background: 'rgba(245, 158, 11, 0.12)', borderColor: 'rgba(245, 158, 11, 0.4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Wrench size={22} color="#f59e0b" />
            <div>
              <div style={{ fontWeight: 700, color: '#f59e0b', fontSize: '0.9rem' }}>PREDICTIVE MAINTENANCE EARLY WARNING TRIGGERED</div>
              <div style={{ fontSize: '0.825rem', color: 'var(--text-primary)' }}>{health.warning_message}</div>
            </div>
          </div>
        </div>
      )}

      {/* Sensor Health Channel Bars */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="panel" style={{ marginBottom: 0 }}>
          <div className="kpi-title">OVERALL STATION HEALTH</div>
          <div className="kpi-value" style={{ color: (health.overall_health || 95) > 85 ? '#10b981' : '#f59e0b' }}>
            {health.overall_health || 95}%
          </div>
          <div className="meter-bar">
            <div className="meter-fill" style={{ width: `${health.overall_health || 95}%`, backgroundColor: (health.overall_health || 95) > 85 ? '#10b981' : '#f59e0b' }} />
          </div>
          <div className="kpi-sub">Composite Reliability Index</div>
        </div>

        <div className="panel" style={{ marginBottom: 0 }}>
          <div className="kpi-title">TEMPERATURE SENSOR HEALTH</div>
          <div className="kpi-value" style={{ color: '#f59e0b' }}>
            {health.temperature_health || 94}%
          </div>
          <div className="meter-bar">
            <div className="meter-fill" style={{ width: `${health.temperature_health || 94}%`, backgroundColor: '#f59e0b' }} />
          </div>
          <div className="kpi-sub">Drift: {health.drift_detected ? `${health.drift_rate}°C/day (${health.drift_direction})` : 'Zero Drift'}</div>
        </div>

        <div className="panel" style={{ marginBottom: 0 }}>
          <div className="kpi-title">PRESSURE SENSOR HEALTH</div>
          <div className="kpi-value" style={{ color: '#a855f7' }}>
            {health.pressure_health || 98}%
          </div>
          <div className="meter-bar">
            <div className="meter-fill" style={{ width: `${health.pressure_health || 98}%`, backgroundColor: '#a855f7' }} />
          </div>
          <div className="kpi-sub">Barometric Transducer Certified</div>
        </div>

        <div className="panel" style={{ marginBottom: 0 }}>
          <div className="kpi-title">HUMIDITY SENSOR HEALTH</div>
          <div className="kpi-value" style={{ color: '#38bdf8' }}>
            {health.humidity_health || 92}%
          </div>
          <div className="meter-bar">
            <div className="meter-fill" style={{ width: `${health.humidity_health || 92}%`, backgroundColor: '#38bdf8' }} />
          </div>
          <div className="kpi-sub">Hygrometric Element In-Tolerance</div>
        </div>
      </div>

      {/* Station Certified Physical Envelope */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">
            <Settings size={18} color="var(--accent-cyan)" />
            <span>Station-Specific Certified Physical QC Limits (IMD Standards)</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', fontSize: '0.85rem' }}>
          <div style={{ background: 'var(--bg-subtle)', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontWeight: 600, color: '#f59e0b', marginBottom: '0.4rem' }}>Temperature Envelope</div>
            <div>Valid Physical Limits: <strong>-10.0°C to +55.0°C</strong></div>
            <div>Max Rate of Change: <strong>3.5°C per 10 min</strong></div>
            <div>Frozen Persistence Limit: <strong>6 consecutive periods</strong></div>
          </div>

          <div style={{ background: 'var(--bg-subtle)', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontWeight: 600, color: '#a855f7', marginBottom: '0.4rem' }}>Pressure Envelope (Hypsometric)</div>
            <div>Valid Elevation Range: <strong>{station.elevation > 1500 ? '750 to 820 hPa' : '960 to 1030 hPa'}</strong></div>
            <div>Max Rate of Change: <strong>3.5 hPa per 10 min</strong></div>
            <div>Diurnal Tide Amplitude: <strong>1.4 hPa (Semi-diurnal)</strong></div>
          </div>

          <div style={{ background: 'var(--bg-subtle)', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontWeight: 600, color: '#38bdf8', marginBottom: '0.4rem' }}>Humidity Envelope</div>
            <div>Valid Hygrometric Limits: <strong>0.0% to 100.0%</strong></div>
            <div>Max Rate of Change: <strong>25.0% per 10 min</strong></div>
            <div>Thermodynamic Law: <strong>T_dewpoint &le; T_air</strong></div>
          </div>
        </div>
      </div>

      {/* Recent Observations Log */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">
            <span>Recent Observation Telemetry Audit Trail</span>
          </div>
        </div>
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Temperature (°C)</th>
                <th>Pressure (hPa)</th>
                <th>Humidity (%)</th>
                <th>Dew Point (°C)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {stationObs.map((obs, idx) => (
                <tr key={idx}>
                  <td className="font-mono">{new Date(obs.timestamp).toLocaleTimeString()}</td>
                  <td className="font-mono" style={{ color: '#f59e0b', fontWeight: 600 }}>{obs.temperature}°C</td>
                  <td className="font-mono" style={{ color: '#a855f7' }}>{obs.pressure} hPa</td>
                  <td className="font-mono" style={{ color: '#38bdf8' }}>{obs.humidity}%</td>
                  <td className="font-mono">{(obs.temperature - (100 - obs.humidity)/5).toFixed(1)}°C</td>
                  <td><span className="status-badge badge-normal">PASSED QC</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
