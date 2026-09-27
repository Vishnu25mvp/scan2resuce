const Ambulance = require('../models/Ambulance');
const { parseCoordinates, sortByDistance } = require('../utils/geo');

exports.getAllAmbulances = async (_req, res) => {
  try {
    const ambulances = await Ambulance.find({ available: true }).sort({ name: 1 });
    return res.status(200).json(ambulances);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getNearbyAmbulances = async (req, res) => {
  const coordinates = parseCoordinates(req.query);
  if (!coordinates) {
    return res.status(400).json({ message: 'Valid latitude and longitude are required' });
  }

  try {
    const ambulances = await Ambulance.find({ available: true });
    return res.status(200).json(sortByDistance(ambulances, coordinates.latitude, coordinates.longitude));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.createAmbulance = async (req, res) => {
  try {
    const ambulance = await Ambulance.create(req.body);
    return res.status(201).json({ ambulance });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

exports.updateAmbulance = async (req, res) => {
  try {
    const ambulance = await Ambulance.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!ambulance) return res.status(404).json({ message: 'Ambulance not found' });
    return res.status(200).json({ ambulance });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

exports.deleteAmbulance = async (req, res) => {
  try {
    const ambulance = await Ambulance.findByIdAndDelete(req.params.id);
    if (!ambulance) return res.status(404).json({ message: 'Ambulance not found' });
    return res.status(204).send();
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

exports.getAdminAmbulances = async (_req, res) => {
  try {
    const ambulances = await Ambulance.find().sort({ name: 1 });
    return res.status(200).json(ambulances);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};