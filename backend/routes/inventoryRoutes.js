const express = require('express');
const router = express.Router();
const {
  getInventoryStatus,
  adjustInventory,
  getInventoryLogs,
} = require('../controllers/inventoryController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect);

router.get('/', getInventoryStatus);
router.post('/adjust', adminOnly, adjustInventory);
router.get('/logs', getInventoryLogs);

module.exports = router;
