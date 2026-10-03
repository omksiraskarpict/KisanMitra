const express = require('express');
const mongoose = require('mongoose');
const Crop = require('../../database/models/Crop');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const filter = { active: true };
    const search = String(req.query.search || '').trim();
    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.name = { $regex: escapedSearch, $options: 'i' };
    }

    const crops = await Crop.find(filter).sort({ name: 1 }).lean();
    return res.json({ crops });
  } catch (error) {
    console.error('List crops error:', error);
    return res.status(500).json({ message: 'Unable to load crops.' });
  }
});

router.get('/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid crop ID.' });
  }

  try {
    const crop = await Crop.findOne({ _id: req.params.id, active: true }).lean();
    if (!crop) return res.status(404).json({ message: 'Crop not found.' });
    return res.json({ crop });
  } catch (error) {
    console.error('Get crop error:', error);
    return res.status(500).json({ message: 'Unable to load crop.' });
  }
});

module.exports = router;