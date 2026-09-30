const express = require('express');
const router = express.Router();
const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect);

router.route('/').get(getCategories).post(adminOnly, createCategory);
router.route('/:id').put(adminOnly, updateCategory).delete(adminOnly, deleteCategory);

module.exports = router;
