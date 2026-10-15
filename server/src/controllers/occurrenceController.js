import TaskOccurrence from '../models/TaskOccurrence.js';
import Task from '../models/Task.js';
import { syncOccurrencesForDate, syncOccurrencesForRange } from '../services/occurrenceService.js';
import { format } from 'date-fns';

export const getOccurrences = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const { date, startDate, endDate } = req.query;

    if (startDate && endDate) {
      const occurrences = await syncOccurrencesForRange(userId, startDate, endDate);
      return res.json(occurrences);
    }

    const targetDate = date || format(new Date(), 'yyyy-MM-dd');
    const occurrences = await syncOccurrencesForDate(userId, targetDate);
    res.json(occurrences);
  } catch (err) {
    next(err);
  }
};

export const updateOccurrence = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.uid;
    const { status, actualDuration, notes, distractionReason, distractionNotes, postponedToDate } = req.body;

    const occurrence = await TaskOccurrence.findOne({ _id: id, userId }).populate('taskId');
    if (!occurrence) {
      return res.status(404).json({ error: 'Not Found', message: 'Task occurrence not found.' });
    }

    if (status !== undefined) {
      occurrence.status = status;
      occurrence.completedAt = status === 'done' ? new Date() : null;

      // If occurrence task is a one-time task, keep base task status in sync
      if (occurrence.taskId) {
        const taskId = occurrence.taskId._id || occurrence.taskId;
        const schedType = occurrence.taskId.scheduleType || 'one_time';
        if (schedType === 'one_time') {
          await Task.updateOne(
            { _id: taskId, userId },
            { status, completedAt: occurrence.completedAt }
          );
        }
      }
    }

    if (actualDuration !== undefined) occurrence.actualDuration = Number(actualDuration);
    if (notes !== undefined) occurrence.notes = notes;
    if (distractionReason !== undefined) occurrence.distractionReason = distractionReason;
    if (distractionNotes !== undefined) occurrence.distractionNotes = distractionNotes;
    if (postponedToDate !== undefined) occurrence.postponedToDate = postponedToDate;

    await occurrence.save();
    res.json(occurrence);
  } catch (err) {
    next(err);
  }
};

export const skipOccurrence = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.uid;
    const { reason, notes } = req.body;

    const occurrence = await TaskOccurrence.findOne({ _id: id, userId });
    if (!occurrence) {
      return res.status(404).json({ error: 'Not Found', message: 'Task occurrence not found.' });
    }

    occurrence.status = 'skipped';
    if (reason) occurrence.distractionReason = reason;
    if (notes) occurrence.distractionNotes = notes;
    await occurrence.save();

    res.json({ message: 'Occurrence skipped.', occurrence });
  } catch (err) {
    next(err);
  }
};

export const rescheduleOccurrence = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.uid;
    const { newDate, reason, notes } = req.body;

    if (!newDate) {
      return res.status(400).json({ error: 'Validation Error', message: 'newDate is required.' });
    }

    const occurrence = await TaskOccurrence.findOne({ _id: id, userId }).populate('taskId');
    if (!occurrence) {
      return res.status(404).json({ error: 'Not Found', message: 'Occurrence not found.' });
    }

    occurrence.status = 'postponed';
    occurrence.postponedToDate = newDate;
    if (reason) occurrence.distractionReason = reason;
    if (notes) occurrence.distractionNotes = notes;
    await occurrence.save();

    // Increment task postpone count
    if (occurrence.taskId) {
      occurrence.taskId.postponeCount = (occurrence.taskId.postponeCount || 0) + 1;
      occurrence.taskId.lastPostponedAt = new Date();
      if (occurrence.taskId.scheduleType === 'one_time') {
        occurrence.taskId.dueDate = newDate;
      }
      await occurrence.taskId.save();
    }

    // Ensure new occurrence on newDate
    await syncOccurrencesForDate(userId, newDate);

    res.json({ message: 'Occurrence rescheduled.', occurrence });
  } catch (err) {
    next(err);
  }
};
