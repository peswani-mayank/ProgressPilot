import Task from '../models/Task.js';
import TaskOccurrence from '../models/TaskOccurrence.js';
import { syncOccurrencesForDate } from '../services/occurrenceService.js';
import { format } from 'date-fns';

export const getTasks = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const {
      search,
      category,
      priority,
      status,
      scheduleType,
      date,
      sortBy = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 50,
    } = req.query;

    const filter = { userId, isArchived: false };

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    if (status) filter.status = status;
    if (scheduleType) filter.scheduleType = scheduleType;
    if (date) {
      filter.$or = [{ dueDate: date }, { startDate: date }];
    }

    const sortOrder = order === 'asc' ? 1 : -1;
    const sortObj = {};
    if (sortBy === 'priority') {
      // Custom priority sort can be mapped or default sorted
      sortObj.priority = sortOrder;
    } else {
      sortObj[sortBy] = sortOrder;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('goalId', 'title category currentProgress targetValue targetUnit'),
      Task.countDocuments(filter),
    ]);

    res.json({
      tasks,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (err) {
    next(err);
  }
};

export const getTaskById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const task = await Task.findOne({ _id: id, userId: req.user.uid, isArchived: false })
      .populate('goalId');

    if (!task) {
      return res.status(404).json({ error: 'Not Found', message: 'Task not found or access denied.' });
    }

    res.json(task);
  } catch (err) {
    next(err);
  }
};

export const createTask = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const {
      title,
      description,
      category,
      priority,
      scheduleType,
      recurrenceRule,
      startDate,
      startTime,
      dueDate,
      deadlineTime,
      estimatedDuration,
      subtasks,
      notes,
      goalId,
      milestoneId,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Validation Error', message: 'Task title is required.' });
    }

    const task = await Task.create({
      userId,
      title: title.trim(),
      description: description?.trim() || '',
      category: category || 'personal',
      priority: priority || 'medium',
      scheduleType: scheduleType || 'one_time',
      recurrenceRule: recurrenceRule || {},
      startDate: startDate || null,
      startTime: startTime || '',
      dueDate: dueDate || null,
      deadlineTime: deadlineTime || '',
      estimatedDuration: estimatedDuration !== undefined ? Number(estimatedDuration) : 30,
      subtasks: Array.isArray(subtasks) ? subtasks : [],
      notes: notes || '',
      goalId: goalId || null,
      milestoneId: milestoneId || null,
    });

    // If task has a scheduled date, ensure today's or scheduled day's occurrence exists
    const dateToSync = task.dueDate || task.startDate || format(new Date(), 'yyyy-MM-dd');
    try {
      await syncOccurrencesForDate(userId, dateToSync);
    } catch (e) {
      console.warn('Initial occurrence sync warning:', e.message);
    }

    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
};

export const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.uid;

    const task = await Task.findOne({ _id: id, userId, isArchived: false });
    if (!task) {
      return res.status(404).json({ error: 'Not Found', message: 'Task not found or access denied.' });
    }

    const updates = { ...req.body };
    delete updates.userId; // Prevent userId tampering

    Object.assign(task, updates);
    await task.save();

    res.json(task);
  } catch (err) {
    next(err);
  }
};

export const completeTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.uid;
    const { status = 'done', date = format(new Date(), 'yyyy-MM-dd') } = req.body;

    const task = await Task.findOne({ _id: id, userId, isArchived: false });
    if (!task) {
      return res.status(404).json({ error: 'Not Found', message: 'Task not found.' });
    }

    const isDone = status === 'done';
    task.status = status;
    task.completedAt = isDone ? new Date() : null;
    await task.save();

    // Also update today's occurrence if present
    await TaskOccurrence.findOneAndUpdate(
      { userId, taskId: id, scheduledDate: date },
      {
        status,
        completedAt: isDone ? new Date() : null,
      },
      { upsert: true }
    );

    res.json(task);
  } catch (err) {
    next(err);
  }
};

export const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.uid;

    const task = await Task.findOneAndUpdate(
      { _id: id, userId, isArchived: false },
      { isArchived: true },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({ error: 'Not Found', message: 'Task not found.' });
    }

    // Remove future occurrences
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    await TaskOccurrence.deleteMany({
      userId,
      taskId: id,
      scheduledDate: { $gte: todayStr },
      status: 'todo',
    });

    res.json({ message: 'Task archived successfully.', task });
  } catch (err) {
    next(err);
  }
};

export const duplicateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.uid;

    const original = await Task.findOne({ _id: id, userId, isArchived: false });
    if (!original) {
      return res.status(404).json({ error: 'Not Found', message: 'Task not found.' });
    }

    const clonedData = original.toObject();
    delete clonedData._id;
    delete clonedData.createdAt;
    delete clonedData.updatedAt;
    clonedData.title = `${clonedData.title} (Copy)`;
    clonedData.status = 'todo';
    clonedData.completedAt = null;

    const newTask = await Task.create(clonedData);
    res.status(201).json(newTask);
  } catch (err) {
    next(err);
  }
};

export const postponeTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.uid;
    const { newDate, reason, notes } = req.body;

    if (!newDate) {
      return res.status(400).json({ error: 'Validation Error', message: 'newDate is required.' });
    }

    const task = await Task.findOne({ _id: id, userId, isArchived: false });
    if (!task) {
      return res.status(404).json({ error: 'Not Found', message: 'Task not found.' });
    }

    const previousDueDate = task.dueDate || format(new Date(), 'yyyy-MM-dd');

    // Update the task's due date and increment postpone count
    task.dueDate = newDate;
    task.postponeCount = (task.postponeCount || 0) + 1;
    task.lastPostponedAt = new Date();
    await task.save();

    // Mark previous occurrence as postponed with reason
    await TaskOccurrence.findOneAndUpdate(
      { userId, taskId: id, scheduledDate: previousDueDate },
      {
        status: 'postponed',
        distractionReason: reason || 'unexpected_time_constraints',
        distractionNotes: notes || '',
        postponedToDate: newDate,
      },
      { upsert: true }
    );

    // Sync new date occurrence
    await syncOccurrencesForDate(userId, newDate);

    res.json({ message: 'Task postponed successfully.', task });
  } catch (err) {
    next(err);
  }
};
