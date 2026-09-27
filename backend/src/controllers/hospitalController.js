const logger = require('../config/logger');

const Hospital = require('../models/Hospital');
const { distanceKm, parseCoordinates, sortByDistance } = require('../utils/geo');

/**
 * Calculates the distance between two points in kilometers using the Haversine formula.
 */
/**
 * Adds a new hospital to the database.
 */
exports.addHospital = async (req, res) => {
  try {
    const { name, phone, address, latitude, longitude } = req.body;

    if (!name || !phone || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ message: 'Name, phone, latitude, and longitude are required' });
    }

    if (!Number.isFinite(Number(latitude)) || Number(latitude) < -90 || Number(latitude) > 90) {
      return res.status(400).json({ message: 'Latitude must be between -90 and 90' });
    }

    if (!Number.isFinite(Number(longitude)) || Number(longitude) < -180 || Number(longitude) > 180) {
      return res.status(400).json({ message: 'Longitude must be between -180 and 180' });
    }

    const hospital = await Hospital.create({
      name,
      phone,
      address: address || '',
      latitude: Number(latitude),
      longitude: Number(longitude),
    });

    return res.status(201).json(hospital);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.updateHospital = async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.latitude !== undefined) updates.latitude = Number(updates.latitude);
    if (updates.longitude !== undefined) updates.longitude = Number(updates.longitude);

    if (updates.latitude !== undefined && (!Number.isFinite(updates.latitude) || updates.latitude < -90 || updates.latitude > 90)) {
      return res.status(400).json({ message: 'Latitude must be between -90 and 90' });
    }
    if (updates.longitude !== undefined && (!Number.isFinite(updates.longitude) || updates.longitude < -180 || updates.longitude > 180)) {
      return res.status(400).json({ message: 'Longitude must be between -180 and 180' });
    }

    const hospital = await Hospital.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!hospital) return res.status(404).json({ message: 'Hospital not found' });
    return res.status(200).json(hospital);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.deleteHospital = async (req, res) => {
  try {
    const hospital = await Hospital.findByIdAndDelete(req.params.id);
    if (!hospital) return res.status(404).json({ message: 'Hospital not found' });
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/**
 * Retrieves all registered hospitals.
 */
exports.getAllHospitals = async (req, res) => {
  try {
    const hospitals = await Hospital.find();
    return res.status(200).json(hospitals);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getNearbyHospitals = async (req, res) => {
  const coordinates = parseCoordinates(req.query);
  if (!coordinates) {
    return res.status(400).json({ message: 'Valid latitude and longitude are required' });
  }

  try {
    const hospitals = await Hospital.find();
    return res.status(200).json(sortByDistance(hospitals, coordinates.latitude, coordinates.longitude));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/**
 * Static helper function (not exposed as a route) to find the closest hospital using coordinates.
 */
exports.findNearestHospital = async (latitude, longitude) => {
  try {
    const hospitals = await Hospital.find();
    if (hospitals.length === 0) {
      return null;
    }

    let nearest = null;
    let minDistance = Infinity;

    for (const hospital of hospitals) {
      const distance = distanceKm(
        latitude,
        longitude,
        hospital.latitude,
        hospital.longitude
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearest = hospital;
      }
    }

    if (!nearest) return null;

    return {
      name: nearest.name,
      phone: nearest.phone,
      address: nearest.address,
      latitude: nearest.latitude,
      longitude: nearest.longitude,
      distanceKm: parseFloat(minDistance.toFixed(1)),
    };
  } catch (error) {
    logger.error({ err: error }, 'Error finding nearest hospital');
    return null;
  }
};
