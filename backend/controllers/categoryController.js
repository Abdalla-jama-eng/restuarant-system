const Category = require('../models/Category');
const MenuItem = require('../models/MenuItem');

// @desc Get all categories
// @route GET /api/categories
// @access Private
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({}).sort({ createdAt: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Create category
// @route POST /api/categories
// @access Private/Admin
const createCategory = async (req, res) => {
  try {
    const { name, description, icon, color } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const exists = await Category.findOne({ name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } });
    if (exists) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    const category = await Category.create({
      name: name.trim(),
      description: description || '',
      icon: icon || 'Utensils',
      color: color || '#f97316',
    });

    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Update category
// @route PUT /api/categories/:id
// @access Private/Admin
const updateCategory = async (req, res) => {
  try {
    const { name, description, icon, color, isActive } = req.body;
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const oldName = category.name;
    if (name) category.name = name.trim();
    if (description !== undefined) category.description = description;
    if (icon !== undefined) category.icon = icon;
    if (color !== undefined) category.color = color;
    if (isActive !== undefined) category.isActive = isActive;

    const updated = await category.save();

    // If category name changed, update menu items under this category
    if (name && name.trim() !== oldName) {
      await MenuItem.updateMany({ category: oldName }, { category: name.trim() });
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Delete category
// @route DELETE /api/categories/:id
// @access Private/Admin
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Check if items exist under this category
    const itemCount = await MenuItem.countDocuments({ category: category.name });
    if (itemCount > 0) {
      return res.status(400).json({
        message: `Cannot delete category: contains ${itemCount} active menu item(s). Reassign or delete them first.`,
      });
    }

    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
