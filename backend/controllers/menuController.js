const MenuItem = require('../models/MenuItem');
const InventoryLog = require('../models/InventoryLog');

// @desc Get all menu items with search/filter
// @route GET /api/menu
// @access Private
const getMenuItems = async (req, res) => {
  try {
    const { category, search, availableOnly } = req.query;
    let query = {};

    if (category && category !== 'All') {
      query.category = category;
    }

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    if (availableOnly === 'true') {
      query.isAvailable = true;
    }

    const items = await MenuItem.find(query).sort({ category: 1, name: 1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get single menu item
// @route GET /api/menu/:id
// @access Private
const getMenuItemById = async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Create menu item
// @route POST /api/menu
// @access Private/Admin
const createMenuItem = async (req, res) => {
  try {
    const {
      name,
      code,
      category,
      categoryId,
      price,
      costPrice,
      stockQuantity,
      minStockThreshold,
      isAvailable,
      image,
      description,
    } = req.body;

    if (!name || price === undefined || !category) {
      return res.status(400).json({ message: 'Name, category and price are required' });
    }

    const item = await MenuItem.create({
      name: name.trim(),
      code: code ? code.trim() : '',
      category: category.trim(),
      categoryId: categoryId || null,
      price: Number(price),
      costPrice: costPrice ? Number(costPrice) : 0,
      stockQuantity: stockQuantity !== undefined ? Number(stockQuantity) : 100,
      minStockThreshold: minStockThreshold !== undefined ? Number(minStockThreshold) : 10,
      isAvailable: isAvailable !== undefined ? isAvailable : true,
      image: image || '🍽️',
      description: description || '',
    });

    // Create initial stock log
    if (item.stockQuantity > 0) {
      await InventoryLog.create({
        menuItemId: item._id,
        itemName: item.name,
        changeType: 'restock',
        quantityChanged: item.stockQuantity,
        previousStock: 0,
        newStock: item.stockQuantity,
        reason: 'Initial stock on item creation',
        user: {
          id: req.user._id,
          name: req.user.name,
        },
      });
    }

    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Update menu item
// @route PUT /api/menu/:id
// @access Private/Admin
const updateMenuItem = async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    const {
      name,
      code,
      category,
      categoryId,
      price,
      costPrice,
      stockQuantity,
      minStockThreshold,
      isAvailable,
      image,
      description,
    } = req.body;

    if (name) item.name = name.trim();
    if (code !== undefined) item.code = code.trim();
    if (category) item.category = category.trim();
    if (categoryId !== undefined) item.categoryId = categoryId;
    if (price !== undefined) item.price = Number(price);
    if (costPrice !== undefined) item.costPrice = Number(costPrice);
    if (minStockThreshold !== undefined) item.minStockThreshold = Number(minStockThreshold);
    if (isAvailable !== undefined) item.isAvailable = isAvailable;
    if (image !== undefined) item.image = image;
    if (description !== undefined) item.description = description;

    // If stock quantity manually edited here
    if (stockQuantity !== undefined && Number(stockQuantity) !== item.stockQuantity) {
      const prev = item.stockQuantity;
      const nextStock = Number(stockQuantity);
      const diff = nextStock - prev;
      item.stockQuantity = nextStock;

      await InventoryLog.create({
        menuItemId: item._id,
        itemName: item.name,
        changeType: 'manual_adjustment',
        quantityChanged: diff,
        previousStock: prev,
        newStock: nextStock,
        reason: 'Manual adjustment in Menu Editor',
        user: {
          id: req.user._id,
          name: req.user.name,
        },
      });
    }

    const updated = await item.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Delete menu item
// @route DELETE /api/menu/:id
// @access Private/Admin
const deleteMenuItem = async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    await MenuItem.findByIdAndDelete(req.params.id);
    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Toggle item availability
// @route PATCH /api/menu/:id/toggle-availability
// @access Private
const toggleAvailability = async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    item.isAvailable = !item.isAvailable;
    await item.save();

    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleAvailability,
};
