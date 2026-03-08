import mongoose from 'mongoose';

const tankSchema = new mongoose.Schema({
  tankId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Tank = mongoose.model('Tank', tankSchema);

export default Tank;
