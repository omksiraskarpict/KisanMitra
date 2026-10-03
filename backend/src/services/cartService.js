const Cart = require('../database/models/Cart');

const removePurchasedQuantities = async (farmerId, orderItems) => {
  const cart = await Cart.findOne({ farmerId });
  if (!cart) return;

  const purchased = new Map(orderItems.map((item) => [item.product.toString(), item.quantity]));
  cart.items = cart.items.reduce((remaining, item) => {
    const productId = item.productId.toString();
    const purchasedQuantity = purchased.get(productId) || 0;
    const leftInCart = item.quantity - purchasedQuantity;
    if (leftInCart > 0) remaining.push({ productId, quantity: leftInCart });
    return remaining;
  }, []);
  await cart.save();
};

module.exports = { removePurchasedQuantities };