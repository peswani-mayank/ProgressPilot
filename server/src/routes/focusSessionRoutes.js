import express from 'express';
import {
  createFocusSession,
  getFocusSessions,
  getTodayFocusStats,
} from '../controllers/focusSessionController.js';

const router = express.Router();

router.get('/', getFocusSessions);
router.post('/', createFocusSession);
router.get('/today', getTodayFocusStats);

export default router;
