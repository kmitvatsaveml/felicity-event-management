const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// helper to generate token
function generateToken(id, role) {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

// POST /api/auth/register - participant registration
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, participantType, collegeName, contactNumber } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ message: 'Please fill all required fields' });
    }

    // check if user already exists
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // validate IIIT email
    if (participantType === 'iiit') {
      const iiitDomains = ['iiit.ac.in', 'students.iiit.ac.in', 'research.iiit.ac.in'];
      const domain = email.split('@')[1];
      if (!iiitDomains.includes(domain)) {
        return res.status(400).json({ message: 'IIIT participants must use an IIIT email address' });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'participant',
      participantType: participantType || 'non-iiit',
      collegeName: collegeName || '',
      contactNumber: contactNumber || ''
    });

    const token = generateToken(user._id, user.role);
    res.status(201).json({
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        participantType: user.participantType,
        onboardingDone: user.onboardingDone
      }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // check if organizer account is disabled
    if (user.role === 'organizer') {
      const Organizer = require('../models/Organizer');
      const org = await Organizer.findOne({ userId: user._id });
      if (org && !org.isActive) {
        return res.status(403).json({ message: 'This account has been disabled by admin' });
      }
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id, user.role);

    // build response based on role
    const userData = {
      id: user._id,
      email: user.email,
      role: user.role
    };

    if (user.role === 'participant') {
      userData.firstName = user.firstName;
      userData.lastName = user.lastName;
      userData.participantType = user.participantType;
      userData.onboardingDone = user.onboardingDone;
    } else if (user.role === 'organizer') {
      const Organizer = require('../models/Organizer');
      const org = await Organizer.findOne({ userId: user._id });
      if (org) {
        userData.organizerId = org._id;
        userData.organizerName = org.name;
      }
    }

    res.json({ token, user: userData });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// GET /api/auth/me - get current user info
router.get('/me', protect, async (req, res) => {
  try {
    const user = req.user;
    const userData = {
      id: user._id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      participantType: user.participantType,
      onboardingDone: user.onboardingDone,
      collegeName: user.collegeName,
      contactNumber: user.contactNumber,
      interests: user.interests,
      followedOrganizers: user.followedOrganizers
    };

    if (user.role === 'organizer') {
      const Organizer = require('../models/Organizer');
      const org = await Organizer.findOne({ userId: user._id });
      if (org) {
        userData.organizerId = org._id;
        userData.organizerName = org.name;
        userData.category = org.category;
        userData.description = org.description;
        userData.contactEmail = org.contactEmail;
        userData.discordWebhook = org.discordWebhook;
      }
    }

    res.json(userData);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
