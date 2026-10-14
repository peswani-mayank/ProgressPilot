import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
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
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['deadline', 'overdue', 'daily_planning', 'daily_review', 'focus_complete', 'streak', 'smart_reminder', 'system'],
      default: 'system',
      index: true,
    },
    channel: {
      type: String,
      enum: ['in_app', 'email', 'browser'],
      default: 'in_app',
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'failed', 'snoozed', 'dismissed'],
      default: 'delivered',
    },
    providerMessageId: {
      type: String,
      default: null,
    },
    deliveryError: {
      type: String,
      default: null,
    },
    idempotencyKey: {
      type: String,
      default: null,
      sparse: true,
      index: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    link: {
      type: String,
      default: '',
    },
    relatedId: {
      type: String,
      default: null,
    },
    snoozedUntil: {
      type: Date,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);
