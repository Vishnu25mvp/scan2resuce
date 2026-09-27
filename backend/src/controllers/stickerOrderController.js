const StickerOrder = require('../models/StickerOrder');

const transitions = {
  PENDING: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['DISPATCHED', 'CANCELLED'],
  DISPATCHED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

exports.createOrder = async (req, res) => {
  try {
    const { placement, quantity = 1, shippingAddress } = req.body;
    if (!req.user.publicEmergencyConsent) {
      return res.status(409).json({ message: 'Enable public emergency-card sharing before ordering a sticker' });
    }
    if (!req.user.vehicle?.type || !req.user.vehicle?.registrationNumber) {
      return res.status(409).json({ message: 'Add vehicle type and registration number before ordering a sticker' });
    }
    if (!['helmet', 'windshield', 'other'].includes(placement)) {
      return res.status(400).json({ message: 'Choose where the sticker will be placed' });
    }

    const order = await StickerOrder.create({
      user: req.user._id,
      qrId: req.user.qrId,
      placement,
      quantity,
      shippingAddress,
    });
    await order.populate('user', 'fullName phone qrId');
    req.app.get('io')?.emit('new_sticker_order', order);
    return res.status(201).json({ order });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const orders = await StickerOrder.find({ user: req.user._id }).sort({ createdAt: -1 });
    return res.status(200).json({ orders });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getAllOrders = async (_req, res) => {
  try {
    const orders = await StickerOrder.find()
      .populate('user', 'fullName phone email qrId')
      .sort({ createdAt: -1 });
    return res.status(200).json({ orders });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.updateOrder = async (req, res) => {
  try {
    const order = await StickerOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Sticker order not found' });

    const { status, trackingNumber, dispatchNote } = req.body;
    if (status && status !== order.status && !transitions[order.status]?.includes(status)) {
      return res.status(409).json({ message: `Order cannot move from ${order.status} to ${status}` });
    }

    if (status) order.status = status;
    if (trackingNumber !== undefined) order.trackingNumber = String(trackingNumber).trim();
    if (dispatchNote !== undefined) order.dispatchNote = String(dispatchNote).trim();
    if (status === 'DISPATCHED') order.dispatchedAt = new Date();
    if (status === 'DELIVERED') order.deliveredAt = new Date();

    await order.save();
    await order.populate('user', 'fullName phone email qrId');
    return res.status(200).json({ order });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};