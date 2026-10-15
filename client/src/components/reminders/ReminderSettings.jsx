import React, { useState, useEffect } from 'react';
import {
  Bell,
  Clock,
  Mail,
  Smartphone,
  Shield,
  Moon,
  PauseCircle,
  PlayCircle,
  Sparkles,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Flame,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const TIMEZONES = [
  'UTC',
  'Asia/Kolkata',
  'America/New_York',
  'America/Los_Angeles',
  'America/Chicago',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Singapore',
  'Australia/Sydney',
];

export const ReminderSettings = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  // Settings State
  const [enabled, setEnabled] = useState(true);
  const [notificationEmail, setNotificationEmail] = useState('');
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('21:00');
  const [followUpIntervalMinutes, setFollowUpIntervalMinutes] = useState(30);
  const [channels, setChannels] = useState({ inApp: true, email: true, browser: false });
  const [priorities, setPriorities] = useState(['high', 'medium']);
  const [minPendingTasks, setMinPendingTasks] = useState(1);
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(true);
  const [quietHoursStart, setQuietHoursStart] = useState('22:00');
  const [quietHoursEnd, setQuietHoursEnd] = useState('08:00');
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  );
  const [maxEmailsPerDay, setMaxEmailsPerDay] = useState(3);

  // Snooze & Pause State
  const [snoozedUntil, setSnoozedUntil] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [pausedUntil, setPausedUntil] = useState(null);
  const [pauseReason, setPauseReason] = useState('');
  const [pauseDays, setPauseDays] = useState(1);

  // Load preferences from backend
  const loadPreferences = async () => {
    try {
      setLoading(true);
      const data = await api.get('/reminders/preferences');
      if (data) {
        setEnabled(data.enabled !== false);
        setStartTime(data.startTime || '18:00');
        setEndTime(data.endTime || '21:00');
        setFollowUpIntervalMinutes(data.followUpIntervalMinutes || 30);
        setChannels(data.channels || { inApp: true, email: true, browser: false });
        setPriorities(data.priorities || ['high', 'medium']);
        setMinPendingTasks(data.minPendingTasks || 1);
        setQuietHoursEnabled(data.quietHoursEnabled !== false);
        setQuietHoursStart(data.quietHoursStart || '22:00');
        setQuietHoursEnd(data.quietHoursEnd || '08:00');
        setTimezone(data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
        setMaxEmailsPerDay(data.maxEmailsPerDay || 3);
        setNotificationEmail(data.notificationEmail || '');
        setSnoozedUntil(data.snoozedUntil ? new Date(data.snoozedUntil) : null);
        setIsPaused(Boolean(data.isPaused));
        setPausedUntil(data.pausedUntil ? new Date(data.pausedUntil) : null);
        setPauseReason(data.pauseReason || '');
      }
    } catch (err) {
      console.error('Failed to load reminder settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPreferences();
  }, []);

  // Save Settings
  const handleSave = async (e) => {
    e?.preventDefault();
    try {
      setSaving(true);
      const payload = {
        enabled,
        notificationEmail: notificationEmail.trim() || null,
        startTime,
        endTime,
        followUpIntervalMinutes: Number(followUpIntervalMinutes),
        channels,
        priorities,
        minPendingTasks: Number(minPendingTasks),
        quietHoursEnabled,
        quietHoursStart,
        quietHoursEnd,
        timezone,
        maxEmailsPerDay: Number(maxEmailsPerDay),
      };

      if (typeof api.put === 'function') {
        await api.put('/reminders/preferences', payload);
      } else if (typeof api.patch === 'function') {
        await api.patch('/reminders/preferences', payload);
      } else {
        await api.post('/reminders/preferences', payload);
      }

      addToast({
        title: 'Reminder Settings Saved! ⚡',
        message: 'Your accountability preferences are active.',
        type: 'success',
      });
    } catch (err) {
      addToast({
        title: 'Save failed',
        message: err.message,
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  // Snooze Actions
  const handleSnooze = async (duration) => {
    try {
      const res = await api.post('/reminders/snooze', { durationMinutes: duration });
      setSnoozedUntil(new Date(res.snoozedUntil));
      addToast({
        title: 'Reminders Snoozed ⏱️',
        message: res.message,
        type: 'info',
      });
    } catch (err) {
      addToast({ title: 'Snooze failed', message: err.message, type: 'error' });
    }
  };

  // Pause Actions
  const handlePause = async () => {
    try {
      const res = await api.post('/reminders/pause', {
        days: pauseDays,
        reason: pauseReason || 'Rest or Exam Period',
      });
      setIsPaused(true);
      setPausedUntil(new Date(res.pausedUntil));
      addToast({
        title: 'Reminders Paused ⏸️',
        message: res.message,
        type: 'info',
      });
    } catch (err) {
      addToast({ title: 'Pause failed', message: err.message, type: 'error' });
    }
  };

  // Resume Action
  const handleResume = async () => {
    try {
      await api.post('/reminders/resume');
      setIsPaused(false);
      setPausedUntil(null);
      setSnoozedUntil(null);
      setPauseReason('');
      addToast({
        title: 'Reminders Resumed! ▶️',
        message: 'Your smart accountability schedule is back on track.',
        type: 'success',
      });
    } catch (err) {
      addToast({ title: 'Resume failed', message: err.message, type: 'error' });
    }
  };

  // Test Reminder Trigger
  const handleTestEvaluation = async () => {
    try {
      setTesting(true);
      const res = await api.post('/reminders/evaluate', { force: true });
      if (res.result?.notified) {
        addToast({
          title: 'Test Reminder Dispatched! 🚀',
          message: `Generated message: "${res.result.message}"`,
          type: 'success',
          duration: 5000,
        });
      } else {
        addToast({
          title: 'Reminder Evaluated',
          message: `Evaluation completed: ${res.result?.reason}`,
          type: 'info',
        });
      }
    } catch (err) {
      addToast({ title: 'Test failed', message: err.message, type: 'error' });
    } finally {
      setTesting(false);
    }
  };

  const [sendingEmail, setSendingEmail] = useState(false);

  const handleSendRealTestEmail = async () => {
    try {
      setSendingEmail(true);
      const res = await api.post('/reminders/send-test-email');
      addToast({
        title: 'Real Email Delivered! 📬',
        message: res.message || 'Check your inbox now!',
        type: 'success',
        duration: 8000,
      });
    } catch (err) {
      addToast({
        title: 'Email Delivery Failed',
        message: err.message || 'Please check your email credentials in server/.env',
        type: 'error',
        duration: 8000,
      });
    } finally {
      setSendingEmail(false);
    }
  };

  const togglePriority = (p) => {
    if (priorities.includes(p)) {
      if (priorities.length > 1) {
        setPriorities(priorities.filter((item) => item !== p));
      }
    } else {
      setPriorities([...priorities, p]);
    }
  };

  if (loading) {
    return (
      <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse">
        <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded mb-4" />
        <div className="h-4 w-72 bg-slate-100 dark:bg-slate-800 rounded" />
      </div>
    );
  }

  const isCurrentlySnoozed = snoozedUntil && new Date(snoozedUntil) > new Date();
  const isCurrentlyPaused = isPaused && (!pausedUntil || new Date(pausedUntil) > new Date());

  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-card space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <span>Smart Accountability Reminders</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
              Duolingo-Inspired
            </span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Gentle, contextual accountability nudges to protect your momentum without guilt or spam.
          </p>
        </div>

        {/* Master Switch */}
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
          <span className="ml-2.5 text-xs font-bold text-slate-800 dark:text-slate-200">
            {enabled ? 'Reminders Active' : 'Disabled'}
          </span>
        </label>
      </div>

      {/* Active Snooze / Pause Alert Banner */}
      {(isCurrentlySnoozed || isCurrentlyPaused) && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
            <PauseCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>
              {isCurrentlyPaused
                ? `Reminders paused until ${pausedUntil?.toLocaleDateString()} ${pauseReason ? `(${pauseReason})` : ''}`
                : `Reminders snoozed until ${snoozedUntil?.toLocaleTimeString()}`}
            </span>
          </div>
          <button
            type="button"
            onClick={handleResume}
            className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] shadow-xs"
          >
            Resume Now
          </button>
        </div>
      )}

      {/* Configuration Grid */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Row 1: Evening Window & Follow-Up Interval */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Start Time (Evening Evaluation)
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium dark:text-white"
            />
            <p className="text-[11px] text-slate-400 mt-1">Default: 18:00 (6:00 PM)</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              End Time (Window Closes)
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium dark:text-white"
            />
            <p className="text-[11px] text-slate-400 mt-1">Default: 21:00 (9:00 PM)</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Follow-Up Interval
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
              {[15, 30, 60].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setFollowUpIntervalMinutes(mins)}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                    followUpIntervalMinutes === mins
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Nudge frequency inside window</p>
          </div>
        </div>

        {/* Row 2: Delivery Channels & Priorities */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Channels */}
          <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Notification Channels
            </span>
            <div className="space-y-2">
              <label className="flex items-center gap-2.5 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={channels.inApp}
                  onChange={(e) => setChannels({ ...channels, inApp: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <Bell className="w-3.5 h-3.5 text-indigo-500" />
                <span>In-App Notifications (Notification Center & Bell)</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={channels.email}
                  onChange={(e) => setChannels({ ...channels, email: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <Mail className="w-3.5 h-3.5 text-emerald-500" />
                <span>Transactional Email Reminders (HTML Summary)</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={channels.browser}
                  onChange={(e) => setChannels({ ...channels, browser: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <Smartphone className="w-3.5 h-3.5 text-purple-500" />
                <span>Browser Push Notifications (when tab active)</span>
              </label>
            </div>

            {/* Connected Account Email Indicator */}
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Logged In Google Email:
                </span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  {user?.email || 'Not connected'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                All incomplete task reminders will be sent directly to whichever Google account you log in with.
              </p>
            </div>
          </div>

          {/* Task Priorities Trigger */}
          <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Trigger For Priorities
            </span>
            <div className="flex flex-wrap gap-2 pt-1">
              {[
                { id: 'high', label: 'High Priority', color: 'rose' },
                { id: 'medium', label: 'Medium Priority', color: 'amber' },
                { id: 'low', label: 'Low Priority', color: 'indigo' },
              ].map((p) => {
                const isSelected = priorities.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => togglePriority(p.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400">
              Only tasks with selected priorities trigger accountability nudges.
            </p>
          </div>
        </div>

        {/* Row 3: Quiet Hours & Timezone */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Quiet Hours (Sleep Protection)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={quietHoursStart}
                onChange={(e) => setQuietHoursStart(e.target.value)}
                className="w-1/2 px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium dark:text-white"
              />
              <span className="text-xs text-slate-400">to</span>
              <input
                type="time"
                value={quietHoursEnd}
                onChange={(e) => setQuietHoursEnd(e.target.value)}
                className="w-1/2 px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium dark:text-white"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Never sends notifications during this window</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Timezone
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium dark:text-white"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-1">Evaluates evening hours in your local time</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Max Reminder Emails / Day
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={maxEmailsPerDay}
              onChange={(e) => setMaxEmailsPerDay(Number(e.target.value))}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium dark:text-white"
            />
            <p className="text-[11px] text-slate-400 mt-1">Prevents inbox clutter (Default: 3)</p>
          </div>
        </div>

        {/* Quick Snooze & Pause Actions Bar */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-slate-900 dark:text-white block">
              Quick Snooze & Rest Controls
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Take a break without turning off your whole accountability system
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleSnooze(30)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:border-indigo-500"
            >
              Snooze 30m
            </button>
            <button
              type="button"
              onClick={() => handleSnooze(60)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:border-indigo-500"
            >
              Snooze 1h
            </button>
            <button
              type="button"
              onClick={() => handleSnooze('tomorrow')}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:border-indigo-500"
            >
              Until Tomorrow
            </button>

            {/* Pause Popover / Button */}
            <button
              type="button"
              onClick={() => {
                const days = prompt('Pause reminders for how many days? (e.g. 1, 3, 7)', '3');
                if (days) {
                  const reason = prompt('Reason for pause (e.g. Exams, Vacation):', 'Exams');
                  setPauseDays(Number(days));
                  setPauseReason(reason || '');
                  api.post('/reminders/pause', { days: Number(days), reason }).then((res) => {
                    setIsPaused(true);
                    setPausedUntil(new Date(res.pausedUntil));
                    addToast({ title: 'Reminders Paused', message: res.message, type: 'info' });
                  });
                }
              }}
              className="px-2.5 py-1.5 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-xs font-bold hover:bg-amber-100"
            >
              Pause (Exams/Vacation)
            </button>
          </div>
        </div>

        {/* Action Buttons: Save & Test */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleTestEvaluation}
              disabled={testing}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 transition-all border border-indigo-200 dark:border-indigo-800"
            >
              <Sparkles className="w-4 h-4" />
              <span>{testing ? 'Evaluating...' : 'Test Evaluation'}</span>
            </button>

            <button
              type="button"
              onClick={handleSendRealTestEmail}
              disabled={sendingEmail}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 transition-all border border-emerald-200 dark:border-emerald-800"
            >
              <Mail className="w-4 h-4" />
              <span>{sendingEmail ? 'Sending Email...' : 'Send Live Test Email to My Inbox'}</span>
            </button>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/25 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Settings...' : 'Save Reminder Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReminderSettings;
