import Task from '../models/Task.js';
import TaskOccurrence from '../models/TaskOccurrence.js';
import FocusSession from '../models/FocusSession.js';
import Goal from '../models/Goal.js';
import DailyReview from '../models/DailyReview.js';
import { syncOccurrencesForDate, syncOccurrencesForRange } from './occurrenceService.js';
import { parseISO, format, subDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';

/**
 * Calculates real-time daily metrics for a given date
 */
export const getDailyAnalytics = async (userId, dateStr) => {
  // Sync occurrences for this date
  const occurrences = await syncOccurrencesForDate(userId, dateStr);

  // Focus sessions on this date
  const dayStart = new Date(`${dateStr}T00:00:00.000Z`);
  const dayEnd = new Date(`${dateStr}T23:59:59.999Z`);

  const focusSessions = await FocusSession.find({
    userId,
    startTime: { $gte: dayStart, $lte: dayEnd },
    sessionType: { $ne: 'short_break', $nin: ['short_break', 'long_break'] },
  });

  const totalDue = occurrences.length;
  const completedOccurrences = occurrences.filter((o) => o.status === 'done');
  const completedCount = completedOccurrences.length;
  const pendingCount = occurrences.filter((o) => o.status === 'todo' || o.status === 'in_progress').length;
  const skippedCount = occurrences.filter((o) => o.status === 'skipped').length;
  const postponedCount = occurrences.filter((o) => o.status === 'postponed').length;

  // High priority tracking
  const highPriorityOccurrences = occurrences.filter((o) => o.taskId?.priority === 'high');
  const highPriorityTotal = highPriorityOccurrences.length;
  const highPriorityCompleted = highPriorityOccurrences.filter((o) => o.status === 'done').length;
  const highPriorityCompletionRate = highPriorityTotal > 0
    ? Math.round((highPriorityCompleted / highPriorityTotal) * 100)
    : 100;

  // Completion rate formula
  const completionRate = totalDue > 0
    ? Math.round((completedCount / totalDue) * 100)
    : 0;

  // Planned minutes from tasks due today
  const plannedMinutes = occurrences.reduce((acc, o) => acc + (o.taskId?.estimatedDuration || 0), 0);

  // Actual focused minutes from focus sessions
  const actualFocusedMinutes = focusSessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);

  // Time utilization formula: (actual / planned) * 100 (can exceed 100%)
  const timeUtilizationRate = plannedMinutes > 0
    ? Math.round((actualFocusedMinutes / plannedMinutes) * 100)
    : (actualFocusedMinutes > 0 ? 100 : 0);

  // Category breakdown for today's sessions
  const categoryTimeMap = {};
  focusSessions.forEach((s) => {
    const cat = s.category || 'personal';
    categoryTimeMap[cat] = (categoryTimeMap[cat] || 0) + s.durationMinutes;
  });

  const categoryBreakdown = Object.entries(categoryTimeMap).map(([category, minutes]) => ({
    category,
    minutes,
    hours: Number((minutes / 60).toFixed(1)),
  }));

  // Productivity streak calculation
  const streak = await calculateProductivityStreak(userId, dateStr);

  // Yesterday comparison for daily improvement analysis
  const yesterdayDate = subDays(parseISO(dateStr), 1);
  const yesterdayStr = format(yesterdayDate, 'yyyy-MM-dd');
  const yesterdaySessions = await FocusSession.find({
    userId,
    startTime: {
      $gte: new Date(`${yesterdayStr}T00:00:00.000Z`),
      $lte: new Date(`${yesterdayStr}T23:59:59.999Z`),
    },
    sessionType: { $nin: ['short_break', 'long_break'] },
  });
  const yesterdayFocusedMinutes = yesterdaySessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
  const dailyImprovementMinutes = actualFocusedMinutes - yesterdayFocusedMinutes;
  const improvementPercentage = yesterdayFocusedMinutes > 0
    ? Math.round(((actualFocusedMinutes - yesterdayFocusedMinutes) / yesterdayFocusedMinutes) * 100)
    : (actualFocusedMinutes > 0 ? 100 : 0);

  return {
    date: dateStr,
    totalDueTasks: totalDue,
    completedTasks: completedCount,
    pendingTasks: pendingCount,
    skippedTasks: skippedCount,
    postponedTasks: postponedCount,
    completionRate,
    plannedMinutes,
    plannedHours: Number((plannedMinutes / 60).toFixed(1)),
    actualFocusedMinutes,
    actualFocusedHours: Number((actualFocusedMinutes / 60).toFixed(1)),
    timeUtilizationRate,
    highPriorityTotal,
    highPriorityCompleted,
    highPriorityCompletionRate,
    focusSessionsCount: focusSessions.length,
    categoryBreakdown,
    streak,
    yesterdayFocusedMinutes,
    dailyImprovementMinutes,
    improvementPercentage,
    formulaExplanations: {
      completionRate: 'Completed due occurrences / Total due occurrences * 100',
      timeUtilizationRate: 'Actual focused minutes / Planned minutes * 100 (may exceed 100% if extra focus logged)',
      highPriorityCompletionRate: 'Completed high priority / Total due high priority * 100',
    },
  };
};

/**
 * Calculates current consecutive productivity streak
 */
export const calculateProductivityStreak = async (userId, referenceDateStr) => {
  const refDate = parseISO(referenceDateStr);
  let streak = 0;

  for (let i = 0; i < 90; i++) {
    const checkDate = subDays(refDate, i);
    const dateStr = format(checkDate, 'yyyy-MM-dd');

    // Check if any task completed OR focus session logged OR daily review submitted on this date
    const [doneOcc, session, review] = await Promise.all([
      TaskOccurrence.findOne({ userId, scheduledDate: dateStr, status: 'done' }),
      FocusSession.findOne({
        userId,
        startTime: {
          $gte: new Date(`${dateStr}T00:00:00.000Z`),
          $lte: new Date(`${dateStr}T23:59:59.999Z`),
        },
      }),
      DailyReview.findOne({ userId, date: dateStr }),
    ]);

    if (doneOcc || session || review) {
      streak += 1;
    } else {
      // If it's today (i === 0) and not yet active, don't break the streak from yesterday yet
      if (i === 0) continue;
      break;
    }
  }

  return streak;
};

/**
 * Calculates weekly analytics for 7 days
 */
export const getWeeklyAnalytics = async (userId, targetDateStr) => {
  const targetDate = parseISO(targetDateStr);
  const weekStart = startOfWeek(targetDate, { weekStartsOn: 1 }); // Mon
  const weekEnd = endOfWeek(targetDate, { weekStartsOn: 1 }); // Sun

  const startDateStr = format(weekStart, 'yyyy-MM-dd');
  const endDateStr = format(weekEnd, 'yyyy-MM-dd');

  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const dateStrings = days.map((d) => format(d, 'yyyy-MM-dd'));

  // Sync occurrences for whole week
  await syncOccurrencesForRange(userId, startDateStr, endDateStr);

  const [occurrences, focusSessions, goals] = await Promise.all([
    TaskOccurrence.find({
      userId,
      scheduledDate: { $gte: startDateStr, $lte: endDateStr },
    }).populate('taskId'),
    FocusSession.find({
      userId,
      startTime: {
        $gte: new Date(`${startDateStr}T00:00:00.000Z`),
        $lte: new Date(`${endDateStr}T23:59:59.999Z`),
      },
      sessionType: { $nin: ['short_break', 'long_break'] },
    }),
    Goal.find({ userId, status: 'in_progress' }),
  ]);

  // Aggregate day-by-day metrics
  const dailyTrends = dateStrings.map((dStr) => {
    const dayOccurrences = occurrences.filter((o) => o.scheduledDate === dStr && o.taskId && !o.taskId.isArchived);
    const daySessions = focusSessions.filter(
      (s) => format(s.startTime, 'yyyy-MM-dd') === dStr
    );

    const totalDue = dayOccurrences.length;
    const completed = dayOccurrences.filter((o) => o.status === 'done').length;
    const plannedMinutes = dayOccurrences.reduce((acc, o) => acc + (o.taskId?.estimatedDuration || 0), 0);
    const actualMinutes = daySessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);

    return {
      date: dStr,
      dayName: format(parseISO(dStr), 'EEE'),
      totalDue,
      completed,
      completionRate: totalDue > 0 ? Math.round((completed / totalDue) * 100) : 0,
      plannedMinutes,
      actualMinutes,
      plannedHours: Number((plannedMinutes / 60).toFixed(1)),
      actualHours: Number((actualMinutes / 60).toFixed(1)),
    };
  });

  // Category breakdown
  const categoryMap = {};
  focusSessions.forEach((s) => {
    const cat = s.category || 'personal';
    categoryMap[cat] = (categoryMap[cat] || 0) + s.durationMinutes;
  });

  const categoryBreakdown = Object.entries(categoryMap).map(([category, minutes]) => ({
    name: category,
    minutes,
    hours: Number((minutes / 60).toFixed(1)),
  }));

  // Blocker / Distraction trends
  const blockerMap = {};
  occurrences.forEach((o) => {
    if (o.distractionReason) {
      blockerMap[o.distractionReason] = (blockerMap[o.distractionReason] || 0) + 1;
    }
  });

  const blockerTrends = Object.entries(blockerMap).map(([reason, count]) => ({
    reason: reason.replace(/_/g, ' '),
    count,
  }));

  // Repeatedly postponed tasks
  const postponedTasks = await Task.find({
    userId,
    postponeCount: { $gt: 1 },
    isArchived: false,
  })
    .sort({ postponeCount: -1 })
    .limit(5);

  const totalPlannedMinutes = dailyTrends.reduce((acc, d) => acc + (d.plannedMinutes || 0), 0);
  const totalActualMinutes = dailyTrends.reduce((acc, d) => acc + (d.actualMinutes || 0), 0);
  const totalPlannedHours = Number((totalPlannedMinutes / 60).toFixed(1));
  const totalActualHours = Number((totalActualMinutes / 60).toFixed(1));
  const averageDailyMinutes = Math.round(totalActualMinutes / 7);
  const totalDueTasks = dailyTrends.reduce((acc, d) => acc + d.totalDue, 0);
  const totalCompletedTasks = dailyTrends.reduce((acc, d) => acc + d.completed, 0);

  // Most productive day
  const mostProductiveDay = [...dailyTrends].sort((a, b) => b.actualMinutes - a.actualMinutes)[0] || null;

  return {
    weekStart: startDateStr,
    weekEnd: endDateStr,
    totalDueTasks,
    totalCompletedTasks,
    weeklyCompletionRate: totalDueTasks > 0 ? Math.round((totalCompletedTasks / totalDueTasks) * 100) : 0,
    totalPlannedMinutes,
    totalActualMinutes,
    totalPlannedHours,
    totalActualHours,
    averageDailyMinutes,
    mostProductiveDay,
    dailyTrends,
    weekRange: { start: startDateStr, end: endDateStr },
    categoryBreakdown,
    blockerTrends,
    repeatedlyPostponedTasks: postponedTasks.map((t) => ({
      id: t._id,
      title: t.title,
      category: t.category,
      priority: t.priority,
      postponeCount: t.postponeCount,
    })),
    mostProductiveDay,
  };
};

/**
 * Calculates monthly analytics for 30 days
 */
export const getMonthlyAnalytics = async (userId, targetDateStr) => {
  const targetDate = parseISO(targetDateStr);
  const startDateStr = format(subDays(targetDate, 29), 'yyyy-MM-dd');
  const endDateStr = targetDateStr;

  const [occurrences, focusSessions] = await Promise.all([
    TaskOccurrence.find({
      userId,
      scheduledDate: { $gte: startDateStr, $lte: endDateStr },
    }).populate('taskId'),
    FocusSession.find({
      userId,
      startTime: {
        $gte: new Date(`${startDateStr}T00:00:00.000Z`),
        $lte: new Date(`${endDateStr}T23:59:59.999Z`),
      },
      sessionType: { $nin: ['short_break', 'long_break'] },
    }),
  ]);

  const totalDue = occurrences.filter((o) => o.taskId && !o.taskId.isArchived).length;
  const completed = occurrences.filter((o) => o.status === 'done' && o.taskId && !o.taskId.isArchived).length;
  const totalFocusedMinutes = focusSessions.reduce((acc, s) => acc + s.durationMinutes, 0);

  // Group by week (last 4 weeks)
  const weeklyBuckets = [
    { label: 'Week 1', days: 7, focusMinutes: 0, completedTasks: 0 },
    { label: 'Week 2', days: 7, focusMinutes: 0, completedTasks: 0 },
    { label: 'Week 3', days: 7, focusMinutes: 0, completedTasks: 0 },
    { label: 'Week 4', days: 9, focusMinutes: 0, completedTasks: 0 },
  ];

  focusSessions.forEach((s) => {
    const diff = Math.floor((targetDate - new Date(s.startTime)) / (1000 * 60 * 60 * 24));
    if (diff < 7) weeklyBuckets[3].focusMinutes += s.durationMinutes;
    else if (diff < 14) weeklyBuckets[2].focusMinutes += s.durationMinutes;
    else if (diff < 21) weeklyBuckets[1].focusMinutes += s.durationMinutes;
    else if (diff < 30) weeklyBuckets[0].focusMinutes += s.durationMinutes;
  });

  return {
    range: { start: startDateStr, end: endDateStr },
    totalDueTasks: totalDue,
    completedTasks: completed,
    monthlyCompletionRate: totalDue > 0 ? Math.round((completed / totalDue) * 100) : 0,
    totalFocusedHours: Number((totalFocusedMinutes / 60).toFixed(1)),
    totalFocusSessions: focusSessions.length,
    weeklyBuckets: weeklyBuckets.map((b) => ({
      ...b,
      focusHours: Number((b.focusMinutes / 60).toFixed(1)),
    })),
  };
};
