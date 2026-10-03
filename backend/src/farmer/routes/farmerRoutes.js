const express = require('express');
const mongoose = require('mongoose');
const { authenticate, authorize } = require('../../middleware/auth');
const Crop = require('../../database/models/Crop');
const User = require('../../database/models/User');
const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok', module: 'farmer' });
});

router.get('/dashboard', authenticate, authorize('farmer'), async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('name email mobile role status city state pincode homeAddress farmAddress selectedCrop selectedCropId')
      .populate('selectedCropId', 'name');
    if (!user) return res.status(404).json({ message: 'Farmer not found.' });

    return res.json({
      user,
      selectedCrop: user.selectedCropId?.name || user.selectedCrop || 'Not selected',
      selectedCropId: user.selectedCropId?._id || null,
      crops: [],
      questions: [],
      dashboard: { summary: 'Farmer dashboard ready' }
    });
  } catch (error) {
    console.error('Farmer dashboard error:', error);
    return res.status(500).json({ message: 'Unable to load farmer dashboard.' });
  }
});

router.post('/select-crop', authenticate, authorize('farmer'), async (req, res) => {
  const { cropId } = req.body;
  if (!mongoose.isValidObjectId(cropId)) {
    return res.status(400).json({ message: 'A valid crop ID is required.' });
  }

  try {
    const crop = await Crop.findOne({ _id: cropId, active: true });
    if (!crop) return res.status(404).json({ message: 'Crop not found.' });

    const user = await User.findOneAndUpdate(
      { _id: req.user.id, role: 'farmer' },
      { $set: { selectedCropId: crop._id, selectedCrop: crop.name } },
      { new: true }
    ).select('_id selectedCrop selectedCropId');
    if (!user) return res.status(404).json({ message: 'Farmer account not found.' });

    return res.json({ message: 'Crop selected.', crop: { id: crop._id, name: crop.name } });
  } catch (error) {
    console.error('Select farmer crop error:', error);
    return res.status(500).json({ message: 'Unable to save crop selection.' });
  }
});

module.exports = router;
