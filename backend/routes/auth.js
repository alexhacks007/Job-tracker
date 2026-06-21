const express = require('express');
const router = express.Router();
const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// @route   POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    // Check if user exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Assign role (default user if not provided)
    const userRole = role === 'admin' ? 'admin' : 'user';

    // Create user
    const newUser = await User.create({ name, email, password: hashedPassword, role: userRole });

    // Generate token
    const permissions = await User.getPermissions(newUser.id);
    
    const token = jwt.sign(
      { id: newUser.id, role: newUser.role, name: newUser.name, permissions },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(201).json({ token, user: { ...newUser, permissions } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check pass
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate Token
    const permissions = await User.getPermissions(user.id);
    
    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name, permissions },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, permissions } });

    // Log login activity async
    const db = require('../db/setup');
    db.run("INSERT INTO activity_logs (user_id, action_type, action_details) VALUES (?, ?, ?)", [user.id, 'login', 'User authenticated successfully'], (err) => {
      if (err) console.error('Failed to log login', err);
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
