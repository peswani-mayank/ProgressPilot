import express from 'express';
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  completeTask,
  duplicateTask,
  postponeTask,
} from '../controllers/taskController.js';
import {
  getWorkLogsForTask,
  createWorkLog,
  updateWorkLog,
  deleteWorkLog,
} from '../controllers/workLogController.js';

const router = express.Router();

router.get('/', getTasks);
router.post('/', createTask);
router.get('/:id', getTaskById);
router.patch('/:id', updateTask);
router.delete('/:id', deleteTask);
router.patch('/:id/complete', completeTask);
router.post('/:id/duplicate', duplicateTask);
router.post('/:id/postpone', postponeTask);

// Work Log / What I Did routes
router.get('/:taskId/work-logs', getWorkLogsForTask);
router.post('/:taskId/work-logs', createWorkLog);
router.patch('/:taskId/work-logs/:id', updateWorkLog);
router.delete('/:taskId/work-logs/:id', deleteWorkLog);

export default router;
