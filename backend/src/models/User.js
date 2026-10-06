const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    password: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ['Farmer', 'Senior Farmer', 'Trader', 'Buyer', 'Agribusiness', 'Admin', 'Super Admin'],
      default: 'Farmer'
    },
    region: {
      type: String,
      default: 'Maharashtra, India'
    },
    avatar: {
      type: String,
      default: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces'
    },
    verificationStatus: {
      type: String,
      enum: ['Pending', 'Verified', 'Rejected'],
      default: 'Pending'
    },
    documents: [
      {
        docType: { type: String },
        docUrl: { type: String }
      }
    ]
  },
  { timestamps: true }
);

// Prevents OverwriteModelError if compiled across multiple modules
module.exports = mongoose.models.User || mongoose.model('User', userSchema);