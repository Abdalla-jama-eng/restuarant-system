const express = require('express');
const router = express.Router();
const { getSalesReport } = require('../controllers/reportController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);

router.get('/sales', getSalesReport);

module.exports = router;
