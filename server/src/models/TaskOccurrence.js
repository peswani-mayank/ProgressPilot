import mongoose from 'mongoose';

const taskOccurrenceSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
      index: true,
    },
    scheduledDate: {
      type: String, // YYYY-MM-DD
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['todo', 'in_progress', 'done', 'skipped', 'postponed'],
      default: 'todo',
      index: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    actualDuration: {
      type: Number,
      default: 0, // minutes
      min: 0,
    },
    notes: {
      type: String,
      default: '',
    },
    distractionReason: {
      type: String,
      enum: [
        'unexpected_time_constraints',
        'harder_than_expected',
        'distraction',
        'incorrect_estimate',
        'not_a_priority',
        'other',
        null
      ],
      default: null,
    },
    distractionNotes: {
      type: String,
      default: '',
    },
    postponedToDate: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate occurrences for the same task on the same date for the user
taskOccurrenceSchema.index({ userId: 1, taskId: 1, scheduledDate: 1 }, { unique: true });
taskOccurrenceSchema.index({ userId: 1, scheduledDate: 1, status: 1 });

export default mongoose.model('TaskOccurrence', taskOccurrenceSchema);
