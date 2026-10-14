import mongoose from 'mongoose';

const structuredReportSchema = new mongoose.Schema(
  {
    summary: {
      type: String,
      default: '',
      trim: true,
    },
    completedActivities: {
      type: [String],
      default: [],
    },
    learnings: {
      type: [String],
      default: [],
    },
    achievements: {
      type: [String],
      default: [],
    },
    challenges: {
      type: [String],
      default: [],
    },
    pendingWork: {
      type: [String],
      default: [],
    },
    tomorrowPlan: {
      type: [String],
      default: [],
    },
    additionalNotes: {
      type: [String],
      default: [],
    },
    aiSuggestions: {
      type: [String],
      default: [],
    },
  },
  { _id: false }
);

const dailyJournalSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    journalDate: {
      type: String, // Format: YYYY-MM-DD
      required: true,
      index: true,
    },
    originalText: {
      type: String,
      default: '',
    },
    structuredReport: {
      type: structuredReportSchema,
      default: () => ({}),
    },
    outputLanguage: {
      type: String,
      enum: ['original', 'english', 'hindi'],
      default: 'original',
    },
    processingStatus: {
      type: String,
      enum: ['idle', 'processing', 'completed', 'failed'],
      default: 'idle',
    },
    lastStructuredAt: {
      type: Date,
      default: null,
    },
    linkedTasks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
      },
    ],
    linkedGoals: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Goal',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// One journal entry per user per day
dailyJournalSchema.index({ userId: 1, journalDate: 1 }, { unique: true });
dailyJournalSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('DailyJournal', dailyJournalSchema);
