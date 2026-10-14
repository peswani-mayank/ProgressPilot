import mongoose from 'mongoose';

const subtaskSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true, trim: true },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date, default: null },
}, { _id: false });

const taskSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    category: {
      type: String,
      default: 'personal',
      index: true,
    },
    priority: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium',
      index: true,
    },
    status: {
      type: String,
      enum: ['todo', 'in_progress', 'done'],
      default: 'todo',
      index: true,
    },
    scheduleType: {
      type: String,
      enum: ['one_time', 'daily', 'weekly', 'custom_recurrence'],
      default: 'one_time',
      index: true,
    },
    recurrenceRule: {
      frequency: {
        type: String,
        enum: ['daily', 'weekly', 'custom'],
        default: 'daily',
      },
      interval: {
        type: Number,
        default: 1,
      },
      daysOfWeek: {
        type: [Number], // 0: Sun, 1: Mon, ..., 6: Sat
        default: [],
      },
      startDate: {
        type: String, // YYYY-MM-DD
        default: null,
      },
      endDate: {
        type: String, // YYYY-MM-DD
        default: null,
      },
      isPaused: {
        type: Boolean,
        default: false,
      },
    },
    startDate: {
      type: String, // YYYY-MM-DD
      default: null,
      index: true,
    },
    startTime: {
      type: String, // HH:mm
      default: '',
    },
    dueDate: {
      type: String, // YYYY-MM-DD
      default: null,
      index: true,
    },
    deadlineTime: {
      type: String, // HH:mm
      default: '',
    },
    estimatedDuration: {
      type: Number,
      default: 30, // minutes
      min: 0,
    },
    actualDuration: {
      type: Number,
      default: 0, // minutes
      min: 0,
    },
    subtasks: {
      type: [subtaskSchema],
      default: [],
    },
    notes: {
      type: String,
      default: '',
    },
    goalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Goal',
      default: null,
      index: true,
    },
    milestoneId: {
      type: String,
      default: null,
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    postponeCount: {
      type: Number,
      default: 0,
    },
    lastPostponedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

taskSchema.index({ userId: 1, dueDate: 1, status: 1 });
taskSchema.index({ userId: 1, scheduleType: 1 });
taskSchema.index({ userId: 1, priority: 1 });

export default mongoose.model('Task', taskSchema);
