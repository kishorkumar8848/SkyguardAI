import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ConsoleHeader } from './components/ConsoleHeader';
import { Overview } from './pages/Overview';
import { LiveMonitoring } from './pages/LiveMonitoring';
import { StationMap } from './pages/StationMap';
import { StationDetails } from './pages/StationDetails';
import { AlertCenter } from './pages/AlertCenter';
import { SensorHealth } from './pages/SensorHealth';
import { FaultInjectionLab } from './pages/FaultInjectionLab';
import { ModelPerformance } from './pages/ModelPerformance';
import { Explainability } from './pages/Explainability';
import { DataExplorer } from './pages/DataExplorer';
import { SideBySideDemo } from './pages/SideBySideDemo';
import { SystemSettings } from './pages/SystemSettings';

import {
  fetchStations,
  fetchAnomalies,
  fetchObservations,
  fetchSimulationStatus,
  startSimulation,
  stopSimulation
} from './services/api';
import { useWebSocket } from './hooks/useWebSocket';

export function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stations, setStations] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [observations, setObservations] = useState([]);
  const [selectedStationId, setSelectedStationId] = useState('AWS-DEL-001');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isSimRunning, setIsSimRunning] = useState(true);
  const [theme, setTheme] = useState('dark');

  // WebSocket Live Updates
  const handleWsTick = (tick) => {
    // Update observation stream
    if (tick?.observation) {
      setObservations(prev => {
        const next = [...prev, tick.observation];
        return next.slice(-200);
      });
    }

    // If an anomaly was detected, update anomaly list
    if (tick?.fusion?.classification && tick.fusion.classification !== 'NORMAL') {
      const newEvent = {
        event_id: `EVT-${Date.now()}`,
        timestamp: tick.observation.timestamp,
        station_id: tick.observation.station_id,
        classification: tick.fusion.classification,
        root_cause: tick.fusion.root_cause,
        severity: tick.fusion.severity,
        confidence: tick.fusion.confidence,
        status: 'ACTIVE',
        details: tick
      };
      setAnomalies(prev => [newEvent, ...prev.slice(0, 49)]);
    }

    // Refresh station statuses dynamically
    if (tick?.observation?.station_id) {
      setStations(prev => prev.map(st => {
        if (st.station_id === tick.observation.station_id) {
          return {
            ...st,
            latest_observation: tick.observation,
            status: tick.fusion.classification === 'NORMAL' ? 'HEALTHY' : 
                    tick.fusion.classification === 'GENUINE_WEATHER_EVENT' ? 'WARNING' : 'CRITICAL'
          };
        }
        return st;
      }));
    }
  };

  const { isConnected: isWsConnected, lastTick } = useWebSocket(handleWsTick);

  // Initial Data Fetch
  useEffect(() => {
    async function init() {
      try {
        const [sts, anoms, obs, sim] = await Promise.all([
          fetchStations(),
          fetchAnomalies(),
          fetchObservations(null, 50),
          fetchSimulationStatus()
        ]);
        setStations(sts || []);
        setAnomalies(anoms || []);
        setObservations(obs || []);
        setIsSimRunning(sim?.is_running || false);
      } catch (err) {
        console.error('Failed to load initial console telemetry:', err);
      }
    }
    init();
  }, []);

  const handleToggleSim = async () => {
    try {
      if (isSimRunning) {
        await stopSimulation();
        setIsSimRunning(false);
      } else {
        await startSimulation();
        setIsSimRunning(true);
      }
    } catch (err) {
      console.error('Failed to toggle live simulation:', err);
    }
  };

  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.body.className = nextTheme;
  };

  const handleInspectExplanation = (event) => {
    setSelectedEvent(event);
    setActiveTab('explainability');
  };

  const selectedStation = stations.find(s => s.station_id === selectedStationId) || stations[0];

  return (
    <div className="console-layout-wrapper">
      {/* Left Vertical Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        anomalyCount={anomalies.length || 3}
      />

      {/* Main Operations Container */}
      <div className="console-main-content">
        {/* Panoramic Mountain Sunset / Clouds Header */}
        <ConsoleHeader
          theme={theme}
          onToggleTheme={handleToggleTheme}
          isWsConnected={isWsConnected}
          isSimRunning={isSimRunning}
          totalStations={stations.length || 6}
          dataQuality="99.4%"
        />

        {/* View Switcher Container */}
        <main className="console-view-body">
          {activeTab === 'overview' && (
            <Overview
              stations={stations}
              anomalies={anomalies}
              lastTick={lastTick}
              onSelectStation={(sid) => setSelectedStationId(sid)}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'live' && (
            <LiveMonitoring
              stations={stations}
              lastTick={lastTick}
              observations={observations}
              selectedStationId={selectedStationId}
              onSelectStation={(sid) => setSelectedStationId(sid)}
            />
          )}

          {activeTab === 'map' && (
            <StationMap
              stations={stations}
              onSelectStation={(sid) => setSelectedStationId(sid)}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'station-detail' && (
            <StationDetails
              station={selectedStation}
              observations={observations}
              onReplayEvent={(sid) => {
                setActiveTab('live');
                setSelectedStationId(sid);
              }}
            />
          )}

          {activeTab === 'alerts' && (
            <AlertCenter
              anomalies={anomalies}
              stations={stations}
              onInspectExplanation={handleInspectExplanation}
            />
          )}

          {activeTab === 'health' && (
            <SensorHealth
              stations={stations}
            />
          )}

          {activeTab === 'injection-lab' && (
            <FaultInjectionLab
              stations={stations}
            />
          )}

          {activeTab === 'models' && (
            <ModelPerformance />
          )}

          {activeTab === 'explainability' && (
            <Explainability
              selectedEvent={selectedEvent || anomalies[0]}
              onBackToAlerts={() => setActiveTab('alerts')}
            />
          )}

          {activeTab === 'explorer' && (
            <DataExplorer
              observations={observations}
              stations={stations}
            />
          )}

          {activeTab === 'side-by-side' && (
            <SideBySideDemo />
          )}

          {activeTab === 'settings' && (
            <SystemSettings
              stations={stations}
            />
          )}
        </main>
      </div>
    </div>
  );
}
