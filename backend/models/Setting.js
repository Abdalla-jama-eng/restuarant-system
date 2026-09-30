const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema(
  {
    restaurantName: {
      type: String,
      default: 'BiteFlow Restaurant & Cafe',
    },
    tagline: {
      type: String,
      default: 'Fresh & Delicious Cuisine',
    },
    address: {
      type: String,
      default: '123 Gourmet Street, Downtown',
    },
    phone: {
      type: String,
      default: '+1 (555) 019-2834',
    },
    email: {
      type: String,
      default: 'info@biteflowpos.local',
    },
    currencySymbol: {
      type: String,
      default: '$',
    },
    taxRate: {
      type: Number,
      default: 5.0, // in percentage
    },
    enableTax: {
      type: Boolean,
      default: true,
    },
    receiptFooter: {
      type: String,
      default: 'Thank you for dining with us! Please come again.',
    },
    defaultLowStockAlert: {
      type: Number,
      default: 10,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Setting', settingSchema);
