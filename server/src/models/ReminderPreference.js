import mongoose from 'mongoose';

const reminderPreferenceSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    startTime: {
      type: String,
      default: '18:00', // 6:00 PM default start
    },
    endTime: {
      type: String,
      default: '21:00', // 9:00 PM default end
    },
    followUpIntervalMinutes: {
      type: Number,
      enum: [15, 30, 60],
      default: 30,
    },
    channels: {
      inApp: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
      browser: { type: Boolean, default: false },
    },
    priorities: {
      type: [String],
      enum: ['high', 'medium', 'low'],
      default: ['high', 'medium'],
    },
    minPendingTasks: {
      type: Number,
      default: 1,
      min: 1,
    },
    quietHoursEnabled: {
      type: Boolean,
      default: true,
    },
    quietHoursStart: {
      type: String,
      default: '22:00', // 10:00 PM
    },
    quietHoursEnd: {
      type: String,
      default: '08:00', // 8:00 AM
    },
    timezone: {
      type: String,
      default: 'UTC',
    },
    maxEmailsPerDay: {
      type: Number,
      default: 3,
      min: 1,
      max: 10,
    },
    notificationEmail: {
      type: String,
      default: null,
      trim: true,
      lowercase: true,
    },
    emailsSentToday: {
      type: Number,
      default: 0,
    },
    lastEmailDate: {
      type: String,
      default: null,
    },
    snoozedUntil: {
      type: Date,
      default: null,
    },
    isPaused: {
      type: Boolean,
      default: false,
    },
    pausedUntil: {
      type: Date,
      default: null,
    },
    pauseReason: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('ReminderPreference', reminderPreferenceSchema);
