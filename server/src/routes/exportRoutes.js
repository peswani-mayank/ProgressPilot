import express from 'express';
import {
  exportTasksCSV,
  exportTimeLogsCSV,
  exportGoalsCSV,
  exportAllJSON,
} from '../controllers/exportController.js';

const router = express.Router();

router.get('/tasks', exportTasksCSV);
router.get('/time-logs', exportTimeLogsCSV);
router.get('/goals', exportGoalsCSV);
router.get('/all', exportAllJSON);

export default router;
