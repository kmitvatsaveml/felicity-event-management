const mongoose = require('mongoose');

// schema for custom form fields (form builder)
const formFieldSchema = new mongoose.Schema({
  label: { type: String, required: true },
  fieldType: {
    type: String,
    enum: ['text', 'textarea', 'dropdown', 'checkbox', 'file', 'number', 'email'],
    required: true
  },
  options: [String], // for dropdown fields
  required: { type: Boolean, default: false },
  order: { type: Number, default: 0 }
}, { _id: true });

// schema for merchandise variants
const merchVariantSchema = new mongoose.Schema({
  size: { type: String },
  color: { type: String },
  stock: { type: Number, default: 0 },
  purchaseLimit: { type: Number, default: 1 }
}, { _id: true });

const eventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  eventType: {
    type: String,
    enum: ['normal', 'merchandise'],
    required: true
  },
  eligibility: {
    type: String,
    default: 'all' // 'all', 'iiit', 'non-iiit'
  },
  registrationDeadline: {
    type: Date,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  registrationLimit: {
    type: Number,
    default: 0 // 0 means unlimited
  },
  registrationFee: {
    type: Number,
    default: 0
  },
  organizerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organizer',
    required: true
  },
  tags: {
    type: [String],
    default: []
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'ongoing', 'completed', 'closed'],
    default: 'draft'
  },
  // for normal events - custom form
  customForm: [formFieldSchema],

  // for merchandise events
  merchItems: [merchVariantSchema],

  registrationCount: {
    type: Number,
    default: 0
  },
  viewCount: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// text index for search
eventSchema.index({ name: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Event', eventSchema);
