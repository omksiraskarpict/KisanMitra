const mongoose = require('mongoose');

const cropSchema = new mongoose.Schema({
  slug: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  name: { type: String, required: true, unique: true },
  category: { type: String, required: true },
  description: String,
  season: String,
  image: String,
  active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Crop', cropSchema);
