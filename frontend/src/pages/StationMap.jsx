import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { StatusBadge } from '../components/StatusBadge';
import { MapPin, Info } from 'lucide-react';

export function StationMap({ stations, onSelectStation, onNavigateTab }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Center on India [22.5, 79.0]
      const map = L.map(mapContainerRef.current).setView([22.5, 79.0], 5);
      
      // Clean dark matter / satellite tile layer
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear existing markers
    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];

    // Add stations
    stations.forEach(st => {
      if (!st.latitude || !st.longitude) return;

      const color = st.status === 'HEALTHY' ? '#10b981' : st.status === 'WARNING' ? '#f59e0b' : '#ef4444';

      const customIcon = L.divIcon({
        className: 'custom-station-pin',
        html: `
          <div style="
            width: 22px;
            height: 22px;
            background: ${color};
            border: 2px solid #ffffff;
            border-radius: 50%;
            box-shadow: 0 0 10px ${color};
            display: flex;
            align-items: center;
            justify-content: center;
            color: #000;
            font-weight: bold;
            font-size: 10px;
          ">
          </div>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      });

      const marker = L.marker([st.latitude, st.longitude], { icon: customIcon }).addTo(map);

      const obs = st.last_observation || {};
      const popupHtml = `
        <div style="font-family: Inter, sans-serif; color: #0f172a; min-width: 180px; padding: 4px;">
          <div style="font-weight: 700; font-size: 13px; margin-bottom: 2px;">${st.station_name}</div>
          <div style="font-size: 11px; color: #64748b; margin-bottom: 6px;">ID: ${st.station_id} • Elev: ${st.elevation}m</div>
          <div style="font-size: 12px; margin-bottom: 3px;"><strong>Temp:</strong> ${obs.temperature || '--'}°C</div>
          <div style="font-size: 12px; margin-bottom: 3px;"><strong>Pressure:</strong> ${obs.pressure || '--'} hPa</div>
          <div style="font-size: 12px; margin-bottom: 6px;"><strong>Humidity:</strong> ${obs.humidity || '--'}%</div>
          <div style="font-size: 11px; margin-bottom: 8px;"><strong>Health:</strong> ${st.health?.overall_health || 95}% (${st.status})</div>
          <button id="btn-inspect-${st.station_id}" style="
            background: #0284c7;
            color: #fff;
            border: none;
            padding: 4px 10px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 600;
            cursor: pointer;
            width: 100%;
          ">Inspect Live Telemetry</button>
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-inspect-${st.station_id}`);
        if (btn) {
          btn.onclick = () => {
            onSelectStation(st.station_id);
            onNavigateTab('station-detail');
          };
        }
      });

      markersRef.current.push(marker);
    });

  }, [stations]);

  return (
    <div>
      <div className="panel" style={{ padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <MapPin size={18} color="var(--accent-cyan)" />
          <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Geographic IMD AWS Network Distribution</span>
        </div>
        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
            <span>Healthy (&gt;85%)</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }}></span>
            <span>Warning / Drift</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }}></span>
            <span>Anomalous / Critical</span>
          </span>
        </div>
      </div>

      <div className="leaflet-map-wrapper" ref={mapContainerRef} />
    </div>
  );
}
