const express = require('express');
const mongoose = require('mongoose');
const Crop = require('../../database/models/Crop');
const Category = require('../../database/models/Category');
const Product = require('../../database/models/Product');
const { presentProduct } = require('../presentProduct');

const router = express.Router();

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

router.get('/', async (req, res) => {
  try {
    const filter = { active: true, deleted: false };
    const search = String(req.query.search || '').trim();
    const cropFilter = String(req.query.crop || '').trim();
    const categoryFilter = String(req.query.category || '').trim();

    if (cropFilter) {
      const crop = mongoose.isValidObjectId(cropFilter)
        ? await Crop.findOne({ _id: cropFilter, active: true }).select('_id')
        : await Crop.findOne({ active: true, $or: [{ slug: cropFilter.toLowerCase() }, { name: new RegExp(`^${escapeRegex(cropFilter)}$`, 'i') }] }).select('_id');
      if (!crop) return res.json({ products: [], total: 0, page: 1 });
      filter.applicableCrops = crop._id;
    }

    if (categoryFilter) {
      const category = mongoose.isValidObjectId(categoryFilter)
        ? await Category.findOne({ _id: categoryFilter, active: true }).select('_id')
        : await Category.findOne({ active: true, $or: [{ slug: categoryFilter.toLowerCase() }, { name: new RegExp(`^${escapeRegex(categoryFilter)}$`, 'i') }] }).select('_id');
      if (!category) return res.json({ products: [], total: 0, page: 1 });
      filter.categoryId = category._id;
    }

    const minPrice = req.query.minPrice === undefined ? undefined : Number(req.query.minPrice);
    const maxPrice = req.query.maxPrice === undefined ? undefined : Number(req.query.maxPrice);
    if ((minPrice !== undefined && (!Number.isFinite(minPrice) || minPrice < 0)) ||
        (maxPrice !== undefined && (!Number.isFinite(maxPrice) || maxPrice < 0)) ||
        (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice)) {
      return res.status(400).json({ message: 'Invalid price range.' });
    }
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = minPrice;
      if (maxPrice !== undefined) filter.price.$lte = maxPrice;
    }

    if (['true', 'available'].includes(String(req.query.availability || '').toLowerCase())) {
      filter.stock = { $gt: 0 };
    } else if (['false', 'unavailable', 'out-of-stock'].includes(String(req.query.availability || '').toLowerCase())) {
      filter.stock = 0;
    }

    if (search) {
      const expression = new RegExp(escapeRegex(search), 'i');
      const [matchingCategories, matchingCrops] = await Promise.all([
        Category.find({ active: true, name: expression }).select('_id').lean(),
        Crop.find({ active: true, name: expression }).select('_id').lean()
      ]);
      const searchConditions = [
        { name: expression },
        { description: expression },
        { usage: expression },
        { brand: expression },
        { tags: expression },
        { recommendationTags: expression }
      ];
      if (matchingCategories.length) searchConditions.push({ categoryId: { $in: matchingCategories.map((category) => category._id) } });
      if (matchingCrops.length) searchConditions.push({ applicableCrops: { $in: matchingCrops.map((crop) => crop._id) } });
      filter.$or = searchConditions;
    }

    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(48, Math.max(1, Number.parseInt(req.query.limit, 10) || 24));
    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('categoryId', 'name slug')
        .populate('applicableCrops', 'name slug')
        .populate('retailerId', 'name businessName businessCategory city state')
        .sort({ name: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter)
    ]);

    return res.json({ products: products.map(presentProduct), total, page, limit });
  } catch (error) {
    console.error('List Mongo products error:', error);
    return res.status(500).json({ message: 'Unable to load products.' });
  }
});

router.get('/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid product ID.' });
  }

  try {
    const product = await Product.findOne({ _id: req.params.id, active: true, deleted: false })
      .populate('categoryId', 'name slug')
      .populate('applicableCrops', 'name slug')
      .populate('retailerId', 'name businessName businessCategory city state')
      .lean();
    if (!product) return res.status(404).json({ message: 'Product not found.' });
    return res.json({ product: presentProduct(product) });
  } catch (error) {
    console.error('Get Mongo product error:', error);
    return res.status(500).json({ message: 'Unable to load product details.' });
  }
});

module.exports = router;