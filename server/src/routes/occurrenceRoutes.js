import express from 'express';
import {
  getOccurrences,
  updateOccurrence,
  skipOccurrence,
  rescheduleOccurrence,
} from '../controllers/occurrenceController.js';

const router = express.Router();

router.get('/', getOccurrences);
router.patch('/:id', updateOccurrence);
router.post('/:id/skip', skipOccurrence);
router.post('/:id/reschedule', rescheduleOccurrence);

export default router;
