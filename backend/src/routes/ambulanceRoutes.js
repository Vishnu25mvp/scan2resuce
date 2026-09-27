const express = require('express');
const ambulanceController = require('../controllers/ambulanceController');
const { requireAdmin } = require('../middleware/adminMiddleware');

const router = express.Router();

router.get('/all', ambulanceController.getAllAmbulances);
router.get('/nearby', ambulanceController.getNearbyAmbulances);
router.use(requireAdmin);
router.get('/admin/all', ambulanceController.getAdminAmbulances);
router.post('/', ambulanceController.createAmbulance);
router.patch('/:id', ambulanceController.updateAmbulance);
router.delete('/:id', ambulanceController.deleteAmbulance);

module.exports = router;