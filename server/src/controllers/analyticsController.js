import {
  getDailyAnalytics,
  getWeeklyAnalytics,
  getMonthlyAnalytics,
} from '../services/analyticsService.js';
import { format } from 'date-fns';

export const getDaily = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const date = req.query.date || format(new Date(), 'yyyy-MM-dd');
    const analytics = await getDailyAnalytics(userId, date);
    res.json(analytics);
  } catch (err) {
    next(err);
  }
};

export const getWeekly = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const date = req.query.date || format(new Date(), 'yyyy-MM-dd');
    const analytics = await getWeeklyAnalytics(userId, date);
    res.json(analytics);
  } catch (err) {
    next(err);
  }
};

export const getMonthly = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const date = req.query.date || format(new Date(), 'yyyy-MM-dd');
    const analytics = await getMonthlyAnalytics(userId, date);
    res.json(analytics);
  } catch (err) {
    next(err);
  }
};
