const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const EmergencyContact = require('../models/EmergencyContact');
const AlertLog = require('../models/AlertLog');
const hospitalController = require('./hospitalController');

/**
 * Helper to generate a 30-day JWT token
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

/**
 * Registers a new user, generates a unique QR ID, and sets up a primary emergency contact.
 */
exports.registerUser = async (req, res) => {
  try {
    const fullName = String(req.body.fullName || '').trim();
    const phone = String(req.body.phone || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const bloodGroup = String(req.body.bloodGroup || '').trim().toUpperCase();
    const allergies = String(req.body.allergies || '').trim();
    const medicalConditions = String(req.body.medicalConditions || '').trim();
    const emergencyContactName = String(req.body.emergencyContactName || '').trim();
    const emergencyContactPhone = String(req.body.emergencyContactPhone || '').trim();
    const vehicleInput = req.body.vehicle && typeof req.body.vehicle === 'object' ? req.body.vehicle : {};
    const vehicle = {
      type: String(vehicleInput.type || '').trim(),
      registrationNumber: String(vehicleInput.registrationNumber || '').trim().toUpperCase(),
      makeModel: String(vehicleInput.makeModel || '').trim(),
      color: String(vehicleInput.color || '').trim(),
    };
    const publicEmergencyConsent = req.body.publicEmergencyConsent === true;

    // 1. Validation
    if (
      !fullName ||
      !phone ||
      !email ||
      !password ||
      !bloodGroup ||
      !emergencyContactName ||
      !emergencyContactPhone
    ) {
      return res.status(400).json({ message: 'Please fill in all required fields' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    if (!/^\+?[0-9 ()-]{7,20}$/.test(phone) || !/^\+?[0-9 ()-]{7,20}$/.test(emergencyContactPhone)) {
      return res.status(400).json({ message: 'Please provide valid phone numbers' });
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    // 2. Check duplicates (Phone or Email)
    const phoneExists = await User.findOne({ phone });
    if (phoneExists) {
      return res.status(400).json({ message: 'Phone number already registered' });
    }

    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ message: 'Email address already registered' });
    }

    // 3. Password Hashing
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Generate cryptographically unique qrId
    const qrId = uuidv4();

    // 5. Create User
    const user = await User.create({
      fullName,
      phone,
      email,
      password: hashedPassword,
      bloodGroup,
      allergies,
      medicalConditions,
      vehicle,
      publicEmergencyConsent,
      qrId,
    });

    // 6. Create Primary Emergency Contact
    await EmergencyContact.create({
      user: user._id,
      name: emergencyContactName,
      phone: emergencyContactPhone,
      relation: 'Primary',
    });

    // 7. Generate Response (User without password)
    const userResponse = {
      _id: user._id,
      fullName: user.fullName,
      phone: user.phone,
      email: user.email,
      bloodGroup: user.bloodGroup,
      allergies: user.allergies,
      medicalConditions: user.medicalConditions,
      vehicle: user.vehicle,
      publicEmergencyConsent: user.publicEmergencyConsent,
      qrId: user.qrId,
      createdAt: user.createdAt,
    };

    const token = generateToken(user._id);

    return res.status(201).json({
      user: userResponse,
      token,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

/**
 * Authenticates user by email or phone and password, returns JWT.
 */
exports.loginUser = async (req, res) => {
  try {
    const identifier = req.body.identifier || req.body.email || req.body.phone;
    const { password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Please enter all login credentials' });
    }

    // Find user by email or phone
    const user = await User.findOne({
      $or: [{ email: identifier.toLowerCase() }, { phone: identifier }],
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const userResponse = {
      _id: user._id,
      fullName: user.fullName,
      phone: user.phone,
      email: user.email,
      bloodGroup: user.bloodGroup,
      allergies: user.allergies,
      medicalConditions: user.medicalConditions,
      vehicle: user.vehicle,
      publicEmergencyConsent: user.publicEmergencyConsent,
      qrId: user.qrId,
      createdAt: user.createdAt,
    };

    const token = generateToken(user._id);

    return res.status(200).json({
      user: userResponse,
      token,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getCurrentUser = async (req, res) => {
  return res.status(200).json({
    user: req.user,
  });
};

exports.updateCurrentUser = async (req, res) => {
  const updates = {};

  if (req.body.fullName !== undefined) updates.fullName = String(req.body.fullName).trim();
  if (req.body.email !== undefined) updates.email = String(req.body.email).trim().toLowerCase();
  if (req.body.bloodGroup !== undefined) updates.bloodGroup = String(req.body.bloodGroup).trim().toUpperCase();
  if (req.body.allergies !== undefined) updates.allergies = String(req.body.allergies).trim();
  if (req.body.medicalConditions !== undefined) {
    updates.medicalConditions = String(req.body.medicalConditions).trim();
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
  if (typeof req.body.publicEmergencyConsent === 'boolean') {
    updates.publicEmergencyConsent = req.body.publicEmergencyConsent;
  }

  if (updates.fullName === '') {
    return res.status(400).json({ message: 'Full name cannot be empty' });
  }

  if (updates.email && !/^\S+@\S+\.\S+$/.test(updates.email)) {
    return res.status(400).json({ message: 'Please provide a valid email address' });
  }

  try {
    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    }).select('-password');

    return res.status(200).json({ user });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Email address already registered' });
    }
    throw error;
  }
};

/**
 * Fetches non-sensitive profile information and emergency contacts linked to a specific QR ID.
 */
exports.getUserByQrId = async (req, res) => {
  try {
    const { qrId } = req.params;

    if (process.env.NODE_ENV !== 'production' && process.env.DEBUG_VICTIM_OTP) {
      const debugOtp = req.get('x-debug-otp') || req.query.debugOtp;
      if (debugOtp !== process.env.DEBUG_VICTIM_OTP) {
        return res.status(401).json({ message: 'A valid debug OTP is required for QR lookup' });
      }
    }

    const user = await User.findOne({ qrId });
    if (!user) {
      return res.status(404).json({
        message: 'Invalid QR code. This code is not registered in Scan2Rescue.',
      });
    }

    // Fetch associated emergency contacts
    const emergencyContacts = await EmergencyContact.find({ user: user._id }).select('name phone relation -_id');

    // Return only non-sensitive data
    const victimData = {
      fullName: user.fullName,
      phone: user.phone,
      bloodGroup: user.bloodGroup,
      allergies: user.allergies,
      medicalConditions: user.medicalConditions,
      vehicle: user.vehicle,
      emergencyContacts,
    };

    if (req.accepts('html') === 'html') {
      const escapeHtml = (value) => String(value || '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
      const contactsHtml = emergencyContacts.length > 0
        ? emergencyContacts.map((contact) => (
          `<li><strong>${escapeHtml(contact.name)}</strong> (${escapeHtml(contact.relation)}) `
          + `<a href="tel:${escapeHtml(String(contact.phone).replace(/[^+0-9]/g, ''))}">Call ${escapeHtml(contact.phone)}</a></li>`
        )).join('')
        : '<li>No emergency contacts listed</li>';
      const vehicle = user.vehicle || {};
      const ownerPhone = String(user.phone || '').replace(/[^+0-9]/g, '');

      return res.type('html').send(`<!doctype html>
<html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Scan2Rescue Emergency Card</title>
<style>body{font-family:system-ui,sans-serif;background:#101317;color:#f9fafb;padding:18px;max-width:720px;margin:auto}main{padding:22px 0}h1{color:#f06a64;font-size:22px}h2{font-size:25px;margin:4px 0 12px}h3{font-size:16px;margin:0 0 12px}section{background:#1b2026;border:1px solid #343a40;border-radius:8px;padding:17px;margin:12px 0}dl{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px}dt{color:#9ca3af;font-size:12px}dd{margin:4px 0 0;overflow-wrap:anywhere}a{color:#fff}li{margin:12px 0}.call{display:inline-block;background:#c93632;padding:9px 12px;border-radius:6px;text-decoration:none}.muted{color:#9ca3af;font-size:13px}@media(max-width:440px){body{padding:12px}}</style>
</head><body><main><h1>Scan2Rescue · Emergency Card</h1>
<section><h2>${escapeHtml(victimData.fullName)}</h2>${ownerPhone ? `<a class="call" href="tel:${escapeHtml(ownerPhone)}">Call owner · ${escapeHtml(user.phone)}</a>` : ''}</section>
<section><h3>Vehicle details</h3><dl><div><dt>Registration</dt><dd>${escapeHtml(vehicle.registrationNumber) || 'Not listed'}</dd></div>
<div><dt>Vehicle</dt><dd>${escapeHtml([vehicle.type, vehicle.makeModel].filter(Boolean).join(' · ')) || 'Not listed'}</dd></div>
<div><dt>Color</dt><dd>${escapeHtml(vehicle.color) || 'Not listed'}</dd></div></dl></section>
<section><h3>Emergency information</h3><dl><div><dt>Blood group</dt><dd>${escapeHtml(victimData.bloodGroup) || 'Not listed'}</dd></div>
<div><dt>Allergies</dt><dd>${escapeHtml(victimData.allergies) || 'None declared'}</dd></div>
<div><dt>Medical conditions</dt><dd>${escapeHtml(victimData.medicalConditions) || 'None declared'}</dd></div></dl></section>
<section><h3>Emergency contacts</h3><ul>${contactsHtml}</ul></section>
<section><h3>Nearby hospitals</h3><div id="hospitals" class="muted">Requesting location to find nearby services...</div></section>
<section><h3>Available ambulances</h3><div id="ambulances" class="muted">Loading directory...</div></section>
</main><script>
function renderResources(elementId, items, fallback) {
  const target = document.getElementById(elementId);
  target.replaceChildren();
  if (!items.length) { target.textContent = fallback; return; }
  for (const item of items) {
    const row = document.createElement('p');
    const title = document.createElement('strong');
    title.textContent = item.name || 'Emergency service';
    row.append(title);
    const details = document.createElement('span');
    details.className = 'muted';
    details.textContent = (item.address || 'Address not listed') + (Number.isFinite(item.distanceKm) ? ' · ' + item.distanceKm + ' km' : '');
    row.append(document.createElement('br'), details, document.createElement('br'));
    if (item.phone) {
      const call = document.createElement('a');
      call.className = 'call';
      call.href = 'tel:' + String(item.phone).replace(/[^+0-9]/g, '');
      call.textContent = 'Call ' + item.phone;
      row.append(call);
    }
    target.append(row);
  }
}
async function loadResources(latitude, longitude) {
  const mode = latitude === undefined ? 'all' : 'nearby';
  const query = latitude === undefined ? '' : '?latitude=' + latitude + '&longitude=' + longitude;
  const results = await Promise.allSettled([
    fetch('/api/hospitals/' + mode + query).then((response) => response.json()),
    fetch('/api/ambulances/' + mode + query).then((response) => response.json()),
  ]);
  renderResources('hospitals', results[0].status === 'fulfilled' && Array.isArray(results[0].value) ? results[0].value : [], 'No hospitals are listed.');
  renderResources('ambulances', results[1].status === 'fulfilled' && Array.isArray(results[1].value) ? results[1].value : [], 'No available ambulances are listed.');
}
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(({ coords }) => loadResources(coords.latitude, coords.longitude), () => loadResources(), { timeout: 10000, maximumAge: 60000 });
} else { loadResources(); }
</script></body></html>`);
    }

    return res.status(200).json(victimData);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/**
 * Logs an emergency alert and checks for the nearest hospital if coordinates are supplied.
 */
exports.createAlert = async (req, res) => {
  try {
    const {
      qrId,
      latitude,
      longitude,
      type = 'sms_location',
      emergencyNumber,
      emergencyRegion,
      callerMode = 'owner',
    } = req.body;

    if (!qrId) {
      return res.status(400).json({ message: 'QR ID is required to register an alert' });
    }

    if (latitude !== undefined && (typeof latitude !== 'number' || latitude < -90 || latitude > 90)) {
      return res.status(400).json({ message: 'Latitude must be a number between -90 and 90' });
    }

    if (longitude !== undefined && (typeof longitude !== 'number' || longitude < -180 || longitude > 180)) {
      return res.status(400).json({ message: 'Longitude must be a number between -180 and 180' });
    }

    if (!['call', 'sms_location', 'state_helpline'].includes(type)) {
      return res.status(400).json({ message: 'Invalid alert type' });
    }
    if (type === 'state_helpline' && !['108', '112'].includes(String(emergencyNumber))) {
      return res.status(400).json({ message: 'Emergency number must be a supported helpline' });
    }
    if (type === 'state_helpline' && !['owner', 'bystander'].includes(callerMode)) {
      return res.status(400).json({ message: 'Caller mode must be owner or bystander' });
    }

    const user = await User.findOne({ qrId });
    if (!user) {
      return res.status(404).json({ message: 'User associated with QR ID not found' });
    }

    const isAuthenticatedOwner = req.user && String(req.user._id) === String(user._id);
    if (type === 'state_helpline' && callerMode === 'owner' && req.user && !isAuthenticatedOwner) {
      return res.status(403).json({ message: 'You can only log your own emergency call as the owner' });
    }

    if (type === 'state_helpline' && !user.publicEmergencyConsent && !isAuthenticatedOwner) {
      return res.status(403).json({ message: 'The owner has not enabled public emergency-card sharing' });
    }

    const recentActiveAlert = type === 'state_helpline' ? null : await AlertLog.findOne({
      user: user._id,
      status: 'ACTIVE',
      createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) },
    });

    if (recentActiveAlert) {
      return res.status(409).json({
        message: 'An active alert already exists for this user',
        alert: recentActiveAlert,
      });
    }

    // Log the alert
    const alert = await AlertLog.create({
      user: user._id,
      latitude,
      longitude,
      type,
      emergencyNumber: type === 'state_helpline' ? String(emergencyNumber) : '',
      emergencyRegion: type === 'state_helpline' ? String(emergencyRegion || '').trim().slice(0, 100) : '',
      callerMode: type === 'state_helpline' ? callerMode : 'owner',
    });

    const populatedAlert = await AlertLog.findById(alert._id)
      .populate('user', 'fullName phone bloodGroup allergies medicalConditions');

    let nearestHospital = null;
    if (latitude !== undefined && longitude !== undefined) {
      nearestHospital = await hospitalController.findNearestHospital(latitude, longitude);
    }

    req.app.get('io')?.emit('new_alert', populatedAlert);

    return res.status(201).json({
      alert: populatedAlert,
      nearestHospital,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
