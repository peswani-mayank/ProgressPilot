import mongoose from 'mongoose';

const focusSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      default: null,
      index: true,
    },
    occurrenceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TaskOccurrence',
      default: null,
      index: true,
    },
    clientSessionId: {
      type: String,
      default: null,
      index: true,
    },
    taskTitle: {
      type: String,
      default: 'General Focus',
      trim: true,
    },
    category: {
      type: String,
      default: 'personal',
      index: true,
    },
    sessionType: {
      type: String,
      enum: ['pomodoro', 'short_break', 'long_break', 'custom_focus', 'manual'],
      default: 'pomodoro',
      index: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    durationMinutes: {
      type: Number,
      required: true,
      min: 1,
    },
    pausedIntervals: [
      {
        pauseStart: { type: Date },
        pauseEnd: { type: Date },
        durationSeconds: { type: Number, default: 0 },
      },
    ],
    status: {
      type: String,
      enum: ['active', 'paused', 'completed', 'discarded'],
      default: 'completed',
    },
    completed: {
      type: Boolean,
      default: true,
    },
    isManualEntry: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

focusSessionSchema.index({ userId: 1, startTime: -1 });
focusSessionSchema.index({ userId: 1, category: 1 });

export default mongoose.model('FocusSession', focusSessionSchema);
