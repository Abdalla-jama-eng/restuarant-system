const User = require('../models/User');
const Category = require('../models/Category');
const MenuItem = require('../models/MenuItem');
const Table = require('../models/Table');
const Order = require('../models/Order');
const InventoryLog = require('../models/InventoryLog');
const Setting = require('../models/Setting');

// @desc Export all database collections to JSON
// @route GET /api/backup/export
// @access Private/Admin
const exportBackup = async (req, res) => {
  try {
    const users = await User.find({});
    const categories = await Category.find({});
    const menuItems = await MenuItem.find({});
    const tables = await Table.find({});
    const orders = await Order.find({});
    const inventoryLogs = await InventoryLog.find({});
    const settings = await Setting.find({});

    const backupData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      exportedBy: req.user.name,
      database: 'restaurant_pos',
      data: {
        users,
        categories,
        menuItems,
        tables,
        orders,
        inventoryLogs,
        settings,
      },
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=restaurant_pos_backup_${new Date().toISOString().slice(0, 10)}.json`
    );
    res.json(backupData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Restore database from JSON payload
// @route POST /api/backup/restore
// @access Private/Admin
const restoreBackup = async (req, res) => {
  try {
    const { data } = req.body;
    if (!data) {
      return res.status(400).json({ message: 'Invalid backup file structure: missing data payload' });
    }

    // Optional clearing / inserting
    if (data.categories && Array.isArray(data.categories)) {
      await Category.deleteMany({});
      if (data.categories.length) await Category.insertMany(data.categories);
    }

    if (data.menuItems && Array.isArray(data.menuItems)) {
      await MenuItem.deleteMany({});
      if (data.menuItems.length) await MenuItem.insertMany(data.menuItems);
    }

    if (data.tables && Array.isArray(data.tables)) {
      await Table.deleteMany({});
      if (data.tables.length) await Table.insertMany(data.tables);
    }

    if (data.orders && Array.isArray(data.orders)) {
      await Order.deleteMany({});
      if (data.orders.length) await Order.insertMany(data.orders);
    }

    if (data.inventoryLogs && Array.isArray(data.inventoryLogs)) {
      await InventoryLog.deleteMany({});
      if (data.inventoryLogs.length) await InventoryLog.insertMany(data.inventoryLogs);
    }

    if (data.settings && Array.isArray(data.settings) && data.settings.length) {
      await Setting.deleteMany({});
      await Setting.insertMany(data.settings);
    }

    if (data.users && Array.isArray(data.users) && data.users.length) {
      await User.deleteMany({});
      await User.insertMany(data.users);
    }

    res.json({
      message: 'Database backup restored successfully!',
      restoredSummary: {
        categories: data.categories?.length || 0,
        menuItems: data.menuItems?.length || 0,
        tables: data.tables?.length || 0,
        orders: data.orders?.length || 0,
        inventoryLogs: data.inventoryLogs?.length || 0,
        users: data.users?.length || 0,
      },
    });
  } catch (error) {
    res.status(500).json({ message: `Restore failed: ${error.message}` });
  }
};

module.exports = { exportBackup, restoreBackup };
