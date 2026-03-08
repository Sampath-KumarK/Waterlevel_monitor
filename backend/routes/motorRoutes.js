import express from 'express';
import MotorStatus from '../models/MotorStatus.js';
import History from '../models/History.js';

const router = express.Router();

// GET motor status for a tank
router.get('/:tankId', async (req, res) => {
  try {
    const { tankId } = req.params;
    const motor = await MotorStatus.getOrCreate(tankId);
    res.json(motor);
  } catch (error) {
    console.error('Error fetching motor status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST set motor mode (AUTO / MANUAL)
router.post('/:tankId/mode', async (req, res) => {
  try {
    const { tankId } = req.params;
    const { mode } = req.body;

    if (!['AUTO', 'MANUAL'].includes(mode)) {
      return res.status(400).json({ message: 'Mode must be AUTO or MANUAL' });
    }

    const motor = await MotorStatus.findOneAndUpdate(
      { tankId },
      { mode, updatedAt: new Date() },
      { upsert: true, new: true }
    );

    res.json({ success: true, motor });
  } catch (error) {
    console.error('Error setting motor mode:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST toggle motor ON/OFF (manual control)
router.post('/:tankId/toggle', async (req, res) => {
  try {
    const { tankId } = req.params;
    const { isOn } = req.body;

    if (typeof isOn !== 'boolean') {
      return res.status(400).json({ message: 'isOn must be a boolean' });
    }

    const motor = await MotorStatus.findOneAndUpdate(
      { tankId },
      { isOn, updatedAt: new Date() },
      { upsert: true, new: true }
    );

    // Log motor event in history
    await History.create({
      tankId,
      event: isOn ? 'MOTOR_ON' : 'MOTOR_OFF',
      timestamp: new Date()
    });

    res.json({ success: true, motor });
  } catch (error) {
    console.error('Error toggling motor:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
