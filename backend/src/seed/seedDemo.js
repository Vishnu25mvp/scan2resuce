const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const User = require('../models/User');
const EmergencyContact = require('../models/EmergencyContact');
const AlertLog = require('../models/AlertLog');
const Hospital = require('../models/Hospital');

const hospitals = [
  {
    name: 'Ganga Hospital',
    phone: '+914222485000',
    address: '313, Mettupalayam Rd, Saibaba Colony, Coimbatore, Tamil Nadu 641043',
    latitude: 11.026193,
    longitude: 76.952542,
  },
  {
    name: 'Kovai Medical Center and Hospital (KMCH)',
    phone: '+914224323800',
    address: '99, Avinashi Rd, Peelamedu, Coimbatore, Tamil Nadu 641014',
    latitude: 11.041967,
    longitude: 77.04044,
  },
  {
    name: 'KG Hospital',
    phone: '+914224042121',
    address: '5, Government Arts College Rd, Gopalapuram, Coimbatore, Tamil Nadu 641018',
    latitude: 11.000232,
    longitude: 76.971573,
  },
  {
    name: 'PSG Hospitals',
    phone: '+914224345353',
    address: 'Avinashi Rd, Peelamedu, Coimbatore, Tamil Nadu 641004',
    latitude: 11.018584,
    longitude: 77.006815,
  },
  {
    name: 'Kongunad Hospital',
    phone: '+914224316000',
    address: '11th St, Tatabad, Coimbatore, Tamil Nadu 641012',
    latitude: 11.017726,
    longitude: 76.960454,
  },
];

const demoUsers = [
  {
    fullName: 'Arun Kumar',
    phone: '+919876543210',
    email: 'arun.demo@example.com',
    bloodGroup: 'O+',
    allergies: 'Penicillin',
    medicalConditions: 'Asthma',
    vehicle: { type: 'Motorcycle', registrationNumber: 'DEMO-ARUN-01', makeModel: 'Demo commuter bike', color: 'Blue' },
    publicEmergencyConsent: true,
    qrId: 'demo-arun-kumar',
    contact: { name: 'Priya Kumar', phone: '+919876543211', relation: 'Primary' },
  },
  {
    fullName: 'Divya Raj',
    phone: '+919876543212',
    email: 'divya.demo@example.com',
    bloodGroup: 'A+',
    allergies: '',
    medicalConditions: 'Diabetes',
    vehicle: { type: 'Car', registrationNumber: 'DEMO-DIVYA-02', makeModel: 'Demo compact car', color: 'Silver' },
    publicEmergencyConsent: true,
    qrId: 'demo-divya-raj',
    contact: { name: 'Raj Kumar', phone: '+919876543213', relation: 'Parent' },
  },
  {
    fullName: 'Karthik S',
    phone: '+919876543214',
    email: 'karthik.demo@example.com',
    bloodGroup: 'B-',
    allergies: 'Peanuts',
    medicalConditions: '',
    vehicle: { type: 'Scooter', registrationNumber: 'DEMO-KARTHIK-03', makeModel: 'Demo scooter', color: 'Black' },
    publicEmergencyConsent: true,
    qrId: 'demo-karthik-s',
    contact: { name: 'Meena S', phone: '+919876543215', relation: 'Sibling' },
  },
];

const seedDemo = async () => {
  try {
    if (!process.env.MONGO_URI) throw new Error('MONGO_URI is not configured');

    await mongoose.connect(process.env.MONGO_URI);
    await Promise.all([
      User.deleteMany({}),
      EmergencyContact.deleteMany({}),
      AlertLog.deleteMany({}),
      Hospital.deleteMany({}),
    ]);

    const password = await bcrypt.hash('Demo@12345', 10);
    const users = await User.insertMany(demoUsers.map(({ contact, ...user }) => ({
      ...user,
      password,
    })));

    await EmergencyContact.insertMany(users.map((user, index) => ({
      user: user._id,
      ...demoUsers[index].contact,
    })));

    const now = Date.now();
    await AlertLog.insertMany([
      {
        user: users[0]._id,
        latitude: 11.018,
        longitude: 76.97,
        type: 'sms_location',
        status: 'ACTIVE',
        createdAt: new Date(now - 10 * 60 * 1000),
      },
      {
        user: users[1]._id,
        latitude: 11.041967,
        longitude: 77.04044,
        type: 'call',
        status: 'RESOLVED',
        createdAt: new Date(now - 2 * 60 * 60 * 1000),
        resolvedAt: new Date(now - 90 * 60 * 1000),
        resolvedBy: users[0]._id,
      },
    ]);

    await Hospital.insertMany(hospitals);

    console.log('Demo data seeded successfully.');
    console.log(`Users: ${users.length}`);
    console.log(`Hospitals: ${hospitals.length}`);
    console.log('Demo user password: Demo@12345');
    console.log('Demo QR IDs: demo-arun-kumar, demo-divya-raj, demo-karthik-s');
    console.log(`Admin username: ${process.env.ADMIN_USERNAME || 'configure ADMIN_USERNAME'}`);
  } finally {
    await mongoose.disconnect();
  }
};

seedDemo().catch((error) => {
  console.error(`Demo seed failed: ${error.message}`);
  process.exitCode = 1;
});
