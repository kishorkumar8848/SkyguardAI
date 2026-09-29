import React, { useState } from 'react';
import {
  Thermometer,
  Droplets,
  Gauge,
  AlertTriangle,
  Zap,
  BarChart3,
  HeartPulse,
  Database,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Cpu,
  Clock,
  ArrowRight
} from 'lucide-react';
import { StationNetworkMap } from '../components/StationNetworkMap';

export function Overview({ stations = [], anomalies = [], lastTick, onSelectStation, onNavigateTab }) {
  const [dataTrendRange, setDataTrendRange] = useState('7d');

  // Compute live aggregates or fallback to calibrated demo figures
  const totalStations = stations.length || 6;
  const healthyCount = stations.filter(s => s.status === 'HEALTHY').length || 4;
  const warningCount = stations.filter(s => s.status === 'WARNING').length || 1;
  const criticalCount = stations.filter(s => s.status === 'CRITICAL' || s.status === 'ANOMALOUS').length || 1;

  const currentTemp = lastTick?.observation?.temperature?.toFixed(1) || "32.6";
  const currentHumidity = lastTick?.observation?.humidity?.toFixed(1) || "58.4";
  const currentPressure = lastTick?.observation?.pressure?.toFixed(1) || "1007.2";

  // Recent anomaly records matching IMD console standard
  const recentEvents = [
    { time: '28 Sep 10:15', station: 'Mumbai', param: 'Temperature', type: 'Spike', severity: 'High', conf: '94%', status: 'Investigating' },
    { time: '28 Sep 09:42', station: 'Kolkata', param: 'Humidity', type: 'Drift', severity: 'Medium', conf: '87%', status: 'Monitoring' },
    { time: '28 Sep 08:11', station: 'New Delhi', param: 'Pressure', type: 'Inconsistency', severity: 'Medium', conf: '82%', status: 'Resolved' },
    { time: '28 Sep 07:33', station: 'Bhopal', param: 'Temperature', type: 'Frozen', severity: 'High', conf: '91%', status: 'Resolved' },
  ];

  return (
    <div className="overview-console-grid">
      {/* ========================================================================= */}
      {/* ROW 1: 5 HIGH-LEVEL KPI STAT CARDS                                         */}
      {/* ========================================================================= */}
      <div className="kpi-top-row">
        {/* Card 1: Active Stations */}
        <div className="kpi-stat-card card-blue">
          <div className="kpi-top-meta">
            <div className="kpi-icon-pill icon-blue">
              <Database size={18} />
            </div>
            <div className="kpi-values-wrap">
              <div className="kpi-big-number font-mono">{totalStations}</div>
              <div className="kpi-label">Active Stations</div>
            </div>
          </div>
          <div className="kpi-bottom-meta">
            <span className="kpi-subtext">0 Healthy • 0 Warning</span>
            {/* Mini Bar Equalizer Graphic */}
            <div className="mini-bars-graphic">
              <span style={{ height: '40%' }}></span>
              <span style={{ height: '70%' }}></span>
              <span style={{ height: '100%' }}></span>
              <span style={{ height: '55%' }}></span>
              <span style={{ height: '85%' }}></span>
            </div>
          </div>
        </div>

        {/* Card 2: Network Sensor Health */}
        <div className="kpi-stat-card card-green">
          <div className="kpi-top-meta">
            <div className="kpi-icon-pill icon-green">
              <HeartPulse size={18} />
            </div>
            <div className="kpi-values-wrap">
              <div className="kpi-big-number font-mono" style={{ color: '#10b981' }}>94%</div>
              <div className="kpi-label">Network Sensor Health</div>
            </div>
          </div>
          {/* Smooth Green Neon Sparkline */}
          <div className="kpi-sparkline-wrap">
            <svg viewBox="0 0 160 30" fill="none" className="sparkline-svg">
              <path d="M0 22 Q 25 15, 50 18 T 100 10 T 140 14 T 160 8" stroke="#10b981" strokeWidth="2.5" fill="none" />
              <path d="M0 22 Q 25 15, 50 18 T 100 10 T 140 14 T 160 8 L 160 30 L 0 30 Z" fill="url(#greenGlowGrad)" opacity="0.25" />
              <defs>
                <linearGradient id="greenGlowGrad" x1="0" y1="0" x2="0" y2="30" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#10b981" />
                  <stop offset="1" stopColor="#10b981" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="kpi-bottom-meta">
            <span className="kpi-subtext">24h EWMA Aggregate</span>
          </div>
        </div>

        {/* Card 3: Active Anomaly Events */}
        <div className="kpi-stat-card card-red">
          <div className="kpi-top-meta">
            <div className="kpi-icon-pill icon-red">
              <AlertTriangle size={18} />
            </div>
            <div className="kpi-values-wrap">
              <div className="kpi-big-number font-mono" style={{ color: '#ef4444' }}>0</div>
              <div className="kpi-label">Active Anomaly Events</div>
            </div>
          </div>
          {/* Smooth Red Sparkline */}
          <div className="kpi-sparkline-wrap">
            <svg viewBox="0 0 160 30" fill="none" className="sparkline-svg">
              <path d="M0 25 Q 30 20, 60 22 T 110 14 T 140 20 T 160 12" stroke="#ef4444" strokeWidth="2.5" fill="none" />
              <path d="M0 25 Q 30 20, 60 22 T 110 14 T 140 20 T 160 12 L 160 30 L 0 30 Z" fill="url(#redGlowGrad)" opacity="0.2" />
              <defs>
                <linearGradient id="redGlowGrad" x1="0" y1="0" x2="0" y2="30" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#ef4444" />
                  <stop offset="1" stopColor="#ef4444" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="kpi-bottom-meta">
            <span className="kpi-subtext">Sensor faults & physical violations</span>
          </div>
        </div>

        {/* Card 4: Avg Inference Latency */}
        <div className="kpi-stat-card card-purple">
          <div className="kpi-top-meta">
            <div className="kpi-icon-pill icon-purple">
              <Zap size={18} />
            </div>
            <div className="kpi-values-wrap">
              <div className="kpi-big-number font-mono" style={{ color: '#a855f7' }}>
                6.8 <span className="kpi-unit">ms</span>
              </div>
              <div className="kpi-label">Avg Inference Latency</div>
            </div>
          </div>
          {/* Smooth Purple Sparkline */}
          <div className="kpi-sparkline-wrap">
            <svg viewBox="0 0 160 30" fill="none" className="sparkline-svg">
              <path d="M0 20 Q 30 16, 65 18 T 115 8 T 145 16 T 160 10" stroke="#a855f7" strokeWidth="2.5" fill="none" />
              <path d="M0 20 Q 30 16, 65 18 T 115 8 T 145 16 T 160 10 L 160 30 L 0 30 Z" fill="url(#purpleGlowGrad)" opacity="0.2" />
              <defs>
                <linearGradient id="purpleGlowGrad" x1="0" y1="0" x2="0" y2="30" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#a855f7" />
                  <stop offset="1" stopColor="#a855f7" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="kpi-bottom-meta">
            <span className="kpi-subtext">Target: &lt;100ms</span>
          </div>
        </div>

        {/* Card 5: Data Quality Rate */}
        <div className="kpi-stat-card card-teal">
          <div className="kpi-top-meta">
            <div className="kpi-icon-pill icon-teal">
              <ShieldCheck size={18} />
            </div>
            <div className="kpi-values-wrap">
              <div className="kpi-big-number font-mono" style={{ color: '#06b6d4' }}>99.4%</div>
              <div className="kpi-label">Data Quality Rate</div>
            </div>
          </div>
          <div className="kpi-bottom-meta">
            <span className="kpi-subtext">IMD certified completeness</span>
            {/* Equalizer Wave bars */}
            <div className="mini-bars-graphic teal-bars">
              <span style={{ height: '70%' }}></span>
              <span style={{ height: '85%' }}></span>
              <span style={{ height: '95%' }}></span>
              <span style={{ height: '75%' }}></span>
              <span style={{ height: '90%' }}></span>
              <span style={{ height: '100%' }}></span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ROW 2: MAIN OPERATIONAL CENTER (MAP ON LEFT, TELEMETRY & ALERTS ON RIGHT)   */}
      {/* ========================================================================= */}
      <div className="middle-ops-row">
        {/* Left Column: Interactive Map */}
        <div className="ops-left-map-col">
          <StationNetworkMap 
            stations={stations} 
            onSelectStation={onSelectStation}
            onNavigateTab={onNavigateTab}
          />
        </div>

        {/* Right Column: Live Readings + Recent Anomaly Events */}
        <div className="ops-right-data-col">
          {/* Top Panel: Live Sensor Readings (Network Aggregate) */}
          <div className="console-panel live-readings-panel">
            <div className="panel-title-bar">
              <div className="title-with-icon">
                <Zap size={16} color="#0ea5e9" />
                <span className="panel-heading">Live Sensor Readings (Network Aggregate)</span>
              </div>
              <span className="live-realtime-pill">
                <span className="pulse-dot"></span>
                <span>Real-time</span>
              </span>
            </div>

            {/* 3 Telemetry Metric Cards */}
            <div className="readings-grid-3">
              {/* Temperature Card */}
              <div className="reading-mini-card">
                <div className="reading-header">
                  <div className="reading-icon-wrap icon-temp">
                    <Thermometer size={16} />
                  </div>
                  <span className="reading-param-name">Temperature</span>
                </div>
                <div className="reading-metric-row">
                  <span className="reading-big-val font-mono">{currentTemp} <small>°C</small></span>
                  <span className="reading-delta-pill delta-down">
                    <TrendingDown size={12} /> 0.8°C
                  </span>
                </div>
                {/* Cyan Sparkline Chart with time labels */}
                <div className="reading-wave-wrap">
                  <svg viewBox="0 0 180 34" fill="none" className="wave-svg">
                    <path d="M0 24 Q 30 18, 60 22 T 110 10 T 150 16 T 180 12" stroke="#38bdf8" strokeWidth="2.5" fill="none" />
                    <path d="M0 24 Q 30 18, 60 22 T 110 10 T 150 16 T 180 12 L 180 34 L 0 34 Z" fill="url(#cyanArea)" opacity="0.2" />
                    <defs>
                      <linearGradient id="cyanArea" x1="0" y1="0" x2="0" y2="34" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#38bdf8" />
                        <stop offset="1" stopColor="#38bdf8" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="wave-time-ticks">
                    <span>06:00</span>
                    <span>12:00</span>
                    <span>18:00</span>
                    <span>00:00</span>
                  </div>
                </div>
              </div>

              {/* Humidity Card */}
              <div className="reading-mini-card">
                <div className="reading-header">
                  <div className="reading-icon-wrap icon-humidity">
                    <Droplets size={16} />
                  </div>
                  <span className="reading-param-name">Humidity</span>
                </div>
                <div className="reading-metric-row">
                  <span className="reading-big-val font-mono">{currentHumidity} <small>%</small></span>
                  <span className="reading-delta-pill delta-up-green">
                    <TrendingUp size={12} /> 1.2%
                  </span>
                </div>
                {/* Green Sparkline Chart with time labels */}
                <div className="reading-wave-wrap">
                  <svg viewBox="0 0 180 34" fill="none" className="wave-svg">
                    <path d="M0 22 Q 35 28, 70 20 T 120 12 T 155 18 T 180 14" stroke="#10b981" strokeWidth="2.5" fill="none" />
                    <path d="M0 22 Q 35 28, 70 20 T 120 12 T 155 18 T 180 14 L 180 34 L 0 34 Z" fill="url(#greenArea)" opacity="0.2" />
                    <defs>
                      <linearGradient id="greenArea" x1="0" y1="0" x2="0" y2="34" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#10b981" />
                        <stop offset="1" stopColor="#10b981" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="wave-time-ticks">
                    <span>06:00</span>
                    <span>12:00</span>
                    <span>18:00</span>
                    <span>00:00</span>
                  </div>
                </div>
              </div>

              {/* Pressure Card */}
              <div className="reading-mini-card">
                <div className="reading-header">
                  <div className="reading-icon-wrap icon-pressure">
                    <Gauge size={16} />
                  </div>
                  <span className="reading-param-name">Pressure</span>
                </div>
                <div className="reading-metric-row">
                  <span className="reading-big-val font-mono">{currentPressure} <small>hPa</small></span>
                  <span className="reading-delta-pill delta-up-red">
                    <TrendingUp size={12} /> 0.3 hPa
                  </span>
                </div>
                {/* Amber / Gold Sparkline Chart with time labels */}
                <div className="reading-wave-wrap">
                  <svg viewBox="0 0 180 34" fill="none" className="wave-svg">
                    <path d="M0 16 Q 40 22, 80 18 T 130 14 T 160 20 T 180 16" stroke="#f59e0b" strokeWidth="2.5" fill="none" />
                    <path d="M0 16 Q 40 22, 80 18 T 130 14 T 160 20 T 180 16 L 180 34 L 0 34 Z" fill="url(#amberArea)" opacity="0.2" />
                    <defs>
                      <linearGradient id="amberArea" x1="0" y1="0" x2="0" y2="34" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#f59e0b" />
                        <stop offset="1" stopColor="#f59e0b" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="wave-time-ticks">
                    <span>06:00</span>
                    <span>12:00</span>
                    <span>18:00</span>
                    <span>00:00</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Panel: Recent Anomaly Events Table */}
          <div className="console-panel recent-anomalies-panel">
            <div className="panel-title-bar">
              <div className="title-with-icon">
                <AlertTriangle size={16} color="#ef4444" />
                <span className="panel-heading">Recent Anomaly Events</span>
              </div>
              <button 
                className="panel-link-btn"
                onClick={() => onNavigateTab && onNavigateTab('alerts')}
              >
                View All
              </button>
            </div>

            <div className="table-responsive-wrapper">
              <table className="console-data-table">
                <thead>
                  <tr>
                    <th>TIME</th>
                    <th>STATION</th>
                    <th>PARAMETER</th>
                    <th>TYPE</th>
                    <th>SEVERITY</th>
                    <th>CONFIDENCE</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {recentEvents.map((evt, idx) => (
                    <tr key={idx}>
                      <td className="font-mono text-muted">{evt.time}</td>
                      <td className="font-semibold text-white">{evt.station}</td>
                      <td>{evt.param}</td>
                      <td>
                        <span className="anomaly-type-text">{evt.type}</span>
                      </td>
                      <td>
                        <span className={`severity-tag tag-${evt.severity.toLowerCase()}`}>
                          {evt.severity}
                        </span>
                      </td>
                      <td className="font-mono text-white">{evt.conf}</td>
                      <td>
                        <span className={`status-tag status-${evt.status.toLowerCase()}`}>
                          {evt.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ROW 3: 3 BOTTOM ANALYTICS PANELS                                          */}
      {/* ========================================================================= */}
      <div className="bottom-analytics-row">
        {/* Panel 1: Model Performance (4 Donut Progress Rings) */}
        <div className="console-panel bottom-panel-card">
          <div className="panel-title-bar">
            <div className="title-with-icon">
              <BarChart3 size={16} color="#0ea5e9" />
              <span className="panel-heading">Model Performance</span>
            </div>
            <button 
              className="panel-link-btn"
              onClick={() => onNavigateTab && onNavigateTab('models')}
            >
              View Details
            </button>
          </div>

          <div className="radial-metrics-row">
            {/* Donut 1: Precision */}
            <div className="radial-metric-item">
              <div className="radial-ring-box">
                <svg viewBox="0 0 72 72" className="radial-svg">
                  <circle cx="36" cy="36" r="30" stroke="#1e293b" strokeWidth="5.5" fill="none" />
                  <circle 
                    cx="36" cy="36" r="30" 
                    stroke="#0ea5e9" strokeWidth="5.5" fill="none" 
                    strokeDasharray="188.5" strokeDashoffset="7.5"
                    strokeLinecap="round"
                    transform="rotate(-90 36 36)"
                  />
                </svg>
                <div className="radial-center-val font-mono">96%</div>
              </div>
              <span className="radial-label">Precision</span>
            </div>

            {/* Donut 2: Recall */}
            <div className="radial-metric-item">
              <div className="radial-ring-box">
                <svg viewBox="0 0 72 72" className="radial-svg">
                  <circle cx="36" cy="36" r="30" stroke="#1e293b" strokeWidth="5.5" fill="none" />
                  <circle 
                    cx="36" cy="36" r="30" 
                    stroke="#06b6d4" strokeWidth="5.5" fill="none" 
                    strokeDasharray="188.5" strokeDashoffset="17.0"
                    strokeLinecap="round"
                    transform="rotate(-90 36 36)"
                  />
                </svg>
                <div className="radial-center-val font-mono">91%</div>
              </div>
              <span className="radial-label">Recall</span>
            </div>

            {/* Donut 3: F1-Score */}
            <div className="radial-metric-item">
              <div className="radial-ring-box">
                <svg viewBox="0 0 72 72" className="radial-svg">
                  <circle cx="36" cy="36" r="30" stroke="#1e293b" strokeWidth="5.5" fill="none" />
                  <circle 
                    cx="36" cy="36" r="30" 
                    stroke="#38bdf8" strokeWidth="5.5" fill="none" 
                    strokeDasharray="188.5" strokeDashoffset="13.2"
                    strokeLinecap="round"
                    transform="rotate(-90 36 36)"
                  />
                </svg>
                <div className="radial-center-val font-mono">93%</div>
              </div>
              <span className="radial-label">F1-Score</span>
            </div>

            {/* Donut 4: False Positive Rate */}
            <div className="radial-metric-item">
              <div className="radial-ring-box">
                <svg viewBox="0 0 72 72" className="radial-svg">
                  <circle cx="36" cy="36" r="30" stroke="#1e293b" strokeWidth="5.5" fill="none" />
                  <circle 
                    cx="36" cy="36" r="30" 
                    stroke="#10b981" strokeWidth="5.5" fill="none" 
                    strokeDasharray="188.5" strokeDashoffset="186.5"
                    strokeLinecap="round"
                    transform="rotate(-90 36 36)"
                  />
                </svg>
                <div className="radial-center-val font-mono">0.8%</div>
              </div>
              <span className="radial-label">False Positive Rate</span>
            </div>
          </div>
        </div>

        {/* Panel 2: Sensor Health Distribution (Donut Chart) */}
        <div className="console-panel bottom-panel-card">
          <div className="panel-title-bar">
            <div className="title-with-icon">
              <HeartPulse size={16} color="#10b981" />
              <span className="panel-heading">Sensor Health Distribution</span>
            </div>
          </div>

          <div className="donut-distribution-row">
            {/* SVG Multi-Colored Donut */}
            <div className="donut-chart-container">
              <svg viewBox="0 0 110 110" className="donut-chart-svg">
                {/* Background Ring */}
                <circle cx="55" cy="55" r="42" stroke="#1e293b" strokeWidth="12" fill="none" />
                {/* Healthy segment (66.7% - Green) */}
                <circle 
                  cx="55" cy="55" r="42" 
                  stroke="#10b981" strokeWidth="12" fill="none" 
                  strokeDasharray="176 264" strokeDashoffset="0"
                  transform="rotate(-90 55 55)"
                />
                {/* Warning segment (16.7% - Yellow) */}
                <circle 
                  cx="55" cy="55" r="42" 
                  stroke="#f59e0b" strokeWidth="12" fill="none" 
                  strokeDasharray="44 264" strokeDashoffset="-176"
                  transform="rotate(-90 55 55)"
                />
                {/* Anomalous segment (16.7% - Orange) */}
                <circle 
                  cx="55" cy="55" r="42" 
                  stroke="#f97316" strokeWidth="12" fill="none" 
                  strokeDasharray="44 264" strokeDashoffset="-220"
                  transform="rotate(-90 55 55)"
                />
              </svg>
              <div className="donut-inner-label">
                <div className="donut-center-num font-mono">6</div>
                <div className="donut-center-sub">Stations</div>
              </div>
            </div>

            {/* Distribution Legend List */}
            <div className="donut-legend-list">
              <div className="donut-legend-item">
                <span className="legend-dot green"></span>
                <span className="legend-name">Healthy</span>
                <strong className="legend-qty font-mono">4 (66.7%)</strong>
              </div>
              <div className="donut-legend-item">
                <span className="legend-dot yellow"></span>
                <span className="legend-name">Warning</span>
                <strong className="legend-qty font-mono">1 (16.7%)</strong>
              </div>
              <div className="donut-legend-item">
                <span className="legend-dot orange"></span>
                <span className="legend-name">Anomalous</span>
                <strong className="legend-qty font-mono">1 (16.7%)</strong>
              </div>
              <div className="donut-legend-item">
                <span className="legend-dot red"></span>
                <span className="legend-name">Critical</span>
                <strong className="legend-qty font-mono">0 (0%)</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Panel 3: Data Quality Trend Line Chart */}
        <div className="console-panel bottom-panel-card">
          <div className="panel-title-bar">
            <div className="title-with-icon">
              <Database size={16} color="#06b6d4" />
              <span className="panel-heading">Data Quality Trend</span>
            </div>
            <select 
              className="trend-period-select"
              value={dataTrendRange}
              onChange={(e) => setDataTrendRange(e.target.value)}
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>

          <div className="trend-line-chart-wrap">
            <svg viewBox="0 0 340 130" fill="none" className="trend-chart-svg">
              {/* Grid Lines */}
              <line x1="40" y1="20" x2="330" y2="20" stroke="#1e293b" strokeDasharray="3 3" />
              <text x="32" y="24" fill="#64748b" fontSize="9" textAnchor="end">100%</text>

              <line x1="40" y1="50" x2="330" y2="50" stroke="#1e293b" strokeDasharray="3 3" />
              <text x="32" y="54" fill="#64748b" fontSize="9" textAnchor="end">90%</text>

              <line x1="40" y1="80" x2="330" y2="80" stroke="#1e293b" strokeDasharray="3 3" />
              <text x="32" y="84" fill="#64748b" fontSize="9" textAnchor="end">80%</text>

              <line x1="40" y1="110" x2="330" y2="110" stroke="#1e293b" strokeDasharray="3 3" />
              <text x="32" y="114" fill="#64748b" fontSize="9" textAnchor="end">70%</text>

              {/* Cyan Trend Path */}
              <path 
                d="M 50 28 L 95 24 L 140 26 L 185 22 L 230 25 L 275 20 L 320 18" 
                stroke="#0ea5e9" strokeWidth="2.5" fill="none" 
              />
              {/* Cyan Area Gradient */}
              <path 
                d="M 50 28 L 95 24 L 140 26 L 185 22 L 230 25 L 275 20 L 320 18 L 320 110 L 50 110 Z" 
                fill="url(#trendGrad)" opacity="0.15" 
              />

              {/* Data Node Dots */}
              <circle cx="50" cy="28" r="3.5" fill="#38bdf8" stroke="#0f172a" strokeWidth="1.5" />
              <circle cx="95" cy="24" r="3.5" fill="#38bdf8" stroke="#0f172a" strokeWidth="1.5" />
              <circle cx="140" cy="26" r="3.5" fill="#38bdf8" stroke="#0f172a" strokeWidth="1.5" />
              <circle cx="185" cy="22" r="3.5" fill="#38bdf8" stroke="#0f172a" strokeWidth="1.5" />
              <circle cx="230" cy="25" r="3.5" fill="#38bdf8" stroke="#0f172a" strokeWidth="1.5" />
              <circle cx="275" cy="20" r="3.5" fill="#38bdf8" stroke="#0f172a" strokeWidth="1.5" />
              <circle cx="320" cy="18" r="4.5" fill="#0ea5e9" stroke="#ffffff" strokeWidth="2" />

              {/* Date Ticks */}
              <text x="50" y="125" fill="#64748b" fontSize="9" textAnchor="middle">Sep 22</text>
              <text x="95" y="125" fill="#64748b" fontSize="9" textAnchor="middle">Sep 23</text>
              <text x="140" y="125" fill="#64748b" fontSize="9" textAnchor="middle">Sep 24</text>
              <text x="185" y="125" fill="#64748b" fontSize="9" textAnchor="middle">Sep 25</text>
              <text x="230" y="125" fill="#64748b" fontSize="9" textAnchor="middle">Sep 26</text>
              <text x="275" y="125" fill="#64748b" fontSize="9" textAnchor="middle">Sep 27</text>
              <text x="320" y="125" fill="#38bdf8" fontSize="9" fontWeight="bold" textAnchor="middle">Sep 28</text>

              <defs>
                <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="110" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#0ea5e9" />
                  <stop offset="1" stopColor="#0ea5e9" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
