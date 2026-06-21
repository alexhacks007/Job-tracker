const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/user');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// @route   GET /api/profile
// @desc    Get current user profile
router.get('/', async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const { password, ...safeUser } = user;
    res.json(safeUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/profile
// @desc    Update name, email, and social platform links
router.put('/', async (req, res) => {
  try {
    const { name, email, linkedin, naukri, workindia, glassdoor, portfolio } = req.body;
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required.' });
    }

    // Prevent email conflict with another user
    const existing = await User.findByEmail(email);
    if (existing && existing.id !== req.user.id) {
      return res.status(409).json({ message: 'Email is already in use by another account.' });
    }

    await User.update(req.user.id, { name, email, linkedin, naukri, workindia, glassdoor, portfolio });
    const updated = await User.findById(req.user.id);
    const { password, ...safeUser } = updated;
    res.json({ message: 'Profile updated successfully.', user: safeUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/profile/password
// @desc    Change password
router.put('/password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Both current and new password are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters.' });
    }

    const user = await User.findById(req.user.id);
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect.' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await User.updatePassword(req.user.id, hashed);
    res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/profile/avatar
// @desc    Update profile picture (base64 encoded)
router.put('/avatar', async (req, res) => {
  try {
    const { avatar } = req.body;
    if (!avatar) return res.status(400).json({ message: 'No image data provided.' });

    // Basic size guard — base64 of 2MB image ≈ 2.7MB string
    if (avatar.length > 3 * 1024 * 1024) {
      return res.status(413).json({ message: 'Image too large. Please use an image under 2MB.' });
    }

    await User.updateAvatar(req.user.id, avatar);
    res.json({ message: 'Profile picture updated.', avatar });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
