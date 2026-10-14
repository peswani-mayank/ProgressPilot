import express from 'express';
import {
  getProfile,
  updatePreferences,
  completeOnboarding,
} from '../controllers/userController.js';

const router = express.Router();

router.get('/profile', getProfile);
router.patch('/preferences', updatePreferences);
router.post('/onboarding', completeOnboarding);

export default router;
