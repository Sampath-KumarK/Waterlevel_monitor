import mongoose from 'mongoose';

const historySchema = new mongoose.Schema({
  tankId: {
    type: String,
    required: true,
    default: 'default'
  },
  event: {
    type: String,
    required: true,
    enum: ['FULL', 'EMPTY', 'MOTOR_ON', 'MOTOR_OFF']
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
historySchema.index({ tankId: 1, timestamp: -1 });

const History = mongoose.model('History', historySchema);

export default History;
