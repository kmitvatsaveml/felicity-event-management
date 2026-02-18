const express = require('express');
const router = express.Router();
const ForumMessage = require('../models/ForumMessage');
const Registration = require('../models/Registration');
const Organizer = require('../models/Organizer');
const { protect } = require('../middleware/auth');

// GET /api/forum/:eventId - get all messages for an event
router.get('/:eventId', protect, async (req, res) => {
  try {
    const messages = await ForumMessage.find({
      eventId: req.params.eventId,
      isDeleted: false
    })
      .populate('userId', 'firstName lastName role')
      .sort({ isPinned: -1, createdAt: -1 });

    res.json(messages);
  } catch (err) {
    console.error('Forum fetch error:', err);
    res.status(500).json({ message: 'Failed to load forum messages' });
  }
});

// POST /api/forum/:eventId - post a new message
router.post('/:eventId', protect, async (req, res) => {
  try {
    const { content, parentId, isAnnouncement } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Message cannot be empty' });
    }

    // check if user is registered or is the organizer
    const isOrganizer = req.user.role === 'organizer';
    if (!isOrganizer) {
      const reg = await Registration.findOne({
        eventId: req.params.eventId,
        userId: req.user._id,
        status: { $in: ['registered', 'attended'] }
      });
      if (!reg) {
        return res.status(403).json({ message: 'You must be registered for this event to post' });
      }
    }

    const message = await ForumMessage.create({
      eventId: req.params.eventId,
      userId: req.user._id,
      content: content.trim(),
      parentId: parentId || null,
      isAnnouncement: isOrganizer && isAnnouncement ? true : false
    });

    const populated = await ForumMessage.findById(message._id)
      .populate('userId', 'firstName lastName role');

    res.status(201).json(populated);
  } catch (err) {
    console.error('Forum post error:', err);
    res.status(500).json({ message: 'Failed to post message' });
  }
});

// PUT /api/forum/:messageId/pin - pin or unpin a message (organizer only)
router.put('/:messageId/pin', protect, async (req, res) => {
  try {
    if (req.user.role !== 'organizer') {
      return res.status(403).json({ message: 'Only organizers can pin messages' });
    }
    const msg = await ForumMessage.findById(req.params.messageId);
    if (!msg) return res.status(404).json({ message: 'Message not found' });

    msg.isPinned = !msg.isPinned;
    await msg.save();
    res.json({ message: msg.isPinned ? 'Message pinned' : 'Message unpinned', data: msg });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update message' });
  }
});

// DELETE /api/forum/:messageId - delete a message (organizer moderation)
router.delete('/:messageId', protect, async (req, res) => {
  try {
    const msg = await ForumMessage.findById(req.params.messageId);
    if (!msg) return res.status(404).json({ message: 'Message not found' });

    // only organizer or the message author can delete
    const isOrganizer = req.user.role === 'organizer';
    const isAuthor = msg.userId.toString() === req.user._id.toString();
    if (!isOrganizer && !isAuthor) {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }

    msg.isDeleted = true;
    await msg.save();
    res.json({ message: 'Message deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete message' });
  }
});

// POST /api/forum/:messageId/react - react to a message
router.post('/:messageId/react', protect, async (req, res) => {
  try {
    const { emoji } = req.body;
    const msg = await ForumMessage.findById(req.params.messageId);
    if (!msg) return res.status(404).json({ message: 'Message not found' });

    // check if user already reacted with same emoji
    const existingIdx = msg.reactions.findIndex(
      r => r.userId.toString() === req.user._id.toString() && r.emoji === (emoji || '👍')
    );

    if (existingIdx >= 0) {
      msg.reactions.splice(existingIdx, 1);
    } else {
      msg.reactions.push({ userId: req.user._id, emoji: emoji || '👍' });
    }

    await msg.save();
    res.json(msg);
  } catch (err) {
    res.status(500).json({ message: 'Failed to react' });
  }
});

module.exports = router;
