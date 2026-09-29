import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Maximize2, Radio } from 'lucide-react';

export function StationNetworkMap({ stations = [], onSelectStation, onNavigateTab }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [selectedFilter, setSelectedFilter] = useState('ALL');

  // Realistic AWS station coordinates matching IMD network in India
  const stationLocations = [
    { id: 'AWS-LEH-007', name: 'Leh', lat: 34.1526, lon: 77.5771, status: 'HEALTHY', temp: '14.2°C', rh: '28%' },
    { id: 'AWS-DEL-001', name: 'New Delhi', lat: 28.5850, lon: 77.2060, status: 'WARNING', temp: '34.8°C', rh: '42%' },
    { id: 'AWS-LKO-008', name: 'Lucknow', lat: 26.8467, lon: 80.9462, status: 'HEALTHY', temp: '31.5°C', rh: '65%' },
    { id: 'AWS-BHP-009', name: 'Bhopal', lat: 23.2599, lon: 77.4126, status: 'HEALTHY', temp: '29.8°C', rh: '62%' },
    { id: 'AWS-KOL-006', name: 'Kolkata', lat: 22.5726, lon: 88.3639, status: 'WARNING', temp: '32.1°C', rh: '78%' },
    { id: 'AWS-MUM-003', name: 'Mumbai', lat: 19.0760, lon: 72.8777, status: 'ANOMALOUS', temp: '33.4°C', rh: '81%', pulsing: true }
  ];

  // Merge with any dynamic stations passed from backend
  const displayStations = stations.length >= 5 ? stations.map(s => ({
    id: s.station_id,
    name: s.station_name || s.station_id,
    lat: s.latitude,
    lon: s.longitude,
    status: s.status,
    temp: `${s.latest_observation?.temperature ?? 32.5}°C`,
    rh: `${s.latest_observation?.humidity ?? 60}%`,
    pulsing: s.status === 'ANOMALOUS' || s.status === 'CRITICAL'
  })) : stationLocations;

  const healthyCount = displayStations.filter(s => s.status === 'HEALTHY').length;
  const warningCount = displayStations.filter(s => s.status === 'WARNING').length;
  const anomalousCount = displayStations.filter(s => s.status === 'ANOMALOUS' || s.status === 'SUSPICIOUS').length;
  const criticalCount = displayStations.filter(s => s.status === 'CRITICAL').length;

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Initialize Leaflet map centered over Central/Northern India
      const map = L.map(mapContainerRef.current, {
        center: [23.8, 79.5],
        zoom: 4.8,
        zoomControl: false,
        attributionControl: false
      });

      // Dark Satellite / Carto Dark Hybrid Tiles
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 18,
        subdomains: 'abcd'
      }).addTo(map);

      // Custom Zoom Control at top-left
      L.control.zoom({ position: 'topleft' }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear previous markers
    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];

    // Filter stations if selected
    const activeStations = selectedFilter === 'ALL' 
      ? displayStations 
      : displayStations.filter(s => s.id === selectedFilter || s.name === selectedFilter);

    // Render Markers with Glowing Rings and Tooltips
    activeStations.forEach(st => {
      if (!st.lat || !st.lon) return;

      const colorMap = {
        HEALTHY: '#10b981',
        WARNING: '#f59e0b',
        ANOMALOUS: '#f97316',
        CRITICAL: '#ef4444'
      };
      const pinColor = colorMap[st.status] || '#10b981';

      // HTML for marker with optional radar pulse wave animation
      const markerHtml = `
        <div class="map-station-marker-wrap ${st.pulsing ? 'pulse-active' : ''}">
          <div class="marker-core" style="background: ${pinColor}; box-shadow: 0 0 12px ${pinColor};"></div>
          ${st.pulsing ? `<div class="marker-ripple" style="border-color: ${pinColor};"></div>` : ''}
          <div class="marker-city-tag">${st.name}</div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-map-pin',
        html: markerHtml,
        iconSize: [80, 36],
        iconAnchor: [40, 18]
      });

      const marker = L.marker([st.lat, st.lon], { icon: customIcon }).addTo(map);

      marker.bindPopup(`
        <div style="background:#0f172a; color:#f8fafc; padding:8px 12px; border-radius:6px; font-family:sans-serif; min-width:140px;">
          <strong style="color:#38bdf8; font-size:13px;">${st.name} (${st.id})</strong><br/>
          <div style="font-size:11px; color:#94a3b8; margin:4px 0;">Status: <b style="color:${pinColor}">${st.status}</b></div>
          <div style="font-size:11px;">Temp: <b>${st.temp}</b> | RH: <b>${st.rh}</b></div>
        </div>
      `);

      marker.on('click', () => {
        if (onSelectStation) onSelectStation(st.id);
      });

      markersRef.current.push(marker);
    });

  }, [displayStations, selectedFilter]);

  return (
    <div className="network-map-panel">
      {/* Header Toolbar */}
      <div className="network-map-header">
        <div className="map-title-wrap">
          <div className="map-radar-icon">
            <Radio size={16} color="#0ea5e9" />
          </div>
          <span className="map-title">India Station Network</span>
        </div>

        <div className="map-controls-row">
          <select 
            className="map-filter-select"
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
          >
            <option value="ALL">All Stations</option>
            {displayStations.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
            ))}
          </select>

          <button 
            className="map-action-icon-btn" 
            title="Full Screen / Detailed Map"
            onClick={() => onNavigateTab && onNavigateTab('map')}
          >
            <Maximize2 size={14} color="#94a3b8" />
          </button>
        </div>
      </div>

      {/* Map Canvas */}
      <div className="map-canvas-container" ref={mapContainerRef}>
        {/* Floating Bottom-Left Legend */}
        <div className="map-floating-legend">
          <div className="legend-item">
            <span className="legend-dot green"></span>
            <span>Healthy ({healthyCount})</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot yellow"></span>
            <span>Warning ({warningCount})</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot orange"></span>
            <span>Anomalous ({anomalousCount})</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot red"></span>
            <span>Critical ({criticalCount})</span>
          </div>
        </div>
      </div>
    </div>
  );
}
