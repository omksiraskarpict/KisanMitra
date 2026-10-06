const mongoose = require('mongoose');
const User = require('../database/models/User');
const Order = require('../database/models/Order');
const Product = require('../database/models/Product');
const Machinery = require('../models/Machinery');

const getOverviewMetrics = async (req, res) => {
  try {
    const quarterStart = new Date();
    quarterStart.setMonth(quarterStart.getMonth() - 3);
    const [totalFarmers, totalAgribusinesses, monthlyRegistrations] = await Promise.all([
      User.countDocuments({ role: 'farmer' }),
      User.countDocuments({ role: 'retailer' }),
      User.aggregate([
        { $match: { createdAt: { $gte: quarterStart } } },
        {
          $group: {
            _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ])
    ]);

    return res.json({
      success: true,
      data: { totalFarmers, totalAgribusinesses, growth: monthlyRegistrations }
    });
  } catch (error) {
    console.error('Load admin overview metrics error:', error);
    return res.status(500).json({ success: false, message: 'Unable to load overview statistics.' });
  }
};
exports.getOverviewMetrics = getOverviewMetrics;
exports.getOverviewStats = getOverviewMetrics;

const getRealtimeOrders = async (req, res) => {
  try {
    const [newOrders, processing, delivered, revenueAgg, categories] = await Promise.all([
      Order.countDocuments({ orderStatus: 'ORDER_PLACED' }),
      Order.countDocuments({ orderStatus: { $in: ['CONFIRMED', 'PROCESSING'] } }),
      Order.countDocuments({ orderStatus: 'DELIVERED' }),
      Order.aggregate([
        { $match: { paymentStatus: 'PAID' } },
        { $group: { _id: null, totalRevenue: { $sum: '$amount' } } }
      ]),
      Product.aggregate([
        { $match: { active: true, deleted: false } },
        { $lookup: { from: 'categories', localField: 'categoryId', foreignField: '_id', as: 'category' } },
        { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
        { $group: { _id: '$category.name', totalQuantity: { $sum: '$stock' } } },
        { $sort: { totalQuantity: -1 } }
      ])
    ]);

    return res.json({
      success: true,
      data: { newOrders, processing, delivered, totalRevenue: revenueAgg[0]?.totalRevenue || 0, categories }
    });
  } catch (error) {
    console.error('Load admin order summary error:', error);
    return res.status(500).json({ success: false, message: 'Unable to load order summary.' });
  }
};
exports.getRealtimeOrders = getRealtimeOrders;
exports.getOrderSummary = getRealtimeOrders;

const getApprovalQueue = async (req, res) => {
  try {
    const pendingUsers = await User.find({
      role: { $in: ['farmer', 'retailer', 'delivery'] },
      accountStatus: 'PENDING'
    })
      .select('name role city state accountStatus createdAt')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const records = pendingUsers.map((user) => ({
      ...user,
      region: [user.city, user.state].filter(Boolean).join(', '),
      verificationStatus: user.accountStatus
    }));
    return res.json({ success: true, pendingUsers: records, data: records });
  } catch (error) {
    console.error('Load admin approval queue error:', error);
    return res.status(500).json({ success: false, message: 'Unable to load pending approvals.' });
  }
};
exports.getApprovalQueue = getApprovalQueue;
exports.getApprovalsQueue = getApprovalQueue;

const handleApprovalDecision = async (req, res) => {
  const action = req.body.action || req.body.decision;
  const updatedStatus = action === 'Approve' ? 'VERIFIED' : action === 'Reject' ? 'REJECTED' : null;
  if (!updatedStatus || !mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Choose a valid approval decision and user.' });
  }

  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { status: updatedStatus, accountStatus: updatedStatus } },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    return res.json({ success: true, message: `User marked as ${updatedStatus}.`, user });
  } catch (error) {
    console.error('Update admin approval decision error:', error);
    return res.status(500).json({ success: false, message: 'Unable to update approval status.' });
  }
};
exports.handleApprovalDecision = handleApprovalDecision;

const getMachineryListings = async (req, res) => {
  try {
    const listings = await Machinery.find().sort({ createdAt: -1 }).limit(10).lean();
    return res.json({ success: true, data: listings });
  } catch (error) {
    console.error('Load machinery listings error:', error);
    return res.status(500).json({ success: false, message: 'Unable to load machinery listings.' });
  }
};
exports.getMachineryListings = getMachineryListings;
exports.getMachineryActivity = getMachineryListings;

const flagMachineryListing = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid machinery listing ID.' });
  }

  try {
    const item = await Machinery.findByIdAndUpdate(
      req.params.id,
      { $set: { status: 'Flagged', isFlagged: true } },
      { new: true, runValidators: true }
    );
    if (!item) return res.status(404).json({ success: false, message: 'Machinery listing not found.' });
    return res.json({ success: true, message: 'Listing has been flagged.', data: item });
  } catch (error) {
    console.error('Flag machinery listing error:', error);
    return res.status(500).json({ success: false, message: 'Unable to flag machinery listing.' });
  }
};
exports.flagMachineryListing = flagMachineryListing;

const getInventoryAlerts = async (req, res) => {
  try {
    const products = await Product.find({
      active: true,
      deleted: false,
      stock: { $lte: 15 }
    })
      .select('name stock unit')
      .sort({ stock: 1, name: 1 })
      .limit(10)
      .lean();

    const items = products.map((product) => ({
      _id: product._id,
      name: product.name,
      qty: `${product.stock} ${product.unit || 'units'}`,
      level: product.stock <= 5 ? 'Critical' : 'Low Stock'
    }));
    return res.json({ success: true, data: items, lowStockItems: items });
  } catch (error) {
    console.error('Load inventory alerts error:', error);
    return res.status(500).json({ success: false, message: 'Unable to load inventory alerts.' });
  }
};
exports.getInventoryAlerts = getInventoryAlerts;
