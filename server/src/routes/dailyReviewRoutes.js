import express from 'express';
import {
  getDailyReview,
  saveDailyReview,
  getReviewHistory,
} from '../controllers/dailyReviewController.js';

const router = express.Router();

router.get('/', getDailyReview);
router.post('/', saveDailyReview);
router.get('/history', getReviewHistory);

export default router;
