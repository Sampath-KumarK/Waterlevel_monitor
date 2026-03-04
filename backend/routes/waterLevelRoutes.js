import express from 'express';
import CurrentStatus from '../models/CurrentStatus.js';
import History from '../models/History.js';

const router = express.Router();

// Helper function to calculate status
const calculateStatus = (waterLevel) => {
  if (waterLevel === 100) return 'FULL';
  if (waterLevel >= 81) return 'HIGH';
  if (waterLevel >= 41) return 'MEDIUM';
  if (waterLevel >= 11) return 'LOW';
  return 'EMPTY';
};

// GET current water level
router.get('/current', async (req, res) => {
  try {
    const current = await CurrentStatus.findOne().sort({ updatedAt: -1, _id: -1 });
    
    if (!current) {
      return res.status(404).json({ 
        message: 'No data available',
        waterLevel: 0,
        status: 'EMPTY'
      });
    }

    res.json({
      waterLevel: current.waterLevel,
      status: current.status,
      updatedAt: current.updatedAt
    });
  } catch (error) {
    console.error('Error fetching current status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST update water level (from ESP32)
router.post('/update', async (req, res) => {
  try {
    const { deviceId, waterLevel, timestamp } = req.body;

    // Validate input
    if (waterLevel === undefined || waterLevel < 0 || waterLevel > 100) {
      return res.status(400).json({ 
        message: 'Invalid water level. Must be between 0 and 100.' 
      });
    }

    // Calculate new status
    const newStatus = calculateStatus(waterLevel);

    // Get previous status
    const previousStatus = await CurrentStatus.findOne().sort({ updatedAt: -1, _id: -1 });
    const oldStatus = previousStatus ? previousStatus.status : null;

    // Update current status
    const updatedStatus = await CurrentStatus.updateCurrent(waterLevel, newStatus);

    // Log to history only if status changed to FULL or EMPTY
    if (oldStatus !== newStatus && (newStatus === 'FULL' || newStatus === 'EMPTY')) {
      await History.create({
        event: newStatus,
        timestamp: timestamp || new Date()
      });
      console.log(`History logged: ${newStatus} at ${timestamp || new Date()}`);
    }

    res.json({
      success: true,
      waterLevel: updatedStatus.waterLevel,
      status: updatedStatus.status,
      historyLogged: oldStatus !== newStatus && (newStatus === 'FULL' || newStatus === 'EMPTY')
    });
  } catch (error) {
    console.error('Error updating water level:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
