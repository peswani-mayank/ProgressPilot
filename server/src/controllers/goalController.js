import Goal from '../models/Goal.js';
import Task from '../models/Task.js';

export const getGoals = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const { status, category } = req.query;

    const filter = { userId };
    if (status) filter.status = status;
    if (category) filter.category = category;

    const goals = await Goal.find(filter).sort({ targetDeadline: 1, createdAt: -1 });

    // Enhance goals with count of linked tasks
    const goalsWithTaskStats = await Promise.all(
      goals.map(async (goal) => {
        const linkedTasks = await Task.find({ userId, goalId: goal._id, isArchived: false });
        const completedTasks = linkedTasks.filter((t) => t.status === 'done').length;

        const goalObj = goal.toObject();
        goalObj.linkedTasksCount = linkedTasks.length;
        goalObj.linkedCompletedTasksCount = completedTasks;
        return goalObj;
      })
    );

    res.json(goalsWithTaskStats);
  } catch (err) {
    next(err);
  }
};

export const getGoalById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.uid;

    const goal = await Goal.findOne({ _id: id, userId });
    if (!goal) {
      return res.status(404).json({ error: 'Not Found', message: 'Goal not found.' });
    }

    const linkedTasks = await Task.find({ userId, goalId: goal._id, isArchived: false });
    const goalObj = goal.toObject();
    goalObj.linkedTasks = linkedTasks;

    res.json(goalObj);
  } catch (err) {
    next(err);
  }
};

export const createGoal = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const {
      title,
      description,
      category,
      startDate,
      targetDeadline,
      targetValue,
      targetUnit,
      milestones,
      notes,
    } = req.body;

    if (!title || !startDate || !targetDeadline || !targetValue || !targetUnit) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'title, startDate, targetDeadline, targetValue, and targetUnit are required.',
      });
    }

    const goal = await Goal.create({
      userId,
      title: title.trim(),
      description: description?.trim() || '',
      category: category || 'personal',
      startDate,
      targetDeadline,
      targetValue: Number(targetValue),
      targetUnit: targetUnit.trim(),
      currentProgress: 0,
      status: 'in_progress',
      milestones: Array.isArray(milestones) ? milestones : [],
      notes: notes || '',
    });

    res.status(201).json(goal);
  } catch (err) {
    next(err);
  }
};

export const updateGoal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.uid;

    const goal = await Goal.findOne({ _id: id, userId });
    if (!goal) {
      return res.status(404).json({ error: 'Not Found', message: 'Goal not found.' });
    }

    const updates = { ...req.body };
    delete updates.userId;

    if (updates.currentProgress !== undefined) {
      updates.currentProgress = Number(updates.currentProgress);
      if (updates.currentProgress >= goal.targetValue && goal.status !== 'completed') {
        updates.status = 'completed';
        updates.completedAt = new Date();
      }
    }

    Object.assign(goal, updates);
    await goal.save();

    res.json(goal);
  } catch (err) {
    next(err);
  }
};

export const deleteGoal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.uid;

    const goal = await Goal.findOneAndDelete({ _id: id, userId });
    if (!goal) {
      return res.status(404).json({ error: 'Not Found', message: 'Goal not found.' });
    }

    // Unlink tasks from deleted goal
    await Task.updateMany({ userId, goalId: id }, { goalId: null, milestoneId: null });

    res.json({ message: 'Goal deleted successfully.' });
  } catch (err) {
    next(err);
  }
};
