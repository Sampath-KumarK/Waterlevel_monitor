import mongoose from 'mongoose';

const historySchema = new mongoose.Schema({
  event: {
    type: String,
    required: true,
    enum: ['FULL', 'EMPTY']
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
historySchema.index({ timestamp: -1 });

const History = mongoose.model('History', historySchema);

export default History;
