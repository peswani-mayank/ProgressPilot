import Task from '../models/Task.js';
import TaskOccurrence from '../models/TaskOccurrence.js';
import { parseISO, format, addDays, getDay, isBefore, isAfter, startOfDay } from 'date-fns';

/**
 * Checks if a task should recur on a specific date (YYYY-MM-DD)
 */
export const isTaskScheduledOnDate = (task, dateStr) => {
  const targetDate = parseISO(dateStr);
  const targetDayOfWeek = getDay(targetDate); // 0 = Sun, 1 = Mon ...

  // One-time task check
  if (task.scheduleType === 'one_time') {
    return task.dueDate === dateStr || task.startDate === dateStr;
  }

  // If recurrence is paused or task is archived
  if (task.isArchived || task.recurrenceRule?.isPaused) {
    return false;
  }

  const startRecurrence = task.recurrenceRule?.startDate || task.startDate || task.createdAt.toISOString().slice(0, 10);
  if (startRecurrence && isBefore(targetDate, startOfDay(parseISO(startRecurrence)))) {
    return false;
  }

  const endRecurrence = task.recurrenceRule?.endDate;
  if (endRecurrence && isAfter(targetDate, startOfDay(parseISO(endRecurrence)))) {
    return false;
  }

  const frequency = task.recurrenceRule?.frequency || 'daily';

  if (frequency === 'daily') {
    const interval = task.recurrenceRule?.interval || 1;
    if (interval === 1) return true;

    const startDate = parseISO(startRecurrence);
    const diffDays = Math.round((targetDate - startDate) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays % interval === 0;
  }

  if (frequency === 'weekly') {
    const days = task.recurrenceRule?.daysOfWeek;
    if (Array.isArray(days) && days.length > 0) {
      return days.includes(targetDayOfWeek);
    }
    // If no specific days listed, recur on the same day of week as start date
    const startDay = getDay(parseISO(startRecurrence));
    return targetDayOfWeek === startDay;
  }

  if (frequency === 'custom') {
    const days = task.recurrenceRule?.daysOfWeek || [];
    if (days.length > 0) {
      return days.includes(targetDayOfWeek);
    }
    return true;
  }

  return false;
};

/**
 * Ensures TaskOccurrence records exist in DB for a given date and user,
 * preventing duplicates via findOneAndUpdate with upsert.
 */
export const syncOccurrencesForDate = async (userId, dateStr) => {
  // 1. Fetch all user tasks that are not archived
  const tasks = await Task.find({ userId, isArchived: false });

  const scheduledTasks = tasks.filter((t) => isTaskScheduledOnDate(t, dateStr));

  // 2. For each scheduled task, ensure an occurrence exists
  const occurrenceOps = scheduledTasks.map((task) => ({
    updateOne: {
      filter: { userId, taskId: task._id, scheduledDate: dateStr },
      update: {
        $setOnInsert: {
          userId,
          taskId: task._id,
          scheduledDate: dateStr,
          status: 'todo',
          actualDuration: 0,
        },
      },
      upsert: true,
    },
  }));

  if (occurrenceOps.length > 0) {
    try {
      await TaskOccurrence.bulkWrite(occurrenceOps, { ordered: false });
    } catch (bulkErr) {
      // Ignore duplicate key collision race conditions safely
      if (bulkErr.code !== 11000) {
        console.error('[OccurrenceService] bulkWrite error:', bulkErr.message);
      }
    }
  }

  // 3. Return hydrated occurrences with populated task details
  const occurrences = await TaskOccurrence.find({ userId, scheduledDate: dateStr })
    .populate('taskId')
    .sort({ createdAt: 1 });

  // Filter out any occurrences whose tasks might have been deleted or archived
  return occurrences.filter((occ) => occ.taskId && !occ.taskId.isArchived);
};

/**
 * Syncs and returns occurrences for a range of dates [startDateStr, endDateStr]
 */
export const syncOccurrencesForRange = async (userId, startDateStr, endDateStr) => {
  const start = parseISO(startDateStr);
  const end = parseISO(endDateStr);

  let current = start;
  const dates = [];
  while (!isAfter(current, end)) {
    dates.push(format(current, 'yyyy-MM-dd'));
    current = addDays(current, 1);
  }

  // Sync all days in range
  await Promise.all(dates.map((d) => syncOccurrencesForDate(userId, d)));

  const occurrences = await TaskOccurrence.find({
    userId,
    scheduledDate: { $gte: startDateStr, $lte: endDateStr },
  })
    .populate('taskId')
    .sort({ scheduledDate: 1, createdAt: 1 });

  return occurrences.filter((occ) => occ.taskId && !occ.taskId.isArchived);
};
