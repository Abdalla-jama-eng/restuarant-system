const express = require('express');
const router = express.Router();
const { exportBackup, restoreBackup } = require('../controllers/backupController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);

router.get('/export', exportBackup);
router.post('/restore', restoreBackup);

module.exports = router;
