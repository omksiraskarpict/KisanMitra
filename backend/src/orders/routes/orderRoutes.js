const express = require('express');
const mongoose = require('mongoose');
const { authenticate, authorize } = require('../../middleware/auth');
const Cart = require('../../database/models/Cart');
const Order = require('../../database/models/Order');
const Product = require('../../database/models/Product');
const User = require('../../database/models/User');
const { presentOrder } = require('../presentOrder');

const router = express.Router();
const DELIVERY_FEE = Number(process.env.DELIVERY_FEE || 120);
router.use(authenticate, authorize('farmer'));

const findOwnedOrder = (orderId, farmerId) => {
  const orderFilter = mongoose.isValidObjectId(orderId)
    ? { $or: [{ _id: orderId }, { orderNumber: orderId }] }
    : { orderNumber: orderId };
  return Order.findOne({ ...orderFilter, farmer: farmerId });
};

router.post('/create', async (req, res) => {
  const checkoutKey = String(req.body.checkoutKey || '').trim();
  if (checkoutKey.length < 8 || checkoutKey.length > 120) {
    return res.status(400).json({ message: 'A valid checkout reference is required.' });
  }

  try {
    const existingOrder = await Order.findOne({ farmer: req.user.id, checkoutKey });
    if (existingOrder) return res.status(200).json({ message: 'Existing checkout order retrieved.', order: presentOrder(existingOrder) });

    const [farmer, cart] = await Promise.all([
      User.findOne({ _id: req.user.id, role: 'farmer' }).select('name homeAddress farmAddress'),
      Cart.findOne({ farmerId: req.user.id })
    ]);
    if (!farmer) return res.status(401).json({ message: 'Farmer account not found.' });
    if (!cart?.items?.length) return res.status(400).json({ message: 'Your cart is empty.' });

    const productIds = cart.items.map((item) => item.productId);
    const products = await Product.find({ _id: { $in: productIds }, active: true, deleted: false }).select('name images price stock unit retailerId');
    const productById = new Map(products.map((product) => [product._id.toString(), product]));
    const orderItems = [];

    for (const cartItem of cart.items) {
      const product = productById.get(cartItem.productId.toString());
      if (!product || product.stock <= 0) {
        return res.status(409).json({ message: 'A product in your cart is no longer available.' });
      }
      if (cartItem.quantity > product.stock) {
        return res.status(409).json({ message: `Available stock changed for ${product.name}.` });
      }
      orderItems.push({
        product: product._id,
        retailerId: product.retailerId,
        name: product.name,
        quantity: cartItem.quantity,
        price: product.price,
        image: product.images?.[0],
        retailerStatus: 'ORDER_PLACED',
        retailerStatusHistory: [{ status: 'ORDER_PLACED', updatedBy: farmer._id }]
      });
    }

    const subtotalPaise = orderItems.reduce((sum, item) => sum + Math.round(item.price * 100) * item.quantity, 0);
    const deliveryFeePaise = Math.round(DELIVERY_FEE * 100);
    const amount = (subtotalPaise + deliveryFeePaise) / 100;
    if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ message: 'Unable to calculate a valid order total.' });

    const retailerIds = [...new Set(products.map((product) => product.retailerId?.toString()).filter(Boolean))];
    const retailer = retailerIds.length === 1 ? retailerIds[0] : null;
    const retailerName = retailer ? (await User.findById(retailer).select('businessName name'))?.businessName || 'Retailer' : 'Multiple retailers';
    const order = await Order.create({
      orderNumber: `KM-${Date.now()}-${Math.random().toString(16).slice(2, 6).toUpperCase()}`,
      checkoutKey,
      farmer: farmer._id,
      retailer,
      retailerName,
      items: orderItems,
      amount,
      deliveryFee: deliveryFeePaise / 100,
      paymentStatus: 'PENDING',
      orderStatus: 'ORDER_PLACED',
      deliveryStatus: 'PENDING',
      deliveryAddress: String(req.body.deliveryAddress || farmer.homeAddress || '').trim(),
      farmAddress: String(req.body.farmAddress || farmer.farmAddress || '').trim(),
      statusHistory: [{ status: 'ORDER_PLACED', updatedBy: farmer._id }]
    });

    return res.status(201).json({ message: 'Order created. Payment is pending.', order: presentOrder(order) });
  } catch (error) {
    if (error.code === 11000) {
      const existingOrder = await Order.findOne({ farmer: req.user.id, checkoutKey });
      if (existingOrder) return res.status(200).json({ message: 'Existing checkout order retrieved.', order: presentOrder(existingOrder) });
    }
    console.error('Create Mongo order error:', error);
    return res.status(500).json({ message: 'Unable to create your order.' });
  }
});

router.get('/my', async (req, res) => {
  try {
    const orders = await Order.find({ farmer: req.user.id }).sort({ createdAt: -1 }).lean();
    return res.json({ orders: orders.map(presentOrder) });
  } catch (error) {
    console.error('List farmer orders error:', error);
    return res.status(500).json({ message: 'Unable to load your orders.' });
  }
});

router.get('/:orderId', async (req, res) => {
  try {
    const order = await findOwnedOrder(req.params.orderId, req.user.id).lean();
    if (!order) return res.status(404).json({ message: 'Order not found.' });
    return res.json({ order: presentOrder(order) });
  } catch (error) {
    console.error('Get farmer order error:', error);
    return res.status(500).json({ message: 'Unable to load order details.' });
  }
});

module.exports = { router, findOwnedOrder };