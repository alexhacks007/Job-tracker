const express = require('express');
const router = express.Router();
const Job = require('../models/job');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/analytics/funnel
router.get('/funnel', async (req, res) => {
  try {
    const jobs = await Job.findByUserId(req.user.id);
    let counts = {
      Applied: 0,
      Pending: 0,
      Called: 0,
      Interview: 0,
      Offer: 0,
      Rejected: 0
    };

    jobs.forEach(j => {
       const status = j.status;
       if (counts[status] !== undefined) counts[status]++;
       else counts.Applied++; // fallback
    });

    // Funnel data ordered
    const funnelData = [
      { name: 'Applied', value: counts.Applied + counts.Pending }, // combine start states
      { name: 'Screening', value: counts.Called },
      { name: 'Interview', value: counts.Interview },
      { name: 'Offer', value: counts.Offer }
    ];

    res.json({ success: true, data: funnelData });
  } catch(e){ res.status(500).json({ success: false }); }
});

// GET /api/analytics/heatmap
router.get('/heatmap', async (req, res) => {
  try {
    const jobs = await Job.findByUserId(req.user.id);
    
    // group by date string YYYY-MM-DD
    const dateMap = {};
    jobs.forEach(j => {
      if (j.applied_date) {
        dateMap[j.applied_date] = (dateMap[j.applied_date] || 0) + 1;
      }
    });

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 119); // ~17 weeks back
    
    const heatmapData = [];
    let currentDate = new Date(startDate);
    const endDate = new Date();

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      heatmapData.push({
        date: dateStr,
        count: dateMap[dateStr] || 0
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.json({ success: true, data: heatmapData });
  } catch(e) { res.status(500).json({ success: false }); }
});

// GET /api/analytics/distribution
router.get('/distribution', async (req, res) => {
  try {
    const jobs = await Job.findByUserId(req.user.id);
    const platforms = {};
    
    jobs.forEach(j => {
       const p = j.platform || 'Direct Upload';
       platforms[p] = (platforms[p] || 0) + 1;
    });

    const distributionData = Object.keys(platforms).map(k => ({
       name: k, value: platforms[k]
    }));

    res.json({ success: true, data: distributionData });
  } catch(e) { res.status(500).json({ success: false }); }
});

module.exports = router;
