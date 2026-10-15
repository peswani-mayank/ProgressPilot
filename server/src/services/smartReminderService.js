import ReminderPreference from '../models/ReminderPreference.js';
import Notification from '../models/Notification.js';
import TaskOccurrence from '../models/TaskOccurrence.js';
import Task from '../models/Task.js';
import FocusSession from '../models/FocusSession.js';
import User from '../models/User.js';
import { syncOccurrencesForDate } from './occurrenceService.js';
import {
  sendAccountabilityEmail,
  buildReminderHtml,
  buildReminderText,
} from './emailService.js';

/**
 * Calculates current local date and time for a given IANA timezone.
 */
export const getUserLocalTime = (timezone = 'UTC', baseDate = new Date()) => {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const parts = formatter.formatToParts(baseDate);
    const partMap = {};
    parts.forEach((p) => {
      partMap[p.type] = p.value;
    });

    const year = partMap.year;
    const month = partMap.month;
    const day = partMap.day;
    const hour = partMap.hour === '24' ? '00' : partMap.hour;
    const minute = partMap.minute;

    const localDateStr = `${year}-${month}-${day}`;
    const localTimeStr = `${hour}:${minute}`;
    const currentMinutes = parseInt(hour, 10) * 60 + parseInt(minute, 10);

    return { localDateStr, localTimeStr, currentMinutes };
  } catch {
    // Fallback to UTC on invalid timezone
    const year = baseDate.getUTCFullYear();
    const month = String(baseDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(baseDate.getUTCDate()).padStart(2, '0');
    const hour = String(baseDate.getUTCHours()).padStart(2, '0');
    const minute = String(baseDate.getUTCMinutes()).padStart(2, '0');

    return {
      localDateStr: `${year}-${month}-${day}`,
      localTimeStr: `${hour}:${minute}`,
      currentMinutes: parseInt(hour, 10) * 60 + parseInt(minute, 10),
    };
  }
};

/**
 * Checks if a time HH:mm is inside a window [start, end].
 * Handles overnight intervals such as 22:00 to 08:00.
 */
export const isTimeInWindow = (timeStr, startStr, endStr) => {
  const [h, m] = timeStr.split(':').map(Number);
  const [sh, sm] = startStr.split(':').map(Number);
  const [eh, em] = endStr.split(':').map(Number);

  const cur = h * 60 + m;
  const start = sh * 60 + sm;
  const end = eh * 60 + em;

  if (start <= end) {
    // Normal window within same day (e.g. 18:00 to 21:00)
    return cur >= start && cur <= end;
  } else {
    // Overnight window (e.g. 22:00 to 08:00)
    return cur >= start || cur <= end;
  }
};

/**
 * Generates contextual accountability message based on actual user progress.
 */
export const generateReminderMessage = ({
  completedCount,
  pendingCount,
  topTask,
  hasStartedFocus,
  totalRemainingMinutes,
  eveningMinutesRemaining,
}) => {
  const taskTitle = topTask?.title || 'your key priority';

  // 1. Overloaded Day check
  if (
    eveningMinutesRemaining > 0 &&
    totalRemainingMinutes > eveningMinutesRemaining * 1.25 &&
    pendingCount > 1
  ) {
    const hours = Math.round((totalRemainingMinutes / 60) * 10) / 10;
    return `You have ${hours}h of work planned with limited evening time remaining. Consider rescheduling or focusing just on '${taskTitle}'.`;
  }

  // 2. Partial progress (some done, important tasks pending)
  if (completedCount > 0) {
    return `Good progress today! You completed ${completedCount} task${completedCount > 1 ? 's' : ''}. Your ${taskTitle} is still pending.`;
  }

  // 3. User already started a focus session today, follow-up nudge
  if (hasStartedFocus) {
    return `Your '${taskTitle}' is still on today's plan. Can you give it 25 focused minutes now?`;
  }

  // 4. First reminder (no progress yet)
  return `Your daily plan is waiting. You have ${pendingCount} task${pendingCount > 1 ? 's' : ''} remaining. Start with your top priority: '${taskTitle}'.`;
};

/**
 * Evaluates a single user for smart reminder eligibility and dispatches notifications.
 */
export const evaluateUserReminder = async (userId, options = {}) => {
  const {
    force = false,
    simulateTime = null,
    simulateDate = null,
    now = new Date(),
  } = options;

  // 1. Get or create Reminder Preferences
  let prefs = await ReminderPreference.findOne({ userId });
  if (!prefs) {
    prefs = await ReminderPreference.create({ userId });
  }

  // 2. Check enabled status
  if (!prefs.enabled && !force) {
    return { evaluated: true, notified: false, reason: 'reminders_disabled' };
  }

  // 3. Check pause state
  if (!force && prefs.isPaused) {
    if (prefs.pausedUntil && new Date(prefs.pausedUntil) <= now) {
      // Auto-resume if pause duration expired
      prefs.isPaused = false;
      prefs.pausedUntil = null;
      prefs.pauseReason = '';
      await prefs.save();
    } else {
      return { evaluated: true, notified: false, reason: 'reminders_paused' };
    }
  }

  // 4. Check snooze state
  if (!force && prefs.snoozedUntil && new Date(prefs.snoozedUntil) > now) {
    return { evaluated: true, notified: false, reason: 'snoozed', snoozedUntil: prefs.snoozedUntil };
  }

  // 5. Evaluate local time & timezone
  const { localDateStr, localTimeStr, currentMinutes } = getUserLocalTime(prefs.timezone || 'UTC', now);
  const activeDateStr = simulateDate || localDateStr;
  const activeTimeStr = simulateTime || localTimeStr;

  // 6. Check quiet hours
  if (!force && prefs.quietHoursEnabled) {
    if (isTimeInWindow(activeTimeStr, prefs.quietHoursStart, prefs.quietHoursEnd)) {
      return { evaluated: true, notified: false, reason: 'in_quiet_hours' };
    }
  }

  // 7. Check reminder window [startTime, endTime]
  if (!force) {
    if (!isTimeInWindow(activeTimeStr, prefs.startTime, prefs.endTime)) {
      return { evaluated: true, notified: false, reason: 'outside_window' };
    }
  }

  // 8. Fetch current daily task state from database
  await syncOccurrencesForDate(userId, activeDateStr);

  const [occurrences, focusSessions, user] = await Promise.all([
    TaskOccurrence.find({
      userId,
      scheduledDate: activeDateStr,
    }).populate('taskId'),
    FocusSession.find({
      userId,
      startTime: {
        $gte: new Date(`${activeDateStr}T00:00:00.000Z`),
        $lte: new Date(`${activeDateStr}T23:59:59.999Z`),
      },
      sessionType: { $nin: ['short_break', 'long_break'] },
    }),
    User.findOne({ userId }),
  ]);

  // Valid occurrences with non-archived tasks
  const validOccurrences = occurrences.filter((o) => o.taskId && !o.taskId.isArchived);
  const completedOccurrences = validOccurrences.filter((o) => o.status === 'done');
  const pendingOccurrences = validOccurrences.filter((o) => o.status !== 'done');

  // Filter pending tasks matching configured priorities
  const eligiblePendingOccurrences = pendingOccurrences.filter((o) => {
    const priority = o.taskId.priority || 'medium';
    return (prefs.priorities || ['high', 'medium']).includes(priority);
  });

  const completedCount = completedOccurrences.length;
  const pendingCount = eligiblePendingOccurrences.length;

  // If no eligible tasks remain, all tasks are completed!
  if (pendingCount === 0) {
    return { evaluated: true, notified: false, reason: 'all_tasks_completed' };
  }

  // Check minimum pending-task threshold
  if (pendingCount < (prefs.minPendingTasks || 1) && !force) {
    return { evaluated: true, notified: false, reason: 'below_pending_threshold' };
  }

  // 9. Calculate slot & idempotency key
  const interval = prefs.followUpIntervalMinutes || 30;
  const [activeH, activeM] = activeTimeStr.split(':').map(Number);
  const minutesSinceMidnight = activeH * 60 + activeM;
  const slotIndex = Math.floor(minutesSinceMidnight / interval);
  const idempotencyKey = `reminder-${userId}-${activeDateStr}-slot-${slotIndex}`;

  // Check if notification was already sent for this slot
  const existingNotification = await Notification.findOne({
    userId,
    idempotencyKey,
  });

  if (existingNotification && !force) {
    return {
      evaluated: true,
      notified: false,
      reason: 'already_notified_this_interval',
      existingId: existingNotification._id,
    };
  }

  // Also check if any reminder was sent within the last (interval - 2) minutes
  if (!force) {
    const recentReminder = await Notification.findOne({
      userId,
      type: 'smart_reminder',
      createdAt: { $gte: new Date(now.getTime() - (interval - 2) * 60 * 1000) },
    });

    if (recentReminder) {
      return {
        evaluated: true,
        notified: false,
        reason: 'already_notified_recently',
        existingId: recentReminder._id,
      };
    }
  }

  // 10. Prioritize tasks: High > Medium > Low, then by estimatedDuration
  const priorityOrder = { high: 3, medium: 2, low: 1 };
  const sortedPending = [...eligiblePendingOccurrences].sort((a, b) => {
    const pA = priorityOrder[a.taskId.priority] || 2;
    const pB = priorityOrder[b.taskId.priority] || 2;
    if (pB !== pA) return pB - pA;
    return (b.taskId.estimatedDuration || 0) - (a.taskId.estimatedDuration || 0);
  });

  const topOccurrence = sortedPending[0];
  const topTask = topOccurrence.taskId;

  const totalRemainingMinutes = sortedPending.reduce(
    (acc, o) => acc + (o.taskId.estimatedDuration || 30),
    0
  );

  // Evening time remaining until 23:59 or end of day
  const eveningMinutesRemaining = Math.max(0, 24 * 60 - minutesSinceMidnight);

  // 11. Generate contextual message
  const message = generateReminderMessage({
    completedCount,
    pendingCount,
    topTask,
    hasStartedFocus: focusSessions.length > 0,
    totalRemainingMinutes,
    eveningMinutesRemaining,
  });

  const clientUrl =
    process.env.CLIENT_SERVICE_URL ||
    ((process.env.CLIENT_URL && process.env.CLIENT_URL !== 'http://localhost:5173')
      ? process.env.CLIENT_URL
      : (process.env.NODE_ENV === 'production' ? 'https://progresspilots.netlify.app' : 'http://localhost:5173'));
  const dashboardUrl = `${clientUrl}/tasks?date=${activeDateStr}`;

  const channelsDispatched = [];
  let inAppNotification = null;

  // 12. Deliver In-App Notification (Channel 1)
  if (prefs.channels?.inApp !== false) {
    inAppNotification = await Notification.create({
      userId,
      title: 'Daily Accountability Reminder',
      message,
      type: 'smart_reminder',
      channel: 'in_app',
      status: 'delivered',
      link: `/tasks?date=${activeDateStr}&highlight=${topTask._id}`,
      relatedId: topTask._id.toString(),
      idempotencyKey,
      metadata: {
        pendingCount,
        completedCount,
        topTaskTitle: topTask.title,
        topTaskPriority: topTask.priority,
        scheduledDate: activeDateStr,
      },
    });

    channelsDispatched.push('in_app');
  }

  // 13. Deliver Email Notification (Channel 2)
  let emailResult = null;
  const targetEmail = prefs.notificationEmail || user?.email;
  if (prefs.channels?.email && targetEmail) {
    // Reset daily email counter if date changed
    if (prefs.lastEmailDate !== activeDateStr) {
      prefs.emailsSentToday = 0;
      prefs.lastEmailDate = activeDateStr;
    }

    const maxEmails = prefs.maxEmailsPerDay || 3;

    if (prefs.emailsSentToday < maxEmails) {
      const emailTasks = sortedPending.slice(0, 5).map((o) => ({
        title: o.taskId.title,
        priority: o.taskId.priority,
        estimatedDuration: o.taskId.estimatedDuration,
      }));

      const html = buildReminderHtml({
        displayName: user?.displayName || 'Progress Pilot',
        dateStr: activeDateStr,
        message,
        pendingTasks: emailTasks,
        dashboardUrl,
      });

      const text = buildReminderText({
        displayName: user?.displayName || 'Progress Pilot',
        dateStr: activeDateStr,
        message,
        pendingTasks: emailTasks,
        dashboardUrl,
      });

      emailResult = await sendAccountabilityEmail({
        to: targetEmail,
        subject: `⚡ Your Daily Plan: ${topTask.title} (${pendingCount} pending)`,
        html,
        text,
      });

      if (emailResult.success) {
        prefs.emailsSentToday += 1;
        await prefs.save();
        channelsDispatched.push('email');

        // Log successful email event
        await Notification.create({
          userId,
          title: `Email Reminder Sent: ${topTask.title}`,
          message,
          type: 'smart_reminder',
          channel: 'email',
          status: 'delivered',
          providerMessageId: emailResult.messageId,
          idempotencyKey: `${idempotencyKey}-email`,
          link: `/tasks?date=${activeDateStr}`,
          relatedId: topTask._id.toString(),
          metadata: {
            recipient: targetEmail,
            providerMessageId: emailResult.messageId,
          },
        });
      } else {
        // Record email delivery failure while preserving in-app notification
        await Notification.create({
          userId,
          title: 'Email Reminder Delivery Failed',
          message: `Could not send email reminder to ${targetEmail}: ${emailResult.error}`,
          type: 'smart_reminder',
          channel: 'email',
          status: 'failed',
          deliveryError: emailResult.error,
          idempotencyKey: `${idempotencyKey}-email-failed`,
        });
      }
    }
  }

  return {
    evaluated: true,
    notified: true,
    channels: channelsDispatched,
    message,
    topTask: {
      id: topTask._id,
      title: topTask.title,
      priority: topTask.priority,
    },
    pendingCount,
    completedCount,
    notificationId: inAppNotification?._id,
    emailStatus: emailResult?.status,
  };
};

/**
 * Runs across all users during the scheduled background worker.
 */
export const evaluateAllReminders = async () => {
  const users = await User.find({});
  const results = [];

  for (const user of users) {
    try {
      const res = await evaluateUserReminder(user.userId);
      results.push({ userId: user.userId, ...res });
    } catch (err) {
      console.error(`[SmartReminder] Error evaluating user ${user.userId}:`, err.message);
      results.push({ userId: user.userId, error: err.message });
    }
  }

  return results;
};
