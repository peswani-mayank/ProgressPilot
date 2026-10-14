import FocusSession from '../models/FocusSession.js';
import Task from '../models/Task.js';
import TaskOccurrence from '../models/TaskOccurrence.js';
import { format } from 'date-fns';

export const createFocusSession = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const {
      taskId,
      occurrenceId,
      clientSessionId,
      taskTitle,
      category,
      sessionType = 'pomodoro',
      startTime,
      endTime,
      durationMinutes,
      pausedIntervals = [],
      notes,
      isManualEntry = false,
    } = req.body;

    if (!startTime || !endTime || !durationMinutes || durationMinutes <= 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'startTime, endTime, and a positive durationMinutes are required.',
      });
    }

    // 1. Strict Idempotency check with clientSessionId
    if (clientSessionId) {
      const existingByClient = await FocusSession.findOne({ userId, clientSessionId });
      if (existingByClient) {
        return res.status(200).json(existingByClient);
      }
    }

    // 2. Duplicate check within 10 seconds window
    const startObj = new Date(startTime);
    const existing = await FocusSession.findOne({
      userId,
      startTime: {
        $gte: new Date(startObj.getTime() - 10000),
        $lte: new Date(startObj.getTime() + 10000),
      },
      durationMinutes,
    });

    if (existing) {
      return res.status(200).json({ message: 'Duplicate session ignored.', session: existing });
    }

    const session = await FocusSession.create({
      userId,
      taskId: taskId || null,
      occurrenceId: occurrenceId || null,
      clientSessionId: clientSessionId || null,
      taskTitle: taskTitle || 'General Focus',
      category: category || 'personal',
      sessionType,
      startTime: startObj,
      endTime: new Date(endTime),
      durationMinutes: Number(durationMinutes),
      pausedIntervals: Array.isArray(pausedIntervals) ? pausedIntervals : [],
      notes: notes || '',
      isManualEntry: Boolean(isManualEntry),
      completed: true,
      status: 'completed',
    });

    // If focused session (not a break), increment task and occurrence actualDuration
    const isFocusType = !['short_break', 'long_break'].includes(sessionType);
    if (isFocusType && taskId) {
      const task = await Task.findOne({ _id: taskId, userId });
      if (task) {
        task.actualDuration = (task.actualDuration || 0) + Number(durationMinutes);
        await task.save();

        if (occurrenceId) {
          await TaskOccurrence.findOneAndUpdate(
            { _id: occurrenceId, userId },
            { $inc: { actualDuration: Number(durationMinutes) } }
          );
        } else {
          const todayStr = format(startObj, 'yyyy-MM-dd');
          await TaskOccurrence.findOneAndUpdate(
            { userId, taskId, scheduledDate: todayStr },
            { $inc: { actualDuration: Number(durationMinutes) } },
            { upsert: true }
          );
        }
      }
    }

    res.status(201).json(session);
  } catch (err) {
    next(err);
  }
};

export const getFocusSessions = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const { date, startDate, endDate, category, limit = 100 } = req.query;

    const filter = { userId };
    if (category) filter.category = category;

    if (date) {
      filter.startTime = {
        $gte: new Date(`${date}T00:00:00.000Z`),
        $lte: new Date(`${date}T23:59:59.999Z`),
      };
    } else if (startDate && endDate) {
      filter.startTime = {
        $gte: new Date(`${startDate}T00:00:00.000Z`),
        $lte: new Date(`${endDate}T23:59:59.999Z`),
      };
    }

    const sessions = await FocusSession.find(filter)
      .sort({ startTime: -1 })
      .limit(parseInt(limit));

    res.json(sessions);
  } catch (err) {
    next(err);
  }
};

export const getTodayFocusStats = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const todayStr = format(new Date(), 'yyyy-MM-dd');

    const sessions = await FocusSession.find({
      userId,
      startTime: {
        $gte: new Date(`${todayStr}T00:00:00.000Z`),
        $lte: new Date(`${todayStr}T23:59:59.999Z`),
      },
      sessionType: { $nin: ['short_break', 'long_break'] },
    });

    const totalMinutes = sessions.reduce((acc, s) => acc + s.durationMinutes, 0);
    const totalSessions = sessions.length;

    res.json({
      date: todayStr,
      totalMinutes,
      totalHours: Number((totalMinutes / 60).toFixed(1)),
      totalSessions,
      sessions,
    });
  } catch (err) {
    next(err);
  }
};
