import React from 'react';
import { Activity, Play, Square, Sun, Moon, ShieldCheck } from 'lucide-react';

export function Navbar({ isSimRunning, onToggleSim, theme, onToggleTheme, isWsConnected }) {
  return (
    <header className="header-bar">
      <div className="brand-section">
        <div className="radar-logo">
          <ShieldCheck size={20} />
        </div>
        <div className="brand-text">
          <h1>SKYGUARD AI</h1>
          <div className="tagline">
            “When weather data looks wrong, determine whether the atmosphere changed — or the sensor did.”
          </div>
        </div>
      </div>

      <div className="header-meta">
        <div className="live-indicator" style={{
          background: isWsConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          color: isWsConnected ? '#10b981' : '#ef4444',
          borderColor: isWsConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'
        }}>
          <div className="live-pulse" style={{ backgroundColor: isWsConnected ? '#10b981' : '#ef4444' }} />
          <span>{isWsConnected ? 'TELEMETRY LIVE' : 'WS RECONNECTING'}</span>
        </div>

        <button
          className={`btn ${isSimRunning ? 'btn-danger' : 'btn-primary'}`}
          onClick={onToggleSim}
          style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
        >
          {isSimRunning ? <Square size={13} /> : <Play size={13} />}
          <span>{isSimRunning ? 'PAUSE SIMULATOR' : 'START SIMULATOR'}</span>
        </button>

        <button
          className="btn btn-secondary"
          onClick={onToggleTheme}
          title="Toggle Theme"
          style={{ padding: '0.35rem 0.6rem' }}
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </div>
    </header>
  );
}
