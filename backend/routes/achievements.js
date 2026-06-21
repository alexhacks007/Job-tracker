const express = require('express');
const router = express.Router();
const Job = require('../models/job');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/achievements
router.get('/', async (req, res) => {
  try {
    const jobs = await Job.findByUserId(req.user.id);
    
    // Determine Streak
    // 1. Get unique sorted dates in descending order
    const datesSet = new Set();
    jobs.forEach(j => { if (j.applied_date) datesSet.add(j.applied_date); });
    const sortedDates = Array.from(datesSet).sort((a,b) => new Date(b) - new Date(a));

    let currentStreak = 0;
    const todayStr = new Date().toISOString().split('T')[0];
    let checkDate = new Date();

    // Reset loop checks from today downwards
    for (let i = 0; i < sortedDates.length; i++) {
        let cmpDateStr = checkDate.toISOString().split('T')[0];
        if (sortedDates.includes(cmpDateStr)) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else if (cmpDateStr === todayStr) {
            // It's fine if they haven't applied today, check yesterday
            checkDate.setDate(checkDate.getDate() - 1);
            cmpDateStr = checkDate.toISOString().split('T')[0];
            if (sortedDates.includes(cmpDateStr)) {
                currentStreak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        } else {
            break;
        }
    }

    const streak = {
      currentStreak: currentStreak,
      longestStreak: Math.max(currentStreak, 1), // Simplistic measure for MVP
      statusMessage: currentStreak > 2 ? `You applied ${currentStreak} days in a row 🔥` : (currentStreak === 0 ? "Time to start applying!" : "Keep the momentum going!")
    };

    // Calculate dynamic achievements
    let totalInterviews = 0;
    let totalOffers = 0;
    jobs.forEach(j => {
      const status = j.status.toLowerCase();
      if (status.includes('interview')) totalInterviews++;
      else if (status.includes('offer')) totalOffers++;
    });

    const isConsistencyStarter = currentStreak >= 3;
    const isCenturyMark = jobs.length >= 100;
    const isInterviewMaestro = totalInterviews >= 5;
    const isBoss = totalOffers >= 1;

    const achievements = [
      { id: 1, name: 'Consistency Starter', description: 'Applied 3 days in a row.', unlocked: isConsistencyStarter, date: isConsistencyStarter ? todayStr : null },
      { id: 2, name: 'Century Mark', description: 'Hit 100 total applications.', unlocked: isCenturyMark, date: isCenturyMark ? todayStr : null },
      { id: 3, name: 'Interview Maestro', description: 'Secured 5 interviews.', unlocked: isInterviewMaestro, date: isInterviewMaestro ? todayStr : null },
      { id: 4, name: 'The Final Boss', description: 'Received your first offer.', unlocked: isBoss, date: isBoss ? todayStr : null }
    ];

    res.json({ success: true, data: { achievements, streak } });
  } catch(e) { 
    console.error(e);
    res.status(500).json({ success: false }); 
  }
});

module.exports = router;
