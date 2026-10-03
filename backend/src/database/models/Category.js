const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  description: String,
  active: { type: Boolean, default: true, index: true }
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);