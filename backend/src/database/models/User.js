const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  mobile: { type: String, required: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['farmer', 'retailer', 'delivery', 'admin'],
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'VERIFIED', 'REJECTED'],
    default: 'PENDING'
  },
  accountStatus: {
    type: String,
    enum: ['PENDING', 'VERIFIED', 'REJECTED'],
    default: 'PENDING'
  },
  homeAddress: String,
  farmAddress: String,
  businessName: String,
  businessCategory: String,
  businessType: String,
  businessAddress: String,
  businessDescription: String,
  ownerName: String,
  gstin: { type: String, unique: true, sparse: true, uppercase: true, trim: true },
  city: String,
  state: String,
  pincode: String,
  vehicleType: String,
  vehicleRegistration: String,
  isAvailable: { type: Boolean, default: false },
  selectedCrop: String,
  selectedCropId: { type: mongoose.Schema.Types.ObjectId, ref: 'Crop' },
  googleId: String,
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
