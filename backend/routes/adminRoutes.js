const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const User = require('../models/User');
const Organizer = require('../models/Organizer');
const Event = require('../models/Event');
const { protect, authorize } = require('../middleware/auth');
const sendEmail = require('../utils/sendEmail');

// POST /api/admin/organizers - create new organizer account
router.post('/organizers', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, category, description, contactEmail } = req.body;

    if (!name || !category || !contactEmail) {
      return res.status(400).json({ message: 'Name, category and contact email are required' });
    }

    // generate login credentials
    const loginEmail = name.toLowerCase().replace(/\s+/g, '.') + '@felicity-org.com';
    const tempPassword = crypto.randomBytes(6).toString('hex'); // 12 char random pw

    // check if login email already taken
    const existingUser = await User.findOne({ email: loginEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'An organizer with a similar name already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPw = await bcrypt.hash(tempPassword, salt);

    // create user account for organizer
    const user = await User.create({
      firstName: name,
      lastName: '',
      email: loginEmail,
      password: hashedPw,
      role: 'organizer',
      onboardingDone: true
    });

    // create organizer profile
    const organizer = await Organizer.create({
      userId: user._id,
      name,
      category,
      description: description || '',
      contactEmail
    });

    res.status(201).json({
      message: 'Organizer account created',
      organizer,
      credentials: {
        email: loginEmail,
        password: tempPassword
      }
    });
  } catch (err) {
    console.error('Create organizer error:', err);
    res.status(500).json({ message: 'Failed to create organizer' });
  }
});

// GET /api/admin/organizers - list all organizers
router.get('/organizers', protect, authorize('admin'), async (req, res) => {
  try {
    const organizers = await Organizer.find()
      .populate('userId', 'email')
      .sort({ createdAt: -1 });
    res.json(organizers);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch organizers' });
  }
});

// PUT /api/admin/organizers/:id/disable - disable organizer
router.put('/organizers/:id/disable', protect, authorize('admin'), async (req, res) => {
  try {
    const organizer = await Organizer.findById(req.params.id);
    if (!organizer) {
      return res.status(404).json({ message: 'Organizer not found' });
    }

    organizer.isActive = false;
    await organizer.save();
    res.json({ message: 'Organizer disabled', organizer });
  } catch (err) {
    res.status(500).json({ message: 'Failed to disable organizer' });
  }
});

// PUT /api/admin/organizers/:id/enable - re-enable organizer
router.put('/organizers/:id/enable', protect, authorize('admin'), async (req, res) => {
  try {
    const organizer = await Organizer.findById(req.params.id);
    if (!organizer) {
      return res.status(404).json({ message: 'Organizer not found' });
    }

    organizer.isActive = true;
    await organizer.save();
    res.json({ message: 'Organizer enabled', organizer });
  } catch (err) {
    res.status(500).json({ message: 'Failed to enable organizer' });
  }
});

// DELETE /api/admin/organizers/:id - permanently delete organizer
router.delete('/organizers/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const organizer = await Organizer.findById(req.params.id);
    if (!organizer) {
      return res.status(404).json({ message: 'Organizer not found' });
    }

    // delete the user account too
    await User.findByIdAndDelete(organizer.userId);
    await Organizer.findByIdAndDelete(req.params.id);

    res.json({ message: 'Organizer permanently deleted' });
  } catch (err) {
    console.error('Delete organizer error:', err);
    res.status(500).json({ message: 'Failed to delete organizer' });
  }
});

// PUT /api/admin/organizers/:id/reset-password - reset organizer password
router.put('/organizers/:id/reset-password', protect, authorize('admin'), async (req, res) => {
  try {
    const organizer = await Organizer.findById(req.params.id);
    if (!organizer) {
      return res.status(404).json({ message: 'Organizer not found' });
    }

    const newPassword = crypto.randomBytes(6).toString('hex');
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(newPassword, salt);

    await User.findByIdAndUpdate(organizer.userId, { password: hashed });

    res.json({
      message: 'Password reset successful',
      credentials: {
        email: (await User.findById(organizer.userId)).email,
        password: newPassword
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to reset password' });
  }
});

// GET /api/admin/stats - basic system stats for admin dashboard
router.get('/stats', protect, authorize('admin'), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'participant' });
    const totalOrganizers = await Organizer.countDocuments();
    const totalEvents = await Event.countDocuments();
    const activeEvents = await Event.countDocuments({ status: { $in: ['published', 'ongoing'] } });

    res.json({ totalUsers, totalOrganizers, totalEvents, activeEvents });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
});

module.exports = router;
