import DailyReview from '../models/DailyReview.js';
import { getDailyAnalytics } from '../services/analyticsService.js';
import { format } from 'date-fns';

export const getDailyReview = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const date = req.query.date || format(new Date(), 'yyyy-MM-dd');

    const review = await DailyReview.findOne({ userId, date });
    const liveStats = await getDailyAnalytics(userId, date);

    res.json({
      review: review || null,
      liveStats,
    });
  } catch (err) {
    next(err);
  }
};

export const saveDailyReview = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const {
      date,
      wentWell,
      notWell,
      distractions,
      learnedToday,
      improveTomorrow,
      topPrioritiesTomorrow,
    } = req.body;

    if (!date) {
      return res.status(400).json({ error: 'Validation Error', message: 'date is required.' });
    }

    // Capture snapshot of stats at time of review
    const liveStats = await getDailyAnalytics(userId, date);

    const statsSnapshot = {
      completedTasksCount: liveStats.completedTasks,
      incompleteTasksCount: liveStats.pendingTasks,
      plannedMinutes: liveStats.plannedMinutes,
      focusedMinutes: liveStats.actualFocusedMinutes,
      focusSessionsCount: liveStats.focusSessionsCount,
      highPriorityCompletedCount: liveStats.highPriorityCompleted,
      completionRate: liveStats.completionRate,
      timeUtilization: liveStats.timeUtilizationRate,
    };

    const review = await DailyReview.findOneAndUpdate(
      { userId, date },
      {
        userId,
        date,
        wentWell: wentWell || '',
        notWell: notWell || '',
        distractions: distractions || '',
        learnedToday: learnedToday || '',
        improveTomorrow: improveTomorrow || '',
        topPrioritiesTomorrow: Array.isArray(topPrioritiesTomorrow) ? topPrioritiesTomorrow : ['', '', ''],
        statsSnapshot,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json(review);
  } catch (err) {
    next(err);
  }
};

export const getReviewHistory = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const { limit = 30 } = req.query;

    const reviews = await DailyReview.find({ userId })
      .sort({ date: -1 })
      .limit(parseInt(limit));

    res.json(reviews);
  } catch (err) {
    next(err);
  }
};
