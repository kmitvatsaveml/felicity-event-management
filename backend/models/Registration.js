const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['registered', 'cancelled', 'rejected', 'attended'],
    default: 'registered'
  },
  formResponses: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // for merchandise
  merchSelection: {
    variantId: { type: mongoose.Schema.Types.ObjectId },
    size: String,
    color: String,
    quantity: { type: Number, default: 1 }
  },
  ticketId: {
    type: String,
    unique: true,
    sparse: true
  },
  registeredAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// one registration per user per event
registrationSchema.index({ eventId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Registration', registrationSchema);
