const express = require('express');
const router = express.Router();
const hospitalController = require('../controllers/hospitalController');
const { requireAdmin } = require('../middleware/adminMiddleware');

router.get('/all', hospitalController.getAllHospitals);
router.get('/nearby', hospitalController.getNearbyHospitals);
router.post('/add', requireAdmin, hospitalController.addHospital);
router.patch('/:id', requireAdmin, hospitalController.updateHospital);
router.delete('/:id', requireAdmin, hospitalController.deleteHospital);

module.exports = router;
