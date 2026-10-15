import React, { useState, useEffect } from 'react';
import {
  Bell,
  Check,
  Trash2,
  Calendar,
  AlertTriangle,
  Clock,
  ArrowRight,
  Sparkles,
  Zap,
  Mail,
  PauseCircle,
  PlayCircle,
  MoreVertical,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import EmptyState from '../components/common/EmptyState';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

export const NotificationsPage = () => {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'smart_reminder'
  const [snoozeMenuOpenId, setSnoozeMenuOpenId] = useState(null);

  // Reminder Preferences status (for pause/snooze banner)
  const [reminderPrefs, setReminderPrefs] = useState(null);

  const fetchNotifications = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [data, prefs] = await Promise.all([
        api.get('/notifications'),
        api.get('/reminders/preferences').catch(() => null),
      ]);
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
      setReminderPrefs(prefs);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    const prevNotifications = notifications;
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await api.patch(`/notifications/${id}/read`);
      fetchNotifications(true);
    } catch (err) {
      setNotifications(prevNotifications);
      console.error('Error marking as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    const prevNotifications = notifications;
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    addToast({ title: 'All notifications marked as read', type: 'success' });

    try {
      await api.post('/notifications/mark-all-read');
      fetchNotifications(true);
    } catch (err) {
      setNotifications(prevNotifications);
      addToast({ title: 'Failed to mark all as read', type: 'error' });
    }
  };

  const handleDismiss = async (id) => {
    const prevNotifications = notifications;
    const target = notifications.find((n) => n._id === id);
    setNotifications((prev) => prev.filter((n) => n._id !== id));
    if (target && !target.isRead) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    try {
      await api.delete(`/notifications/${id}`);
      fetchNotifications(true);
    } catch (err) {
      setNotifications(prevNotifications);
      console.error('Error dismissing notification:', err);
    }
  };

  const handleSnooze = async (id, durationMinutes) => {
    try {
      setSnoozeMenuOpenId(null);
      const res = await api.patch(`/notifications/${id}/snooze`, { durationMinutes });
      addToast({
        title: 'Notification Snoozed ⏱️',
        message: res.message,
        type: 'info',
      });
      fetchNotifications();
    } catch (err) {
      addToast({ title: 'Snooze failed', message: err.message, type: 'error' });
    }
  };

  const handleResumeReminders = async () => {
    try {
      await api.post('/reminders/resume');
      addToast({
        title: 'Reminders Resumed! ▶️',
        message: 'Your accountability schedule is active again.',
        type: 'success',
      });
      fetchNotifications();
    } catch (err) {
      addToast({ title: 'Resume failed', message: err.message, type: 'error' });
    }
  };

  const isPaused = reminderPrefs?.isPaused && (!reminderPrefs.pausedUntil || new Date(reminderPrefs.pausedUntil) > new Date());
  const isSnoozed = reminderPrefs?.snoozedUntil && new Date(reminderPrefs.snoozedUntil) > new Date();

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'smart_reminder') return n.type === 'smart_reminder';
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>Notification & Accountability Center</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Smart reminders, daily accountability follow-ups, and upcoming deadlines.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all self-start sm:self-auto"
          >
            <Check className="w-4 h-4" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {/* Pause/Snooze Alert Banner */}
      {(isPaused || isSnoozed) && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
            <PauseCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              {isPaused
                ? `Smart Reminders are currently paused${reminderPrefs.pauseReason ? ` for "${reminderPrefs.pauseReason}"` : ''} until ${new Date(reminderPrefs.pausedUntil).toLocaleDateString()}`
                : `Smart Reminders are snoozed until ${new Date(reminderPrefs.snoozedUntil).toLocaleTimeString()}`}
            </span>
          </div>
          <button
            type="button"
            onClick={handleResumeReminders}
            className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] shadow-xs"
          >
            Resume Reminders
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            filter === 'all'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            filter === 'unread'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          Unread ({unreadCount})
        </button>
        <button
          onClick={() => setFilter('smart_reminder')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            filter === 'smart_reminder'
              ? 'bg-purple-600 text-white'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          Smart Reminders
        </button>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="All caught up!"
          description="You don't have any pending notifications right now."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const isUnread = !item.isRead;
            const isSnoozedNotification =
              item.snoozedUntil && new Date(item.snoozedUntil) > new Date();

            return (
              <div
                key={item._id}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start justify-between gap-4 ${
                  isUnread
                    ? 'bg-indigo-50/40 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-900 shadow-xs'
                    : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
                }`}
              >
                <div className="flex items-start gap-3 w-full">
                  {/* Icon */}
                  <div
                    className={`p-2.5 rounded-xl mt-0.5 shrink-0 ${
                      item.type === 'smart_reminder'
                        ? 'bg-purple-100 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400'
                        : item.type === 'deadline'
                        ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
                        : item.type === 'overdue'
                        ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                        : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400'
                    }`}
                  >
                    {item.type === 'smart_reminder' ? (
                      <Zap className="w-4 h-4 fill-current" />
                    ) : item.type === 'deadline' ? (
                      <Calendar className="w-4 h-4" />
                    ) : item.type === 'overdue' ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {item.title}
                      </h4>
                      {isUnread && (
                        <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                      )}

                      {/* Channel Badge */}
                      {item.channel && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {item.channel === 'email' ? 'Email' : 'In-App'}
                        </span>
                      )}

                      {/* Priority Badge */}
                      {item.metadata?.topTaskPriority && (
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${
                            item.metadata.topTaskPriority === 'high'
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                              : item.metadata.topTaskPriority === 'medium'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                          }`}
                        >
                          {item.metadata.topTaskPriority}
                        </span>
                      )}

                      {/* Snoozed Badge */}
                      {isSnoozedNotification && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          <Clock className="w-3 h-3" />
                          <span>
                            Snoozed until{' '}
                            {new Date(item.snoozedUntil).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                      {item.message}
                    </p>

                    <div className="flex items-center gap-4 mt-2.5">
                      {item.link && (
                        <button
                          type="button"
                          onClick={() => {
                            handleMarkAsRead(item._id);
                            navigate(item.link);
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          <span>Open Today's Plan & Timer</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}

                      <span className="text-[11px] text-slate-400">
                        {new Date(item.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions: Snooze, Read, Dismiss */}
                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-start">
                  {/* Snooze Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        setSnoozeMenuOpenId(snoozeMenuOpenId === item._id ? null : item._id)
                      }
                      title="Snooze reminder"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Clock className="w-4 h-4" />
                    </button>

                    {snoozeMenuOpenId === item._id && (
                      <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-20 text-xs animate-fade-in">
                        <button
                          type="button"
                          onClick={() => handleSnooze(item._id, 30)}
                          className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium"
                        >
                          Snooze 30m
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSnooze(item._id, 60)}
                          className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium"
                        >
                          Snooze 1 hour
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSnooze(item._id, 'tomorrow')}
                          className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium"
                        >
                          Until Tomorrow
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Mark as read */}
                  {isUnread && (
                    <button
                      type="button"
                      onClick={() => handleMarkAsRead(item._id)}
                      title="Mark as read"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}

                  {/* Dismiss */}
                  <button
                    type="button"
                    onClick={() => handleDismiss(item._id)}
                    title="Dismiss notification"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
