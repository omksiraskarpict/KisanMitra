const express = require('express');
const mongoose = require('mongoose');
const { authenticate, authorize } = require('../../middleware/auth');
const User = require('../../database/models/User');
const Product = require('../../database/models/Product');
const Order = require('../../database/models/Order');
const Delivery = require('../../database/models/Delivery');
const Crop = require('../../database/models/Crop');
const Question = require('../../database/models/Question');
const Category = require('../../database/models/Category');
const { presentOrder } = require('../../orders/presentOrder');
const { presentDelivery } = require('../../delivery/presentDelivery');
const { presentProduct } = require('../../products/presentProduct');

const router = express.Router();
router.use(authenticate, authorize('admin'));
router.use(async (req, res, next) => {
  try {
    const admin = await User.findOne({ _id: req.user.id, role: 'admin' }).select('_id name email role');
    if (!admin) return res.status(401).json({ message: 'Admin account not found.' });
    req.admin = admin;
    return next();
  } catch (error) {
    console.error('Load admin account error:', error);
    return res.status(500).json({ message: 'Unable to load admin account.' });
  }
});

router.get('/health', (req, res) => res.json({ status: 'ok', module: 'admin' }));

const getDashboardStats = async () => {
  const [farmers, retailers, deliveryPartners, pendingFarmers, pendingRetailers, pendingDeliveryPartners,
    totalProducts, activeProducts, orderGroups, deliveryGroups, categoryCounts, dailyOrders] = await Promise.all([
    User.countDocuments({ role: 'farmer' }),
    User.countDocuments({ role: 'retailer' }),
    User.countDocuments({ role: 'delivery' }),
    User.countDocuments({ role: 'farmer', accountStatus: 'PENDING' }),
    User.countDocuments({ role: 'retailer', accountStatus: 'PENDING' }),
    User.countDocuments({ role: 'delivery', accountStatus: 'PENDING' }),
    Product.countDocuments({ deleted: false }),
    Product.countDocuments({ active: true, deleted: false }),
    Order.aggregate([
      { $group: { _id: { orderStatus: '$orderStatus', paymentStatus: '$paymentStatus' }, count: { $sum: 1 }, amount: { $sum: '$amount' } } }
    ]),
    Delivery.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Product.aggregate([
      { $match: { deleted: false } },
      { $lookup: { from: 'categories', localField: 'categoryId', foreignField: '_id', as: 'category' } },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      { $group: { _id: '$category.name', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    Order.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000) } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 }, revenue: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'PAID'] }, '$amount', 0] } } } },
      { $sort: { _id: 1 } }
    ])
  ]);

  const orderCount = (status) => orderGroups.find((entry) => entry._id.orderStatus === status)?.count || 0;
  const orderTotal = orderGroups.reduce((sum, entry) => sum + entry.count, 0);
  const paidOrders = orderGroups.filter((entry) => entry._id.paymentStatus === 'PAID');
  const revenue = paidOrders.reduce((sum, entry) => sum + entry.amount, 0);
  const deliveryCount = (status) => deliveryGroups.find((entry) => entry._id === status)?.count || 0;
  return {
    totals: {
      farmers,
      retailers,
      deliveryPartners,
      totalProducts,
      activeProducts,
      totalOrders: orderTotal,
      pendingOrders: orderCount('ORDER_PLACED'),
      processingOrders: orderCount('PROCESSING'),
      readyForPickupOrders: orderCount('READY_FOR_PICKUP'),
      deliveredOrders: orderCount('DELIVERED'),
      paidOrders: paidOrders.reduce((sum, entry) => sum + entry.count, 0),
      revenue,
      activeDeliveries: deliveryGroups.reduce((sum, entry) => sum + (entry._id === 'DELIVERED' ? 0 : entry.count), 0),
      completedDeliveries: deliveryCount('DELIVERED'),
      pendingVerifications: pendingFarmers + pendingRetailers + pendingDeliveryPartners,
      pendingFarmers,
      pendingRetailers,
      pendingDeliveryPartners
    },
    charts: {
      ordersByStatus: orderGroups.map((entry) => ({ status: entry._id.orderStatus, paymentStatus: entry._id.paymentStatus, count: entry.count, amount: entry.amount })),
      productsByCategory: categoryCounts.map((entry) => ({ category: entry._id || 'Uncategorized', count: entry.count })),
      ordersByDay: dailyOrders.map((entry) => ({ date: entry._id, orders: entry.count, paidRevenue: entry.revenue }))
    }
  };
};

router.get('/dashboard', async (req, res) => {
  try {
    const result = await getDashboardStats();
    return res.json(result);
  } catch (error) {
    console.error('Admin dashboard aggregate error:', error);
    return res.status(500).json({ message: 'Unable to load admin dashboard.' });
  }
});
router.get('/stats', async (req, res) => {
  try {
    const { totals } = await getDashboardStats();
    return res.json({ totals });
  } catch (error) {
    console.error('Admin stats error:', error);
    return res.status(500).json({ message: 'Unable to load admin statistics.' });
  }
});
router.get('/charts', async (req, res) => {
  try {
    const { charts } = await getDashboardStats();
    return res.json({ charts });
  } catch (error) {
    console.error('Admin chart data error:', error);
    return res.status(500).json({ message: 'Unable to load admin reports.' });
  }
});

router.get('/users', async (req, res) => {
  const role = ['farmer', 'retailer', 'delivery', 'admin'].includes(req.query.role) ? req.query.role : undefined;
  const status = ['PENDING', 'VERIFIED', 'REJECTED'].includes(req.query.status) ? req.query.status : undefined;
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 25));
  const filter = { ...(role ? { role } : {}), ...(status ? { accountStatus: status } : {}) };
  const search = String(req.query.search || '').trim();
  if (search) {
    const expression = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: expression }, { email: expression }, { mobile: expression }, { businessName: expression }];
  }

  try {
    const [users, total] = await Promise.all([
      User.find(filter).select('-password -googleId').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      User.countDocuments(filter)
    ]);
    return res.json({ users: users.map((user) => ({ ...user, id: user._id.toString(), status: user.accountStatus || user.status })), total, page, limit });
  } catch (error) {
    console.error('Admin list users error:', error);
    return res.status(500).json({ message: 'Unable to load users.' });
  }
});

router.get('/verification-queue', async (req, res) => {
  try {
    const users = await User.find({ role: { $in: ['farmer', 'retailer', 'delivery'] }, accountStatus: 'PENDING' })
      .select('-password -googleId').sort({ createdAt: 1 }).lean();
    return res.json({ users });
  } catch (error) {
    console.error('Admin verification queue error:', error);
    return res.status(500).json({ message: 'Unable to load verification queue.' });
  }
});

router.patch('/users/:id/verify', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid user ID.' });
  const status = String(req.body.status || '');
  if (!['VERIFIED', 'REJECTED', 'PENDING'].includes(status)) return res.status(400).json({ message: 'Choose PENDING, VERIFIED, or REJECTED.' });
  try {
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, role: { $in: ['farmer', 'retailer', 'delivery'] } },
      { $set: { status, accountStatus: status } },
      { new: true }
    ).select('-password -googleId');
    if (!user) return res.status(404).json({ message: 'Verifiable account not found.' });
    return res.json({ message: `Account marked ${status}.`, user: { ...user.toObject(), id: user._id.toString() } });
  } catch (error) {
    console.error('Admin verify user error:', error);
    return res.status(500).json({ message: 'Unable to update account status.' });
  }
});

router.get('/products', async (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 25));
  const filter = req.query.includeDeleted === 'true' ? {} : { deleted: false };
  try {
    const [products, total] = await Promise.all([
      Product.find(filter).populate('retailerId', 'name businessName email').populate('categoryId', 'name').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Product.countDocuments(filter)
    ]);
    return res.json({ products: products.map(presentProduct), total, page, limit });
  } catch (error) {
    console.error('Admin products error:', error);
    return res.status(500).json({ message: 'Unable to load products.' });
  }
});

router.patch('/products/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid product ID.' });
  const updates = {};
  if (typeof req.body.active === 'boolean') updates.active = req.body.active;
  if (typeof req.body.deleted === 'boolean') updates.deleted = req.body.deleted;
  if (!Object.keys(updates).length) return res.status(400).json({ message: 'Provide active and/or deleted boolean values.' });
  if (updates.deleted) updates.active = false;
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true })
      .populate('retailerId', 'name businessName email').populate('categoryId', 'name');
    if (!product) return res.status(404).json({ message: 'Product not found.' });
    return res.json({ product: presentProduct(product) });
  } catch (error) {
    console.error('Admin product update error:', error);
    return res.status(500).json({ message: 'Unable to update product.' });
  }
});

router.get('/orders', async (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 25));
  const filter = {};
  if (['PENDING', 'PAID', 'FAILED', 'REFUNDED'].includes(req.query.paymentStatus)) filter.paymentStatus = req.query.paymentStatus;
  if (['ORDER_PLACED', 'CONFIRMED', 'PROCESSING', 'READY_FOR_PICKUP', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'].includes(req.query.orderStatus)) filter.orderStatus = req.query.orderStatus;
  try {
    const [orders, total] = await Promise.all([
      Order.find(filter).populate('farmer', 'name email mobile').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Order.countDocuments(filter)
    ]);
    return res.json({ orders: orders.map(presentOrder), total, page, limit });
  } catch (error) {
    console.error('Admin orders error:', error);
    return res.status(500).json({ message: 'Unable to load orders.' });
  }
});

router.get('/orders/:id', async (req, res) => {
  const filter = mongoose.isValidObjectId(req.params.id)
    ? { $or: [{ _id: req.params.id }, { orderNumber: req.params.id }] }
    : { orderNumber: req.params.id };
  try {
    const order = await Order.findOne(filter).populate('farmer', 'name email mobile').lean();
    if (!order) return res.status(404).json({ message: 'Order not found.' });
    return res.json({ order: presentOrder(order) });
  } catch (error) {
    console.error('Admin order detail error:', error);
    return res.status(500).json({ message: 'Unable to load order.' });
  }
});

router.get('/deliveries/ready', async (req, res) => {
  try {
    const deliveries = await Delivery.find({ status: 'READY_FOR_PICKUP', deliveryPartner: null })
      .populate('order', 'paymentStatus orderStatus').populate('farmer', 'name mobile')
      .populate('retailer', 'name businessName businessAddress city state').sort({ createdAt: 1 }).lean();
    return res.json({ deliveries: deliveries.filter((entry) => entry.order?.paymentStatus === 'PAID').map(presentDelivery) });
  } catch (error) {
    console.error('Admin ready deliveries error:', error);
    return res.status(500).json({ message: 'Unable to load unassigned deliveries.' });
  }
});

router.get('/deliveries', async (req, res) => {
  const filter = {};
  if (['READY_FOR_PICKUP', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(req.query.status)) filter.status = req.query.status;
  try {
    const deliveries = await Delivery.find(filter).populate('order', 'paymentStatus orderStatus')
      .populate('farmer', 'name mobile').populate('retailer', 'name businessName businessAddress city state')
      .populate('deliveryPartner', 'name mobile vehicleType vehicleRegistration').sort({ updatedAt: -1 }).limit(100).lean();
    return res.json({ deliveries: deliveries.map(presentDelivery) });
  } catch (error) {
    console.error('Admin deliveries error:', error);
    return res.status(500).json({ message: 'Unable to load deliveries.' });
  }
});

router.post('/deliveries/:id/assign', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id) || !mongoose.isValidObjectId(req.body.deliveryPartnerId)) {
    return res.status(400).json({ message: 'Valid delivery and partner IDs are required.' });
  }
  try {
    const partner = await User.findOne({ _id: req.body.deliveryPartnerId, role: 'delivery', accountStatus: 'VERIFIED' }).select('_id isAvailable');
    if (!partner) return res.status(404).json({ message: 'Verified delivery partner not found.' });
    if (!partner.isAvailable) return res.status(409).json({ message: 'Delivery partner is not available.' });
    const delivery = await Delivery.findOneAndUpdate(
      { _id: req.params.id, status: 'READY_FOR_PICKUP', deliveryPartner: null },
      { $set: { deliveryPartner: partner._id, assignedAt: new Date() }, $push: { statusHistory: { status: 'READY_FOR_PICKUP', updatedBy: req.admin._id } } },
      { new: true }
    );
    if (!delivery) return res.status(409).json({ message: 'Delivery is no longer available for assignment.' });
    await User.updateOne({ _id: partner._id }, { $set: { isAvailable: false } });
    await delivery.populate([
      { path: 'order', select: 'paymentStatus orderStatus' },
      { path: 'farmer', select: 'name mobile' },
      { path: 'retailer', select: 'name businessName businessAddress city state' },
      { path: 'deliveryPartner', select: 'name mobile vehicleType vehicleRegistration' }
    ]);
    return res.json({ message: 'Delivery assigned.', delivery: presentDelivery(delivery) });
  } catch (error) {
    console.error('Admin assign delivery error:', error);
    return res.status(500).json({ message: 'Unable to assign delivery.' });
  }
});

router.get('/crops', async (req, res) => {
  try {
    const crops = await Crop.find({}).sort({ name: 1 }).lean();
    return res.json({ crops });
  } catch (error) {
    console.error('Admin crops error:', error);
    return res.status(500).json({ message: 'Unable to load crops.' });
  }
});

router.patch('/crops/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id) || typeof req.body.active !== 'boolean') return res.status(400).json({ message: 'Valid crop ID and active flag are required.' });
  try {
    const crop = await Crop.findByIdAndUpdate(req.params.id, { $set: { active: req.body.active } }, { new: true });
    if (!crop) return res.status(404).json({ message: 'Crop not found.' });
    return res.json({ crop });
  } catch (error) {
    console.error('Admin crop update error:', error);
    return res.status(500).json({ message: 'Unable to update crop.' });
  }
});

router.get('/questions', async (req, res) => {
  try {
    const filter = {};
    if (req.query.cropId && mongoose.isValidObjectId(req.query.cropId)) filter.cropId = req.query.cropId;
    const questions = await Question.find(filter).populate('cropId', 'name').sort({ cropId: 1, order: 1 }).lean();
    return res.json({ questions });
  } catch (error) {
    console.error('Admin questions error:', error);
    return res.status(500).json({ message: 'Unable to load questions.' });
  }
});

router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.find({}).sort({ name: 1 }).lean();
    return res.json({ categories });
  } catch (error) {
    console.error('Admin categories error:', error);
    return res.status(500).json({ message: 'Unable to load categories.' });
  }
});

module.exports = router;
