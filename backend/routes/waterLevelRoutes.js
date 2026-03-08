import express from 'express';
import CurrentStatus from '../models/CurrentStatus.js';
import History from '../models/History.js';
import MotorStatus from '../models/MotorStatus.js';

const router = express.Router();

// Helper function to calculate status
const calculateStatus = (waterLevel) => {
  if (waterLevel === 100) return 'FULL';
  if (waterLevel >= 81) return 'HIGH';
  if (waterLevel >= 41) return 'MEDIUM';
  if (waterLevel >= 11) return 'LOW';
  return 'EMPTY';
};

// GET current water level for a specific tank (or default)
router.get('/current', async (req, res) => {
  try {
    const tankId = req.query.tankId || 'default';
    const current = await CurrentStatus.findOne({ tankId });

    if (!current) {
      return res.json({
        waterLevel: 0,
        status: 'EMPTY',
        tankId
      });
    }

    // Also get the motor status
    const motor = await MotorStatus.getOrCreate(tankId);

    res.json({
      waterLevel: current.waterLevel,
      status: current.status,
      updatedAt: current.updatedAt,
      tankId: current.tankId,
      motor: {
        mode: motor.mode,
        isOn: motor.isOn
      }
    });
  } catch (error) {
    console.error('Error fetching current status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST update water level (from ESP32)
router.post('/update', async (req, res) => {
  try {
    const { deviceId, waterLevel, timestamp, tankId: bodyTankId } = req.body;
    const tankId = bodyTankId || deviceId || 'default';

    // Validate input
    if (waterLevel === undefined || waterLevel < 0 || waterLevel > 100) {
      return res.status(400).json({
        message: 'Invalid water level. Must be between 0 and 100.'
      });
    }

    // Calculate new status
    const newStatus = calculateStatus(waterLevel);

    // Get previous status
    const previousStatus = await CurrentStatus.findOne({ tankId });
    const oldStatus = previousStatus ? previousStatus.status : null;

    // Update current status
    const updatedStatus = await CurrentStatus.updateCurrent(tankId, waterLevel, newStatus);

    // Log to history only if status changed to FULL or EMPTY
    if (oldStatus !== newStatus && (newStatus === 'FULL' || newStatus === 'EMPTY')) {
      await History.create({
        tankId,
        event: newStatus,
        timestamp: timestamp || new Date()
      });
    }

    // ---- AUTO MOTOR LOGIC ----
    const motor = await MotorStatus.getOrCreate(tankId);
    let motorChanged = false;

    if (motor.mode === 'AUTO') {
      if (waterLevel <= 10 && !motor.isOn) {
        // Water is low — turn motor ON
        motor.isOn = true;
        motor.updatedAt = new Date();
        await motor.save();
        motorChanged = true;
        await History.create({ tankId, event: 'MOTOR_ON', timestamp: new Date() });
      } else if (waterLevel >= 95 && motor.isOn) {
        // Water is high — turn motor OFF
        motor.isOn = false;
        motor.updatedAt = new Date();
        await motor.save();
        motorChanged = true;
        await History.create({ tankId, event: 'MOTOR_OFF', timestamp: new Date() });
      }
    }

    res.json({
      success: true,
      waterLevel: updatedStatus.waterLevel,
      status: updatedStatus.status,
      tankId,
      motor: {
        mode: motor.mode,
        isOn: motor.isOn,
        changed: motorChanged
      }
    });
  } catch (error) {
    console.error('Error updating water level:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
