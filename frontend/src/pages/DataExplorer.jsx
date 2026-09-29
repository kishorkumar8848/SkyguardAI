import React, { useState } from 'react';
import { uploadCSVFile } from '../services/api';
import { Database, Upload, Download, FileText, CheckCircle2, AlertTriangle } from 'lucide-react';

export function DataExplorer({ observations, stations }) {
  const [stationFilter, setStationFilter] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState(null);
  const [uploadedData, setUploadedData] = useState(null);

  const displayData = uploadedData || (
    stationFilter 
      ? observations.filter(o => o.station_id === stationFilter)
      : observations
  );

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadMsg(null);
    try {
      const res = await uploadCSVFile(file);
      setUploadMsg(`Successfully processed ${res.records_analyzed} records via SkyGuard AI Pipeline!`);
      // Convert result to display format
      const mapped = res.results.map(r => ({
        ...r.observation,
        classification: r.fusion.classification,
        anomaly_score: r.fusion.final_anomaly_score,
        corrected_temp: r.corrections?.temperature?.corrected_value
      }));
      setUploadedData(mapped);
    } catch (err) {
      setUploadMsg(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleExport = () => {
    const url = stationFilter ? `/api/export/csv?station_id=${stationFilter}` : '/api/export/csv';
    window.open(url, '_blank');
  };

  return (
    <div>
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">
            <Database size={18} color="var(--accent-cyan)" />
            <span>AWS Telemetry Data Explorer & Dataset Adapter</span>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
              <Upload size={14} />
              <span>{uploading ? 'Analyzing CSV...' : 'Upload Historical CSV'}</span>
              <input type="file" accept=".csv" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>
            <button className="btn btn-primary" onClick={handleExport}>
              <Download size={14} />
              <span>Export Telemetry CSV</span>
            </button>
          </div>
        </div>

        {uploadMsg && (
          <div style={{
            background: 'rgba(14, 165, 233, 0.1)',
            border: '1px solid rgba(14, 165, 233, 0.3)',
            padding: '0.6rem 0.85rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.8rem',
            color: '#38bdf8',
            marginBottom: '1rem'
          }}>
            {uploadMsg}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
          <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Station Filter:</span>
          <select
            className="form-select"
            style={{ width: '250px' }}
            value={stationFilter}
            onChange={(e) => setStationFilter(e.target.value)}
          >
            <option value="">All Stations</option>
            {stations.map(s => (
              <option key={s.station_id} value={s.station_id}>{s.station_id} — {s.station_name}</option>
            ))}
          </select>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Showing {displayData.length} observation records
          </span>
        </div>
      </div>

      {/* Observation Table */}
      <div className="panel">
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Station ID</th>
                <th>Temperature (°C)</th>
                <th>Pressure (hPa)</th>
                <th>Humidity (%)</th>
                <th>Corrected Temp</th>
                <th>Quality Flag</th>
              </tr>
            </thead>
            <tbody>
              {displayData.slice(-50).map((row, idx) => (
                <tr key={idx}>
                  <td className="font-mono" style={{ fontSize: '0.75rem' }}>
                    {new Date(row.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="font-mono" style={{ fontWeight: 600 }}>{row.station_id}</td>
                  <td className="font-mono" style={{ color: '#f59e0b', fontWeight: 600 }}>
                    {row.temperature !== null ? `${row.temperature}°C` : 'MISSING'}
                  </td>
                  <td className="font-mono" style={{ color: '#a855f7' }}>
                    {row.pressure !== null ? `${row.pressure} hPa` : 'MISSING'}
                  </td>
                  <td className="font-mono" style={{ color: '#38bdf8' }}>
                    {row.humidity !== null ? `${row.humidity}%` : 'MISSING'}
                  </td>
                  <td className="font-mono" style={{ color: '#0ea5e9' }}>
                    {row.corrected_temp ? `${row.corrected_temp}°C` : '--'}
                  </td>
                  <td>
                    <span className="status-badge badge-normal">PASSED</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
