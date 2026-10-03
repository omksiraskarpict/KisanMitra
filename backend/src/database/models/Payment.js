const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  razorpayOrderId: { type: String, unique: true, sparse: true },
  razorpayPaymentId: { type: String, unique: true, sparse: true },
  razorpaySignature: { type: String, select: false },
  amount: { type: Number, required: true, min: 1 },
  currency: { type: String, required: true, default: 'INR' },
  status: { type: String, enum: ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'], default: 'PENDING', index: true },
  method: String,
  failureReason: { type: String, maxlength: 500 },
  attemptNumber: { type: Number, required: true, min: 1 }
}, { timestamps: true });

paymentSchema.index({ orderId: 1, createdAt: -1 });
paymentSchema.index({ orderId: 1 }, { unique: true, partialFilterExpression: { status: 'SUCCESS' } });
paymentSchema.index({ orderId: 1, status: 1 }, { unique: true, partialFilterExpression: { status: 'PENDING' } });

module.exports = mongoose.model('Payment', paymentSchema);