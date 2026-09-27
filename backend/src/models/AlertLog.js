const mongoose = require('mongoose');

const alertLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  latitude: {
    type: Number,
  },
  longitude: {
    type: Number,
  },
  type: {
    type: String,
    enum: ['call', 'sms_location', 'state_helpline'],
    default: 'sms_location',
  },
  emergencyNumber: {
    type: String,
    default: '',
    trim: true,
  },
  emergencyRegion: {
    type: String,
    default: '',
    trim: true,
    maxlength: 100,
  },
  callerMode: {
    type: String,
    enum: ['owner', 'bystander'],
    default: 'owner',
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'RESOLVED'],
    default: 'ACTIVE',
  },
  resolvedAt: {
    type: Date,
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('AlertLog', alertLogSchema);
