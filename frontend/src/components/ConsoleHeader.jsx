import React, { useState, useEffect } from 'react';
import {
  Database,
  Radio,
  Settings,
  ShieldCheck,
  Sun,
  Moon,
  Clock,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

export function ConsoleHeader({
  theme,
  onToggleTheme,
  isWsConnected = true,
  isSimRunning = true,
  totalStations = 6,
  dataQuality = "99.4%"
}) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date) => {
    const day = date.getDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const timeStr = date.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    return `${day} ${month} ${year} | ${timeStr}`;
  };

  return (
    <header className="console-header-banner">
      {/* Background Panoramic Mountain Sunrise Backdrop SVG */}
      <div className="header-backdrop-wrap">
        <svg viewBox="0 0 1600 220" fill="none" preserveAspectRatio="none" className="mountain-backdrop-svg">
          <defs>
            <linearGradient id="skyGrad" x1="800" y1="0" x2="800" y2="220" gradientUnits="userSpaceOnUse">
              <stop stopColor="#071022" />
              <stop offset="0.6" stopColor="#0c1d38" />
              <stop offset="0.85" stopColor="#1a2e4d" />
              <stop offset="1" stopColor="#2c2a3e" />
            </linearGradient>
            <radialGradient id="sunGlow" cx="950" cy="180" r="280" gradientUnits="userSpaceOnUse">
              <stop stopColor="#f59e0b" stopOpacity="0.45" />
              <stop offset="0.4" stopColor="#d97706" stopOpacity="0.2" />
              <stop offset="1" stopColor="#0c1d38" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="mountainRidge1" x1="0" y1="100" x2="1600" y2="220" gradientUnits="userSpaceOnUse">
              <stop stopColor="#11223e" stopOpacity="0.7" />
              <stop offset="1" stopColor="#081427" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="mountainRidge2" x1="0" y1="130" x2="1600" y2="220" gradientUnits="userSpaceOnUse">
              <stop stopColor="#071120" stopOpacity="0.85" />
              <stop offset="1" stopColor="#040913" stopOpacity="0.98" />
            </linearGradient>
          </defs>

          {/* Deep Sky Base */}
          <rect width="1600" height="220" fill="url(#skyGrad)" />
          {/* Sunrise Golden Glow Horizon */}
          <rect width="1600" height="220" fill="url(#sunGlow)" />

          {/* Distant Mountain Peaks */}
          <path d="M0 160 L140 135 L280 155 L420 125 L580 148 L720 115 L880 140 L960 120 L1080 145 L1240 110 L1380 138 L1520 122 L1600 140 L1600 220 L0 220 Z" fill="url(#mountainRidge1)" />

          {/* Closer Foreground Mountain Ridge */}
          <path d="M0 180 L180 152 L360 178 L520 145 L690 172 L860 138 L1020 168 L1190 132 L1360 162 L1500 148 L1600 165 L1600 220 L0 220 Z" fill="url(#mountainRidge2)" />

          {/* Subtle cloud mist layers */}
          <ellipse cx="940" cy="180" rx="340" ry="18" fill="#f8fafc" fillOpacity="0.04" />
          <ellipse cx="400" cy="190" rx="280" ry="14" fill="#38bdf8" fillOpacity="0.03" />
        </svg>
      </div>

      {/* Header Foreground Content */}
      <div className="header-inner-content">
        {/* Left: Titles & Feature Badges */}
        <div className="header-left">
          <h1 className="console-main-title">
            Automatic Weather Station (AWS) Data-Trust Console
          </h1>
          <p className="console-subtitle">
            AI-powered anomaly detection and sensor health monitoring across Indian agro-climatic stations
          </p>

          <div className="console-pill-row">
            <span className="info-badge">
              <Database size={13} color="#38bdf8" />
              <span>{totalStations} Stations</span>
            </span>

            <span className="info-badge highlight-green">
              <span className="pulsing-live-dot"></span>
              <span>Real-time Monitoring</span>
            </span>

            <span className="info-badge">
              <Settings size={13} color="#0ea5e9" />
              <span>AI Models Active</span>
            </span>

            <span className="info-badge highlight-teal">
              <CheckCircle2 size={13} color="#10b981" />
              <span>Data Quality: {dataQuality}</span>
            </span>
          </div>
        </div>

        {/* Right: Date-Time, Status, Controls & User Avatar */}
        <div className="header-right">
          <div className="header-top-controls">
            {/* Live Clock Card */}
            <div className="clock-pill">
              <Clock size={14} color="#94a3b8" />
              <span className="clock-text font-mono">{formatDate(currentTime)}</span>
            </div>

            {/* Live Data Badge */}
            <div className="live-pill">
              <span className="live-dot-green"></span>
              <span>Live Data</span>
            </div>

            {/* Theme Toggle Button */}
            <button className="theme-toggle-btn" onClick={onToggleTheme} title="Toggle Dark/Light Mode">
              {theme === 'dark' ? <Sun size={15} color="#cbd5e1" /> : <Moon size={15} color="#cbd5e1" />}
            </button>

            {/* User Avatar Circle */}
            <div className="user-avatar-circle" title="IMD Duty Officer (KK)">
              <span>KK</span>
            </div>
          </div>

          {/* System Status Panel with Animated Equalizer Wave */}
          <div className="system-status-box">
            <div className="system-status-label">SYSTEM STATUS</div>
            <div className="status-row">
              <span className="operational-badge">
                <span className="operational-dot"></span>
                <span>OPERATIONAL</span>
              </span>

              {/* Animated Audio / Telemetry Wave Bars */}
              <div className="telemetry-equalizer">
                <span className="eq-bar bar1"></span>
                <span className="eq-bar bar2"></span>
                <span className="eq-bar bar3"></span>
                <span className="eq-bar bar4"></span>
                <span className="eq-bar bar5"></span>
                <span className="eq-bar bar6"></span>
              </div>
            </div>
            <div className="system-status-subtext">All systems running normally</div>
          </div>
        </div>
      </div>
    </header>
  );
}
