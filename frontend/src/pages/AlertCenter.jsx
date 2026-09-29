import React, { useState } from 'react';
import { StatusBadge } from '../components/StatusBadge';
import { AlertTriangle, Filter, CheckCircle, Search, ExternalLink } from 'lucide-react';

export function AlertCenter({ anomalies, stations, onInspectExplanation }) {
  const [stationFilter, setStationFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [acknowledged, setAcknowledged] = useState({});

  const filtered = anomalies.filter(e => {
    if (stationFilter && e.station_id !== stationFilter) return false;
    if (severityFilter && e.severity !== severityFilter) return false;
    if (classFilter && e.classification !== classFilter) return false;
    return true;
  });

  const toggleAck = (id) => {
    setAcknowledged(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div>
      {/* Header and Filter Controls */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">
            <AlertTriangle size={18} color="#f59e0b" />
            <span>Operational Alert Center — Quality Control & Fault Incidents</span>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Showing {filtered.length} of {anomalies.length} recorded events
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          <div>
            <label className="form-label">Filter by Station</label>
            <select
              className="form-select"
              value={stationFilter}
              onChange={(e) => setStationFilter(e.target.value)}
            >
              <option value="">All AWS Stations</option>
              {stations.map(s => (
                <option key={s.station_id} value={s.station_id}>{s.station_id} — {s.station_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Filter by Severity</label>
            <select
              className="form-select"
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
            >
              <option value="">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <div>
            <label className="form-label">Filter by Classification</label>
            <select
              className="form-select"
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
            >
              <option value="">All Classifications</option>
              <option value="SENSOR_ANOMALY">Sensor Anomaly</option>
              <option value="GENUINE_WEATHER_EVENT">Genuine Weather Event</option>
              <option value="DATA_QUALITY_ISSUE">Data Quality Issue</option>
              <option value="UNCERTAIN">Uncertain / Ambiguous</option>
            </select>
          </div>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="panel">
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Incident ID</th>
                <th>Time (UTC)</th>
                <th>Station</th>
                <th>Parameter</th>
                <th>Reported Value</th>
                <th>Classification</th>
                <th>Root Cause</th>
                <th>Severity</th>
                <th>Confidence</th>
                <th>Action Taken</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="11" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No incident records match the active filter criteria.
                  </td>
                </tr>
              ) : (
                filtered.map(e => (
                  <tr key={e.id} style={{ opacity: acknowledged[e.id] ? 0.5 : 1 }}>
                    <td className="font-mono">#EV-{String(e.id).padStart(4, '0')}</td>
                    <td className="font-mono" style={{ fontSize: '0.75rem' }}>
                      {new Date(e.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="font-mono" style={{ fontWeight: 600 }}>{e.station_id}</td>
                    <td style={{ textTransform: 'capitalize' }}>{e.parameter || 'temperature'}</td>
                    <td className="font-mono" style={{ fontWeight: 600, color: '#f59e0b' }}>
                      {e.raw_value !== null ? `${e.raw_value}°C` : 'MISSING'}
                    </td>
                    <td>
                      <StatusBadge status={e.classification} />
                    </td>
                    <td style={{ fontWeight: 500 }}>{e.root_cause.replace(/_/g, ' ')}</td>
                    <td>
                      <StatusBadge status={e.severity} />
                    </td>
                    <td className="font-mono">{Math.round(e.confidence * 100)}%</td>
                    <td>
                      <button
                        className={`btn ${acknowledged[e.id] ? 'btn-secondary' : 'btn-success'}`}
                        style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
                        onClick={() => toggleAck(e.id)}
                      >
                        {acknowledged[e.id] ? 'Acked' : 'Acknowledge'}
                      </button>
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary"
                        style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
                        onClick={() => onInspectExplanation(e)}
                      >
                        <ExternalLink size={12} />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
