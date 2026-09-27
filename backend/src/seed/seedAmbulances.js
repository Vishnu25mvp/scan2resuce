const mongoose = require('mongoose');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const Ambulance = require('../models/Ambulance');

const demoAmbulances = [
  {
    name: 'DEMO ONLY - Ambulance North',
    provider: 'Training placeholder - replace with a verified service',
    phone: '0000000000',
    address: 'Coimbatore north area - demo coordinates',
    latitude: 11.045,
    longitude: 76.955,
    available: false,
  },
  {
    name: 'DEMO ONLY - Ambulance South',
    provider: 'Training placeholder - replace with a verified service',
    phone: '0000000000',
    address: 'Coimbatore south area - demo coordinates',
    latitude: 10.99,
    longitude: 76.97,
    available: false,
  },
];

async function seedAmbulances() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Demo ambulance records cannot be seeded in production');
  }
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is not configured');

  await mongoose.connect(process.env.MONGO_URI);
  try {
    const result = await Ambulance.bulkWrite(demoAmbulances.map((ambulance) => ({
      updateOne: {
        filter: { name: ambulance.name, provider: ambulance.provider },
        update: { $set: ambulance },
        upsert: true,
      },
    })));
    console.log(`Seeded ${result.upsertedCount + result.modifiedCount} unavailable demo ambulance records.`);
    console.log('Replace these placeholders with verified providers before enabling availability.');
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  seedAmbulances().catch((error) => {
    console.error(`Ambulance seed failed: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = { demoAmbulances, seedAmbulances };