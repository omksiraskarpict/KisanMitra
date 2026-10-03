const express = require('express');
const mongoose = require('mongoose');
const { authenticate, authorize } = require('../../middleware/auth');
const Order = require('../../database/models/Order');
const Payment = require('../../database/models/Payment');
const User = require('../../database/models/User');
const { findOwnedOrder } = require('../../orders/routes/orderRoutes');
const { presentOrder } = require('../../orders/presentOrder');
const { removePurchasedQuantities } = require('../../services/cartService');
const { createRazorpayClient, getRazorpayConfiguration, verifyRazorpaySignature } = require('../../services/razorpayService');

const router = express.Router();
router.use(authenticate, authorize('farmer'));

const getOrderAmountPaise = (order) => {
  const subtotalPaise = (order.items || []).reduce((sum, item) => sum + Math.round(Number(item.price) * 100) * Number(item.quantity), 0);
  return subtotalPaise + Math.round(Number(order.deliveryFee || 0) * 100);
};

const presentPayment = (payment) => payment ? ({
  id: payment._id?.toString() || payment.id,
  orderId: payment.orderId?.toString(),
  razorpayOrderId: payment.razorpayOrderId,
  razorpayPaymentId: payment.razorpayPaymentId,
  amount: payment.amount,
  amountRupees: payment.amount / 100,
  currency: payment.currency,
  status: payment.status,
  method: payment.method || null,
  failureReason: payment.failureReason || null,
  attemptNumber: payment.attemptNumber,
  createdAt: payment.createdAt,
  updatedAt: payment.updatedAt
}) : null;

const completeCapturedPayment = async (payment, order, configuration) => {
  const razorpayOrderId = payment.razorpayOrderId;
  const razorpayPaymentId = payment.razorpayPaymentId;
  const razorpaySignature = payment.razorpaySignature;

  if (!verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature, configuration.keySecret)) {
    throw Object.assign(new Error('Razorpay signature verification failed.'), { status: 400 });
  }
  if (order.orderStatus === 'CANCELLED') {
    throw Object.assign(new Error('Cancelled orders cannot be paid.'), { status: 409 });
  }

  const amount = getOrderAmountPaise(order);
  if (amount !== payment.amount || Math.round(Number(order.amount) * 100) !== payment.amount) {
    throw Object.assign(new Error('Payment amount or order verification failed.'), { status: 409 });
  }

  if (order.paymentStatus === 'PAID' && order.paymentId !== razorpayPaymentId) {
    throw Object.assign(new Error('This order already has a successful payment.'), { status: 409 });
  }

  const razorpay = createRazorpayClient(configuration);
  let providerPayment = await razorpay.payments.fetch(razorpayPaymentId);
  if (providerPayment.order_id !== razorpayOrderId || providerPayment.amount !== payment.amount || providerPayment.currency !== payment.currency) {
    throw Object.assign(new Error('Razorpay payment details do not match this order.'), { status: 400 });
  }
  if (providerPayment.status === 'authorized') {
    await razorpay.payments.capture(razorpayPaymentId, payment.amount, payment.currency);
    providerPayment = await razorpay.payments.fetch(razorpayPaymentId);
  }
  if (providerPayment.status !== 'captured') {
    throw Object.assign(new Error('Payment is not captured yet. Check payment status or retry.'), { status: 409 });
  }

  let updatedOrder = order;
  if (order.paymentStatus !== 'PAID') {
    updatedOrder = await Order.findOneAndUpdate(
      { _id: order._id, farmer: payment.farmerId, paymentStatus: { $ne: 'PAID' }, orderStatus: { $ne: 'CANCELLED' } },
      { $set: { paymentStatus: 'PAID', paymentId: razorpayPaymentId, razorpayOrderId, paidAt: new Date(), paymentMethod: providerPayment.method || null } },
      { new: true }
    );
    if (!updatedOrder) throw Object.assign(new Error('Order payment state changed. Refresh and check status.'), { status: 409 });
  }

  payment.status = 'SUCCESS';
  payment.method = providerPayment.method || null;
  payment.failureReason = undefined;
  await payment.save();
  await Payment.updateMany(
    { orderId: order._id, _id: { $ne: payment._id }, status: { $in: ['PENDING', 'FAILED'] } },
    { $set: { status: 'FAILED', failureReason: 'Another payment attempt completed this order.' } }
  );
  await removePurchasedQuantities(payment.farmerId, updatedOrder.items);
  return { payment, order: updatedOrder };
};

router.post('/create-order', async (req, res) => {
  const orderId = String(req.body.orderId || '').trim();
  if (!orderId) return res.status(400).json({ message: 'Order ID is required.' });

  try {
    const order = await findOwnedOrder(orderId, req.user.id);
    if (!order) return res.status(404).json({ message: 'Order not found.' });
    if (order.paymentStatus === 'PAID') return res.status(409).json({ message: 'This order is already paid.' });
    if (order.orderStatus === 'CANCELLED') return res.status(409).json({ message: 'Cancelled orders cannot be paid.' });

    const amount = getOrderAmountPaise(order);
    if (!Number.isSafeInteger(amount) || amount <= 0 || Math.round(Number(order.amount) * 100) !== amount) {
      return res.status(409).json({ message: 'Order amount verification failed.' });
    }

    const configuration = getRazorpayConfiguration();
    if (!configuration) {
      return res.status(503).json({ message: 'Razorpay TEST MODE is not configured. Add test credentials to backend/.env.' });
    }

    let existingPending = await Payment.findOne({ orderId: order._id, farmerId: req.user.id, status: 'PENDING' }).sort({ createdAt: -1 });
    if (existingPending?.razorpayOrderId) {
      const farmer = await User.findById(req.user.id).select('name email mobile');
      return res.json({
        keyId: configuration.keyId,
        amount: existingPending.amount,
        currency: existingPending.currency,
        razorpayOrderId: existingPending.razorpayOrderId,
        payment: presentPayment(existingPending),
        farmer: { name: farmer?.name, email: farmer?.email, contact: farmer?.mobile }
      });
    }
    if (existingPending && Date.now() - existingPending.createdAt.getTime() > 2 * 60 * 1000) {
      existingPending.status = 'FAILED';
      existingPending.failureReason = 'Payment setup timed out before checkout was ready.';
      await existingPending.save();
      existingPending = null;
    }
    if (existingPending) return res.status(409).json({ message: 'Payment setup is still in progress. Retry in a moment.' });

    const attemptNumber = await Payment.countDocuments({ orderId: order._id }) + 1;
    const attempt = await Payment.create({
      orderId: order._id,
      farmerId: req.user.id,
      amount,
      currency: 'INR',
      status: 'PENDING',
      attemptNumber
    });

    try {
      const razorpay = createRazorpayClient(configuration);
      const razorpayOrder = await razorpay.orders.create({
        amount,
        currency: 'INR',
        receipt: order.orderNumber,
        notes: { businessOrderId: order.orderNumber, farmerId: req.user.id }
      });
      attempt.razorpayOrderId = razorpayOrder.id;
      await attempt.save();
      await Order.updateOne({ _id: order._id, farmer: req.user.id }, { $set: { razorpayOrderId: razorpayOrder.id, paymentStatus: 'PENDING' } });
      const farmer = await User.findById(req.user.id).select('name email mobile');
      return res.status(201).json({
        keyId: configuration.keyId,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        razorpayOrderId: razorpayOrder.id,
        payment: presentPayment(attempt),
        farmer: { name: farmer?.name, email: farmer?.email, contact: farmer?.mobile }
      });
    } catch (error) {
      attempt.status = 'FAILED';
      attempt.failureReason = 'Unable to create Razorpay test order.';
      await attempt.save();
      await Order.updateOne({ _id: order._id, farmer: req.user.id, paymentStatus: { $ne: 'PAID' } }, { $set: { paymentStatus: 'FAILED' } });
      const providerReason = error.error?.description || error.error?.reason || error.error?.code || error.statusCode || 'provider request failed';
      console.error('Razorpay order creation failed:', providerReason);
      return res.status(502).json({ message: 'Unable to create a Razorpay test payment. You can retry this order.' });
    }
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'A payment attempt is already being prepared for this order.' });
    console.error('Create Razorpay order error:', error);
    return res.status(500).json({ message: 'Unable to start payment for this order.' });
  }
});

router.post('/verify', async (req, res) => {
  const { razorpay_order_id: razorpayOrderId, razorpay_payment_id: razorpayPaymentId, razorpay_signature: razorpaySignature } = req.body;
  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return res.status(400).json({ message: 'Razorpay payment verification data is incomplete.' });
  }

  const configuration = getRazorpayConfiguration();
  if (!configuration) return res.status(503).json({ message: 'Razorpay TEST MODE is not configured.' });

  try {
    const payment = await Payment.findOne({ razorpayOrderId, farmerId: req.user.id }).select('+razorpaySignature');
    if (!payment) return res.status(404).json({ message: 'Payment attempt not found.' });
    const order = await Order.findOne({ _id: payment.orderId, farmer: req.user.id });
    if (!order) return res.status(404).json({ message: 'Order not found.' });

    if (order.paymentStatus === 'PAID') {
      if (order.paymentId === razorpayPaymentId && payment.status === 'SUCCESS') {
        await removePurchasedQuantities(req.user.id, order.items);
        return res.json({ success: true, alreadyVerified: true, payment: presentPayment(payment), order: presentOrder(order) });
      }
      return res.status(409).json({ message: 'This order already has a successful payment.' });
    }
    if (order.orderStatus === 'CANCELLED') return res.status(409).json({ message: 'Cancelled orders cannot be paid.' });
    if (payment.status !== 'PENDING' && payment.status !== 'FAILED') {
      return res.status(409).json({ message: 'This payment attempt cannot be verified.' });
    }
    if (!verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature, configuration.keySecret)) {
      return res.status(400).json({ message: 'Razorpay signature verification failed.' });
    }
    payment.razorpayPaymentId = razorpayPaymentId;
    payment.razorpaySignature = razorpaySignature;
    await payment.save();
    const result = await completeCapturedPayment(payment, order, configuration);
    return res.json({ success: true, payment: presentPayment(result.payment), order: presentOrder(result.order) });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'A successful payment is already recorded for this order.' });
    console.error('Verify Razorpay payment error:', error.message);
    return res.status(error.status || 502).json({ message: error.status ? error.message : 'Unable to verify payment with Razorpay. The order remains unpaid.' });
  }
});

router.post('/failure', async (req, res) => {
  const { orderId, razorpayOrderId } = req.body;
  if (!orderId || !razorpayOrderId) return res.status(400).json({ message: 'Order and Razorpay order IDs are required.' });

  try {
    const order = await findOwnedOrder(orderId, req.user.id);
    if (!order) return res.status(404).json({ message: 'Order not found.' });
    if (order.paymentStatus === 'PAID') return res.status(409).json({ message: 'This order is already paid.' });
    const payment = await Payment.findOne({ orderId: order._id, farmerId: req.user.id, razorpayOrderId, status: 'PENDING' });
    if (!payment) return res.status(404).json({ message: 'Pending payment attempt not found.' });

    const reason = String(req.body.failureReason || 'Payment was not completed.').slice(0, 500);
    payment.status = 'FAILED';
    payment.failureReason = reason;
    await payment.save();
    await Order.updateOne({ _id: order._id, farmer: req.user.id, paymentStatus: { $ne: 'PAID' } }, { $set: { paymentStatus: 'FAILED' } });
    return res.json({ message: 'Payment attempt marked as failed.', payment: presentPayment(payment) });
  } catch (error) {
    console.error('Record payment failure error:', error);
    return res.status(500).json({ message: 'Unable to record payment failure.' });
  }
});

router.get('/order/:orderId', async (req, res) => {
  try {
    const order = await findOwnedOrder(req.params.orderId, req.user.id);
    if (!order) return res.status(404).json({ message: 'Order not found.' });
    let payment = await Payment.findOne({ orderId: order._id, farmerId: req.user.id }).sort({ createdAt: -1 }).select('+razorpaySignature');
    if (order.paymentStatus === 'PAID' && payment?.status === 'SUCCESS') {
      await removePurchasedQuantities(req.user.id, order.items);
    }
    const configuration = getRazorpayConfiguration();
    if (payment && configuration && payment.razorpayPaymentId && payment.razorpaySignature && payment.status !== 'SUCCESS') {
      try {
        const result = await completeCapturedPayment(payment, order, configuration);
        return res.json({ order: presentOrder(result.order), payment: presentPayment(result.payment) });
      } catch (error) {
        console.error('Payment status reconciliation failed:', error.message);
        payment = await Payment.findById(payment._id);
      }
    }
    return res.json({ order: presentOrder(order), payment: presentPayment(payment) });
  } catch (error) {
    console.error('Get order payment error:', error);
    return res.status(500).json({ message: 'Unable to load payment status.' });
  }
});

module.exports = router;