const mongoose = require('mongoose');

const machinerySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    region: {
      type: String,
      required: true
    },
    dailyRate: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['Active', 'Pending', 'Rented', 'Flagged'],
      default: 'Active'
    },
    isFlagged: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Machinery', machinerySchema);