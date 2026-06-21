const express = require('express');
const router = express.Router();
const Job = require('../models/job');
const authMiddleware = require('../middleware/auth');

// Apply auth middleware to all job routes
router.use(authMiddleware);

// @route   POST /api/jobs
// @desc    Add a new job
router.post('/', async (req, res) => {
  try {
    const { company_name, job_role, location, salary, status, applied_date, platform } = req.body;
    
    const newJob = await Job.create({
      user_id: req.user.id,
      company_name,
      job_role,
      location,
      salary,
      status: status || 'Applied',
      applied_date: applied_date || new Date().toISOString().split('T')[0],
      platform: platform || null
    });

    res.status(201).json({ message: 'Job created', jobId: newJob.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/jobs
// @desc    Get all jobs for logged in user (or all jobs if admin)
router.get('/', async (req, res) => {
  try {
    let jobs;
    if (req.user.role === 'admin') {
      jobs = await Job.findAll();
    } else {
      jobs = await Job.findByUserId(req.user.id);
    }
    res.json(jobs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/jobs/:id
// @desc    Get a single job by id
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (job.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    res.json(job);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/jobs/:id
// @desc    Edit a job
router.put('/:id', async (req, res) => {
  try {
    const jobId = req.params.id;
    const job = await Job.findById(jobId);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Only owner or admin can edit
    if (job.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to edit this job' });
    }

    const { company_name, job_role, location, salary, status, applied_date, interview_date, interview_result, notes, platform } = req.body;
    
    await Job.update(jobId, {
      company_name: company_name || job.company_name,
      job_role: job_role || job.job_role,
      location: location || job.location,
      salary: salary || job.salary,
      status: status || job.status,
      applied_date: applied_date || job.applied_date,
      interview_date: interview_date !== undefined ? interview_date : job.interview_date,
      interview_result: interview_result !== undefined ? interview_result : job.interview_result,
      notes: notes !== undefined ? notes : job.notes,
      platform: platform !== undefined ? platform : job.platform
    });

    res.json({ message: 'Job updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/jobs/:id
// @desc    Delete a job
router.delete('/:id', async (req, res) => {
  try {
     const jobId = req.params.id;
     const job = await Job.findById(jobId);
     
     if (!job) {
       return res.status(404).json({ message: 'Job not found' });
     }
 
     // Only owner or admin can delete
     if (job.user_id !== req.user.id && req.user.role !== 'admin') {
       return res.status(403).json({ message: 'Not authorized to delete this job' });
     }
 
     await Job.delete(jobId);
     res.json({ message: 'Job removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
