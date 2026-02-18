const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Organizer = require('../models/Organizer');
const { protect, authorize } = require('../middleware/auth');

// PUT /api/users/onboarding - save onboarding preferences
router.put('/onboarding', protect, authorize('participant'), async (req, res) => {
  try {
    const { interests, followedOrganizers } = req.body;

    const updateData = { onboardingDone: true };
    if (interests && Array.isArray(interests)) {
      updateData.interests = interests;
    }
    if (followedOrganizers && Array.isArray(followedOrganizers)) {
      updateData.followedOrganizers = followedOrganizers;
    }

    const user = await User.findByIdAndUpdate(req.user._id, updateData, { new: true })
      .select('-password');
    res.json(user);
  } catch (err) {
    console.error('Onboarding error:', err);
    res.status(500).json({ message: 'Failed to save preferences' });
  }
});

// PUT /api/users/profile - update profile
router.put('/profile', protect, authorize('participant'), async (req, res) => {
  try {
    const { firstName, lastName, contactNumber, collegeName, interests, followedOrganizers } = req.body;

    const updates = {};
    if (firstName !== undefined) updates.firstName = firstName;
    if (lastName !== undefined) updates.lastName = lastName;
    if (contactNumber !== undefined) updates.contactNumber = contactNumber;
    if (collegeName !== undefined) updates.collegeName = collegeName;
    if (interests !== undefined) updates.interests = interests;
    if (followedOrganizers !== undefined) updates.followedOrganizers = followedOrganizers;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true })
      .select('-password');
    res.json(user);
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// PUT /api/users/change-password
router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Both current and new password required' });
    }

    const user = await User.findById(req.user._id);
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Password change error:', err);
    res.status(500).json({ message: 'Failed to change password' });
  }
});

// GET /api/users/organizers - list all active organizers
router.get('/organizers', protect, async (req, res) => {
  try {
    const organizers = await Organizer.find({ isActive: true })
      .select('name category description contactEmail');
    res.json(organizers);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch organizers' });
  }
});

// GET /api/users/organizers/:id - get organizer details
router.get('/organizers/:id', protect, async (req, res) => {
  try {
    const organizer = await Organizer.findById(req.params.id);
    if (!organizer || !organizer.isActive) {
      return res.status(404).json({ message: 'Organizer not found' });
    }
    res.json(organizer);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch organizer' });
  }
});

// POST /api/users/follow/:organizerId
router.post('/follow/:organizerId', protect, authorize('participant'), async (req, res) => {
  try {
    const orgId = req.params.organizerId;
    const user = await User.findById(req.user._id);

    if (user.followedOrganizers.includes(orgId)) {
      return res.status(400).json({ message: 'Already following' });
    }

    user.followedOrganizers.push(orgId);
    await user.save();
    res.json({ message: 'Followed successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to follow organizer' });
  }
});

// DELETE /api/users/follow/:organizerId
router.delete('/follow/:organizerId', protect, authorize('participant'), async (req, res) => {
  try {
    const orgId = req.params.organizerId;
    const user = await User.findById(req.user._id);

    user.followedOrganizers = user.followedOrganizers.filter(
      id => id.toString() !== orgId
    );
    await user.save();
    res.json({ message: 'Unfollowed successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to unfollow organizer' });
  }
});

module.exports = router;
