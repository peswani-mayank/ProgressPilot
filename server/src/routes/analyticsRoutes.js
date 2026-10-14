import express from 'express';
import { getDaily, getWeekly, getMonthly } from '../controllers/analyticsController.js';

const router = express.Router();

router.get('/daily', getDaily);
router.get('/weekly', getWeekly);
router.get('/monthly', getMonthly);

export default router;
