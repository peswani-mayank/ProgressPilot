import express from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  snoozeNotification,
  dismissNotification,
} from '../controllers/notificationController.js';

const router = express.Router();

router.get('/', getNotifications);
router.patch('/:id/read', markAsRead);
router.patch('/:id/snooze', snoozeNotification);
router.post('/mark-all-read', markAllAsRead);
router.delete('/:id', dismissNotification);

export default router;
