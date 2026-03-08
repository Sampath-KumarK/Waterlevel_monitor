import mongoose from 'mongoose';

const motorStatusSchema = new mongoose.Schema({
  tankId: {
    type: String,
    required: true,
    unique: true
  },
  mode: {
    type: String,
    enum: ['AUTO', 'MANUAL'],
    default: 'AUTO'
  },
  isOn: {
    type: Boolean,
    default: false
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

motorStatusSchema.statics.getOrCreate = async function (tankId) {
  let motor = await this.findOne({ tankId });
  if (!motor) {
    motor = await this.create({ tankId, mode: 'AUTO', isOn: false });
  }
  return motor;
};

const MotorStatus = mongoose.model('MotorStatus', motorStatusSchema);

export default MotorStatus;
