const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const { protect } = require('../middleware/auth');

// GET /api/tickets/:ticketId - get ticket by ID
router.get('/:ticketId', protect, async (req, res) => {
  try {
    const ticket = await Ticket.findOne({ ticketId: req.params.ticketId })
      .populate('eventId', 'name eventType startDate endDate')
      .populate('userId', 'firstName lastName email');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // participants can only see their own tickets
    if (req.user.role === 'participant' && ticket.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this ticket' });
    }

    res.json(ticket);
  } catch (err) {
    console.error('Fetch ticket error:', err);
    res.status(500).json({ message: 'Failed to fetch ticket' });
  }
});

// GET /api/tickets/user/my - get all tickets for current user
router.get('/user/my', protect, async (req, res) => {
  try {
    const tickets = await Ticket.find({ userId: req.user._id })
      .populate('eventId', 'name eventType startDate endDate organizerId')
      .sort({ createdAt: -1 });

    res.json(tickets);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch tickets' });
  }
});

module.exports = router;
