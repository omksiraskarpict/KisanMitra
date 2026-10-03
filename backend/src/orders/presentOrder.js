const presentOrder = (order) => {
  const value = order.toObject ? order.toObject() : order;
  return {
    id: value.orderNumber || value._id.toString(),
    orderNumber: value.orderNumber || value._id.toString(),
    farmerId: value.farmer?._id?.toString() || value.farmer?.toString(),
    retailerId: value.retailer?._id?.toString() || value.retailer?.toString() || null,
    retailerName: value.retailerName || '',
    items: (value.items || []).map((item) => ({
      productId: item.product?._id?.toString() || item.product?.toString(),
      retailerId: item.retailerId?._id?.toString() || item.retailerId?.toString(),
      productName: item.name,
      name: item.name,
      image: item.image,
      quantity: item.quantity,
      price: item.price,
      retailerStatus: item.retailerStatus || value.orderStatus,
      retailerStatusHistory: item.retailerStatusHistory || []
    })),
    amount: value.amount,
    deliveryFee: value.deliveryFee || 0,
    paymentStatus: value.paymentStatus,
    orderStatus: value.orderStatus,
    deliveryStatus: value.deliveryStatus,
    deliveryAddress: value.deliveryAddress,
    farmAddress: value.farmAddress,
    paymentId: value.paymentId || null,
    paymentMethod: value.paymentMethod || null,
    paidAt: value.paidAt || null,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    statusHistory: value.statusHistory || []
  };
};

module.exports = { presentOrder };