import Task from '../models/Task.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { format, subDays, addDays } from 'date-fns';

/**
 * Checks for upcoming deadlines and overdue tasks for all users or a specific user
 * and creates in-app notifications if not already notified.
 */
export const checkAndGenerateReminders = async (targetUserId = null) => {
  const query = targetUserId ? { userId: targetUserId } : {};
  const users = await User.find(query);

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const tomorrowStr = format(addDays(new Date(), 1), 'yyyy-MM-dd');

  for (const user of users) {
    const prefs = user.preferences?.notificationPreferences || {};

    // 1. Check Upcoming Deadlines
    if (prefs.upcomingDeadlines !== false) {
      const upcomingTasks = await Task.find({
        userId: user.userId,
        dueDate: { $in: [todayStr, tomorrowStr] },
        status: { $ne: 'done' },
        isArchived: false,
      });

      for (const task of upcomingTasks) {
        const isToday = task.dueDate === todayStr;
        const notifTitle = isToday ? `Deadline Today: ${task.title}` : `Upcoming Deadline: ${task.title}`;
        const notifMsg = isToday
          ? `Task "${task.title}" is due today${task.deadlineTime ? ` at ${task.deadlineTime}` : ''}. Plan your focus time!`
          : `Task "${task.title}" is due tomorrow. Get ahead on it today.`;

        // Check if notification was already sent today
        const existing = await Notification.findOne({
          userId: user.userId,
          type: 'deadline',
          relatedId: task._id.toString(),
          createdAt: { $gte: new Date(`${todayStr}T00:00:00.000Z`) },
        });

        if (!existing) {
          await Notification.create({
            userId: user.userId,
            title: notifTitle,
            message: notifMsg,
            type: 'deadline',
            link: `/tasks?highlight=${task._id}`,
            relatedId: task._id.toString(),
          });
        }
      }
    }

    // 2. Check Overdue Tasks
    if (prefs.overdueTasks !== false) {
      const overdueTasks = await Task.find({
        userId: user.userId,
        dueDate: { $lt: todayStr, $ne: null },
        status: { $ne: 'done' },
        isArchived: false,
      }).limit(5);

      if (overdueTasks.length > 0) {
        const existingOverdue = await Notification.findOne({
          userId: user.userId,
          type: 'overdue',
          createdAt: { $gte: new Date(`${todayStr}T00:00:00.000Z`) },
        });

        if (!existingOverdue) {
          await Notification.create({
            userId: user.userId,
            title: `You have ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}`,
            message: `Review your pending tasks and reschedule or complete them: "${overdueTasks[0].title}"${overdueTasks.length > 1 ? ` and ${overdueTasks.length - 1} more.` : '.'}`,
            type: 'overdue',
            link: '/tasks?filter=overdue',
          });
        }
      }
    }
  }
};
