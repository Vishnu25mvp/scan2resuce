const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/authMiddleware');

// Victim and authentication routes
router.post('/register', authController.registerUser);
router.post('/login', authController.loginUser);
router.get('/me', requireAuth, authController.getCurrentUser);
router.patch('/me', requireAuth, authController.updateCurrentUser);
router.get('/victim/:qrId', authController.getUserByQrId);
router.post('/alert', authController.createAlert);

module.exports = router;
