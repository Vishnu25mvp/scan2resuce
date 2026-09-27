const mongoose = require('mongoose');

const ambulanceSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  provider: { type: String, default: '', trim: true },
  phone: { type: String, required: true, trim: true },
  address: { type: String, default: '', trim: true },
  latitude: { type: Number, required: true, min: -90, max: 90 },
  longitude: { type: Number, required: true, min: -180, max: 180 },
  available: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Ambulance', ambulanceSchema);