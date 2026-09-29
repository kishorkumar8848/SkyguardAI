import React from 'react';

export function MetricCard({ title, value, unit = '', subtext, statusColor, delta, icon: Icon }) {
  return (
    <div className="kpi-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="kpi-title">{title}</div>
        {Icon && <Icon size={16} color="var(--text-muted)" />}
      </div>
      <div className="kpi-value" style={{ color: statusColor || 'var(--text-primary)' }}>
        {value !== null && value !== undefined ? value : '--'}
        {unit && <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-secondary)', marginLeft: '0.2rem' }}>{unit}</span>}
      </div>
      {(subtext || delta !== undefined) && (
        <div className="kpi-sub">
          {delta !== undefined && (
            <span style={{ fontWeight: 600, color: delta > 0 ? '#f59e0b' : '#38bdf8', marginRight: '0.35rem' }}>
              {delta > 0 ? `+${delta}` : delta}
            </span>
          )}
          {subtext}
        </div>
      )}
    </div>
  );
}
