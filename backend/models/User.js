const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['participant', 'organizer', 'admin'],
    required: true
  },
  participantType: {
    type: String,
    enum: ['iiit', 'non-iiit', null],
    default: null
  },
  collegeName: {
    type: String,
    trim: true,
    default: ''
  },
  contactNumber: {
    type: String,
    default: ''
  },
  interests: {
    type: [String],
    default: []
  },
  followedOrganizers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organizer'
  }],
  onboardingDone: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
