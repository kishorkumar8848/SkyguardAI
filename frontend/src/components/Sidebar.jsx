import React from 'react';
import {
  LayoutDashboard,
  Activity,
  MapPin,
  LayoutGrid,
  AlertTriangle,
  HeartPulse,
  Beaker,
  BarChart3,
  Lightbulb,
  Database,
  Zap,
  Settings,
  ShieldCheck
} from 'lucide-react';

export function Sidebar({ activeTab, onSelectTab, anomalyCount = 3 }) {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'live', label: 'Live Monitoring', icon: Activity },
    { id: 'map', label: 'Station Map', icon: MapPin },
    { id: 'station-detail', label: 'Station Details', icon: LayoutGrid },
    { id: 'alerts', label: 'Alert Center', icon: AlertTriangle, badge: anomalyCount },
    { id: 'health', label: 'Sensor Health', icon: HeartPulse },
    { id: 'injection-lab', label: 'Fault Injection Lab', icon: Beaker },
    { id: 'models', label: 'Model Performance', icon: BarChart3 },
    { id: 'explainability', label: 'Explainability', icon: Lightbulb },
    { id: 'explorer', label: 'Data Explorer', icon: Database },
    { id: 'side-by-side', label: 'Side-by-Side Demo', icon: Zap, highlight: true },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="console-sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="brand-logo-icon">
          <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="logo-svg">
            <path d="M18 3L4 9V17C4 24.5 10 31.5 18 33C26 31.5 32 24.5 32 17V9L18 3Z" fill="url(#shield_grad)" />
            <path d="M12 18C12 14.7 14.7 12 18 12C20.6 12 22.8 13.7 23.6 16.1C24.4 16.3 25 17.1 25 18C25 19.1 24.1 20 23 20H13C12.4 20 12 19.6 12 19V18Z" fill="#ffffff" />
            <path d="M15 23H21M17 26H19" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
            <defs>
              <linearGradient id="shield_grad" x1="4" y1="3" x2="32" y2="33" gradientUnits="userSpaceOnUse">
                <stop stopColor="#0ea5e9" />
                <stop offset="1" stopColor="#0284c7" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div className="brand-text">
          <div className="brand-title">
            SKYGUARD <span className="brand-ai">AI</span>
          </div>
          <div className="brand-subtitle">AWS DATA-TRUST & SENSOR HEALTH</div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`sidebar-nav-btn ${isActive ? 'active' : ''} ${item.highlight ? 'highlight-btn' : ''}`}
              onClick={() => onSelectTab(item.id)}
            >
              <div className="nav-icon-wrap">
                <Icon size={18} />
              </div>
              <span className="nav-label">{item.label}</span>
              {item.badge && item.badge > 0 && (
                <span className="nav-badge-pill">{item.badge}</span>
              )}
              {item.highlight && !isActive && (
                <span className="nav-highlight-dot"></span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer with Earth Graphic & IMD / MoES Badge */}
      <div className="sidebar-footer">
        <div className="footer-earth-backdrop">
          {/* Stylized Earth curvature vector with glowing blue atmospheric rim */}
          <svg viewBox="0 0 240 100" fill="none" className="earth-svg" preserveAspectRatio="none">
            <defs>
              <linearGradient id="earthGrad" x1="0" y1="0" x2="0" y2="100" gradientUnits="userSpaceOnUse">
                <stop stopColor="#0b2447" stopOpacity="0.8" />
                <stop offset="1" stopColor="#030816" stopOpacity="0.95" />
              </linearGradient>
              <linearGradient id="rimGlow" x1="0" y1="0" x2="240" y2="0" gradientUnits="userSpaceOnUse">
                <stop stopColor="#38bdf8" stopOpacity="0.1" />
                <stop offset="0.5" stopColor="#38bdf8" stopOpacity="0.9" />
                <stop offset="1" stopColor="#0284c7" stopOpacity="0.2" />
              </linearGradient>
            </defs>
            <path d="M-20 100 C 60 20, 180 20, 260 100 Z" fill="url(#earthGrad)" />
            <path d="M-20 100 C 60 20, 180 20, 260 100" stroke="url(#rimGlow)" strokeWidth="2.5" />
          </svg>
        </div>

        <div className="footer-content">
          <div className="emblem-row">
            {/* Ashoka Lion Emblem / MoES stylized mark */}
            <div className="ashoka-emblem">
              <svg viewBox="0 0 24 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="emblem-svg">
                <path d="M12 2L15 8H9L12 2Z" fill="#94a3b8" />
                <path d="M6 9L9 14H3L6 9Z" fill="#64748b" />
                <path d="M18 9L21 14H15L18 9Z" fill="#64748b" />
                <rect x="4" y="15" width="16" height="3" rx="1.5" fill="#cbd5e1" />
                <circle cx="12" cy="16.5" r="1.2" fill="#0284c7" />
                <path d="M6 19H18V22C18 24 15 25 12 25C9 25 6 24 6 22V19Z" fill="#475569" />
                <rect x="8" y="25" width="8" height="2" rx="1" fill="#94a3b8" />
              </svg>
            </div>
            <div className="gov-text">
              <div className="gov-ministry">Ministry of Earth Sciences</div>
              <div className="gov-dept">India Meteorological Department</div>
            </div>
          </div>
          <div className="sih-pill-badge">
            <span className="sih-code">SIH26073</span>
            <span className="sih-theme">MoES / IMD</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
