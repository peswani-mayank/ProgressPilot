import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getDBStatus } from '../config/db.js';
import { isFirebaseAuthReady } from '../config/firebase.js';

import taskRoutes from './taskRoutes.js';
import occurrenceRoutes from './occurrenceRoutes.js';
import goalRoutes from './goalRoutes.js';
import focusSessionRoutes from './focusSessionRoutes.js';
import dailyReviewRoutes from './dailyReviewRoutes.js';
import analyticsRoutes from './analyticsRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import exportRoutes from './exportRoutes.js';
import userRoutes from './userRoutes.js';
import journalRoutes from './journalRoutes.js';
import reminderRoutes from './reminderRoutes.js';

const router = express.Router();

// Public Health & System Status Endpoint
router.get('/health', (req, res) => {
  const dbStatus = getDBStatus();
  const firebaseReady = isFirebaseAuthReady();
  const isDevMode = process.env.NODE_ENV !== 'production' || process.env.ALLOW_DEV_AUTH === 'true';

  res.json({
    status: 'ok',
    name: 'ProgressPilot API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    database: {
      connected: dbStatus.isConnected,
      readyState: dbStatus.readyState, // 1 = connected
      host: dbStatus.host,
      databaseName: dbStatus.name,
    },
    auth: {
      firebaseConfigured: firebaseReady,
      devAuthAllowed: isDevMode,
    },
  });
});

// All subsequent API endpoints require verified authentication
router.use(requireAuth);

router.use('/tasks', taskRoutes);
router.use('/occurrences', occurrenceRoutes);
router.use('/goals', goalRoutes);
router.use('/focus-sessions', focusSessionRoutes);
router.use('/reviews', dailyReviewRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/notifications', notificationRoutes);
router.use('/export', exportRoutes);
router.use('/user', userRoutes);
router.use('/journals', journalRoutes);
router.use('/reminders', reminderRoutes);

export default router;
