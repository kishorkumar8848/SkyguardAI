const API_BASE = '/api';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

export async function fetchStations() {
  const res = await fetch(`${API_BASE}/stations`);
  return res.json();
}

export async function fetchStation(stationId) {
  const res = await fetch(`${API_BASE}/stations/${stationId}`);
  return res.json();
}

export async function fetchObservations(stationId = null, limit = 50) {
  const url = stationId 
    ? `${API_BASE}/observations?station_id=${stationId}&limit=${limit}`
    : `${API_BASE}/observations?limit=${limit}`;
  const res = await fetch(url);
  return res.json();
}

export async function analyzeObservation(payload) {
  const res = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return res.json();
}

export async function fetchAnomalies(filters = {}) {
  const params = new URLSearchParams();
  if (filters.station_id) params.append('station_id', filters.station_id);
  if (filters.severity) params.append('severity', filters.severity);
  if (filters.classification) params.append('classification', filters.classification);
  const res = await fetch(`${API_BASE}/anomalies?${params.toString()}`);
  return res.json();
}

export async function fetchExplanation(eventId) {
  const res = await fetch(`${API_BASE}/explanations/${eventId}`);
  return res.json();
}

export async function fetchSensorHealth() {
  const res = await fetch(`${API_BASE}/sensor-health`);
  return res.json();
}

export async function fetchModelMetrics() {
  const res = await fetch(`${API_BASE}/model/metrics`);
  return res.json();
}

export async function injectAnomaly(payload) {
  const res = await fetch(`${API_BASE}/anomaly/inject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return res.json();
}

export async function fetchSimulationStatus() {
  const res = await fetch(`${API_BASE}/simulation/status`);
  return res.json();
}

export async function startSimulation() {
  const res = await fetch(`${API_BASE}/simulation/start`, { method: 'POST' });
  return res.json();
}

export async function stopSimulation() {
  const res = await fetch(`${API_BASE}/simulation/stop`, { method: 'POST' });
  return res.json();
}

export async function fetchDemoScenarios() {
  const res = await fetch(`${API_BASE}/demo/scenarios`);
  return res.json();
}

export async function runDemoScenario(scenarioId) {
  const res = await fetch(`${API_BASE}/demo/run-scenario/${scenarioId}`, { method: 'POST' });
  return res.json();
}

export async function fetchSideBySideDemo() {
  const res = await fetch(`${API_BASE}/demo/side-by-side`, { method: 'POST' });
  return res.json();
}

export async function uploadCSVFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/upload/csv`, {
    method: 'POST',
    body: formData
  });
  return res.json();
}
