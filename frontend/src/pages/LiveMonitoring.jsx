import React, { useState } from 'react';
import { StatusBadge } from '../components/StatusBadge';
import { Thermometer, Gauge, Droplets, Activity, ShieldAlert, CheckCircle, HelpCircle } from 'lucide-react';

export function LiveMonitoring({ stations, lastTick, observations, selectedStationId, onSelectStation }) {
  const currentStation = stations.find(s => s.station_id === selectedStationId) || stations[0] || {};
  const currentObs = (lastTick?.observation?.station_id === selectedStationId ? lastTick.observation : null) 
    || currentStation.last_observation 
    || { temperature: 31.5, pressure: 998.2, humidity: 48.0, timestamp: new Date().toISOString() };

  const fusion = (lastTick?.observation?.station_id === selectedStationId ? lastTick.fusion : null) 
    || {
      classification: 'NORMAL',
      root_cause: 'NORMAL',
      severity: 'NORMAL',
      confidence: 0.92,
      final_anomaly_score: 0.12,
      sensor_fault_probability: 0.04,
      weather_event_probability: 0.05,
      uncertainty_score: 0.15,
      recommended_action: 'Sensor operating within certified WMO/IMD envelope.'
    };

  const explain = (lastTick?.observation?.station_id === selectedStationId ? lastTick.explainability : null);
  const physics = (lastTick?.observation?.station_id === selectedStationId ? lastTick.physics : null);
  const corrections = (lastTick?.observation?.station_id === selectedStationId ? lastTick.corrections : {});

  // Recent 20 observations for chart
  const stationObs = observations.filter(o => o.station_id === selectedStationId).slice(-20);

  return (
    <div>
      {/* Station Selector Bar */}
      <div className="panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>ACTIVE STATION:</span>
          <select
            className="form-select"
            style={{ width: '280px', padding: '0.4rem 0.75rem' }}
            value={selectedStationId}
            onChange={(e) => onSelectStation(e.target.value)}
          >
            {stations.map(s => (
              <option key={s.station_id} value={s.station_id}>
                {s.station_id} — {s.station_name} ({s.climate_zone})
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.825rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Elevation: <strong style={{ color: 'var(--text-primary)' }}>{currentStation.elevation || 216} m</strong></span>
          <span>•</span>
          <span style={{ color: 'var(--text-muted)' }}>Last Telemetry Packet: <strong className="font-mono" style={{ color: 'var(--text-primary)' }}>{new Date(currentObs.timestamp).toLocaleTimeString()}</strong></span>
        </div>
      </div>

      {/* Main Meteorological Channel Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {/* Temperature Card */}
        <div className="panel" style={{ borderLeft: '4px solid #f59e0b', marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>AIR TEMPERATURE</span>
            <Thermometer size={18} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#f59e0b' }}>
            {currentObs.temperature !== null ? `${currentObs.temperature}°C` : 'MISSING'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
            <span>Diurnal Baseline: ~32.0°C</span>
            <span>Rate: ±0.3°C/10m</span>
          </div>
          {corrections?.temperature && (
            <div style={{ marginTop: '0.5rem', padding: '0.35rem 0.5rem', background: 'rgba(14, 165, 233, 0.1)', borderRadius: '4px', fontSize: '0.725rem', color: '#38bdf8' }}>
              Non-destructive Corrected: <strong>{corrections.temperature.corrected_value}°C</strong> ({corrections.temperature.correction_method})
            </div>
          )}
        </div>

        {/* Pressure Card */}
        <div className="panel" style={{ borderLeft: '4px solid #a855f7', marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>ATMOSPHERIC PRESSURE</span>
            <Gauge size={18} color="#a855f7" />
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#a855f7' }}>
            {currentObs.pressure !== null ? `${currentObs.pressure} hPa` : 'MISSING'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
            <span>Atmospheric Tide: ~1001 hPa</span>
            <span>Elevation Adjusted</span>
          </div>
        </div>

        {/* Humidity Card */}
        <div className="panel" style={{ borderLeft: '4px solid #38bdf8', marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>RELATIVE HUMIDITY</span>
            <Droplets size={18} color="#38bdf8" />
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>
            {currentObs.humidity !== null ? `${currentObs.humidity}%` : 'MISSING'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
            <span>Dew Point T_d: {physics?.dew_point ? `${physics.dew_point}°C` : '~18.4°C'}</span>
            <span>T - T_d: {physics?.dew_point_depression ? `${physics.dew_point_depression}°C` : '~12.1°C'}</span>
          </div>
        </div>
      </div>

      {/* AI Decision Intelligence Panel */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">
            <Activity size={18} color="var(--accent-cyan)" />
            <span>AI Multi-Engine Synthesis & Root-Cause Assessment</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <StatusBadge status={fusion.classification} />
            <StatusBadge status={fusion.severity} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ background: 'var(--bg-subtle)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>FINAL ANOMALY SCORE</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: fusion.final_anomaly_score > 0.6 ? '#ef4444' : '#10b981' }}>
              {Math.round(fusion.final_anomaly_score * 100)}%
            </div>
            <div className="meter-bar">
              <div className="meter-fill" style={{ width: `${Math.round(fusion.final_anomaly_score * 100)}%`, backgroundColor: fusion.final_anomaly_score > 0.6 ? '#ef4444' : '#10b981' }} />
            </div>
          </div>

          <div style={{ background: 'var(--bg-subtle)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>SENSOR FAULT PROBABILITY</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#f59e0b' }}>
              {Math.round(fusion.sensor_fault_probability * 100)}%
            </div>
            <div className="meter-bar">
              <div className="meter-fill" style={{ width: `${Math.round(fusion.sensor_fault_probability * 100)}%`, backgroundColor: '#f59e0b' }} />
            </div>
          </div>

          <div style={{ background: 'var(--bg-subtle)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>WEATHER EVENT PROBABILITY</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#0ea5e9' }}>
              {Math.round(fusion.weather_event_probability * 100)}%
            </div>
            <div className="meter-bar">
              <div className="meter-fill" style={{ width: `${Math.round(fusion.weather_event_probability * 100)}%`, backgroundColor: '#0ea5e9' }} />
            </div>
          </div>

          <div style={{ background: 'var(--bg-subtle)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>UNCERTAINTY SCORE</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#a855f7' }}>
              {Math.round(fusion.uncertainty_score * 100)}%
            </div>
            <div className="meter-bar">
              <div className="meter-fill" style={{ width: `${Math.round(fusion.uncertainty_score * 100)}%`, backgroundColor: '#a855f7' }} />
            </div>
          </div>
        </div>

        {/* Action and Reasoning Box */}
        <div style={{ background: 'var(--bg-subtle)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-bright)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              ROOT CAUSE CLASSIFICATION: {fusion.root_cause.replace(/_/g, ' ')} (CONFIDENCE: {Math.round(fusion.confidence * 100)}%)
            </span>
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '0.5rem', fontWeight: 500 }}>
            {explain?.summary || "Nominal operation. Sensor telemetry adheres to standard IMD/WMO physical limits."}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <strong>RECOMMENDED OPERATOR ACTION:</strong> {fusion.recommended_action}
          </div>
        </div>
      </div>

      {/* Real-time Telemetry Trend Visualization */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">
            <Activity size={18} color="var(--accent-cyan)" />
            <span>Telemetry History Stream (Last 20 Intervals)</span>
          </div>
          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem' }}>
            <span style={{ color: '#f59e0b' }}>● Temperature (°C)</span>
            <span style={{ color: '#a855f7' }}>● Pressure (hPa/10)</span>
            <span style={{ color: '#38bdf8' }}>● Humidity (%)</span>
          </div>
        </div>

        <div style={{ height: '220px', width: '100%', position: 'relative' }}>
          <svg style={{ width: '100%', height: '100%' }}>
            {/* Grid lines */}
            <line x1="0" y1="25%" x2="100%" y2="25%" stroke="rgba(255,255,255,0.06)" />
            <line x1="0" y1="50%" x2="100%" y2="50%" stroke="rgba(255,255,255,0.06)" />
            <line x1="0" y1="75%" x2="100%" y2="75%" stroke="rgba(255,255,255,0.06)" />

            {/* Sparklines */}
            {stationObs.length > 1 && (
              <>
                {/* Temperature Line (Orange) */}
                <polyline
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2.5"
                  points={stationObs.map((pt, idx) => {
                    const x = (idx / (stationObs.length - 1)) * 100;
                    const y = 100 - ((pt.temperature - 10) / 45) * 100;
                    return `${x}%,${Math.max(5, Math.min(95, y))}%`;
                  }).join(' ')}
                />
                {/* Humidity Line (Blue) */}
                <polyline
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2"
                  points={stationObs.map((pt, idx) => {
                    const x = (idx / (stationObs.length - 1)) * 100;
                    const y = 100 - (pt.humidity / 100) * 100;
                    return `${x}%,${Math.max(5, Math.min(95, y))}%`;
                  }).join(' ')}
                />
              </>
            )}
          </svg>
        </div>
      </div>
    </div>
  );
}
