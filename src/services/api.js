// API base URL - update this for production
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Fetch current water level
export const getCurrentWaterLevel = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/water-level/current`);
    if (!response.ok) {
      throw new Error('Failed to fetch current water level');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching current water level:', error);
    throw error;
  }
};

// Update water level (typically called by ESP32, but can be used for testing)
export const updateWaterLevel = async (deviceId, waterLevel, timestamp = new Date()) => {
  try {
    const response = await fetch(`${API_BASE_URL}/water-level/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        deviceId,
        waterLevel,
        timestamp,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update water level');
    }
    return await response.json();
  } catch (error) {
    console.error('Error updating water level:', error);
    throw error;
  }
};

// Fetch history
export const getHistory = async (limit = 50) => {
  try {
    const response = await fetch(`${API_BASE_URL}/history?limit=${limit}`);
    if (!response.ok) {
      throw new Error('Failed to fetch history');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching history:', error);
    throw error;
  }
};

// Health check
export const checkHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) {
      throw new Error('API health check failed');
    }
    return await response.json();
  } catch (error) {
    console.error('Error checking API health:', error);
    throw error;
  }
};
