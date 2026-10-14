import mongoose from 'mongoose';

const dailyReviewSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true,
      index: true,
    },
    wentWell: {
      type: String,
      default: '',
      trim: true,
    },
    notWell: {
      type: String,
      default: '',
      trim: true,
    },
    distractions: {
      type: String,
      default: '',
      trim: true,
    },
    learnedToday: {
      type: String,
      default: '',
      trim: true,
    },
    improveTomorrow: {
      type: String,
      default: '',
      trim: true,
    },
    topPrioritiesTomorrow: {
      type: [String],
      default: ['', '', ''],
    },
    statsSnapshot: {
      completedTasksCount: { type: Number, default: 0 },
      incompleteTasksCount: { type: Number, default: 0 },
      plannedMinutes: { type: Number, default: 0 },
      focusedMinutes: { type: Number, default: 0 },
      focusSessionsCount: { type: Number, default: 0 },
      highPriorityCompletedCount: { type: Number, default: 0 },
      completionRate: { type: Number, default: 0 },
      timeUtilization: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

dailyReviewSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model('DailyReview', dailyReviewSchema);
