const express = require('express');
const Category = require('../../database/models/Category');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({ active: true }).sort({ name: 1 }).select('name slug description').lean();
    return res.json({ categories });
  } catch (error) {
    console.error('List categories error:', error);
    return res.status(500).json({ message: 'Unable to load product categories.' });
  }
});

module.exports = router;