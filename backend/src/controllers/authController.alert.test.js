const assert = require('node:assert/strict');
const test = require('node:test');
const User = require('../models/User');
const AlertLog = require('../models/AlertLog');
const hospitalController = require('./hospitalController');
const authController = require('./authController');

test('records state helpline number, region, and caller mode without cooldown suppression', async () => {
  const originals = {
    findUser: User.findOne,
    findRecent: AlertLog.findOne,
    createAlert: AlertLog.create,
    findAlert: AlertLog.findById,
    findNearestHospital: hospitalController.findNearestHospital,
  };
  let savedAlert;
  User.findOne = async () => ({ _id: 'owner-id', publicEmergencyConsent: true });
  AlertLog.findOne = async () => { throw new Error('Helpline calls must not use the duplicate alert cooldown'); };
  AlertLog.create = async (alert) => { savedAlert = { _id: 'alert-id', ...alert }; return savedAlert; };
  AlertLog.findById = () => ({ populate: async () => savedAlert });
  hospitalController.findNearestHospital = async () => null;

  const response = {
    statusCode: 0,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
  const request = {
    body: {
      qrId: 'public-qr-id',
      latitude: 11.018,
      longitude: 76.97,
      type: 'state_helpline',
      emergencyNumber: '108',
      emergencyRegion: 'Tamil Nadu',
      callerMode: 'bystander',
    },
    app: { get: () => ({ emit() {} }) },
  };

  try {
    await authController.createAlert(request, response);
    assert.equal(response.statusCode, 201);
    assert.equal(savedAlert.type, 'state_helpline');
    assert.equal(savedAlert.emergencyNumber, '108');
    assert.equal(savedAlert.emergencyRegion, 'Tamil Nadu');
    assert.equal(savedAlert.callerMode, 'bystander');
  } finally {
    User.findOne = originals.findUser;
    AlertLog.findOne = originals.findRecent;
    AlertLog.create = originals.createAlert;
    AlertLog.findById = originals.findAlert;
    hospitalController.findNearestHospital = originals.findNearestHospital;
  }
});

test('rejects unapproved state helpline numbers', async () => {
  const response = {
    statusCode: 0,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
  await authController.createAlert({ body: { qrId: 'public-qr-id', type: 'state_helpline', emergencyNumber: '999' } }, response);
  assert.equal(response.statusCode, 400);
});

test('allows an authenticated owner to log a helpline call without public card sharing', async () => {
  const originals = {
    findUser: User.findOne,
    createAlert: AlertLog.create,
    findAlert: AlertLog.findById,
    findNearestHospital: hospitalController.findNearestHospital,
  };
  const owner = { _id: 'private-owner-id', publicEmergencyConsent: false };
  let savedAlert;
  User.findOne = async () => owner;
  AlertLog.create = async (alert) => { savedAlert = { _id: 'alert-id', ...alert }; return savedAlert; };
  AlertLog.findById = () => ({ populate: async () => savedAlert });
  hospitalController.findNearestHospital = async () => null;

  const response = {
    statusCode: 0,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };

  try {
    await authController.createAlert({
      user: owner,
      body: {
        qrId: 'private-owner-qr',
        type: 'state_helpline',
        emergencyNumber: '112',
        emergencyRegion: 'Location unavailable',
        callerMode: 'owner',
      },
      app: { get: () => ({ emit() {} }) },
    }, response);
    assert.equal(response.statusCode, 201);
    assert.equal(savedAlert.callerMode, 'owner');
    assert.equal(savedAlert.emergencyNumber, '112');
  } finally {
    User.findOne = originals.findUser;
    AlertLog.create = originals.createAlert;
    AlertLog.findById = originals.findAlert;
    hospitalController.findNearestHospital = originals.findNearestHospital;
  }
});

test('does not allow an unauthenticated bystander to log a call for a private QR profile', async () => {
  const originalFindUser = User.findOne;
  User.findOne = async () => ({ _id: 'private-owner-id', publicEmergencyConsent: false });
  const response = {
    statusCode: 0,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };

  try {
    await authController.createAlert({
      body: {
        qrId: 'private-owner-qr',
        type: 'state_helpline',
        emergencyNumber: '112',
        callerMode: 'bystander',
      },
    }, response);
    assert.equal(response.statusCode, 403);
  } finally {
    User.findOne = originalFindUser;
  }
});