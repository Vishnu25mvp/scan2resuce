const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Hospital name is required'],
    trim: true,
  },
  phone: {
    type: String,
    required: [true, 'Hospital phone number is required'],
    trim: true,
  },
  address: {
    type: String,
    default: '',
    trim: true,
  },
  latitude: {
    type: Number,
    required: [true, 'Hospital latitude is required'],
  },
  longitude: {
    type: Number,
    required: [true, 'Hospital longitude is required'],
  },
});

module.exports = mongoose.model('Hospital', hospitalSchema);
