const express = require('express');
const publicEmergencyController = require('../controllers/publicEmergencyController');

const router = express.Router();
router.get('/emergency/:qrId', publicEmergencyController.getPublicEmergencyCard);

module.exports = router;