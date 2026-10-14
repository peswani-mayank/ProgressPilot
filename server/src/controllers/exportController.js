import Task from '../models/Task.js';
import FocusSession from '../models/FocusSession.js';
import Goal from '../models/Goal.js';
import DailyReview from '../models/DailyReview.js';
import TaskOccurrence from '../models/TaskOccurrence.js';
import User from '../models/User.js';

const escapeCSV = (value) => {
  if (value === null || value === undefined) return '""';
  const str = String(value).replace(/"/g, '""');
  return `"${str}"`;
};

const arrayToCSV = (headers, rows) => {
  const headerLine = headers.map(escapeCSV).join(',');
  const rowLines = rows.map((r) => r.map(escapeCSV).join(','));
  return [headerLine, ...rowLines].join('\r\n');
};

export const exportTasksCSV = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const tasks = await Task.find({ userId }).sort({ createdAt: -1 });

    const headers = [
      'Task ID',
      'Title',
      'Description',
      'Category',
      'Priority',
      'Status',
      'Schedule Type',
      'Start Date',
      'Due Date',
      'Estimated Duration (mins)',
      'Actual Focused Duration (mins)',
      'Postpone Count',
      'Notes',
      'Created At',
      'Completed At',
    ];

    const rows = tasks.map((t) => [
      t._id.toString(),
      t.title,
      t.description,
      t.category,
      t.priority,
      t.status,
      t.scheduleType,
      t.startDate || '',
      t.dueDate || '',
      t.estimatedDuration,
      t.actualDuration,
      t.postponeCount,
      t.notes,
      t.createdAt ? t.createdAt.toISOString() : '',
      t.completedAt ? t.completedAt.toISOString() : '',
    ]);

    const csv = arrayToCSV(headers, rows);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="progresspilot-tasks-${Date.now()}.csv"`);
    res.status(200).send(csv);
  } catch (err) {
    next(err);
  }
};

export const exportTimeLogsCSV = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const sessions = await FocusSession.find({ userId }).sort({ startTime: -1 });

    const headers = [
      'Session ID',
      'Task Title',
      'Category',
      'Session Type',
      'Start Time',
      'End Time',
      'Duration (mins)',
      'Is Manual Entry',
      'Notes',
    ];

    const rows = sessions.map((s) => [
      s._id.toString(),
      s.taskTitle,
      s.category,
      s.sessionType,
      s.startTime ? s.startTime.toISOString() : '',
      s.endTime ? s.endTime.toISOString() : '',
      s.durationMinutes,
      s.isManualEntry ? 'Yes' : 'No',
      s.notes,
    ]);

    const csv = arrayToCSV(headers, rows);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="progresspilot-timelogs-${Date.now()}.csv"`);
    res.status(200).send(csv);
  } catch (err) {
    next(err);
  }
};

export const exportGoalsCSV = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const goals = await Goal.find({ userId }).sort({ createdAt: -1 });

    const headers = [
      'Goal ID',
      'Title',
      'Category',
      'Start Date',
      'Target Deadline',
      'Target Value',
      'Target Unit',
      'Current Progress',
      'Progress %',
      'Status',
      'Milestones Count',
      'Notes',
    ];

    const rows = goals.map((g) => {
      const pct = g.targetValue > 0 ? Math.round((g.currentProgress / g.targetValue) * 100) : 0;
      return [
        g._id.toString(),
        g.title,
        g.category,
        g.startDate,
        g.targetDeadline,
        g.targetValue,
        g.targetUnit,
        g.currentProgress,
        `${pct}%`,
        g.status,
        g.milestones?.length || 0,
        g.notes,
      ];
    });

    const csv = arrayToCSV(headers, rows);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="progresspilot-goals-${Date.now()}.csv"`);
    res.status(200).send(csv);
  } catch (err) {
    next(err);
  }
};

export const exportAllJSON = async (req, res, next) => {
  try {
    const userId = req.user.uid;

    const [user, tasks, occurrences, focusSessions, goals, reviews] = await Promise.all([
      User.findOne({ userId }),
      Task.find({ userId }),
      TaskOccurrence.find({ userId }),
      FocusSession.find({ userId }),
      Goal.find({ userId }),
      DailyReview.find({ userId }),
    ]);

    const exportPayload = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      user: {
        userId: user?.userId,
        email: user?.email,
        displayName: user?.displayName,
        preferences: user?.preferences,
      },
      tasks,
      occurrences,
      focusSessions,
      goals,
      dailyReviews: reviews,
      metadata: {
        totalTasks: tasks.length,
        totalFocusSessions: focusSessions.length,
        totalGoals: goals.length,
        totalReviews: reviews.length,
      },
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="progresspilot-backup-${userId}-${Date.now()}.json"`);
    res.status(200).json(exportPayload);
  } catch (err) {
    next(err);
  }
};
