const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect);

router.route('/').get(getSettings).put(adminOnly, updateSettings);

module.exports = router;
