import mongoose from 'mongoose';

const DEFAULT_CATEGORIES = [
  { id: 'dsa', name: 'DSA', color: '#6366f1' },
  { id: 'fullstack', name: 'Full Stack Development', color: '#3b82f6' },
  { id: 'university', name: 'University Academics', color: '#8b5cf6' },
  { id: 'core_cs', name: 'Core Computer Science', color: '#06b6d4' },
  { id: 'projects', name: 'Projects', color: '#10b981' },
  { id: 'job_apps', name: 'Job Applications', color: '#f59e0b' },
  { id: 'personal', name: 'Personal', color: '#ec4899' },
  { id: 'health_fitness', name: 'Health and Fitness', color: '#14b8a6' },
];

const categorySchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  color: { type: String, default: '#6366f1' },
  isCustom: { type: Boolean, default: false },
}, { _id: false });

const userSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    displayName: {
      type: String,
      default: '',
      trim: true,
    },
    photoURL: {
      type: String,
      default: '',
    },
    onboardingCompleted: {
      type: Boolean,
      default: false,
    },
    preferences: {
      theme: {
        type: String,
        enum: ['light', 'dark', 'system'],
        default: 'light',
      },
      timezone: {
        type: String,
        default: 'UTC',
      },
      workingHours: {
        start: { type: String, default: '09:00' },
        end: { type: String, default: '18:00' },
      },
      dailyTaskTarget: {
        type: Number,
        default: 5,
        min: 1,
        max: 50,
      },
      dailyFocusHoursTarget: {
        type: Number,
        default: 4,
        min: 0.5,
        max: 24,
      },
      defaultPomodoroDuration: {
        type: Number,
        default: 25,
        min: 5,
        max: 120,
      },
      defaultShortBreakDuration: {
        type: Number,
        default: 5,
        min: 1,
        max: 30,
      },
      defaultLongBreakDuration: {
        type: Number,
        default: 15,
        min: 5,
        max: 60,
      },
      categories: {
        type: [categorySchema],
        default: DEFAULT_CATEGORIES,
      },
      notificationPreferences: {
        upcomingDeadlines: { type: Boolean, default: true },
        overdueTasks: { type: Boolean, default: true },
        dailyPlanning: { type: Boolean, default: true },
        dailyReview: { type: Boolean, default: true },
        focusComplete: { type: Boolean, default: true },
        dailyPlanningTime: { type: String, default: '08:00' },
        dailyReviewTime: { type: String, default: '20:00' },
      },
    },
  },
  {
    timestamps: true,
  }
);

export const DEFAULT_TASK_CATEGORIES = DEFAULT_CATEGORIES;
export default mongoose.model('User', userSchema);
