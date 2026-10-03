const express = require('express');
const mongoose = require('mongoose');
const { authenticate, authorize } = require('../../middleware/auth');
const User = require('../../database/models/User');
const Delivery = require('../../database/models/Delivery');
const Order = require('../../database/models/Order');
const { presentDelivery } = require('../presentDelivery');

const router = express.Router();
router.use(authenticate, authorize('delivery'));
router.use(async (req, res, next) => {
  try {
    const partner = await User.findOne({ _id: req.user.id, role: 'delivery' });
    if (!partner) return res.status(401).json({ message: 'Delivery partner account not found.' });
    req.partner = partner;
    next();
  } catch (error) {
    console.error('Load delivery partner error:', error);
    return res.status(500).json({ message: 'Unable to load delivery partner account.' });
  }
});

router.get('/profile', (req, res) => res.json({ profile: {
  id: req.partner._id.toString(),
  name: req.partner.name,
  email: req.partner.email,
  mobile: req.partner.mobile,
  address: req.partner.homeAddress || '',
  vehicleType: req.partner.vehicleType || '',
  vehicleRegistration: req.partner.vehicleRegistration || '',
  isAvailable: Boolean(req.partner.isAvailable),
  status: req.partner.accountStatus || req.partner.status
} }));

router.put('/profile', async (req, res) => {
  const { name, mobile, address, vehicleType, vehicleRegistration } = req.body;
  if (mobile !== undefined && !/^\d{10}$/.test(String(mobile).replace(/\s+/g, ''))) {
    return res.status(400).json({ message: 'Enter a valid 10-digit mobile number.' });
  }
  try {
    if (name !== undefined) req.partner.name = String(name).trim();
    if (mobile !== undefined) req.partner.mobile = String(mobile).replace(/\s+/g, '');
    if (address !== undefined) req.partner.homeAddress = String(address).trim();
    if (vehicleType !== undefined) req.partner.vehicleType = String(vehicleType).trim();
    if (vehicleRegistration !== undefined) req.partner.vehicleRegistration = String(vehicleRegistration).trim();
    await req.partner.save();
    return res.json({ message: 'Delivery profile updated.', profile: {
      id: req.partner._id.toString(), name: req.partner.name, email: req.partner.email,
      mobile: req.partner.mobile, address: req.partner.homeAddress,
      vehicleType: req.partner.vehicleType, vehicleRegistration: req.partner.vehicleRegistration,
      isAvailable: req.partner.isAvailable, status: req.partner.accountStatus || req.partner.status
    } });
  } catch (error) {
    console.error('Update delivery profile error:', error);
    return res.status(500).json({ message: 'Unable to update delivery profile.' });
  }
});

router.patch('/availability', async (req, res) => {
  if (typeof req.body.isAvailable !== 'boolean') return res.status(400).json({ message: 'Availability must be true or false.' });
  if (req.body.isAvailable && (req.partner.accountStatus || req.partner.status) !== 'VERIFIED') {
    return res.status(403).json({ message: 'Only verified delivery partners can become available.' });
  }
  try {
    req.partner.isAvailable = req.body.isAvailable;
    await req.partner.save();
    return res.json({ isAvailable: req.partner.isAvailable });
  } catch (error) {
    console.error('Update delivery availability error:', error);
    return res.status(500).json({ message: 'Unable to update availability.' });
  }
});

router.get('/dashboard', async (req, res) => {
  try {
    const [counts, assigned] = await Promise.all([
      Delivery.aggregate([
        { $match: { deliveryPartner: req.partner._id } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Delivery.find({ deliveryPartner: req.partner._id }).sort({ updatedAt: -1 }).limit(10)
        .populate('order', 'orderNumber paymentStatus orderStatus')
        .populate('farmer', 'name mobile')
        .populate('retailer', 'name businessName mobile businessAddress city state')
        .lean()
    ]);
    const count = (status) => counts.find((entry) => entry._id === status)?.count || 0;
    return res.json({
      profile: { name: req.partner.name, isAvailable: Boolean(req.partner.isAvailable), status: req.partner.accountStatus || req.partner.status },
      stats: {
        assigned: counts.reduce((sum, entry) => sum + entry.count, 0),
        pickupPending: count('READY_FOR_PICKUP'),
        pickedUp: count('PICKED_UP'),
        outForDelivery: count('OUT_FOR_DELIVERY'),
        delivered: count('DELIVERED')
      },
      deliveries: assigned.map(presentDelivery)
    });
  } catch (error) {
    console.error('Delivery dashboard error:', error);
    return res.status(500).json({ message: 'Unable to load delivery dashboard.' });
  }
});

router.get('/available', async (req, res) => {
  if ((req.partner.accountStatus || req.partner.status) !== 'VERIFIED' || !req.partner.isAvailable) {
    return res.status(403).json({ message: 'Set yourself available after your account is verified to view pickup jobs.' });
  }
  try {
    const deliveries = await Delivery.find({ status: 'READY_FOR_PICKUP', deliveryPartner: null })
      .populate('order', 'orderNumber paymentStatus orderStatus')
      .populate('farmer', 'name mobile')
      .populate('retailer', 'name businessName mobile businessAddress city state')
      .sort({ createdAt: 1 })
      .lean();
    const eligible = deliveries.filter((delivery) => delivery.order?.paymentStatus === 'PAID');
    return res.json({ deliveries: eligible.map(presentDelivery) });
  } catch (error) {
    console.error('List available delivery jobs error:', error);
    return res.status(500).json({ message: 'Unable to load available pickup jobs.' });
  }
});

router.post('/deliveries/:id/claim', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid delivery ID.' });
  if ((req.partner.accountStatus || req.partner.status) !== 'VERIFIED' || !req.partner.isAvailable) {
    return res.status(403).json({ message: 'Only verified, available partners can claim a delivery.' });
  }
  try {
    const delivery = await Delivery.findOneAndUpdate(
      { _id: req.params.id, status: 'READY_FOR_PICKUP', deliveryPartner: null },
      { $set: { deliveryPartner: req.partner._id, assignedAt: new Date() }, $push: { statusHistory: { status: 'READY_FOR_PICKUP', updatedBy: req.partner._id } } },
      { new: true }
    );
    if (!delivery) return res.status(409).json({ message: 'This pickup job is no longer available.' });
    req.partner.isAvailable = false;
    await req.partner.save();
    const populated = await Delivery.findById(delivery._id)
      .populate('order', 'orderNumber paymentStatus orderStatus')
      .populate('farmer', 'name mobile')
      .populate('retailer', 'name businessName mobile businessAddress city state')
      .lean();
    return res.status(200).json({ message: 'Delivery assigned to you.', delivery: presentDelivery(populated) });
  } catch (error) {
    console.error('Claim delivery error:', error);
    return res.status(500).json({ message: 'Unable to claim this delivery.' });
  }
});

router.get('/deliveries/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid delivery ID.' });
  try {
    const delivery = await Delivery.findOne({ _id: req.params.id, deliveryPartner: req.partner._id })
      .populate('order', 'orderNumber paymentStatus orderStatus')
      .populate('farmer', 'name mobile')
      .populate('retailer', 'name businessName mobile businessAddress city state')
      .lean();
    if (!delivery) return res.status(404).json({ message: 'Assigned delivery not found.' });
    return res.json({ delivery: presentDelivery(delivery) });
  } catch (error) {
    console.error('Get assigned delivery error:', error);
    return res.status(500).json({ message: 'Unable to load delivery.' });
  }
});

router.put('/deliveries/:id/status', async (req, res) => {
  const nextStatus = String(req.body.status || '');
  const transitions = { READY_FOR_PICKUP: 'PICKED_UP', PICKED_UP: 'OUT_FOR_DELIVERY', OUT_FOR_DELIVERY: 'DELIVERED' };
  if (!Object.values(transitions).includes(nextStatus)) {
    return res.status(400).json({ message: 'Choose the next delivery status.' });
  }
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid delivery ID.' });

  try {
    const delivery = await Delivery.findOne({ _id: req.params.id, deliveryPartner: req.partner._id });
    if (!delivery) return res.status(404).json({ message: 'Assigned delivery not found.' });
    const order = await Order.findById(delivery.order);
    if (!order || order.paymentStatus !== 'PAID') return res.status(409).json({ message: 'Only paid orders can be delivered.' });
    if (transitions[delivery.status] !== nextStatus) return res.status(409).json({ message: 'Delivery status must advance one step at a time.' });

    const now = new Date();
    delivery.status = nextStatus;
    delivery.statusHistory.push({ status: nextStatus, timestamp: now, updatedBy: req.partner._id });
    if (nextStatus === 'PICKED_UP') delivery.pickedUpAt = now;
    if (nextStatus === 'OUT_FOR_DELIVERY') delivery.outForDeliveryAt = now;
    if (nextStatus === 'DELIVERED') delivery.deliveredAt = now;
    await delivery.save();

    const deliveries = await Delivery.find({ order: order._id }).select('status').lean();
    const rank = { READY_FOR_PICKUP: 0, PICKED_UP: 1, OUT_FOR_DELIVERY: 2, DELIVERED: 3 };
    const minimumProgress = deliveries.length ? Math.min(...deliveries.map((entry) => rank[entry.status] ?? 0)) : 0;
    const orderStatus = ['READY_FOR_PICKUP', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'][minimumProgress];
    if (order.orderStatus !== orderStatus) {
      order.orderStatus = orderStatus;
      order.deliveryStatus = orderStatus;
      order.statusHistory.push({ status: orderStatus, timestamp: now, updatedBy: req.partner._id });
      await order.save();
    }
    if (nextStatus === 'DELIVERED') {
      req.partner.isAvailable = true;
      await req.partner.save();
    }

    const populated = await Delivery.findById(delivery._id)
      .populate('order', 'orderNumber paymentStatus orderStatus')
      .populate('farmer', 'name mobile')
      .populate('retailer', 'name businessName mobile businessAddress city state')
      .lean();
    return res.json({ message: `Delivery updated to ${nextStatus}.`, delivery: presentDelivery(populated) });
  } catch (error) {
    console.error('Update delivery status error:', error);
    return res.status(500).json({ message: 'Unable to update delivery status.' });
  }
});

module.exports = router;
