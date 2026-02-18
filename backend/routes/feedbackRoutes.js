const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const { protect, authorize } = require('../middleware/auth');

// POST /api/feedback/:eventId - submit anonymous feedback
router.post('/:eventId', protect, authorize('participant'), async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // check user attended the event
    const reg = await Registration.findOne({
      eventId: req.params.eventId,
      userId: req.user._id,
      status: { $in: ['registered', 'attended'] }
    });
    if (!reg) {
      return res.status(403).json({ message: 'You must have attended this event to leave feedback' });
    }

    // check for existing feedback
    const existing = await Feedback.findOne({ eventId: req.params.eventId, userId: req.user._id });
    if (existing) {
      existing.rating = rating;
      existing.comment = comment || '';
      await existing.save();
      return res.json({ message: 'Feedback updated', feedback: existing });
    }

    const feedback = await Feedback.create({
      eventId: req.params.eventId,
      userId: req.user._id,
      rating,
      comment: comment || ''
    });

    res.status(201).json({ message: 'Feedback submitted', feedback });
  } catch (err) {
    console.error('Feedback submit error:', err);
    res.status(500).json({ message: 'Failed to submit feedback' });
  }
});

// GET /api/feedback/:eventId - get feedback for an event (organizer view)
router.get('/:eventId', protect, async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ eventId: req.params.eventId })
      .sort({ createdAt: -1 });

    // compute aggregated stats
    const total = feedbacks.length;
    const avgRating = total > 0
      ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / total).toFixed(1)
      : 0;

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    feedbacks.forEach(f => { distribution[f.rating]++; });

    res.json({
      feedbacks: feedbacks.map(f => ({
        rating: f.rating,
        comment: f.comment,
        createdAt: f.createdAt
      })),
      stats: { total, avgRating: parseFloat(avgRating), distribution }
    });
  } catch (err) {
    console.error('Feedback fetch error:', err);
    res.status(500).json({ message: 'Failed to fetch feedback' });
  }
});

module.exports = router;
