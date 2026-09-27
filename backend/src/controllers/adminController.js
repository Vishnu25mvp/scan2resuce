const User = require('../models/User');
const AlertLog = require('../models/AlertLog');
const EmergencyContact = require('../models/EmergencyContact');
const StickerOrder = require('../models/StickerOrder');
const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.loginAdmin = async (req, res) => {
  const username = String(req.body.username || '').trim();
  const password = String(req.body.password || '');

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD || !process.env.JWT_SECRET) {
    return res.status(503).json({ message: 'Admin authentication is not configured' });
  }

  let admin = await Admin.findOne({ username, active: true });
  let valid = admin ? await bcrypt.compare(password, admin.password) : false;

  if (!admin && username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
    admin = { username, role: 'admin' };
    valid = true;
  }

  if (!valid) return res.status(401).json({ message: 'Invalid admin credentials' });

  const token = jwt.sign(
    { username: admin.username, role: 'admin', adminId: admin._id?.toString() },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  return res.status(200).json({
    token,
    admin: { username: admin.username, role: 'admin' },
  });
};

exports.getAdmins = async (req, res) => {
  const admins = await Admin.find().select('-password').sort({ username: 1 });
  return res.status(200).json(admins);
};

exports.createAdmin = async (req, res) => {
  try {
    const username = String(req.body.username || '').trim();
    const password = String(req.body.password || '');
    if (!username || password.length < 8) {
      return res.status(400).json({ message: 'Username and password of at least 8 characters are required' });
    }

    const admin = await Admin.create({ username, password: await bcrypt.hash(password, 10) });
    return res.status(201).json({ admin: { _id: admin._id, username: admin.username, role: admin.role, active: admin.active } });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'Admin username already exists' });
    return res.status(500).json({ message: error.message });
  }
};

exports.updateAdmin = async (req, res) => {
  try {
    const updates = {};
    if (req.body.username !== undefined) updates.username = String(req.body.username).trim();
    if (req.body.active !== undefined) updates.active = Boolean(req.body.active);
    if (req.body.password) updates.password = await bcrypt.hash(String(req.body.password), 10);
    const admin = await Admin.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).select('-password');
    if (!admin) return res.status(404).json({ message: 'Admin not found' });
    return res.status(200).json({ admin });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'Admin username already exists' });
    return res.status(500).json({ message: error.message });
  }
};

exports.deleteAdmin = async (req, res) => {
  if (req.admin.adminId === req.params.id) return res.status(400).json({ message: 'You cannot delete your own admin account' });
  const admin = await Admin.findByIdAndDelete(req.params.id);
  if (!admin) return res.status(404).json({ message: 'Admin not found' });
  return res.status(204).send();
};

/**
 * Retrieves all registered users (excluding password hashes).
 */
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    const userIds = users.map((user) => user._id);
    const contacts = await EmergencyContact.find({ user: { $in: userIds } })
      .select('user name phone relation');
    const contactsByUser = new Map();

    contacts.forEach((contact) => {
      const userId = contact.user.toString();
      const existing = contactsByUser.get(userId) || [];
      existing.push({ name: contact.name, phone: contact.phone, relation: contact.relation });
      contactsByUser.set(userId, existing);
    });

    return res.status(200).json(users.map((user) => ({
      ...user.toObject(),
      contacts: contactsByUser.get(user._id.toString()) || [],
    })));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const updates = {};
    for (const field of ['fullName', 'email', 'bloodGroup', 'allergies', 'medicalConditions']) {
      if (req.body[field] !== undefined) updates[field] = String(req.body[field]).trim();
    }
    if (req.body.vehicle !== undefined) {
      const vehicle = req.body.vehicle && typeof req.body.vehicle === 'object' ? req.body.vehicle : {};
      updates.vehicle = {
        type: String(vehicle.type || '').trim(),
        registrationNumber: String(vehicle.registrationNumber || '').trim().toUpperCase(),
        makeModel: String(vehicle.makeModel || '').trim(),
        color: String(vehicle.color || '').trim(),
      };
    }

    if (updates.email) updates.email = updates.email.toLowerCase();
    if (updates.bloodGroup) updates.bloodGroup = updates.bloodGroup.toUpperCase();
    if (!updates.fullName) return res.status(400).json({ message: 'Full name is required' });

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.status(200).json({ user });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'Email is already registered' });
    return res.status(500).json({ message: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    await Promise.all([
      EmergencyContact.deleteMany({ user: user._id }),
      AlertLog.deleteMany({ user: user._id }),
      StickerOrder.deleteMany({ user: user._id }),
    ]);

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/**
 * Retrieves all registered emergency alerts, populated with the user details.
 * Ordered by creation date in descending order.
 */
exports.getAllAlerts = async (req, res) => {
  try {
    const alerts = await AlertLog.find()
      .populate('user', 'fullName phone bloodGroup allergies medicalConditions')
      .sort({ createdAt: -1 });

    return res.status(200).json(alerts);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/**
 * Retrieves statistics for the admin dashboard.
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalAlerts = await AlertLog.countDocuments();
    const activeAlerts = await AlertLog.countDocuments({ status: 'ACTIVE' });
    const resolvedAlerts = await AlertLog.countDocuments({ status: 'RESOLVED' });
    const pendingStickerOrders = await StickerOrder.countDocuments({ status: { $in: ['PENDING', 'PROCESSING'] } });

    // Calculate start and end of today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const alertsToday = await AlertLog.countDocuments({
      createdAt: {
        $gte: startOfToday,
        $lte: endOfToday,
      },
    });

    return res.status(200).json({
      totalUsers,
      totalAlerts,
      activeAlerts,
      resolvedAlerts,
      alertsToday,
      pendingStickerOrders,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.updateAlertStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['ACTIVE', 'RESOLVED'].includes(status)) {
      return res.status(400).json({ message: 'Status must be ACTIVE or RESOLVED' });
    }

    const alert = await AlertLog.findByIdAndUpdate(
      req.params.id,
      {
        status,
        resolvedAt: status === 'RESOLVED' ? new Date() : undefined,
      },
      { new: true, runValidators: true }
    ).populate('user', 'fullName phone bloodGroup allergies medicalConditions');

    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    req.app.get('io')?.emit('alert_updated', alert);

    return res.status(200).json({ alert });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
