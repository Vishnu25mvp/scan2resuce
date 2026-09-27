const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  recipientName: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  addressLine1: { type: String, required: true, trim: true },
  addressLine2: { type: String, default: '', trim: true },
  city: { type: String, required: true, trim: true },
  state: { type: String, required: true, trim: true },
  postalCode: { type: String, required: true, trim: true },
  country: { type: String, default: 'India', trim: true },
}, { _id: false });

const stickerOrderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  qrId: { type: String, required: true, index: true },
  placement: {
    type: String,
    enum: ['helmet', 'windshield', 'other'],
    required: true,
  },
  quantity: { type: Number, min: 1, max: 5, default: 1 },
  shippingAddress: { type: addressSchema, required: true },
  status: {
    type: String,
    enum: ['PENDING', 'PROCESSING', 'DISPATCHED', 'DELIVERED', 'CANCELLED'],
    default: 'PENDING',
    index: true,
  },
  trackingNumber: { type: String, default: '', trim: true },
  dispatchNote: { type: String, default: '', trim: true },
  dispatchedAt: { type: Date },
  deliveredAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('StickerOrder', stickerOrderSchema);