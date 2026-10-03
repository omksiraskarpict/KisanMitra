const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  sku: { type: String, unique: true, sparse: true, trim: true },
  name: { type: String, required: true },
  images: [{ type: String, trim: true }],
  description: { type: String, required: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
  applicableCrops: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Crop', index: true }],
  usage: String,
  benefits: [{ type: String }],
  price: { type: Number, required: true, min: 0 },
  stock: { type: Number, default: 0, min: 0 },
  unit: String,
  retailerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  brand: String,
  active: { type: Boolean, default: true, index: true },
  deleted: { type: Boolean, default: false, index: true },
  tags: [{ type: String, lowercase: true, trim: true }],
  recommendationTags: [{ type: String, lowercase: true, trim: true }],
  image: String,
  category: String,
  crop: String,
  suitableCrops: [String],
  manufacturer: String,
  retailer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' }
}, { timestamps: true });

productSchema.index({ active: 1, deleted: 1, stock: 1, applicableCrops: 1 });
productSchema.index({ name: 'text', description: 'text', usage: 'text', brand: 'text', tags: 'text', recommendationTags: 'text' });

module.exports = mongoose.model('Product', productSchema);
