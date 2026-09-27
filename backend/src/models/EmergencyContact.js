const mongoose = require('mongoose');

const emergencyContactSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Contact name is required'],
    trim: true,
  },
  phone: {
    type: String,
    required: [true, 'Contact phone number is required'],
    trim: true,
  },
  relation: {
    type: String,
    required: [true, 'Relationship is required'],
    trim: true,
  },
});

module.exports = mongoose.model('EmergencyContact', emergencyContactSchema);
