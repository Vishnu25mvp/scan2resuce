const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const stickerOrderController = require('../controllers/stickerOrderController');
const { requireAdmin } = require('../middleware/adminMiddleware');

router.post('/login', adminController.loginAdmin);
router.use(requireAdmin);
router.get('/admins', adminController.getAdmins);
router.post('/admins', adminController.createAdmin);
router.patch('/admins/:id', adminController.updateAdmin);
router.delete('/admins/:id', adminController.deleteAdmin);
router.get('/users', adminController.getAllUsers);
router.patch('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.get('/alerts', adminController.getAllAlerts);
router.get('/stats', adminController.getDashboardStats);
router.patch('/alerts/:id/status', adminController.updateAlertStatus);
router.get('/sticker-orders', stickerOrderController.getAllOrders);
router.patch('/sticker-orders/:id', stickerOrderController.updateOrder);

module.exports = router;
