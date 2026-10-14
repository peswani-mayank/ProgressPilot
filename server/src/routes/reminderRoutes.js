import express from 'express';
import {
  getPreferences,
  updatePreferences,
  snoozeReminders,
  pauseReminders,
  resumeReminders,
  evaluateNow,
  sendTestEmail,
  getReminderHistory,
} from '../controllers/reminderController.js';

const router = express.Router();

router.get('/preferences', getPreferences);
router.put('/preferences', updatePreferences);
router.post('/snooze', snoozeReminders);
router.post('/pause', pauseReminders);
router.post('/resume', resumeReminders);
router.post('/evaluate', evaluateNow);
router.post('/send-test-email', sendTestEmail);
router.get('/history', getReminderHistory);

export default router;
