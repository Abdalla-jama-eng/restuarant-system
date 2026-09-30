const express = require('express');
const router = express.Router();
const {
  getMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleAvailability,
} = require('../controllers/menuController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect);

router.route('/').get(getMenuItems).post(adminOnly, createMenuItem);
router.route('/:id').get(getMenuItemById).put(adminOnly, updateMenuItem).delete(adminOnly, deleteMenuItem);
router.patch('/:id/toggle-availability', toggleAvailability);

module.exports = router;
