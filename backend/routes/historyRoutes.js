import express from 'express';
import mongoose from 'mongoose';
import History from '../models/History.js';

const router = express.Router();

// GET history (filtered by tankId if provided)
router.get('/', async (req, res) => {
  try {
    const { limit = 50, tankId } = req.query;
    const filter = tankId ? { tankId } : {};

    const history = await History.find(filter)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    res.json({
      count: history.length,
      history
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE selected history records by IDs
router.post('/delete-selected', async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'ids must be a non-empty array' });
    }

    // Validate all ids are valid ObjectIds
    const validIds = ids.filter(id => mongoose.Types.ObjectId.isValid(id));
    if (validIds.length === 0) {
      return res.status(400).json({ message: 'No valid IDs provided' });
    }

    const result = await History.deleteMany({ _id: { $in: validIds } });
    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} history records`
    });
  } catch (error) {
    console.error('Error deleting selected history:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE all history (optionally filtered by tankId)
router.delete('/', async (req, res) => {
  try {
    const { tankId } = req.query;
    const filter = tankId ? { tankId } : {};
    const result = await History.deleteMany(filter);
    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} history records`
    });
  } catch (error) {
    console.error('Error deleting history:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
