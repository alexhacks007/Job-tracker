const express = require('express');
const router = express.Router();
const Job = require('../models/job');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/insights
router.get('/', async (req, res) => {
  try {
    const jobs = await Job.findByUserId(req.user.id);
    const db = require('../db/setup');

    // Fetch all raw sentinel signals (both read and unread) for history tracking
    const rawSignals = await new Promise((resolve) => {
      db.all("SELECT id, insight_type, message, is_read, generated_at FROM ai_insights WHERE user_id = ? ORDER BY generated_at DESC LIMIT 20", [req.user.id], (err, rows) => {
        // Migration fallback: if column doesn't exist yet, show last 20
        if (err && err.message.includes('no such column')) {
           db.all("SELECT id, insight_type, message, generated_at FROM ai_insights WHERE user_id = ? ORDER BY generated_at DESC LIMIT 20", [req.user.id], (e, r) => resolve(r || []));
        } else {
           resolve(rows || []);
        }
      });
    });
    
    // Process insights from real data
    const insights = {
      adminNudge: rawSignals.find(s => s.insight_type === 'ADMIN_NUDGE')?.message || null,
      rawSignals,
      bestDay: { day: 'N/A', count: 0, message: 'Not enough data.' },
      weeklyChange: { percentage: 0, message: 'No data for comparison.' },
      goalRemaining: { target: 50, current: 0, message: 'Set a goal to track progress.' },
      conversionRates: { interviewRate: 0, offerRate: 0 },
      tips: [
        "Consistent applications lead to consistent interviews.",
        "Ensure your notes are detailed for better tracking."
      ],
      personalSuccessScore: 50 // baseline
    };

    if (!jobs || jobs.length === 0) {
      return res.json({ success: true, insights });
    }

    // Goal Remaining (Monthly default 50)
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const currentMonthJobs = jobs.filter(j => {
       const date = new Date(j.applied_date);
       return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });
    insights.goalRemaining.current = currentMonthJobs.length;
    insights.goalRemaining.message = `${Math.max(0, 50 - currentMonthJobs.length)} more applications to hit your 50/mo goal.`;

    // Conversion Rates
    let totalInterviews = 0;
    let totalOffers = 0;
    jobs.forEach(j => {
      const status = j.status.toLowerCase();
      if (status.includes('interview')) totalInterviews++;
      else if (status.includes('offer')) totalOffers++;
    });
    insights.conversionRates.interviewRate = Math.round((totalInterviews / jobs.length) * 100);
    insights.conversionRates.offerRate = Math.round((totalOffers / jobs.length) * 100);

    // Best Day
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayCounts = {0:0,1:0,2:0,3:0,4:0,5:0,6:0};
    jobs.forEach(j => {
      if (j.applied_date) {
        let d = new Date(j.applied_date).getDay();
        if(!isNaN(d)) dayCounts[d]++;
      }
    });
    let bestDayIndex = 0;
    for(let i=1; i<7; i++) {
       if (dayCounts[i] > dayCounts[bestDayIndex]) bestDayIndex = i;
    }
    if (dayCounts[bestDayIndex] > 0) {
      insights.bestDay = {
        day: days[bestDayIndex],
        count: dayCounts[bestDayIndex],
        message: `Highest rate on ${days[bestDayIndex]}s.`
      };
    }

    // Weekly Change
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    let currentWeekCount = 0;
    let priorWeekCount = 0;

    jobs.forEach(j => {
      if (j.applied_date) {
        const d = new Date(j.applied_date);
        if (d >= oneWeekAgo) currentWeekCount++;
        else if (d >= twoWeeksAgo && d < oneWeekAgo) priorWeekCount++;
      }
    });

    if (priorWeekCount === 0 && currentWeekCount > 0) {
      insights.weeklyChange.percentage = 100;
      insights.weeklyChange.message = `Infinite% jump compared to last week!`;
    } else if (priorWeekCount > 0) {
      const diff = currentWeekCount - priorWeekCount;
      const perc = Math.round((diff / priorWeekCount) * 100);
      insights.weeklyChange.percentage = perc;
      insights.weeklyChange.message = `${perc > 0 ? '+' : ''}${perc}% vs last week.`;
    } else {
      insights.weeklyChange.message = "Steady activity.";
    }

    // Basic tips dynamics
    if (insights.conversionRates.interviewRate < 10) {
      insights.tips.unshift("Your interview conversion rate is low. Consider tuning your resume keywords.");
    }
    if (insights.bestDay.count > 0) {
      insights.tips.push(`Keep applying on ${insights.bestDay.day}s, that's your sweet spot!`);
    }

    res.json({ success: true, insights });
  } catch(e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Error generating insights' });
  }
});

// PATCH /api/insights/:id/read
// Marks a specific signal as read
router.patch('/:id/read', async (req, res) => {
  try {
    const db = require('../db/setup');
    db.run("UPDATE ai_insights SET is_read = 1 WHERE id = ? AND user_id = ?", [req.params.id, req.user.id], (err) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      res.json({ success: true });
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/insights/clear-all
// Physically removes all signals for manual clean slate
router.delete('/clear-all', async (req, res) => {
  try {
    const db = require('../db/setup');
    db.run("DELETE FROM ai_insights WHERE user_id = ?", [req.user.id], (err) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      res.json({ success: true });
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/insights/suggest
// Allows frontend discovery to push a 'hot' recommendation to the user's Sentinel
router.post('/suggest', async (req, res) => {
  try {
    const { jobTitle, company, link } = req.body;
    const db = require('../db/setup');
    
    const message = `High-Potential Match: ${jobTitle} at ${company}. This role aligns with your stack. Check it out here: ${link}`;
    
    db.run(`
       INSERT INTO ai_insights (user_id, insight_type, message)
       VALUES (?, 'JOB_SUGGESTION', ?)
    `, [req.user.id, message], (err) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      res.json({ success: true, message: 'Suggestion pinned to user sentinel' });
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
