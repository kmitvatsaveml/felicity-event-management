const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Organizer = require('../models/Organizer');
const Ticket = require('../models/Ticket');
const { protect, authorize } = require('../middleware/auth');
const generateTicket = require('../utils/generateTicket');
const sendEmail = require('../utils/sendEmail');

// GET /api/organizers/my-events - all events by this organizer
router.get('/my-events', protect, authorize('organizer'), async (req, res) => {
  try {
    const org = await Organizer.findOne({ userId: req.user._id });
    if (!org) return res.status(404).json({ message: 'Organizer profile not found' });

    const events = await Event.find({ organizerId: org._id })
      .sort({ createdAt: -1 });
    res.json(events);
  } catch (err) {
    console.error('Fetch organizer events error:', err);
    res.status(500).json({ message: 'Failed to fetch events' });
  }
});

// POST /api/organizers/events - create new event (draft)
router.post('/events', protect, authorize('organizer'), async (req, res) => {
  try {
    const org = await Organizer.findOne({ userId: req.user._id });
    if (!org) return res.status(404).json({ message: 'Organizer profile not found' });

    const {
      name, description, eventType, eligibility,
      registrationDeadline, startDate, endDate,
      registrationLimit, registrationFee, tags,
      customForm, merchItems
    } = req.body;

    if (!name || !eventType || !registrationDeadline || !startDate || !endDate) {
      return res.status(400).json({ message: 'Missing required event fields' });
    }

    const event = await Event.create({
      name,
      description: description || '',
      eventType,
      eligibility: eligibility || 'all',
      registrationDeadline,
      startDate,
      endDate,
      registrationLimit: registrationLimit || 0,
      registrationFee: registrationFee || 0,
      organizerId: org._id,
      tags: tags || [],
      status: 'draft',
      customForm: eventType === 'normal' ? (customForm || []) : [],
      merchItems: eventType === 'merchandise' ? (merchItems || []) : []
    });

    res.status(201).json(event);
  } catch (err) {
    console.error('Create event error:', err);
    res.status(500).json({ message: 'Failed to create event' });
  }
});

// PUT /api/organizers/events/:id - update event
router.put('/events/:id', protect, authorize('organizer'), async (req, res) => {
  try {
    const org = await Organizer.findOne({ userId: req.user._id });
    const event = await Event.findOne({ _id: req.params.id, organizerId: org._id });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const updates = req.body;

    // editing rules based on status
    if (event.status === 'draft') {
      // draft: free edits allowed
      Object.keys(updates).forEach(key => {
        if (key !== '_id' && key !== 'organizerId') {
          event[key] = updates[key];
        }
      });
    } else if (event.status === 'published') {
      // published: limited edits
      const allowedFields = ['description', 'registrationDeadline', 'registrationLimit', 'status'];
      allowedFields.forEach(field => {
        if (updates[field] !== undefined) {
          // only allow extending deadline and increasing limit
          if (field === 'registrationDeadline') {
            if (new Date(updates[field]) > new Date(event.registrationDeadline)) {
              event[field] = updates[field];
            }
          } else if (field === 'registrationLimit') {
            if (updates[field] >= event.registrationLimit) {
              event[field] = updates[field];
            }
          } else {
            event[field] = updates[field];
          }
        }
      });
    } else if (event.status === 'ongoing' || event.status === 'completed') {
      // only status change allowed
      if (updates.status) {
        event.status = updates.status;
      } else {
        return res.status(400).json({ message: 'Only status changes allowed for ' + event.status + ' events' });
      }
    } else {
      return res.status(400).json({ message: 'Cannot edit closed events' });
    }

    await event.save();

    // if event just published and organizer has discord webhook, post to discord
    if (updates.status === 'published' && org.discordWebhook) {
      try {
        const https = require('https');
        const url = new URL(org.discordWebhook);
        const payload = JSON.stringify({
          content: `New event published: **${event.name}**\nType: ${event.eventType}\nDate: ${new Date(event.startDate).toLocaleDateString()}\nRegister before: ${new Date(event.registrationDeadline).toLocaleDateString()}`
        });
        const options = {
          hostname: url.hostname,
          path: url.pathname,
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        };
        const request = https.request(options);
        request.write(payload);
        request.end();
      } catch (webhookErr) {
        console.error('Discord webhook error:', webhookErr.message);
      }
    }

    res.json(event);
  } catch (err) {
    console.error('Update event error:', err);
    res.status(500).json({ message: 'Failed to update event' });
  }
});

// GET /api/organizers/events/:id - organizer view of event detail
router.get('/events/:id', protect, authorize('organizer'), async (req, res) => {
  try {
    const org = await Organizer.findOne({ userId: req.user._id });
    const event = await Event.findOne({ _id: req.params.id, organizerId: org._id });
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // get registrations for this event
    const registrations = await Registration.find({ eventId: event._id })
      .populate('userId', 'firstName lastName email contactNumber')
      .sort({ registeredAt: -1 });

    // analytics
    const totalRegistrations = registrations.length;
    const attended = registrations.filter(r => r.status === 'attended').length;
    const cancelled = registrations.filter(r => r.status === 'cancelled').length;
    const revenue = totalRegistrations * event.registrationFee;

    res.json({
      event,
      registrations,
      analytics: {
        totalRegistrations,
        attended,
        cancelled,
        revenue
      }
    });
  } catch (err) {
    console.error('Organizer event detail error:', err);
    res.status(500).json({ message: 'Failed to fetch event' });
  }
});

// GET /api/organizers/events/:id/export - export registrations as CSV
router.get('/events/:id/export', protect, authorize('organizer'), async (req, res) => {
  try {
    const org = await Organizer.findOne({ userId: req.user._id });
    const event = await Event.findOne({ _id: req.params.id, organizerId: org._id });
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const registrations = await Registration.find({ eventId: event._id })
      .populate('userId', 'firstName lastName email contactNumber');

    // build CSV
    let csv = 'Name,Email,Contact,Registration Date,Status,Ticket ID\n';
    registrations.forEach(reg => {
      const user = reg.userId;
      const name = user ? (user.firstName + ' ' + user.lastName) : 'N/A';
      const email = user ? user.email : 'N/A';
      const contact = user ? user.contactNumber : 'N/A';
      const date = new Date(reg.registeredAt).toLocaleDateString();
      csv += `"${name}","${email}","${contact}","${date}","${reg.status}","${reg.ticketId || 'N/A'}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=' + event.name + '_registrations.csv');
    res.send(csv);
  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ message: 'Export failed' });
  }
});

// PUT /api/organizers/profile - update organizer profile
router.put('/profile', protect, authorize('organizer'), async (req, res) => {
  try {
    const { name, category, description, contactEmail, contactNumber, discordWebhook } = req.body;
    const org = await Organizer.findOne({ userId: req.user._id });
    if (!org) return res.status(404).json({ message: 'Organizer not found' });

    if (name) org.name = name;
    if (category) org.category = category;
    if (description !== undefined) org.description = description;
    if (contactEmail) org.contactEmail = contactEmail;
    if (contactNumber !== undefined) org.contactNumber = contactNumber;
    if (discordWebhook !== undefined) org.discordWebhook = discordWebhook;

    await org.save();
    res.json(org);
  } catch (err) {
    console.error('Organizer profile update error:', err);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// GET /api/organizers/analytics - overall stats
router.get('/analytics', protect, authorize('organizer'), async (req, res) => {
  try {
    const org = await Organizer.findOne({ userId: req.user._id });
    const events = await Event.find({ organizerId: org._id });

    let totalRegistrations = 0;
    let totalRevenue = 0;
    let completedEvents = 0;

    for (const evt of events) {
      totalRegistrations += evt.registrationCount || 0;
      if (evt.status === 'completed') {
        completedEvents++;
        totalRevenue += (evt.registrationCount || 0) * (evt.registrationFee || 0);
      }
    }

    res.json({
      totalEvents: events.length,
      totalRegistrations,
      totalRevenue,
      completedEvents
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch analytics' });
  }
});

// --- Payment Approval Routes ---

// GET /api/organizers/events/:id/payments - get all payment orders for an event
router.get('/events/:id/payments', protect, authorize('organizer'), async (req, res) => {
  try {
    const org = await Organizer.findOne({ userId: req.user._id });
    const event = await Event.findOne({ _id: req.params.id, organizerId: org._id });
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const orders = await Registration.find({
      eventId: event._id,
      paymentStatus: { $ne: 'not_required' }
    })
      .populate('userId', 'firstName lastName email contactNumber')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    console.error('Fetch payments error:', err);
    res.status(500).json({ message: 'Failed to fetch payment orders' });
  }
});

// PUT /api/organizers/payments/:regId/approve - approve a payment
router.put('/payments/:regId/approve', protect, authorize('organizer'), async (req, res) => {
  try {
    const reg = await Registration.findById(req.params.regId)
      .populate('userId', 'firstName lastName email')
      .populate('eventId');
    if (!reg) return res.status(404).json({ message: 'Order not found' });

    reg.paymentStatus = 'approved';
    reg.status = 'registered';
    reg.paymentReviewedBy = req.user._id;
    reg.paymentReviewedAt = new Date();
    reg.paymentNote = req.body.note || '';

    // generate ticket on approval
    const userName = reg.userId.firstName + ' ' + reg.userId.lastName;
    const ticket = await generateTicket(
      reg._id,
      reg.eventId._id,
      reg.userId._id,
      reg.eventId.name,
      userName
    );
    reg.ticketId = ticket.ticketId;
    await reg.save();

    // send confirmation email with ticket
    const emailHtml = `
      <h2>Payment Approved - Order Confirmed!</h2>
      <p>Hi ${reg.userId.firstName},</p>
      <p>Your payment for <strong>${reg.eventId.name}</strong> has been approved.</p>
      <p><strong>Ticket ID:</strong> ${ticket.ticketId}</p>
      <p><strong>Item:</strong> ${reg.merchSelection.size} / ${reg.merchSelection.color}</p>
      <img src="${ticket.qrCode}" alt="QR Code" style="width:200px;height:200px;" />
      <p>Show this QR code for pickup.</p>
    `;
    sendEmail(reg.userId.email, 'Payment Approved - ' + reg.eventId.name, emailHtml);

    res.json({ message: 'Payment approved, ticket generated', registration: reg });
  } catch (err) {
    console.error('Payment approve error:', err);
    res.status(500).json({ message: 'Failed to approve payment' });
  }
});

// PUT /api/organizers/payments/:regId/reject - reject a payment
router.put('/payments/:regId/reject', protect, authorize('organizer'), async (req, res) => {
  try {
    const reg = await Registration.findById(req.params.regId)
      .populate('userId', 'firstName lastName email')
      .populate('eventId');
    if (!reg) return res.status(404).json({ message: 'Order not found' });

    reg.paymentStatus = 'rejected';
    reg.paymentReviewedBy = req.user._id;
    reg.paymentReviewedAt = new Date();
    reg.paymentNote = req.body.note || 'Payment rejected';
    await reg.save();

    // notify user via email
    sendEmail(
      reg.userId.email,
      'Payment Rejected - ' + reg.eventId.name,
      `<p>Hi ${reg.userId.firstName},</p>
       <p>Your payment for <strong>${reg.eventId.name}</strong> was rejected.</p>
       <p>Reason: ${reg.paymentNote}</p>
       <p>You can upload a new payment proof to try again.</p>`
    );

    res.json({ message: 'Payment rejected', registration: reg });
  } catch (err) {
    console.error('Payment reject error:', err);
    res.status(500).json({ message: 'Failed to reject payment' });
  }
});

// --- QR Scanner & Attendance Routes ---

// POST /api/organizers/events/:id/scan - scan QR code and mark attendance
router.post('/events/:id/scan', protect, authorize('organizer'), async (req, res) => {
  try {
    const { ticketId } = req.body;
    if (!ticketId) {
      return res.status(400).json({ message: 'Ticket ID is required' });
    }

    const org = await Organizer.findOne({ userId: req.user._id });
    const event = await Event.findOne({ _id: req.params.id, organizerId: org._id });
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // find the registration by ticket id
    const reg = await Registration.findOne({
      eventId: event._id,
      ticketId: ticketId
    }).populate('userId', 'firstName lastName email');

    if (!reg) {
      return res.status(404).json({ message: 'Invalid ticket - not found for this event', valid: false });
    }

    // check for duplicate scan
    if (reg.status === 'attended') {
      return res.status(400).json({
        message: 'Already scanned - ' + reg.userId.firstName + ' ' + reg.userId.lastName + ' was marked present at ' + reg.updatedAt.toLocaleTimeString(),
        valid: false,
        duplicate: true,
        participant: reg.userId
      });
    }

    if (reg.status === 'cancelled' || reg.status === 'rejected') {
      return res.status(400).json({
        message: 'This registration has been ' + reg.status,
        valid: false
      });
    }

    // mark attendance
    reg.status = 'attended';
    await reg.save();

    res.json({
      message: 'Attendance marked for ' + reg.userId.firstName + ' ' + reg.userId.lastName,
      valid: true,
      participant: {
        name: reg.userId.firstName + ' ' + reg.userId.lastName,
        email: reg.userId.email,
        ticketId: reg.ticketId,
        markedAt: new Date()
      }
    });
  } catch (err) {
    console.error('QR scan error:', err);
    res.status(500).json({ message: 'Scan failed' });
  }
});

// GET /api/organizers/events/:id/attendance - attendance dashboard
router.get('/events/:id/attendance', protect, authorize('organizer'), async (req, res) => {
  try {
    const org = await Organizer.findOne({ userId: req.user._id });
    const event = await Event.findOne({ _id: req.params.id, organizerId: org._id });
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const allRegs = await Registration.find({
      eventId: event._id,
      status: { $in: ['registered', 'attended'] }
    }).populate('userId', 'firstName lastName email contactNumber');

    const scanned = allRegs.filter(r => r.status === 'attended');
    const notScanned = allRegs.filter(r => r.status === 'registered');

    res.json({
      total: allRegs.length,
      scannedCount: scanned.length,
      notScannedCount: notScanned.length,
      scanned,
      notScanned
    });
  } catch (err) {
    console.error('Attendance fetch error:', err);
    res.status(500).json({ message: 'Failed to fetch attendance' });
  }
});

// GET /api/organizers/events/:id/attendance/export - export attendance CSV
router.get('/events/:id/attendance/export', protect, authorize('organizer'), async (req, res) => {
  try {
    const org = await Organizer.findOne({ userId: req.user._id });
    const event = await Event.findOne({ _id: req.params.id, organizerId: org._id });
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const regs = await Registration.find({ eventId: event._id })
      .populate('userId', 'firstName lastName email contactNumber');

    let csv = 'Name,Email,Contact,Ticket ID,Status,Scanned At\n';
    regs.forEach(reg => {
      const u = reg.userId;
      const name = u ? (u.firstName + ' ' + u.lastName) : 'N/A';
      const scannedAt = reg.status === 'attended' ? new Date(reg.updatedAt).toLocaleString() : 'Not scanned';
      csv += `"${name}","${u ? u.email : ''}","${u ? u.contactNumber : ''}","${reg.ticketId || ''}","${reg.status}","${scannedAt}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=' + event.name + '_attendance.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ message: 'Export failed' });
  }
});

// PUT /api/organizers/events/:id/manual-attendance - manual override attendance
router.put('/events/:id/manual-attendance', protect, authorize('organizer'), async (req, res) => {
  try {
    const { registrationId, action } = req.body;
    const reg = await Registration.findById(registrationId);
    if (!reg) return res.status(404).json({ message: 'Registration not found' });

    if (action === 'mark') {
      reg.status = 'attended';
    } else if (action === 'unmark') {
      reg.status = 'registered';
    }
    await reg.save();
    res.json({ message: 'Attendance updated', registration: reg });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update attendance' });
  }
});

module.exports = router;
