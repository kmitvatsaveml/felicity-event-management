const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Organizer = require('../models/Organizer');
const { protect, authorize } = require('../middleware/auth');
const generateTicket = require('../utils/generateTicket');
const sendEmail = require('../utils/sendEmail');

// GET /api/events - browse events (public for participants)
router.get('/', protect, async (req, res) => {
  try {
    const { search, type, eligibility, dateFrom, dateTo, followedOnly, trending, page = 1, limit = 20 } = req.query;

    let query = { status: { $in: ['published', 'ongoing'] } };

    // event type filter
    if (type && type !== 'all') {
      query.eventType = type;
    }

    // eligibility filter
    if (eligibility && eligibility !== 'all') {
      query.eligibility = eligibility;
    }

    // date range filter
    if (dateFrom || dateTo) {
      query.startDate = {};
      if (dateFrom) query.startDate.$gte = new Date(dateFrom);
      if (dateTo) query.startDate.$lte = new Date(dateTo);
    }

    // followed clubs filter
    if (followedOnly === 'true' && req.user.role === 'participant') {
      const User = require('../models/User');
      const user = await User.findById(req.user._id);
      if (user.followedOrganizers.length > 0) {
        query.organizerId = { $in: user.followedOrganizers };
      }
    }

    let events;

    // trending: top 5 by view count in last 24 hours
    if (trending === 'true') {
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      events = await Event.find({
        ...query,
        updatedAt: { $gte: dayAgo }
      })
        .sort({ viewCount: -1, registrationCount: -1 })
        .limit(5)
        .populate('organizerId', 'name category');
      return res.json({ events, total: events.length });
    }

    // search with partial/fuzzy matching
    if (search) {
      const regex = new RegExp(search.split('').join('.*'), 'i');
      query.$or = [
        { name: { $regex: regex } },
        { tags: { $regex: regex } }
      ];

      // also search by organizer name
      const matchingOrgs = await Organizer.find({ name: { $regex: regex } }).select('_id');
      if (matchingOrgs.length > 0) {
        query.$or.push({ organizerId: { $in: matchingOrgs.map(o => o._id) } });
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Event.countDocuments(query);

    events = await Event.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('organizerId', 'name category');

    // if participant has interests, sort by relevance
    if (req.user.role === 'participant' && req.user.interests && req.user.interests.length > 0) {
      const userInterests = req.user.interests.map(i => i.toLowerCase());
      events = events.sort((a, b) => {
        const aMatch = a.tags.filter(t => userInterests.includes(t.toLowerCase())).length;
        const bMatch = b.tags.filter(t => userInterests.includes(t.toLowerCase())).length;
        return bMatch - aMatch;
      });
    }

    res.json({ events, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    console.error('Browse events error:', err);
    res.status(500).json({ message: 'Failed to fetch events' });
  }
});

// GET /api/events/:id - event details
router.get('/:id', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizerId', 'name category description contactEmail');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // increment view count
    event.viewCount = (event.viewCount || 0) + 1;
    await event.save();

    // check if current user is registered
    let userRegistration = null;
    if (req.user.role === 'participant') {
      userRegistration = await Registration.findOne({
        eventId: event._id,
        userId: req.user._id
      });
    }

    res.json({
      event,
      isRegistered: !!userRegistration,
      registration: userRegistration
    });
  } catch (err) {
    console.error('Event detail error:', err);
    res.status(500).json({ message: 'Failed to fetch event details' });
  }
});

// POST /api/events/:id/register - register for an event
router.post('/:id/register', protect, authorize('participant'), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // validations
    if (event.status !== 'published' && event.status !== 'ongoing') {
      return res.status(400).json({ message: 'Registration not open for this event' });
    }

    if (new Date() > new Date(event.registrationDeadline)) {
      return res.status(400).json({ message: 'Registration deadline has passed' });
    }

    if (event.registrationLimit > 0 && event.registrationCount >= event.registrationLimit) {
      return res.status(400).json({ message: 'Registration limit reached' });
    }

    // eligibility check
    if (event.eligibility !== 'all') {
      if (event.eligibility !== req.user.participantType) {
        return res.status(403).json({ message: 'You are not eligible for this event' });
      }
    }

    // check duplicate
    const existing = await Registration.findOne({ eventId: event._id, userId: req.user._id });
    if (existing) {
      return res.status(400).json({ message: 'Already registered for this event' });
    }

    // for merchandise events, handle stock
    let merchSelection = null;
    if (event.eventType === 'merchandise') {
      const { variantId, quantity } = req.body;
      if (!variantId) {
        return res.status(400).json({ message: 'Please select a merchandise variant' });
      }

      const variant = event.merchItems.id(variantId);
      if (!variant) {
        return res.status(400).json({ message: 'Invalid variant selected' });
      }

      const qty = quantity || 1;
      if (variant.stock < qty) {
        return res.status(400).json({ message: 'Out of stock for selected variant' });
      }
      if (qty > variant.purchaseLimit) {
        return res.status(400).json({ message: 'Exceeds purchase limit of ' + variant.purchaseLimit });
      }

      // decrement stock
      variant.stock -= qty;
      await event.save();

      merchSelection = {
        variantId: variant._id,
        size: variant.size,
        color: variant.color,
        quantity: qty
      };
    }

    // create registration
    const registration = await Registration.create({
      eventId: event._id,
      userId: req.user._id,
      status: 'registered',
      formResponses: req.body.formResponses || {},
      merchSelection: merchSelection
    });

    // update registration count
    event.registrationCount += 1;
    await event.save();

    // generate ticket
    const userName = req.user.firstName + ' ' + req.user.lastName;
    const ticket = await generateTicket(
      registration._id,
      event._id,
      req.user._id,
      event.name,
      userName
    );

    // update registration with ticket id
    registration.ticketId = ticket.ticketId;
    await registration.save();

    // send confirmation email
    const emailHtml = `
      <h2>Registration Confirmed!</h2>
      <p>Hi ${req.user.firstName},</p>
      <p>You have successfully registered for <strong>${event.name}</strong>.</p>
      <p><strong>Ticket ID:</strong> ${ticket.ticketId}</p>
      <p><strong>Event Date:</strong> ${new Date(event.startDate).toLocaleDateString()}</p>
      <p><strong>Event Type:</strong> ${event.eventType}</p>
      <img src="${ticket.qrCode}" alt="QR Code" style="width: 200px; height: 200px;" />
      <p>Please keep this ticket for entry.</p>
    `;
    sendEmail(req.user.email, 'Registration Confirmed - ' + event.name, emailHtml);

    res.status(201).json({
      message: 'Registration successful',
      registration,
      ticket: {
        ticketId: ticket.ticketId,
        qrCode: ticket.qrCode
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Already registered for this event' });
    }
    res.status(500).json({ message: 'Registration failed' });
  }
});

// GET /api/events/my/registrations - get all registrations for participant
router.get('/my/registrations', protect, authorize('participant'), async (req, res) => {
  try {
    const registrations = await Registration.find({ userId: req.user._id })
      .populate({
        path: 'eventId',
        populate: { path: 'organizerId', select: 'name category' }
      })
      .sort({ registeredAt: -1 });

    res.json(registrations);
  } catch (err) {
    console.error('My registrations error:', err);
    res.status(500).json({ message: 'Failed to fetch registrations' });
  }
});

module.exports = router;
