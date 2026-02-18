const mongoose = require('mongoose');

const forumMessageSchema = new mongoose.Schema({
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
  content: {
    type: String,
    required: true,
    trim: true
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ForumMessage',
    default: null
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  isAnnouncement: {
    type: Boolean,
    default: false
  },
  reactions: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    emoji: { type: String, default: '👍' }
  }],
  isDeleted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

forumMessageSchema.index({ eventId: 1, createdAt: -1 });

module.exports = mongoose.model('ForumMessage', forumMessageSchema);
