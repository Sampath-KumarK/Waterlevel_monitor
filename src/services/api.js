// API base URL - update this for production
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ========== WATER LEVEL ==========

// Fetch current water level for a specific tank
export const getCurrentWaterLevel = async (tankId = 'default') => {
  const response = await fetch(`${API_BASE_URL}/water-level/current?tankId=${encodeURIComponent(tankId)}`);
  if (!response.ok) throw new Error('Failed to fetch current water level');
  return await response.json();
};

// Update water level (typically called by ESP32)
export const updateWaterLevel = async (deviceId, waterLevel, timestamp = new Date()) => {
  const response = await fetch(`${API_BASE_URL}/water-level/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceId, waterLevel, timestamp }),
  });
  if (!response.ok) throw new Error('Failed to update water level');
  return await response.json();
};

// ========== HISTORY ==========

// Fetch history (optionally filtered by tankId)
export const getHistory = async (limit = 50, tankId) => {
  let url = `${API_BASE_URL}/history?limit=${limit}`;
  if (tankId) url += `&tankId=${encodeURIComponent(tankId)}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch history');
  return await response.json();
};

// Delete selected history records
export const deleteSelectedHistory = async (ids) => {
  const response = await fetch(`${API_BASE_URL}/history/delete-selected`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  });
  if (!response.ok) throw new Error('Failed to delete selected history');
  return await response.json();
};

// ========== TANKS ==========

// Get all tanks
export const getTanks = async () => {
  const response = await fetch(`${API_BASE_URL}/tanks`);
  if (!response.ok) throw new Error('Failed to fetch tanks');
  return await response.json();
};

// Create a new tank
export const createTank = async (tankId, name, location = '') => {
  const response = await fetch(`${API_BASE_URL}/tanks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tankId, name, location }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Failed to create tank');
  }
  return await response.json();
};

// Delete a tank
export const deleteTank = async (tankId) => {
  const response = await fetch(`${API_BASE_URL}/tanks/${encodeURIComponent(tankId)}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete tank');
  return await response.json();
};

// ========== MOTOR ==========

// Get motor status for a tank
export const getMotorStatus = async (tankId) => {
  const response = await fetch(`${API_BASE_URL}/motor/${encodeURIComponent(tankId)}`);
  if (!response.ok) throw new Error('Failed to fetch motor status');
  return await response.json();
};

// Set motor mode (AUTO / MANUAL)
export const setMotorMode = async (tankId, mode) => {
  const response = await fetch(`${API_BASE_URL}/motor/${encodeURIComponent(tankId)}/mode`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode }),
  });
  if (!response.ok) throw new Error('Failed to set motor mode');
  return await response.json();
};

// Toggle motor ON/OFF (manual)
export const toggleMotor = async (tankId, isOn) => {
  const response = await fetch(`${API_BASE_URL}/motor/${encodeURIComponent(tankId)}/toggle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isOn }),
  });
  if (!response.ok) throw new Error('Failed to toggle motor');
  return await response.json();
};

// ========== HEALTH ==========

export const checkHealth = async () => {
  const response = await fetch(`${API_BASE_URL}/health`);
  if (!response.ok) throw new Error('API health check failed');
  return await response.json();
};
