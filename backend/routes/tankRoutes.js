import express from 'express';
import Tank from '../models/Tank.js';
import CurrentStatus from '../models/CurrentStatus.js';
import MotorStatus from '../models/MotorStatus.js';
import History from '../models/History.js';

const router = express.Router();

// GET all tanks
router.get('/', async (req, res) => {
  try {
    const tanks = await Tank.find().sort({ createdAt: 1 });
    res.json({ tanks });
  } catch (error) {
    console.error('Error fetching tanks:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST create a new tank
router.post('/', async (req, res) => {
  try {
    const { tankId, name, location } = req.body;

    if (!tankId || !name) {
      return res.status(400).json({ message: 'tankId and name are required' });
    }

    // Check for duplicate tankId
    const existing = await Tank.findOne({ tankId });
    if (existing) {
      return res.status(409).json({ message: 'A tank with this ID already exists' });
    }

    const tank = await Tank.create({ tankId, name, location: location || '' });

    // Create default motor status for this tank
    await MotorStatus.getOrCreate(tankId);

    res.status(201).json({ success: true, tank });
  } catch (error) {
    console.error('Error creating tank:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE a tank and its related data
router.delete('/:tankId', async (req, res) => {
  try {
    const { tankId } = req.params;

    const tank = await Tank.findOne({ tankId });
    if (!tank) {
      return res.status(404).json({ message: 'Tank not found' });
    }

    // Delete tank and all related data
    await Promise.all([
      Tank.deleteOne({ tankId }),
      CurrentStatus.deleteMany({ tankId }),
      MotorStatus.deleteMany({ tankId }),
      History.deleteMany({ tankId })
    ]);

    res.json({ success: true, message: `Tank "${tank.name}" and all related data deleted` });
  } catch (error) {
    console.error('Error deleting tank:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
