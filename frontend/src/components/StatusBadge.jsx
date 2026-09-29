import React from 'react';

export function StatusBadge({ status, type = 'classification' }) {
  if (!status) return null;

  let badgeClass = 'badge-normal';
  const s = status.toUpperCase();

  if (s === 'GENUINE_WEATHER_EVENT' || s === 'WEATHER_EVENT') {
    badgeClass = 'badge-weather';
  } else if (s === 'SENSOR_ANOMALY' || s === 'CRITICAL' || s === 'HIGH') {
    badgeClass = 'badge-anomaly';
  } else if (s === 'DATA_QUALITY_ISSUE' || s === 'WARNING' || s === 'MEDIUM') {
    badgeClass = 'badge-warning';
  } else if (s === 'UNCERTAIN' || s === 'UNKNOWN/UNCERTAIN' || s === 'LOW') {
    badgeClass = 'badge-uncertain';
  } else if (s === 'NORMAL' || s === 'HEALTHY') {
    badgeClass = 'badge-normal';
  }

  const displayText = status.replace(/_/g, ' ');

  return (
    <span className={`status-badge ${badgeClass}`}>
      {displayText}
    </span>
  );
}
