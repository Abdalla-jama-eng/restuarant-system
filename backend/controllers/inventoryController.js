const MenuItem = require('../models/MenuItem');
const InventoryLog = require('../models/InventoryLog');

// @desc Get stock overview and low-stock items
// @route GET /api/inventory
// @access Private
const getInventoryStatus = async (req, res) => {
  try {
    const items = await MenuItem.find({}).sort({ stockQuantity: 1 });
    const lowStockItems = items.filter((i) => i.stockQuantity <= i.minStockThreshold);
    const outOfStockItems = items.filter((i) => i.stockQuantity === 0);

    const totalItems = items.length;
    const totalInventoryValue = items.reduce((sum, item) => sum + item.stockQuantity * item.price, 0);
    const totalCostValue = items.reduce((sum, item) => sum + item.stockQuantity * (item.costPrice || 0), 0);

    res.json({
      items,
      lowStockItems,
      outOfStockItems,
      summary: {
        totalItems,
        lowStockCount: lowStockItems.length,
        outOfStockCount: outOfStockItems.length,
        totalInventoryValue: Math.round(totalInventoryValue * 100) / 100,
        totalCostValue: Math.round(totalCostValue * 100) / 100,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Restock or adjust inventory item
// @route POST /api/inventory/adjust
// @access Private/Admin
const adjustInventory = async (req, res) => {
  try {
    const { menuItemId, quantity, type, reason } = req.body; // type: 'restock' | 'adjustment'
    if (!menuItemId || quantity === undefined) {
      return res.status(400).json({ message: 'Menu item and quantity are required' });
    }

    const item = await MenuItem.findById(menuItemId);
    if (!item) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    const prevStock = item.stockQuantity;
    let newStock;
    let qtyChange = Number(quantity);

    if (type === 'restock') {
      // Add quantity to current stock
      newStock = prevStock + qtyChange;
    } else {
      // Direct set
      newStock = Math.max(0, qtyChange);
      qtyChange = newStock - prevStock;
    }

    item.stockQuantity = newStock;
    await item.save();

    const log = await InventoryLog.create({
      menuItemId: item._id,
      itemName: item.name,
      changeType: type === 'restock' ? 'restock' : 'manual_adjustment',
      quantityChanged: qtyChange,
      previousStock: prevStock,
      newStock: newStock,
      reason: reason || (type === 'restock' ? 'Stock delivery restock' : 'Manual stock count adjustment'),
      user: {
        id: req.user._id,
        name: req.user.name,
      },
    });

    res.json({ item, log });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get inventory movement logs
// @route GET /api/inventory/logs
// @access Private
const getInventoryLogs = async (req, res) => {
  try {
    const { changeType, menuItemId, limit = 150 } = req.query;
    let query = {};

    if (changeType && changeType !== 'All') {
      query.changeType = changeType;
    }

    if (menuItemId) {
      query.menuItemId = menuItemId;
    }

    const logs = await InventoryLog.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getInventoryStatus, adjustInventory, getInventoryLogs };
