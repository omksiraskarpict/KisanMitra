const presentDelivery = (delivery) => {
  const value = delivery.toObject ? delivery.toObject() : delivery;
  const farmer = value.farmer && typeof value.farmer === 'object' ? {
    id: value.farmer._id?.toString(),
    name: value.farmer.name,
    mobile: value.farmer.mobile
  } : null;
  const retailer = value.retailer && typeof value.retailer === 'object' ? {
    id: value.retailer._id?.toString(),
    name: value.retailer.businessName || value.retailer.name,
    mobile: value.retailer.mobile,
    address: value.retailer.businessAddress || value.retailer.homeAddress,
    city: value.retailer.city,
    state: value.retailer.state
  } : null;
  return {
    id: value._id.toString(),
    orderId: value.order?._id?.toString() || value.order?.toString(),
    orderNumber: value.orderNumber,
    farmer,
    retailer,
    items: value.items || [],
    pickupAddress: value.pickupAddress || retailer?.address || '',
    deliveryAddress: value.deliveryAddress || '',
    status: value.status,
    currentLocation: value.currentLocation || null,
    locationUpdatedAt: value.locationUpdatedAt || null,
    assignedAt: value.assignedAt || null,
    pickedUpAt: value.pickedUpAt || null,
    outForDeliveryAt: value.outForDeliveryAt || null,
    deliveredAt: value.deliveredAt || null,
    statusHistory: value.statusHistory || [],
    createdAt: value.createdAt,
    updatedAt: value.updatedAt
  };
};

module.exports = { presentDelivery };
