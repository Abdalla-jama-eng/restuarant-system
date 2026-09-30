const Setting = require('../models/Setting');

// @desc Get system settings
// @route GET /api/settings
// @access Private
const getSettings = async (req, res) => {
  try {
    let settings = await Setting.findOne({});
    if (!settings) {
      settings = await Setting.create({});
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Update system settings
// @route PUT /api/settings
// @access Private/Admin
const updateSettings = async (req, res) => {
  try {
    let settings = await Setting.findOne({});
    if (!settings) {
      settings = new Setting({});
    }

    const {
      restaurantName,
      tagline,
      address,
      phone,
      email,
      currencySymbol,
      taxRate,
      enableTax,
      receiptFooter,
      defaultLowStockAlert,
    } = req.body;

    if (restaurantName) settings.restaurantName = restaurantName;
    if (tagline !== undefined) settings.tagline = tagline;
    if (address !== undefined) settings.address = address;
    if (phone !== undefined) settings.phone = phone;
    if (email !== undefined) settings.email = email;
    if (currencySymbol !== undefined) settings.currencySymbol = currencySymbol;
    if (taxRate !== undefined) settings.taxRate = Number(taxRate);
    if (enableTax !== undefined) settings.enableTax = enableTax;
    if (receiptFooter !== undefined) settings.receiptFooter = receiptFooter;
    if (defaultLowStockAlert !== undefined) settings.defaultLowStockAlert = Number(defaultLowStockAlert);

    const saved = await settings.save();
    res.json(saved);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getSettings, updateSettings };
