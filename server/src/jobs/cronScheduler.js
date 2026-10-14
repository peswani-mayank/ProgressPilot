import cron from 'node-cron';
import { checkAndGenerateReminders } from '../services/reminderService.js';
import { evaluateAllReminders } from '../services/smartReminderService.js';

let reminderJob = null;

export const startCronJobs = () => {
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  // Runs every 15 minutes: evaluates smart accountability reminders and upcoming deadlines
  reminderJob = cron.schedule('*/15 * * * *', async () => {
    try {
      // 1. Evaluate smart accountability reminders (Duolingo-style evening follow-ups)
      await evaluateAllReminders();

      // 2. Evaluate deadlines & overdue notifications
      await checkAndGenerateReminders();
    } catch (err) {
      console.error('[Cron Job] Error running reminder scheduler:', err.message);
    }
  });

  console.log('[Cron] Scheduled smart reminder background worker initialized (every 15 minutes).');
};

export const stopCronJobs = () => {
  if (reminderJob) {
    reminderJob.stop();
  }
};
