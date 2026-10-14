import mongoose from 'mongoose';

const workLogSchema = new mongoose.Schema(
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
    occurrenceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TaskOccurrence',
      default: null,
      index: true,
    },
    taskTitle: {
      type: String,
      default: '',
      trim: true,
    },
    date: {
      type: String, // YYYY-MM-DD
      default: () => new Date().toISOString().split('T')[0],
      index: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    durationMinutes: {
      type: Number,
      default: null,
      min: 0,
    },
    isCountedInFocus: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

workLogSchema.index({ userId: 1, taskId: 1, createdAt: -1 });

export default mongoose.model('WorkLog', workLogSchema);
