const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    category: {
      type: String,
      enum: ['Fertilizer', 'Seed', 'Machinery', 'Chemical'],
      default: 'Fertilizer'
    },
    stockQuantity: {
      type: Number,
      required: true,
      default: 0
    },
    unit: {
      type: String,
      default: 'Bags'
    },
    lowStockThreshold: {
      type: Number,
      default: 15
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Inventory', inventorySchema);