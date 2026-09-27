const mongoose = require('mongoose');
const path = require('path');

// Load environment variables from backend/.env (robust resolution)
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const Hospital = require('../models/Hospital');

const hospitals = [
  { name: "Ganga Hospital", phone: "+914222485000", address: "313, Mettupalayam Rd, Saibaba Colony, Coimbatore, Tamil Nadu 641043", latitude: 11.026193, longitude: 76.952542 },
  { name: "Kovai Medical Center and Hospital (KMCH)", phone: "+914224323800", address: "99, Avinashi Rd, Peelamedu, Coimbatore, Tamil Nadu 641014", latitude: 11.041967, longitude: 77.040440 },
  { name: "KG Hospital", phone: "+914224042121", address: "5, Government Arts College Rd, Gopalapuram, Coimbatore, Tamil Nadu 641018", latitude: 11.000232, longitude: 76.971573 },
  { name: "PSG Hospitals", phone: "+914224345353", address: "Avinashi Rd, Peelamedu, Coimbatore, Tamil Nadu 641004", latitude: 11.018584, longitude: 77.006815 },
  { name: "Kongunad Hospital", phone: "+914224316000", address: "11th St, Tatabad, Coimbatore, Tamil Nadu 641012", latitude: 11.017726, longitude: 76.960454 },
  { name: "Sri Ramakrishna Hospital", phone: "+914224500000", address: "395, Sarojini Naidu Rd, Siddhapudur, Coimbatore, Tamil Nadu 641044", latitude: 11.023180, longitude: 76.977733 }
];

const seedHospitals = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected successfully.');

    console.log('Clearing existing hospitals...');
    await Hospital.deleteMany({});
    console.log('Existing hospitals cleared.');

    console.log('Seeding new hospitals...');
    const inserted = await Hospital.insertMany(hospitals);
    console.log(`Real hospitals seeded successfully. Total inserted: ${inserted.length}`);

    await mongoose.connection.close();
    console.log('Mongoose connection closed. Exiting.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding hospitals:', error.message);
    process.exit(1);
  }
};

seedHospitals();
