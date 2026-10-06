const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productName: { type: String, required: true },
  category: {
    type: String,
    enum: ['Fertilizer', 'Seed', 'Machinery', 'Pesticide', 'Other'],
    default: 'Fertilizer'
  },
  quantity: { type: Number, required: true, default: 1 },
  unitPrice: { type: Number, required: true }
});

const orderSchema = new mongoose.Schema(
  {
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    items: [orderItemSchema],
    totalAmount: {
      type: Number,
      required: true,
      default: 0
    },
    status: {
      type: String,
      enum: ['New', 'Processing', 'Delivered', 'Cancelled'],
      default: 'New'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);