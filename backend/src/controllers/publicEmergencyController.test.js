const assert = require('node:assert/strict');
const test = require('node:test');
const User = require('../models/User');
const EmergencyContact = require('../models/EmergencyContact');
const controller = require('./publicEmergencyController');

test('public QR response exposes emergency fields only and does not require a debug OTP', async () => {
  const originalFindOne = User.findOne;
  const originalFindContacts = EmergencyContact.find;
  User.findOne = async ({ qrId }) => qrId === 'public-qr-id' ? {
    _id: 'internal-user-id',
    fullName: 'Alex Kumar',
    phone: '+919876543210',
    email: 'private@example.com',
    password: 'private-hash',
    bloodGroup: 'O+',
    allergies: 'Penicillin',
    medicalConditions: 'Asthma',
    publicEmergencyConsent: true,
    vehicle: { type: 'motorcycle', registrationNumber: 'TN38AB1234', makeModel: 'Honda', color: 'Red' },
  } : null;
  EmergencyContact.find = () => ({
    select: async () => [{ name: 'Priya', phone: '+919876543211', relation: 'Primary' }],
  });

  const response = {
    statusCode: 0,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };

  try {
    await controller.getPublicEmergencyCard({ params: { qrId: 'public-qr-id' } }, response);
    assert.equal(response.statusCode, 200);
    assert.equal(response.body.fullName, 'Alex Kumar');
    assert.equal(response.body.vehicle.registrationNumber, 'TN38AB1234');
    assert.equal(response.body.emergencyContacts[0].name, 'Priya');
    assert.equal(response.body.email, undefined);
    assert.equal(response.body.password, undefined);
    assert.equal(response.body._id, undefined);
  } finally {
    User.findOne = originalFindOne;
    EmergencyContact.find = originalFindContacts;
  }
});

test('public QR lookup refuses profiles without explicit sharing consent', async () => {
  const originalFindOne = User.findOne;
  User.findOne = async () => ({
    _id: 'private-user-id',
    fullName: 'Private User',
    publicEmergencyConsent: false,
  });

  const response = {
    statusCode: 0,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };

  try {
    await controller.getPublicEmergencyCard({ params: { qrId: 'private-qr-id' } }, response);
    assert.equal(response.statusCode, 403);
    assert.match(response.body.message, /not enabled/i);
  } finally {
    User.findOne = originalFindOne;
  }
});