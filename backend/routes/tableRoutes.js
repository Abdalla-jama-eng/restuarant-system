const express = require('express');
const router = express.Router();
const {
  getTables,
  createTable,
  updateTable,
  deleteTable,
  updateTableStatus,
} = require('../controllers/tableController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect);

router.route('/').get(getTables).post(adminOnly, createTable);
router.route('/:id').put(adminOnly, updateTable).delete(adminOnly, deleteTable);
router.patch('/:id/status', updateTableStatus);

module.exports = router;
