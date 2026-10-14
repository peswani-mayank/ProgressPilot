import Notification from '../models/Notification.js';

export const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const now = new Date();

    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ userId }).sort({ createdAt: -1 }).limit(50),
      Notification.countDocuments({
        userId,
        isRead: false,
        $or: [{ snoozedUntil: null }, { snoozedUntil: { $lte: now } }],
      }),
    ]);

    res.json({ notifications, unreadCount });
  } catch (err) {
    next(err);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.uid;

    const notif = await Notification.findOneAndUpdate(
      { _id: id, userId },
      { isRead: true },
      { new: true }
    );

    if (!notif) {
      return res.status(404).json({ error: 'Not Found', message: 'Notification not found.' });
    }

    res.json(notif);
  } catch (err) {
    next(err);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    await Notification.updateMany({ userId, isRead: false }, { isRead: true });
    res.json({ message: 'All notifications marked as read.' });
  } catch (err) {
    next(err);
  }
};

export const snoozeNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { durationMinutes = 30 } = req.body;
    const userId = req.user.uid;

    let snoozedUntil;
    if (durationMinutes === 'tomorrow') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      snoozedUntil = tomorrow;
    } else {
      snoozedUntil = new Date(Date.now() + Number(durationMinutes) * 60 * 1000);
    }

    const notif = await Notification.findOneAndUpdate(
      { _id: id, userId },
      { snoozedUntil, status: 'snoozed', isRead: true },
      { new: true }
    );

    if (!notif) {
      return res.status(404).json({ error: 'Not Found', message: 'Notification not found.' });
    }

    res.json({
      message: `Notification snoozed until ${snoozedUntil.toLocaleTimeString()}`,
      notification: notif,
    });
  } catch (err) {
    next(err);
  }
};

export const dismissNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.uid;

    const notif = await Notification.findOneAndDelete({ _id: id, userId });
    if (!notif) {
      return res.status(404).json({ error: 'Not Found', message: 'Notification not found.' });
    }

    res.json({ message: 'Notification dismissed.' });
  } catch (err) {
    next(err);
  }
};
