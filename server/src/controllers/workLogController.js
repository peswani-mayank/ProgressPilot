import WorkLog from '../models/WorkLog.js';
import Task from '../models/Task.js';

/**
 * GET /api/tasks/:taskId/work-logs
 * List work-log entries for a specific task
 */
export const getWorkLogsForTask = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const { taskId } = req.params;
    const { date } = req.query;

    const query = { userId, taskId };
    if (date) {
      query.date = date;
    }

    const logs = await WorkLog.find(query).sort({ createdAt: 1 });
    res.json(logs);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/tasks/:taskId/work-logs
 * Add a new work-log entry for a task
 */
export const createWorkLog = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const { taskId } = req.params;
    const { text, durationMinutes, date, occurrenceId } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Work log text is required.',
      });
    }

    // Verify task exists and belongs to user
    const task = await Task.findOne({ _id: taskId, userId, isArchived: false });
    if (!task) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Task not found or access denied.',
      });
    }

    const log = await WorkLog.create({
      userId,
      taskId,
      occurrenceId: occurrenceId || null,
      taskTitle: task.title,
      date: date || new Date().toISOString().split('T')[0],
      text: text.trim(),
      durationMinutes: durationMinutes ? Number(durationMinutes) : null,
      isCountedInFocus: false, // Explicit: work log note does not auto-increment focus time
    });

    res.status(201).json(log);
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/tasks/:taskId/work-logs/:id
 * Edit an existing work-log entry
 */
export const updateWorkLog = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const { id } = req.params;
    const { text, durationMinutes } = req.body;

    const log = await WorkLog.findOne({ _id: id, userId });
    if (!log) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Work log entry not found.',
      });
    }

    if (text !== undefined) log.text = text.trim();
    if (durationMinutes !== undefined) {
      log.durationMinutes = durationMinutes !== null ? Number(durationMinutes) : null;
    }

    await log.save();
    res.json(log);
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/tasks/:taskId/work-logs/:id
 * Delete a work-log entry
 */
export const deleteWorkLog = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const { id } = req.params;

    const log = await WorkLog.findOneAndDelete({ _id: id, userId });
    if (!log) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Work log entry not found.',
      });
    }

    res.json({ success: true, message: 'Work log deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

export default {
  getWorkLogsForTask,
  createWorkLog,
  updateWorkLog,
  deleteWorkLog,
};
