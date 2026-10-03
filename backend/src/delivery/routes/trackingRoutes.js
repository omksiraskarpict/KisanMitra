const express = require('express');
const mongoose = require('mongoose');
const { authenticate, authorize } = require('../../middleware/auth');
const Delivery = require('../../database/models/Delivery');
const Order = require('../../database/models/Order');
const { presentDelivery } = require('../presentDelivery');

const router = express.Router();
router.use(authenticate);

router.get('/:orderId', async (req, res) => {
  const idFilter = mongoose.isValidObjectId(req.params.orderId)
    ? { $or: [{ _id: req.params.orderId }, { orderNumber: req.params.orderId }] }
    : { orderNumber: req.params.orderId };
  try {
    let order;
    if (req.user.role === 'farmer') {
      order = await Order.findOne({ ...idFilter, farmer: req.user.id }).select('_id orderNumber');
    } else if (req.user.role === 'retailer') {
      order = await Order.findOne({ ...idFilter, 'items.retailerId': req.user.id }).select('_id orderNumber');
    } else if (req.user.role === 'admin') {
      order = await Order.findOne(idFilter).select('_id orderNumber');
    } else if (req.user.role === 'delivery') {
      const assigned = await Delivery.findOne({ ...idFilter, deliveryPartner: req.user.id }).select('order');
      order = assigned ? await Order.findById(assigned.order).select('_id orderNumber') : null;
    }

    if (!order) return res.status(404).json({ message: 'Tracking information not found.' });
    const deliveries = await Delivery.find({ order: order._id })
      .populate('farmer', 'name')
      .populate('retailer', 'name businessName businessAddress city state')
      .select('order orderNumber farmer retailer deliveryPartner items pickupAddress deliveryAddress status currentLocation locationUpdatedAt assignedAt pickedUpAt outForDeliveryAt deliveredAt statusHistory createdAt updatedAt');

    return res.json({ orderNumber: order.orderNumber, deliveries: deliveries.map(presentDelivery) });
  } catch (error) {
    console.error('Get scoped delivery tracking error:', error);
    return res.status(500).json({ message: 'Unable to load delivery tracking.' });
  }
});

router.patch('/:deliveryId/location', authorize('delivery'), async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.deliveryId)) return res.status(400).json({ message: 'Invalid delivery ID.' });
  const lat = Number(req.body.lat);
  const lng = Number(req.body.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return res.status(400).json({ message: 'Provide valid latitude and longitude coordinates.' });
  }

  try {
    const delivery = await Delivery.findOneAndUpdate(
      { _id: req.params.deliveryId, deliveryPartner: req.user.id, status: { $in: ['PICKED_UP', 'OUT_FOR_DELIVERY'] } },
      { $set: { currentLocation: { lat, lng }, locationUpdatedAt: new Date() } },
      { new: true }
    ).populate('farmer', 'name').populate('retailer', 'name businessName businessAddress city state');
    if (!delivery) return res.status(404).json({ message: 'Active delivery not found.' });

    const payload = { deliveryId: delivery._id.toString(), orderNumber: delivery.orderNumber, location: delivery.currentLocation, updatedAt: delivery.locationUpdatedAt };
    req.io?.to(`delivery:${delivery._id}`).emit('location-update', payload);
    return res.json({ message: 'Delivery location updated.', delivery: presentDelivery(delivery) });
  } catch (error) {
    console.error('Update delivery location error:', error);
    return res.status(500).json({ message: 'Unable to update delivery location.' });
  }
});

module.exports = router;
