const express = require('express');
const mongoose = require('mongoose');
const { authenticate, authorize } = require('../../middleware/auth');
const Crop = require('../../database/models/Crop');
const Question = require('../../database/models/Question');
const FarmerAnswer = require('../../database/models/FarmerAnswer');
const User = require('../../database/models/User');
const { buildRecommendationContext } = require('../../services/recommendationService');

const router = express.Router();
router.use(authenticate, authorize('farmer'));

const validateAnswerType = (question, answer) => {
  if (question.questionType === 'text') return typeof answer === 'string';
  if (question.questionType === 'number') return typeof answer === 'number' && Number.isFinite(answer);
  if (question.questionType === 'select' || question.questionType === 'radio') {
    return typeof answer === 'string' && question.options.includes(answer);
  }
  if (question.questionType === 'checkbox') {
    return Array.isArray(answer) && answer.length > 0 && answer.every((value) => question.options.includes(value));
  }
  if (question.questionType === 'yes/no') {
    return typeof answer === 'boolean' || answer === 'yes' || answer === 'no';
  }
  return false;
};

const hasAnswer = (answer) => {
  if (Array.isArray(answer)) return answer.length > 0;
  if (typeof answer === 'string') return answer.trim().length > 0;
  return answer !== undefined && answer !== null;
};

router.get('/crop/:cropId', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.cropId)) {
    return res.status(400).json({ message: 'Invalid crop ID.' });
  }

  try {
    const crop = await Crop.findOne({ _id: req.params.cropId, active: true }).lean();
    if (!crop) return res.status(404).json({ message: 'Crop not found.' });

    const questions = await Question.find({ cropId: crop._id, active: true })
      .sort({ order: 1, _id: 1 })
      .lean();
    return res.json({ crop, questions });
  } catch (error) {
    console.error('Load crop questions error:', error);
    return res.status(500).json({ message: 'Unable to load crop questions.' });
  }
});

router.get('/answers/:cropId', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.cropId)) {
    return res.status(400).json({ message: 'Invalid crop ID.' });
  }

  try {
    const submission = await FarmerAnswer.findOne({
      farmerId: req.user.id,
      cropId: req.params.cropId
    }).lean();
    return res.json({ submission });
  } catch (error) {
    console.error('Load farmer answers error:', error);
    return res.status(500).json({ message: 'Unable to load saved answers.' });
  }
});

router.post('/answers', async (req, res) => {
  const { cropId, answers } = req.body;
  if (!mongoose.isValidObjectId(cropId) || !Array.isArray(answers)) {
    return res.status(400).json({ message: 'A valid crop ID and answers list are required.' });
  }

  try {
    const [crop, farmer] = await Promise.all([
      Crop.findOne({ _id: cropId, active: true }),
      User.findOne({ _id: req.user.id, role: 'farmer' }).select('_id city state')
    ]);
    if (!crop) return res.status(404).json({ message: 'Crop not found.' });
    if (!farmer) return res.status(401).json({ message: 'Farmer account not found.' });

    const questions = await Question.find({ cropId: crop._id, active: true }).sort({ order: 1, _id: 1 });
    if (questions.length === 0) {
      return res.status(400).json({ message: 'This crop does not have an active questionnaire yet.' });
    }
    const questionsById = new Map(questions.map((question) => [question._id.toString(), question]));
    const submittedById = new Map();

    for (const entry of answers) {
      if (!entry || !mongoose.isValidObjectId(entry.questionId)) {
        return res.status(400).json({ message: 'Each answer must reference a valid question.' });
      }
      const questionId = entry.questionId.toString();
      if (submittedById.has(questionId)) {
        return res.status(400).json({ message: 'A question cannot be answered more than once.' });
      }
      const question = questionsById.get(questionId);
      if (!question) {
        return res.status(400).json({ message: 'One or more questions do not belong to this crop.' });
      }
      if (!hasAnswer(entry.answer)) {
        if (question.required) {
          return res.status(400).json({ message: `Answer required: ${question.questionText}` });
        }
        continue;
      }
      if (!validateAnswerType(question, entry.answer)) {
        return res.status(400).json({ message: `Invalid answer for: ${question.questionText}` });
      }
      submittedById.set(questionId, { questionId: question._id, answer: entry.answer });
    }

    const unansweredRequired = questions.find((question) => question.required && !submittedById.has(question._id.toString()));
    if (unansweredRequired) {
      return res.status(400).json({ message: `Answer required: ${unansweredRequired.questionText}` });
    }

    const normalizedAnswers = Array.from(submittedById.values());
    const analysis = buildRecommendationContext({ farmer, crop, questions, answers: normalizedAnswers });
    const submission = await FarmerAnswer.findOneAndUpdate(
      { farmerId: farmer._id, cropId: crop._id },
      { $set: { answers: normalizedAnswers, analysis, submittedAt: new Date() } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({ message: 'Questionnaire saved.', submission, analysis });
  } catch (error) {
    console.error('Submit farmer answers error:', error);
    return res.status(500).json({ message: 'Unable to save questionnaire answers.' });
  }
});

module.exports = router;