import ReminderPreference from '../models/ReminderPreference.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { evaluateUserReminder } from '../services/smartReminderService.js';
import {
  sendAccountabilityEmail,
  buildReminderHtml,
  buildReminderText,
} from '../services/emailService.js';
import { addMinutes, addDays, format } from 'date-fns';

/**
 * GET /api/reminders/preferences
 */
export const getPreferences = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    let prefs = await ReminderPreference.findOne({ userId });

    if (!prefs) {
      prefs = await ReminderPreference.create({ userId });
    }

    res.json(prefs);
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/reminders/preferences
 */
export const updatePreferences = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const updates = req.body;

    // Disallow overriding userId
    delete updates.userId;
    delete updates._id;

    // Validate followUpIntervalMinutes
    if (updates.followUpIntervalMinutes && ![15, 30, 60].includes(Number(updates.followUpIntervalMinutes))) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'followUpIntervalMinutes must be 15, 30, or 60.',
      });
    }

    const prefs = await ReminderPreference.findOneAndUpdate(
      { userId },
      { $set: updates },
      { new: true, upsert: true, runValidators: true }
    );

    res.json(prefs);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/reminders/snooze
 * Body: { durationMinutes: 30 | 60 | 'tomorrow' }
 */
export const snoozeReminders = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const { durationMinutes } = req.body;

    let snoozedUntil;
    const now = new Date();

    if (durationMinutes === 'tomorrow' || durationMinutes === 'day') {
      const tomorrow = addDays(now, 1);
      snoozedUntil = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 9, 0, 0);
    } else {
      const mins = Number(durationMinutes) || 30;
      snoozedUntil = addMinutes(now, mins);
    }

    const prefs = await ReminderPreference.findOneAndUpdate(
      { userId },
      { snoozedUntil },
      { new: true, upsert: true }
    );

    res.json({
      message: `Reminders snoozed until ${snoozedUntil.toLocaleTimeString()}`,
      snoozedUntil,
      prefs,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/reminders/pause
 * Body: { days: Number, reason: String }
 */
export const pauseReminders = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const { days = 1, reason = '' } = req.body;

    const pausedUntil = addDays(new Date(), Math.max(1, Number(days)));

    const prefs = await ReminderPreference.findOneAndUpdate(
      { userId },
      {
        isPaused: true,
        pausedUntil,
        pauseReason: reason.trim(),
      },
      { new: true, upsert: true }
    );

    res.json({
      message: `Reminders paused for ${days} day(s) until ${pausedUntil.toLocaleDateString()}`,
      pausedUntil,
      prefs,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/reminders/resume
 */
export const resumeReminders = async (req, res, next) => {
  try {
    const userId = req.user.uid;

    const prefs = await ReminderPreference.findOneAndUpdate(
      { userId },
      {
        isPaused: false,
        pausedUntil: null,
        pauseReason: '',
        snoozedUntil: null,
      },
      { new: true, upsert: true }
    );

    res.json({
      message: 'Reminders resumed successfully.',
      prefs,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/reminders/evaluate
 * Triggers manual on-demand evaluation (for testing or instant check)
 */
export const evaluateNow = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const { force = true, simulateTime = null, simulateDate = null } = req.body;

    const result = await evaluateUserReminder(userId, {
      force,
      simulateTime,
      simulateDate,
    });

    res.json({
      message: result.notified ? 'Reminder evaluated and dispatched!' : `Evaluated: ${result.reason}`,
      result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/reminders/send-test-email
 * Dispatches a real test email to authenticated user's email address
 */
export const sendTestEmail = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const user = await User.findOne({ userId });

    if (!user || !user.email) {
      return res.status(400).json({ error: 'User email not found.' });
    }

    const clientUrl =
      (process.env.CLIENT_URL && process.env.CLIENT_URL !== 'http://localhost:5173')
        ? process.env.CLIENT_URL
        : (process.env.NODE_ENV === 'production' ? 'https://progresspilots.netlify.app' : 'http://localhost:5173');
    const todayStr = format(new Date(), 'yyyy-MM-dd');

    const sampleTasks = [
      { title: 'Complete DSA Trees and Graphs', priority: 'high', estimatedDuration: 90 },
      { title: 'Fullstack Project Architecture', priority: 'medium', estimatedDuration: 60 },
    ];

    const html = buildReminderHtml({
      displayName: user.displayName || 'Progress Pilot',
      dateStr: todayStr,
      message: 'This is a live test email from ProgressPilot Smart Accountability Reminders! Your email delivery is working perfectly.',
      pendingTasks: sampleTasks,
      dashboardUrl: `${clientUrl}/tasks?date=${todayStr}`,
    });

    const text = buildReminderText({
      displayName: user.displayName || 'Progress Pilot',
      dateStr: todayStr,
      message: 'This is a live test email from ProgressPilot Smart Accountability Reminders! Your email delivery is working perfectly.',
      pendingTasks: sampleTasks,
      dashboardUrl: `${clientUrl}/tasks?date=${todayStr}`,
    });

    const result = await sendAccountabilityEmail({
      to: user.email,
      subject: '⚡ ProgressPilot Live Email Test: Smart Accountability Reminder',
      html,
      text,
    });

    if (result.success) {
      res.json({
        success: true,
        message: `Email successfully delivered to ${user.email}!`,
        provider: result.provider,
        messageId: result.messageId,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        status: result.status,
      });
    }
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/reminders/history
 * Returns recent reminder events and delivery history
 */
export const getReminderHistory = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const history = await Notification.find({
      userId,
      type: 'smart_reminder',
    })
      .sort({ createdAt: -1 })
      .limit(30);

    res.json(history);
  } catch (err) {
    next(err);
  }
};
