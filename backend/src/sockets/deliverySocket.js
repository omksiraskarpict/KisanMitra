const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../database/models/User');
const Delivery = require('../database/models/Delivery');

const JWT_SECRET = process.env.JWT_SECRET || 'kisanmitra-dev-secret';

const isValidCoordinates = (lat, lng) => Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;

const initializeDeliverySocket = (io) => {
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required.'));
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.id).select('_id role status accountStatus');
      if (!user || user.role !== decoded.role) return next(new Error('Invalid session.'));
      socket.user = user;
      return next();
    } catch (error) {
      return next(new Error('Invalid or expired session.'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.user._id}`);

    socket.on('join-delivery', async (payload = {}, acknowledge = () => {}) => {
      if (!mongoose.isValidObjectId(payload.deliveryId)) return acknowledge({ ok: false, message: 'Invalid delivery ID.' });
      try {
        const delivery = await Delivery.findById(payload.deliveryId).select('farmer retailer deliveryPartner');
        if (!delivery) return acknowledge({ ok: false, message: 'Delivery not found.' });
        const userId = socket.user._id.toString();
        const allowed = socket.user.role === 'admin' ||
          (socket.user.role === 'farmer' && delivery.farmer.toString() === userId) ||
          (socket.user.role === 'retailer' && delivery.retailer.toString() === userId) ||
          (socket.user.role === 'delivery' && delivery.deliveryPartner?.toString() === userId);
        if (!allowed) return acknowledge({ ok: false, message: 'You cannot view this delivery location.' });
        const room = `delivery:${delivery._id}`;
        socket.join(room);
        return acknowledge({ ok: true, room });
      } catch (error) {
        return acknowledge({ ok: false, message: 'Unable to authorize delivery room.' });
      }
    });

    socket.on('delivery-location', async (payload = {}, acknowledge = () => {}) => {
      if (socket.user.role !== 'delivery' || !mongoose.isValidObjectId(payload.deliveryId)) {
        return acknowledge({ ok: false, message: 'Only the assigned delivery partner may share this location.' });
      }
      const lat = Number(payload.lat);
      const lng = Number(payload.lng);
      if (!isValidCoordinates(lat, lng)) return acknowledge({ ok: false, message: 'Invalid location coordinates.' });
      try {
        const updatedAt = new Date();
        const delivery = await Delivery.findOneAndUpdate(
          { _id: payload.deliveryId, deliveryPartner: socket.user._id, status: { $in: ['PICKED_UP', 'OUT_FOR_DELIVERY'] } },
          { $set: { currentLocation: { lat, lng }, locationUpdatedAt: updatedAt } },
          { new: true }
        ).select('_id orderNumber currentLocation locationUpdatedAt');
        if (!delivery) return acknowledge({ ok: false, message: 'Active assigned delivery not found.' });
        const locationUpdate = {
          deliveryId: delivery._id.toString(),
          orderNumber: delivery.orderNumber,
          location: delivery.currentLocation,
          updatedAt: delivery.locationUpdatedAt
        };
        io.to(`delivery:${delivery._id}`).emit('location-update', locationUpdate);
        return acknowledge({ ok: true });
      } catch (error) {
        return acknowledge({ ok: false, message: 'Unable to save delivery location.' });
      }
    });
  });
};

module.exports = { initializeDeliverySocket };
