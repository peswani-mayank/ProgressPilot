import express from 'express';
import {
  getJournals,
  getJournalDates,
  getJournalByDate,
  getWeeklyInsightsHandler,
  getJournalById,
  saveJournal,
  updateJournal,
  deleteJournal,
  structureJournal,
} from '../controllers/journalController.js';

const router = express.Router();

// Specific routes first to prevent collision with /:id
router.get('/', getJournals);
router.get('/dates', getJournalDates);
router.get('/insights/weekly', getWeeklyInsightsHandler);
router.get('/by-date/:date', getJournalByDate);
router.post('/', saveJournal);

// Parameterized ID routes
router.get('/:id', getJournalById);
router.patch('/:id', updateJournal);
router.delete('/:id', deleteJournal);
router.post('/:id/structure', structureJournal);

export default router;
