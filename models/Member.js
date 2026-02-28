const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    pinHash: {
      type: String,
      required: true,
    },
    photoUrl: {
      type: String,
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'expired'],
      default: 'active',
    },
    reminderSent: {
      type: Boolean,
      default: false,
    },
    pinResetAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

memberSchema.index({ phone: 1 }, { unique: true });
memberSchema.index({ expiryDate: 1 });
memberSchema.index({ status: 1 });

const Member = mongoose.model('Member', memberSchema);

module.exports = Member;
