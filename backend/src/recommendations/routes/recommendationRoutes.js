const express = require('express');
const mongoose = require('mongoose');
const { authenticate, authorize } = require('../../middleware/auth');
const Crop = require('../../database/models/Crop');
const FarmerAnswer = require('../../database/models/FarmerAnswer');
const Product = require('../../database/models/Product');
const Question = require('../../database/models/Question');
const User = require('../../database/models/User');
const { buildRecommendationContext, rankProducts } = require('../../services/recommendationService');
const { presentProduct } = require('../../products/presentProduct');

const router = express.Router();
router.use(authenticate, authorize('farmer'));

router.get('/:cropId', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.cropId)) {
    return res.status(400).json({ message: 'Invalid crop ID.' });
  }

  try {
    const [farmer, crop, submission] = await Promise.all([
      User.findOne({ _id: req.user.id, role: 'farmer' }).select('_id selectedCropId'),
      Crop.findOne({ _id: req.params.cropId, active: true }),
      FarmerAnswer.findOne({ farmerId: req.user.id, cropId: req.params.cropId }).lean()
    ]);
    if (!farmer) return res.status(401).json({ message: 'Farmer account not found.' });
    if (!crop) return res.status(404).json({ message: 'Crop not found.' });
    if (farmer.selectedCropId && farmer.selectedCropId.toString() !== crop._id.toString()) {
      return res.status(409).json({ message: 'Select this crop before viewing its recommendations.' });
    }

    if (!submission?.answers?.length) {
      return res.json({
        crop: { id: crop._id.toString(), name: crop.name },
        answerSummary: null,
        recommendations: [],
        message: 'Complete the crop questionnaire to prepare recommendations.'
      });
    }

    const questionIds = submission.answers.map((entry) => entry.questionId);
    const [questions, products] = await Promise.all([
      Question.find({ _id: { $in: questionIds }, cropId: crop._id, active: true }).lean(),
      Product.find({ applicableCrops: crop._id, active: true, deleted: false, stock: { $gt: 0 } })
        .populate('categoryId', 'name slug')
        .populate('applicableCrops', 'name slug')
        .populate('retailerId', 'name businessName businessCategory city state')
        .lean()
    ]);

    const context = buildRecommendationContext({
      farmer,
      crop,
      questions,
      answers: submission.answers
    });
    const rankedProducts = rankProducts({
      farmer,
      crop,
      questions,
      answers: submission.answers,
      products
    });
    const recommendations = rankedProducts.map(presentProduct);

    return res.json({
      crop: context.crop,
      answerSummary: {
        answeredCount: context.recommendationFactors.answerCount,
        farmingConditions: context.farmingConditions,
        problemIndicators: context.problemIndicators.map(({ category, answer }) => ({ category, answer }))
      },
      recommendations,
      message: recommendations.length ? null : 'No matching products are currently available.'
    });
  } catch (error) {
    console.error('Get farmer recommendations error:', error);
    return res.status(500).json({ message: 'Unable to prepare product recommendations.' });
  }
});

module.exports = router;