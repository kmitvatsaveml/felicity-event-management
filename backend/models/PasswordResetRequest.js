const mongoose = require('mongoose');

const passwordResetRequestSchema = new mongoose.Schema({
  organizerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organizer',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  adminComment: {
    type: String,
    default: ''
  },
  newPassword: {
    type: String,
    default: ''
  },
  reviewedAt: Date
}, { timestamps: true });

module.exports = mongoose.model('PasswordResetRequest', passwordResetRequestSchema);
