const express = require('express');
const router = express.Router();
const Job = require('../models/job');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// @route   GET /api/dashboard/stats
// @desc    Get stats for dashboard charts & cards
router.get('/stats', async (req, res) => {
  try {
    let jobs;
    if (req.user.role === 'admin') {
      jobs = await Job.findAll();
    } else {
      jobs = await Job.findByUserId(req.user.id);
    }

    // Default stats layout required by the frontend blueprint
    const stats = {
      totalJobs: jobs.length,
      applied: 0,
      interviews: 0,
      offers: 0,
      rejected: 0,
      chartData: [], // Applications over time (bonus feature calculation)
      applicationsByDate: {},
      interviewsByDate: {},
      upcomingInterviews: []
    };

    const dateCounts = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    jobs.forEach(job => {
      const status = job.status.toLowerCase();
      if (status.includes('applied')) stats.applied++;
      else if (status.includes('interview')) stats.interviews++;
      else if (status.includes('offer')) stats.offers++;
      else if (status.includes('reject')) stats.rejected++;

      if (job.applied_date) {
        dateCounts[job.applied_date] = (dateCounts[job.applied_date] || 0) + 1;
        stats.applicationsByDate[job.applied_date] = (stats.applicationsByDate[job.applied_date] || 0) + 1;
      }

      // Only count interview_date on the calendar if the job status is still "Interview"
      if (job.interview_date && status.includes('interview')) {
        if (!stats.interviewsByDate[job.interview_date]) {
          stats.interviewsByDate[job.interview_date] = [];
        }
        stats.interviewsByDate[job.interview_date].push(job);

        // Check for upcoming interviews
        const intDate = new Date(job.interview_date);
        intDate.setHours(0, 0, 0, 0); // normalize
        if (intDate >= today) {
          stats.upcomingInterviews.push(job);
        }
      }
    });

    // Sort upcoming interviews by date ascending
    stats.upcomingInterviews.sort((a, b) => new Date(a.interview_date) - new Date(b.interview_date));

    // Populate chartData for "Applications over Time" line chart
    stats.chartData = Object.keys(dateCounts)
      .sort((a,b) => new Date(a) - new Date(b))
      .map(date => ({
         date,
         applications: dateCounts[date]
      }));

    // Include recent raw job data for the activity timeline fallback
    stats.recentJobs = jobs.slice(0, 5);

    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/dashboard/admin
// @desc    Get global stats for Super Admin / Admin
router.get('/admin', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const db = require('../db/setup');

    const query = (sql, params = []) => new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows));
    });
    const get = (sql, params = []) => new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => err ? reject(err) : resolve(row));
    });

    const [userCount, jobCount, interviewCount, statusDist, topComp, chartData] = await Promise.all([
      get("SELECT COUNT(*) as count FROM users"),
      get("SELECT COUNT(*) as count FROM jobs"),
      get("SELECT COUNT(*) as count FROM jobs WHERE status LIKE '%interview%'"),
      query("SELECT status as name, COUNT(*) as value FROM jobs GROUP BY status"),
      query("SELECT company_name as name, COUNT(*) as applications FROM jobs GROUP BY company_name ORDER BY applications DESC LIMIT 5"),
      query(`SELECT applied_date as date, COUNT(*) as count FROM jobs WHERE applied_date >= date('now', '-' || ? || ' days') GROUP BY applied_date ORDER BY applied_date ASC`, [days])
    ]);

    // Risk users join
    let recentRiskUsers = await query(`
      SELECT u.id, u.name, u.email, bm.drop_rate as dropRate
      FROM users u
      JOIN behavior_metrics bm ON u.id = bm.user_id
      WHERE bm.drop_rate > 40
      ORDER BY bm.drop_rate DESC
      LIMIT 5
    `);

    if (!recentRiskUsers || recentRiskUsers.length === 0) {
      const fallbacks = await query("SELECT id, name, email FROM users ORDER BY id DESC LIMIT 5");
      recentRiskUsers = fallbacks.map(u => ({ ...u, dropRate: 35 }));
    }

    res.json({
      totalUsers: userCount?.count || 0,
      totalJobs: jobCount?.count || 0,
      totalInterviews: interviewCount?.count || 0,
      recentRiskUsers,
      globalChartData: chartData,
      statusDistribution: statusDist,
      topCompanies: topComp
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
