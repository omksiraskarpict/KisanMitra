const mongoose = require('mongoose');

const deliveryHistorySchema = new mongoose.Schema({
  status: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { _id: false });

const deliveryItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  name: String,
  quantity: Number
}, { _id: false });

const deliverySchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
  orderNumber: { type: String, required: true, index: true },
  farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  retailer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  deliveryPartner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  items: { type: [deliveryItemSchema], default: [] },
  pickupAddress: String,
  deliveryAddress: String,
  status: {
    type: String,
    enum: ['READY_FOR_PICKUP', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'],
    default: 'READY_FOR_PICKUP',
    index: true
  },
  currentLocation: {
    lat: Number,
    lng: Number
  },
  locationUpdatedAt: Date,
  assignedAt: Date,
  pickedUpAt: Date,
  outForDeliveryAt: Date,
  deliveredAt: Date,
  statusHistory: { type: [deliveryHistorySchema], default: [] }
}, { timestamps: true });

deliverySchema.index({ order: 1, retailer: 1 }, { unique: true });
deliverySchema.index({ deliveryPartner: 1, status: 1, createdAt: -1 });
deliverySchema.index({ status: 1, deliveryPartner: 1, createdAt: 1 });

module.exports = mongoose.model('Delivery', deliverySchema);
