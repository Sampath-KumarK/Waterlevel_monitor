import mongoose from 'mongoose';

const currentStatusSchema = new mongoose.Schema({
  tankId: {
    type: String,
    required: true,
    default: 'default'
  },
  waterLevel: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  status: {
    type: String,
    required: true,
    enum: ['EMPTY', 'LOW', 'MEDIUM', 'HIGH', 'FULL']
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

currentStatusSchema.index({ tankId: 1 });

// Update current status for a specific tank
currentStatusSchema.statics.updateCurrent = async function(tankId, waterLevel, status) {
  return await this.findOneAndUpdate(
    { tankId },
    { waterLevel, status, updatedAt: new Date() },
    { upsert: true, new: true }
  );
};

const CurrentStatus = mongoose.model('CurrentStatus', currentStatusSchema);

export default CurrentStatus;
