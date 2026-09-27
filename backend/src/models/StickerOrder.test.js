const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const test = require('node:test');
const StickerOrder = require('./StickerOrder');

const orderData = {
  user: new mongoose.Types.ObjectId(),
  qrId: 'public-qr-id',
  placement: 'helmet',
  quantity: 1,
  shippingAddress: {
    recipientName: 'Alex Kumar',
    phone: '+919876543210',
    addressLine1: '12 Main Road',
    city: 'Coimbatore',
    state: 'Tamil Nadu',
    postalCode: '641001',
    country: 'India',
  },
};

test('accepts a complete pending sticker order', async () => {
  const order = new StickerOrder(orderData);
  await assert.doesNotReject(order.validate());
  assert.equal(order.status, 'PENDING');
});

test('rejects unsupported sticker placements', async () => {
  const order = new StickerOrder({ ...orderData, placement: 'car-door' });
  await assert.rejects(order.validate(), (error) => Boolean(error.errors.placement));
});