const express = require('express');
const mongoose = require('mongoose');
const { authenticate, authorize } = require('../../middleware/auth');
const Cart = require('../../database/models/Cart');
const Product = require('../../database/models/Product');

const router = express.Router();
router.use(authenticate, authorize('farmer'));

const getCart = async (farmerId) => Cart.findOneAndUpdate(
  { farmerId },
  { $setOnInsert: { farmerId, items: [] } },
  { new: true, upsert: true, setDefaultsOnInsert: true }
).populate('items.productId', 'name images price unit stock active deleted');

const presentCart = (cart) => ({
  userId: cart.farmerId.toString(),
  items: cart.items.map((item) => ({
    productId: item.productId?._id?.toString() || item.productId?.toString(),
    quantity: item.quantity,
    product: item.productId && typeof item.productId === 'object' ? {
      id: item.productId._id.toString(),
      name: item.productId.name,
      image: item.productId.images?.[0],
      images: item.productId.images,
      price: item.productId.price,
      unit: item.productId.unit,
      stock: item.productId.stock
    } : null
  }))
});

router.get('/', async (req, res) => {
  try {
    const cart = await getCart(req.user.id);
    return res.json({ cart: presentCart(cart) });
  } catch (error) {
    console.error('Get Mongo cart error:', error);
    return res.status(500).json({ message: 'Unable to load your cart.' });
  }
});

router.post('/add', async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  const parsedQuantity = Number(quantity);
  if (!mongoose.isValidObjectId(productId) || !Number.isSafeInteger(parsedQuantity) || parsedQuantity < 1) {
    return res.status(400).json({ message: 'Choose a valid product and quantity.' });
  }

  try {
    const product = await Product.findOne({ _id: productId, active: true, deleted: false, stock: { $gt: 0 } }).select('stock');
    if (!product) return res.status(404).json({ message: 'Product is unavailable.' });
    const cart = await getCart(req.user.id);
    const item = cart.items.find((entry) => entry.productId?._id?.toString() === productId || entry.productId?.toString() === productId);
    if (item && item.quantity + parsedQuantity > product.stock) {
      return res.status(400).json({ message: 'Requested quantity exceeds available stock.' });
    }
    if (item) item.quantity += parsedQuantity;
    else cart.items.push({ productId, quantity: parsedQuantity });
    await cart.save();
    const refreshedCart = await getCart(req.user.id);
    return res.json({ message: 'Product added to cart.', cart: presentCart(refreshedCart) });
  } catch (error) {
    console.error('Add Mongo cart item error:', error);
    return res.status(500).json({ message: 'Unable to update your cart.' });
  }
});

router.patch('/update', async (req, res) => {
  const { productId, quantity } = req.body;
  const parsedQuantity = Number(quantity);
  if (!mongoose.isValidObjectId(productId) || !Number.isSafeInteger(parsedQuantity) || parsedQuantity < 1) {
    return res.status(400).json({ message: 'Choose a valid product and quantity.' });
  }

  try {
    const [product, cart] = await Promise.all([
      Product.findOne({ _id: productId, active: true, deleted: false }).select('stock'),
      getCart(req.user.id)
    ]);
    if (!product) return res.status(404).json({ message: 'Product is unavailable.' });
    const item = cart.items.find((entry) => entry.productId?._id?.toString() === productId || entry.productId?.toString() === productId);
    if (!item) return res.status(404).json({ message: 'Cart item not found.' });
    if (parsedQuantity > product.stock) return res.status(400).json({ message: 'Requested quantity exceeds available stock.' });
    item.quantity = parsedQuantity;
    await cart.save();
    return res.json({ message: 'Cart updated.', cart: presentCart(await getCart(req.user.id)) });
  } catch (error) {
    console.error('Update Mongo cart item error:', error);
    return res.status(500).json({ message: 'Unable to update your cart.' });
  }
});

router.delete('/:productId', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.productId)) {
    return res.status(400).json({ message: 'Invalid product ID.' });
  }
  try {
    const cart = await getCart(req.user.id);
    cart.items = cart.items.filter((item) => item.productId?._id?.toString() !== req.params.productId && item.productId?.toString() !== req.params.productId);
    await cart.save();
    return res.json({ message: 'Item removed from cart.', cart: presentCart(await getCart(req.user.id)) });
  } catch (error) {
    console.error('Remove Mongo cart item error:', error);
    return res.status(500).json({ message: 'Unable to update your cart.' });
  }
});

module.exports = router;