const express = require('express');
const mongoose = require('mongoose');
const { authenticate, authorize } = require('../../middleware/auth');
const User = require('../../database/models/User');
const Product = require('../../database/models/Product');
const Category = require('../../database/models/Category');
const Crop = require('../../database/models/Crop');
const Order = require('../../database/models/Order');
const Delivery = require('../../database/models/Delivery');
const { presentProduct } = require('../../products/presentProduct');

const router = express.Router();
router.use(authenticate, authorize('retailer'));

router.use(async (req, res, next) => {
  try {
    const retailer = await User.findOne({ _id: req.user.id, role: 'retailer' });
    if (!retailer) return res.status(401).json({ message: 'Retailer account not found.' });
    req.retailer = retailer;
    return next();
  } catch (error) {
    console.error('Load retailer account error:', error);
    return res.status(500).json({ message: 'Unable to load retailer account.' });
  }
});

const normalizeStringList = (value) => {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) return null;
  const cleaned = value.map((item) => String(item).trim()).filter(Boolean);
  return cleaned.length === value.length ? cleaned : null;
};

const validateProductInput = async (body, partial = false) => {
  const errors = [];
  const result = {};
  const requiredStrings = ['name', 'description', 'unit'];
  for (const field of requiredStrings) {
    if (body[field] === undefined && partial) continue;
    const value = String(body[field] || '').trim();
    if (!value) errors.push(`${field} is required.`);
    else result[field] = value;
  }

  for (const field of ['usage', 'brand']) {
    if (body[field] !== undefined) result[field] = String(body[field] || '').trim();
  }

  for (const field of ['price', 'stock']) {
    if (body[field] === undefined && partial) continue;
    const value = Number(body[field]);
    if (!Number.isFinite(value) || value < 0 || (field === 'stock' && !Number.isSafeInteger(value))) {
      errors.push(`${field} must be a valid nonnegative ${field === 'stock' ? 'integer' : 'number'}.`);
    } else result[field] = value;
  }

  if (body.categoryId !== undefined || !partial) {
    if (!mongoose.isValidObjectId(body.categoryId)) errors.push('A valid product category is required.');
    else {
      const category = await Category.findOne({ _id: body.categoryId, active: true }).select('_id');
      if (!category) errors.push('The selected category is unavailable.');
      else result.categoryId = category._id;
    }
  }

  if (body.applicableCrops !== undefined || !partial) {
    if (!Array.isArray(body.applicableCrops) || body.applicableCrops.length === 0 || !body.applicableCrops.every(mongoose.isValidObjectId)) {
      errors.push('Select at least one valid applicable crop.');
    } else {
      const uniqueIds = [...new Set(body.applicableCrops.map(String))];
      const crops = await Crop.find({ _id: { $in: uniqueIds }, active: true }).select('_id').lean();
      if (crops.length !== uniqueIds.length) errors.push('One or more selected crops are unavailable.');
      else result.applicableCrops = crops.map((crop) => crop._id);
    }
  }

  for (const field of ['benefits', 'tags', 'recommendationTags']) {
    const values = normalizeStringList(body[field]);
    if (values === null) errors.push(`${field} must be a list of text values.`);
    else if (values !== undefined) result[field] = values;
  }

  if (body.images !== undefined || !partial) {
    const images = normalizeStringList(body.images || []);
    if (images === null || images.some((image) => {
      try { return !['http:', 'https:'].includes(new URL(image).protocol); } catch { return true; }
    })) errors.push('Images must be valid HTTP or HTTPS URLs.');
    else result.images = images;
  }

  if (body.active !== undefined) result.active = Boolean(body.active);
  return { errors, value: result };
};

const presentRetailerOrder = (order, retailer) => {
  const retailerId = retailer._id.toString();
  const items = (order.items || []).filter((item) => item.retailerId?.toString() === retailerId);
  const statusHistory = [...new Map(items.flatMap((item) => item.retailerStatusHistory || [])
    .map((entry) => [`${entry.status}:${new Date(entry.timestamp).getTime()}`, entry])).values()]
    .sort((left, right) => new Date(left.timestamp) - new Date(right.timestamp));
  const statuses = [...new Set(items.map((item) => item.retailerStatus || 'ORDER_PLACED'))];

  return {
    id: order.orderNumber || order._id.toString(),
    orderNumber: order.orderNumber || order._id.toString(),
    farmer: order.farmer && typeof order.farmer === 'object' ? {
      name: order.farmer.name,
      mobile: order.farmer.mobile
    } : null,
    items: items.map((item) => ({
      productId: item.product?.toString(),
      name: item.name,
      image: item.image,
      quantity: item.quantity,
      price: item.price,
      retailerStatus: item.retailerStatus || 'ORDER_PLACED'
    })),
    retailerSubtotal: items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0),
    retailerStatus: statuses.length === 1 ? statuses[0] : 'ORDER_PLACED',
    paymentStatus: order.paymentStatus,
    orderStatus: order.orderStatus,
    deliveryAddress: order.deliveryAddress,
    pickupAddress: retailer.businessAddress || retailer.homeAddress || '',
    createdAt: order.createdAt,
    statusHistory
  };
};

const backfillRetailerOrderLines = async (retailerId) => {
  const productIds = await Product.distinct('_id', { retailerId });
  if (!productIds.length) return;
  await Order.updateMany(
    { items: { $elemMatch: { product: { $in: productIds }, retailerId: null } } },
    { $set: { 'items.$[line].retailerId': retailerId } },
    { arrayFilters: [{ 'line.product': { $in: productIds }, 'line.retailerId': null }] }
  );
};

router.get('/health', (req, res) => res.json({ status: 'ok', module: 'retailer' }));

router.get('/profile', (req, res) => {
  const retailer = req.retailer;
  return res.json({
    profile: {
      id: retailer._id.toString(),
      ownerName: retailer.ownerName || retailer.name,
      name: retailer.name,
      email: retailer.email,
      mobile: retailer.mobile,
      businessName: retailer.businessName || '',
      businessAddress: retailer.businessAddress || retailer.homeAddress || '',
      businessType: retailer.businessType || '',
      businessCategory: retailer.businessCategory || '',
      businessDescription: retailer.businessDescription || '',
      gstin: retailer.gstin || '',
      city: retailer.city || '',
      state: retailer.state || '',
      pincode: retailer.pincode || '',
      status: retailer.accountStatus || retailer.status
    }
  });
});

router.put('/profile', async (req, res) => {
  try {
    const fields = ['businessName', 'businessAddress', 'businessType', 'businessCategory', 'businessDescription', 'city', 'state', 'pincode', 'ownerName'];
    for (const field of fields) {
      if (req.body[field] !== undefined) req.retailer[field] = String(req.body[field] || '').trim();
    }

    if (req.body.email !== undefined) {
      const email = String(req.body.email).trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: 'Enter a valid business email.' });
      const existing = await User.findOne({ email, _id: { $ne: req.retailer._id } }).select('_id');
      if (existing) return res.status(409).json({ message: 'This email is already in use.' });
      req.retailer.email = email;
    }

    if (req.body.mobile !== undefined) {
      const mobile = String(req.body.mobile).replace(/\s+/g, '');
      if (!/^\d{10}$/.test(mobile)) return res.status(400).json({ message: 'Enter a valid 10-digit mobile number.' });
      const existing = await User.findOne({ mobile, _id: { $ne: req.retailer._id } }).select('_id');
      if (existing) return res.status(409).json({ message: 'This mobile number is already in use.' });
      req.retailer.mobile = mobile;
    }

    if (req.body.gstin !== undefined) {
      const gstin = String(req.body.gstin || '').trim().toUpperCase();
      if (gstin && !/^[A-Z0-9]{15}$/.test(gstin)) return res.status(400).json({ message: 'GSTIN must contain 15 letters or digits.' });
      req.retailer.gstin = gstin || undefined;
    }

    if (req.body.ownerName !== undefined && req.retailer.ownerName) req.retailer.name = req.retailer.ownerName;
    if (req.body.businessAddress !== undefined) req.retailer.homeAddress = req.retailer.businessAddress;
    await req.retailer.save();
    return res.json({ message: 'Business profile saved.', profile: {
      id: req.retailer._id.toString(),
      ownerName: req.retailer.ownerName || req.retailer.name,
      businessName: req.retailer.businessName,
      businessAddress: req.retailer.businessAddress,
      businessType: req.retailer.businessType,
      businessCategory: req.retailer.businessCategory,
      businessDescription: req.retailer.businessDescription,
      gstin: req.retailer.gstin || '',
      email: req.retailer.email,
      mobile: req.retailer.mobile,
      city: req.retailer.city,
      state: req.retailer.state,
      pincode: req.retailer.pincode,
      status: req.retailer.accountStatus || req.retailer.status
    } });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.gstin) {
      return res.status(409).json({ message: 'This GSTIN is already linked to a business account.' });
    }
    console.error('Update retailer profile error:', error);
    return res.status(500).json({ message: 'Unable to save business profile.' });
  }
});

router.get('/dashboard', async (req, res) => {
  try {
    const retailerId = req.retailer._id;
    await backfillRetailerOrderLines(retailerId);
    const [totalProducts, activeProducts, lowStockProducts, orderStats] = await Promise.all([
      Product.countDocuments({ retailerId, deleted: false }),
      Product.countDocuments({ retailerId, active: true, deleted: false }),
      Product.countDocuments({ retailerId, active: true, deleted: false, stock: { $lte: 5 } }),
      Order.aggregate([
        { $match: { paymentStatus: 'PAID', 'items.retailerId': retailerId } },
        { $unwind: '$items' },
        { $match: { 'items.retailerId': retailerId } },
        { $group: { _id: { order: '$_id', retailerStatus: '$items.retailerStatus' }, orderStatus: { $first: '$orderStatus' } } },
        {
          $group: {
            _id: '$_id.retailerStatus',
            count: { $sum: 1 },
            delivered: { $sum: { $cond: [{ $eq: ['$orderStatus', 'DELIVERED'] }, 1, 0] } }
          }
        }
      ])
    ]);
    const count = (status) => orderStats.find((entry) => entry._id === status)?.count || 0;
    const completedOrders = orderStats.reduce((sum, entry) => sum + entry.delivered, 0);
    return res.json({
      user: { name: req.retailer.ownerName || req.retailer.name, businessName: req.retailer.businessName, status: req.retailer.accountStatus || req.retailer.status },
      stats: {
        totalProducts,
        activeProducts,
        lowStockProducts,
        pendingOrders: count('ORDER_PLACED'),
        ordersProcessing: count('CONFIRMED') + count('PROCESSING'),
        readyForPickup: count('READY_FOR_PICKUP'),
        completedOrders
      }
    });
  } catch (error) {
    console.error('Retailer dashboard stats error:', error);
    return res.status(500).json({ message: 'Unable to load retailer dashboard.' });
  }
});

router.get('/products', async (req, res) => {
  try {
    const products = await Product.find({ retailerId: req.retailer._id, deleted: false })
      .populate('categoryId', 'name slug')
      .populate('applicableCrops', 'name slug')
      .populate('retailerId', 'name businessName businessCategory city state')
      .sort({ updatedAt: -1 })
      .lean();
    return res.json({ products: products.map(presentProduct) });
  } catch (error) {
    console.error('List retailer products error:', error);
    return res.status(500).json({ message: 'Unable to load retailer products.' });
  }
});

router.post('/products', async (req, res) => {
  try {
    const { errors, value } = await validateProductInput(req.body);
    if (errors.length) return res.status(400).json({ message: errors[0], errors });
    const product = await Product.create({
      ...value,
      sku: `RET-${req.retailer._id.toString().slice(-6)}-${Date.now()}`,
      retailerId: req.retailer._id,
      active: req.body.active === undefined ? true : Boolean(req.body.active),
      deleted: false
    });
    await product.populate([
      { path: 'categoryId', select: 'name slug' },
      { path: 'applicableCrops', select: 'name slug' },
      { path: 'retailerId', select: 'name businessName businessCategory city state' }
    ]);
    return res.status(201).json({ message: 'Product created.', product: presentProduct(product) });
  } catch (error) {
    console.error('Create retailer product error:', error);
    return res.status(500).json({ message: 'Unable to create product.' });
  }
});

router.get('/products/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid product ID.' });
  try {
    const product = await Product.findOne({ _id: req.params.id, retailerId: req.retailer._id, deleted: false })
      .populate('categoryId', 'name slug')
      .populate('applicableCrops', 'name slug')
      .populate('retailerId', 'name businessName businessCategory city state')
      .lean();
    if (!product) return res.status(404).json({ message: 'Product not found.' });
    return res.json({ product: presentProduct(product) });
  } catch (error) {
    console.error('Get retailer product error:', error);
    return res.status(500).json({ message: 'Unable to load product.' });
  }
});

router.put('/products/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid product ID.' });
  try {
    const product = await Product.findOne({ _id: req.params.id, retailerId: req.retailer._id, deleted: false });
    if (!product) return res.status(404).json({ message: 'Product not found.' });
    const { errors, value } = await validateProductInput(req.body, true);
    if (errors.length) return res.status(400).json({ message: errors[0], errors });
    Object.assign(product, value);
    if (req.body.active !== undefined) {
      product.active = Boolean(req.body.active);
      product.status = product.active ? 'ACTIVE' : 'INACTIVE';
    }
    await product.save();
    await product.populate([
      { path: 'categoryId', select: 'name slug' },
      { path: 'applicableCrops', select: 'name slug' },
      { path: 'retailerId', select: 'name businessName businessCategory city state' }
    ]);
    return res.json({ message: 'Product updated.', product: presentProduct(product) });
  } catch (error) {
    console.error('Update retailer product error:', error);
    return res.status(500).json({ message: 'Unable to update product.' });
  }
});

router.patch('/products/:id/stock', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid product ID.' });
  const stock = Number(req.body.stock);
  if (!Number.isSafeInteger(stock) || stock < 0) return res.status(400).json({ message: 'Stock must be a nonnegative integer.' });
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, retailerId: req.retailer._id, deleted: false },
      { $set: { stock } },
      { new: true, runValidators: true }
    ).populate('categoryId', 'name slug').populate('applicableCrops', 'name slug').populate('retailerId', 'name businessName businessCategory city state');
    if (!product) return res.status(404).json({ message: 'Product not found.' });
    return res.json({ message: 'Stock updated.', product: presentProduct(product) });
  } catch (error) {
    console.error('Update retailer stock error:', error);
    return res.status(500).json({ message: 'Unable to update stock.' });
  }
});

router.delete('/products/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid product ID.' });
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, retailerId: req.retailer._id, deleted: false },
      { $set: { active: false, deleted: true, status: 'INACTIVE' } },
      { new: true }
    );
    if (!product) return res.status(404).json({ message: 'Product not found.' });
    return res.json({ message: 'Product deactivated. Historical orders are unchanged.' });
  } catch (error) {
    console.error('Deactivate retailer product error:', error);
    return res.status(500).json({ message: 'Unable to deactivate product.' });
  }
});

router.get('/orders', async (req, res) => {
  try {
    await backfillRetailerOrderLines(req.retailer._id);
    const orders = await Order.find({ paymentStatus: 'PAID', 'items.retailerId': req.retailer._id })
      .populate('farmer', 'name mobile')
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ orders: orders.map((order) => presentRetailerOrder(order, req.retailer)) });
  } catch (error) {
    console.error('List retailer orders error:', error);
    return res.status(500).json({ message: 'Unable to load retailer orders.' });
  }
});

router.get('/orders/:orderId', async (req, res) => {
  const idFilter = mongoose.isValidObjectId(req.params.orderId)
    ? { $or: [{ _id: req.params.orderId }, { orderNumber: req.params.orderId }] }
    : { orderNumber: req.params.orderId };
  try {
    await backfillRetailerOrderLines(req.retailer._id);
    const order = await Order.findOne({ ...idFilter, paymentStatus: 'PAID', 'items.retailerId': req.retailer._id })
      .populate('farmer', 'name mobile')
      .lean();
    if (!order) return res.status(404).json({ message: 'Order not found.' });
    return res.json({ order: presentRetailerOrder(order, req.retailer) });
  } catch (error) {
    console.error('Get retailer order error:', error);
    return res.status(500).json({ message: 'Unable to load retailer order.' });
  }
});

router.put('/orders/:orderId/status', async (req, res) => {
  const allowed = {
    ORDER_PLACED: 'CONFIRMED',
    CONFIRMED: 'PROCESSING',
    PROCESSING: 'READY_FOR_PICKUP'
  };
  const targetStatus = String(req.body.status || '');
  if (!Object.values(allowed).includes(targetStatus)) {
    return res.status(400).json({ message: 'Choose the next retailer fulfillment status.' });
  }
  const idFilter = mongoose.isValidObjectId(req.params.orderId)
    ? { $or: [{ _id: req.params.orderId }, { orderNumber: req.params.orderId }] }
    : { orderNumber: req.params.orderId };

  try {
    await backfillRetailerOrderLines(req.retailer._id);
    const order = await Order.findOne({ ...idFilter, paymentStatus: 'PAID', 'items.retailerId': req.retailer._id });
    if (!order) return res.status(404).json({ message: 'Paid retailer order not found.' });
    if (order.orderStatus === 'CANCELLED') return res.status(409).json({ message: 'Cancelled orders cannot be processed.' });

    const ownedItems = order.items.filter((item) => item.retailerId?.toString() === req.retailer._id.toString());
    if (!ownedItems.length) return res.status(404).json({ message: 'No items belong to this retailer.' });
    const currentStatuses = [...new Set(ownedItems.map((item) => item.retailerStatus || 'ORDER_PLACED'))];
    if (currentStatuses.length === 1 && currentStatuses[0] === targetStatus) {
      await order.populate('farmer', 'name mobile');
      return res.json({ message: 'Order already has this retailer status.', order: presentRetailerOrder(order, req.retailer) });
    }
    if (currentStatuses.length !== 1 || allowed[currentStatuses[0]] !== targetStatus) {
      return res.status(409).json({ message: 'Retailer order status must advance one step at a time.' });
    }

    const now = new Date();
    for (const item of ownedItems) {
      item.retailerStatus = targetStatus;
      item.retailerStatusHistory.push({ status: targetStatus, timestamp: now, updatedBy: req.retailer._id });
    }

    const rank = { ORDER_PLACED: 0, CONFIRMED: 1, PROCESSING: 2, READY_FOR_PICKUP: 3 };
    const aggregateStatus = order.items
      .map((item) => item.retailerStatus || 'ORDER_PLACED')
      .sort((left, right) => rank[left] - rank[right])[0];
    if (aggregateStatus !== order.orderStatus) {
      order.orderStatus = aggregateStatus;
      order.statusHistory.push({ status: aggregateStatus, timestamp: now, updatedBy: req.retailer._id });
    }
    await order.save();
    if (targetStatus === 'READY_FOR_PICKUP') {
      await Delivery.findOneAndUpdate(
        { order: order._id, retailer: req.retailer._id },
        {
          $setOnInsert: {
            order: order._id,
            orderNumber: order.orderNumber,
            farmer: order.farmer,
            retailer: req.retailer._id,
            items: ownedItems.map((item) => ({ product: item.product, name: item.name, quantity: item.quantity })),
            pickupAddress: req.retailer.businessAddress || req.retailer.homeAddress || '',
            deliveryAddress: order.deliveryAddress || '',
            status: 'READY_FOR_PICKUP',
            statusHistory: [{ status: 'READY_FOR_PICKUP', timestamp: now, updatedBy: req.retailer._id }]
          }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
    await order.populate('farmer', 'name mobile');
    return res.json({ message: `Retailer items moved to ${targetStatus}.`, order: presentRetailerOrder(order, req.retailer) });
  } catch (error) {
    console.error('Update retailer order status error:', error);
    return res.status(500).json({ message: 'Unable to update retailer order status.' });
  }
});

router.get('/health', (req, res) => {
  res.json({ status: 'ok', module: 'retailer', retailerId: req.retailer._id.toString() });
});

module.exports = router;
