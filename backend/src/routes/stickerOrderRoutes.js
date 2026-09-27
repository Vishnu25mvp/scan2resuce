const express = require('express');
const stickerOrderController = require('../controllers/stickerOrderController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(requireAuth);
router.get('/mine', stickerOrderController.getMyOrders);
router.post('/', stickerOrderController.createOrder);

module.exports = router;