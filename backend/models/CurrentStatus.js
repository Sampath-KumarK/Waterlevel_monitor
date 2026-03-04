import mongoose from 'mongoose';

const currentStatusSchema = new mongoose.Schema({
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

// Ensure only one document exists
currentStatusSchema.statics.updateCurrent = async function(waterLevel, status) {
  return await this.findOneAndUpdate(
    {},
    { waterLevel, status, updatedAt: new Date() },
    { upsert: true, new: true, sort: { updatedAt: -1, _id: -1 } }
  );
};

const CurrentStatus = mongoose.model('CurrentStatus', currentStatusSchema);

export default CurrentStatus;
