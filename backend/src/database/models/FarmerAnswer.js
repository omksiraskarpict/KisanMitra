const mongoose = require('mongoose');

const farmerAnswerSchema = new mongoose.Schema({
  farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  cropId: { type: mongoose.Schema.Types.ObjectId, ref: 'Crop', required: true },
  answers: [{
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
    answer: { type: mongoose.Schema.Types.Mixed, required: true }
  }],
  analysis: { type: mongoose.Schema.Types.Mixed },
  submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });

farmerAnswerSchema.index({ farmerId: 1, cropId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('FarmerAnswer', farmerAnswerSchema);
