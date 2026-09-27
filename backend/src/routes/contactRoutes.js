const express = require('express');
const contactController = require('../controllers/contactController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(requireAuth);
router.get('/', contactController.getContacts);
router.post('/', contactController.createContact);
router.delete('/:id', contactController.deleteContact);

module.exports = router;
