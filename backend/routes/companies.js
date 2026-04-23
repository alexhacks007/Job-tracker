const express = require('express');
const router = express.Router();
const Company = require('../models/company');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// GET all companies for this user (admin sees all)
router.get('/', async (req, res) => {
  try {
    const companies = req.user.role === 'admin'
      ? await Company.findAll()
      : await Company.findByUserId(req.user.id);
    res.json(companies);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST create a company
router.post('/', async (req, res) => {
  try {
    const { name, mobile, email, address, website, notes } = req.body;
    if (!name) return res.status(400).json({ message: 'Company name is required.' });

    // Duplicate check
    const duplicate = await Company.findDuplicate(req.user.id, { name, mobile, email });
    if (duplicate) {
      const matchedFields = [];
      if (duplicate.name.toLowerCase() === name.toLowerCase()) matchedFields.push('Company Name');
      if (mobile && mobile.trim() && duplicate.mobile === mobile.trim()) matchedFields.push('Mobile Number');
      if (email && email.trim() && duplicate.email && duplicate.email.toLowerCase() === email.trim().toLowerCase()) matchedFields.push('Email');
      return res.status(409).json({
        message: `A company with the same ${matchedFields.join(' and ')} already exists: "${duplicate.name}".`
      });
    }

    const company = await Company.create({ user_id: req.user.id, name, mobile, email, address, website, notes });
    res.status(201).json({ message: 'Company added', id: company.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT update a company
router.put('/:id', async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ message: 'Company not found' });
    if (company.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const { name, mobile, email, address, website, notes } = req.body;
    if (!name) return res.status(400).json({ message: 'Company name is required.' });

    // Duplicate check (exclude current company from the check)
    const duplicate = await Company.findDuplicate(req.user.id, { name, mobile, email }, req.params.id);
    if (duplicate) {
      const matchedFields = [];
      if (duplicate.name.toLowerCase() === name.toLowerCase()) matchedFields.push('Company Name');
      if (mobile && mobile.trim() && duplicate.mobile === mobile.trim()) matchedFields.push('Mobile Number');
      if (email && email.trim() && duplicate.email && duplicate.email.toLowerCase() === email.trim().toLowerCase()) matchedFields.push('Email');
      return res.status(409).json({
        message: `A company with the same ${matchedFields.join(' and ')} already exists: "${duplicate.name}".`
      });
    }

    await Company.update(req.params.id, { name, mobile, email, address, website, notes });
    res.json({ message: 'Company updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE a company
router.delete('/:id', async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ message: 'Company not found' });
    if (company.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await Company.delete(req.params.id);
    res.json({ message: 'Company deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
