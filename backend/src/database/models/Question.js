const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  seedKey: { type: String, unique: true, sparse: true },
  cropId: { type: mongoose.Schema.Types.ObjectId, ref: 'Crop', required: true, index: true },
  questionText: { type: String, required: true },
  questionType: {
    type: String,
    enum: ['text', 'number', 'select', 'radio', 'checkbox', 'yes/no'],
    required: true
  },
  options: [{ type: String }],
  required: { type: Boolean, default: false },
  order: { type: Number, required: true, default: 0 },
  active: { type: Boolean, default: true },
  category: String
}, { timestamps: true });

questionSchema.index({ cropId: 1, active: 1, order: 1 });

module.exports = mongoose.model('Question', questionSchema);
