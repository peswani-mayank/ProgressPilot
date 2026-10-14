import mongoose from 'mongoose';

const milestoneSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true, trim: true },
  targetDeadline: { type: String, default: null }, // YYYY-MM-DD
  targetValue: { type: Number, default: 0 },
  currentProgress: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed'],
    default: 'pending',
  },
  completedAt: { type: Date, default: null },
}, { _id: false });

const goalSchema = new mongoose.Schema(
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
    startDate: {
      type: String,
      required: true,
    },
    targetDeadline: {
      type: String,
      required: true,
      index: true,
    },
    targetValue: {
      type: Number,
      required: true,
      min: 1,
    },
    targetUnit: {
      type: String,
      required: true,
      trim: true, // e.g. "Problems", "Hours", "Projects", "Chapters"
    },
    currentProgress: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'on_hold'],
      default: 'in_progress',
      index: true,
    },
    milestones: {
      type: [milestoneSchema],
      default: [],
    },
    notes: {
      type: String,
      default: '',
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

goalSchema.index({ userId: 1, targetDeadline: 1, status: 1 });

export default mongoose.model('Goal', goalSchema);
