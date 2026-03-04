import express from 'express';
import History from '../models/History.js';

const router = express.Router();

// GET all history (FULL and EMPTY events)
router.get('/', async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    
    const history = await History.find()
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    res.json({
      count: history.length,
      history: history
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE all history (for maintenance/testing)
router.delete('/', async (req, res) => {
  try {
    const result = await History.deleteMany({});
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
