const mongoose = require('mongoose');

const retailerStatusValues = ['ORDER_PLACED', 'CONFIRMED', 'PROCESSING', 'READY_FOR_PICKUP'];

const statusHistorySchema = new mongoose.Schema({
  status: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { _id: false });

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  retailerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
  image: String,
  retailerStatus: { type: String, enum: retailerStatusValues, default: 'ORDER_PLACED' },
  retailerStatusHistory: { type: [statusHistorySchema], default: [] }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true, sparse: true },
  checkoutKey: String,
  farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  retailer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deliveryPartner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  items: [orderItemSchema],
  amount: { type: Number, required: true, min: 0 },
  deliveryFee: { type: Number, default: 0, min: 0 },
  paymentStatus: { type: String, enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'], default: 'PENDING' },
  orderStatus: {
    type: String,
    enum: ['ORDER_PLACED', 'CONFIRMED', 'PROCESSING', 'READY_FOR_PICKUP', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'],
    default: 'ORDER_PLACED'
  },
  deliveryStatus: String,
  deliveryAddress: String,
  farmAddress: String,
  retailerName: String,
  paymentId: String,
  razorpayOrderId: String,
  paidAt: Date,
  paymentMethod: String,
  statusHistory: { type: [statusHistorySchema], default: [] },
  signature: { type: String, select: false }
}, { timestamps: true });

orderSchema.index({ farmer: 1, createdAt: -1 });
orderSchema.index({ farmer: 1, checkoutKey: 1 }, { unique: true, partialFilterExpression: { checkoutKey: { $type: 'string' } } });

module.exports = mongoose.model('Order', orderSchema);
