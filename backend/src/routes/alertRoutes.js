const express = require('express');
const authController = require('../controllers/authController');
const { optionalAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', optionalAuth, authController.createAlert);

module.exports = router;