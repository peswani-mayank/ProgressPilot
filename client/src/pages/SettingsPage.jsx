import React, { useState, useEffect } from 'react';
import {
  Settings,
  User,
  Sun,
  Moon,
  Clock,
  Target,
  Bell,
  Download,
  Plus,
  Trash2,
  FileSpreadsheet,
  FileJson,
  Save,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import ReminderSettings from '../components/reminders/ReminderSettings';

const DEFAULT_COLOR_PALETTES = [
  '#6366f1',
  '#3b82f6',
  '#06b6d4',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#ec4899',
  '#8b5cf6',
];

export const SettingsPage = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // User preferences
  const [timezone, setTimezone] = useState('UTC');
  const [workingHoursStart, setWorkingHoursStart] = useState('09:00');
  const [workingHoursEnd, setWorkingHoursEnd] = useState('18:00');
  const [dailyTaskTarget, setDailyTaskTarget] = useState(5);
  const [dailyFocusHoursTarget, setDailyFocusHoursTarget] = useState(4);
  const [defaultPomodoroDuration, setDefaultPomodoroDuration] = useState(25);
  const [defaultShortBreakDuration, setDefaultShortBreakDuration] = useState(5);
  const [defaultLongBreakDuration, setDefaultLongBreakDuration] = useState(15);

  // Notification preferences
  const [upcomingDeadlines, setUpcomingDeadlines] = useState(true);
  const [overdueTasks, setOverdueTasks] = useState(true);
  const [dailyPlanning, setDailyPlanning] = useState(true);
  const [dailyReview, setDailyReview] = useState(true);

  // Custom Categories
  const [categories, setCategories] = useState([]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#6366f1');

  // Load user profile & preferences from DB
  useEffect(() => {
    api.get('/user/profile')
      .then((data) => {
        const prefs = data.preferences || {};
        setTimezone(prefs.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
        setWorkingHoursStart(prefs.workingHours?.start || '09:00');
        setWorkingHoursEnd(prefs.workingHours?.end || '18:00');
        setDailyTaskTarget(prefs.dailyTaskTarget || 5);
        setDailyFocusHoursTarget(prefs.dailyFocusHoursTarget || 4);
        setDefaultPomodoroDuration(prefs.defaultPomodoroDuration || 25);
        setDefaultShortBreakDuration(prefs.defaultShortBreakDuration || 5);
        setDefaultLongBreakDuration(prefs.defaultLongBreakDuration || 15);
        setCategories(prefs.categories || []);

        const notif = prefs.notificationPreferences || {};
        setUpcomingDeadlines(notif.upcomingDeadlines !== false);
        setOverdueTasks(notif.overdueTasks !== false);
        setDailyPlanning(notif.dailyPlanning !== false);
        setDailyReview(notif.dailyReview !== false);
      })
      .catch((err) => {
        console.error('Failed to load user preferences:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const preferences = {
        timezone,
        workingHours: {
          start: workingHoursStart,
          end: workingHoursEnd,
        },
        dailyTaskTarget: Number(dailyTaskTarget),
        dailyFocusHoursTarget: Number(dailyFocusHoursTarget),
        defaultPomodoroDuration: Number(defaultPomodoroDuration),
        defaultShortBreakDuration: Number(defaultShortBreakDuration),
        defaultLongBreakDuration: Number(defaultLongBreakDuration),
        categories,
        notificationPreferences: {
          upcomingDeadlines,
          overdueTasks,
          dailyPlanning,
          dailyReview,
        },
      };

      await api.patch('/user/preferences', { preferences });
      addToast({
        title: 'Settings Saved',
        message: 'Your personal preferences have been updated.',
        type: 'success',
      });
    } catch (err) {
      addToast({ title: 'Save failed', message: err.message, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    const catId = newCatName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    setCategories([
      ...categories,
      {
        id: catId,
        name: newCatName.trim(),
        color: newCatColor,
        isCustom: true,
      },
    ]);
    setNewCatName('');
  };

  const handleRemoveCategory = (id) => {
    setCategories(categories.filter((c) => c.id !== id));
  };

  // Exports
  const handleExport = async (endpoint, name) => {
    try {
      addToast({ title: `Preparing ${name} download...`, type: 'info' });
      await api.download(endpoint);
      addToast({ title: `${name} downloaded successfully!`, type: 'success' });
    } catch (err) {
      addToast({ title: 'Export failed', message: err.message, type: 'error' });
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          <span>Settings & Customization</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Configure profile, targets, timers, notifications, and export your data.
        </p>
      </div>

      <form onSubmit={handleSavePreferences} className="space-y-6">
        {/* Profile Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={user?.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.displayName || 'PP'}`}
              alt={user?.displayName || 'User'}
              className="w-16 h-16 rounded-2xl border-2 border-indigo-500/20 object-cover shadow-sm"
            />
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {user?.displayName || 'Progress Pilot'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">{user?.email}</p>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md mt-2">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified Account Session</span>
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={async () => {
              await logout();
              navigate('/login');
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Theme & Appearance */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-subtle space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Theme & Appearance</span>
          </h3>

          <div className="grid grid-cols-2 gap-3 max-w-sm">
            <button
              type="button"
              onClick={() => theme === 'dark' && toggleTheme()}
              className={`p-4 rounded-2xl border text-center font-bold text-xs flex flex-col items-center gap-2 transition-all ${
                theme === 'light'
                  ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <Sun className="w-5 h-5 text-amber-500" />
              <span>Light Mode</span>
            </button>

            <button
              type="button"
              onClick={() => theme === 'light' && toggleTheme()}
              className={`p-4 rounded-2xl border text-center font-bold text-xs flex flex-col items-center gap-2 transition-all ${
                theme === 'dark'
                  ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <Moon className="w-5 h-5 text-indigo-400" />
              <span>Dark Mode</span>
            </button>
          </div>
        </div>

        {/* Daily Targets & Working Hours */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-subtle space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Daily Targets & Working Schedule
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Daily Task Target
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={dailyTaskTarget}
                onChange={(e) => setDailyTaskTarget(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold dark:text-white"
              />
              <p className="text-[11px] text-slate-400 mt-1">Recommended target: 4 to 8 tasks</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Daily Focused Hours Target
              </label>
              <input
                type="number"
                min="0.5"
                max="16"
                step="0.5"
                value={dailyFocusHoursTarget}
                onChange={(e) => setDailyFocusHoursTarget(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold dark:text-white"
              />
              <p className="text-[11px] text-slate-400 mt-1">Recommended deep work: 3 to 6 hours</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Working Hours Start
              </label>
              <input
                type="time"
                value={workingHoursStart}
                onChange={(e) => setWorkingHoursStart(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Working Hours End
              </label>
              <input
                type="time"
                value={workingHoursEnd}
                onChange={(e) => setWorkingHoursEnd(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Pomodoro Timer Defaults */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-subtle space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Default Pomodoro & Break Durations
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Pomodoro Focus (mins)
              </label>
              <input
                type="number"
                min="5"
                max="120"
                value={defaultPomodoroDuration}
                onChange={(e) => setDefaultPomodoroDuration(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Short Break (mins)
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={defaultShortBreakDuration}
                onChange={(e) => setDefaultShortBreakDuration(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Long Break (mins)
              </label>
              <input
                type="number"
                min="5"
                max="60"
                value={defaultLongBreakDuration}
                onChange={(e) => setDefaultLongBreakDuration(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Custom Categories Manager */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-subtle space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Task Categories & Custom Tags
          </h3>

          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <span
                key={c.id || c.name}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border"
                style={{
                  backgroundColor: `${c.color || '#6366f1'}15`,
                  color: c.color || '#6366f1',
                  borderColor: `${c.color || '#6366f1'}35`,
                }}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color || '#6366f1' }} />
                <span>{c.name}</span>
                {c.isCustom && (
                  <button
                    type="button"
                    onClick={() => handleRemoveCategory(c.id)}
                    className="hover:text-rose-500 ml-1"
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
          </div>

          {/* Add Category Form */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <input
              type="text"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="New category name (e.g. AI Research)..."
              className="flex-1 min-w-[200px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs dark:text-white"
            />
            <div className="flex items-center gap-1">
              {DEFAULT_COLOR_PALETTES.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewCatColor(color)}
                  className={`w-6 h-6 rounded-full transition-transform ${newCatColor === color ? 'scale-125 ring-2 ring-indigo-500' : ''}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={handleAddCategory}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200"
            >
              Add Category
            </button>
          </div>
        </div>

        {/* Save button */}
        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/25 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Preferences...' : 'Save All Preferences'}</span>
          </button>
        </div>
      </form>

      {/* Smart Accountability Reminders Configuration (Feature 12) */}
      <ReminderSettings />

      {/* Data Export & Backup Section (Section 15) */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-card space-y-4">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Download className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Export & Data Portability</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            You own your productivity data. Export your tasks, focus logs, and goals anytime as CSV or structured JSON.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          <button
            type="button"
            onClick={() => handleExport('/export/tasks', 'Tasks CSV')}
            className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20 text-left transition-all group"
          >
            <FileSpreadsheet className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mb-2" />
            <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600">
              Tasks (.CSV)
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Export all tasks, deadlines, and statuses</p>
          </button>

          <button
            type="button"
            onClick={() => handleExport('/export/time-logs', 'Time Logs CSV')}
            className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20 text-left transition-all group"
          >
            <Clock className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mb-2" />
            <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600">
              Time Logs (.CSV)
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Focus sessions & Pomodoro records</p>
          </button>

          <button
            type="button"
            onClick={() => handleExport('/export/goals', 'Goals CSV')}
            className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20 text-left transition-all group"
          >
            <Target className="w-6 h-6 text-amber-600 dark:text-amber-400 mb-2" />
            <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600">
              Goals (.CSV)
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Long-term targets & milestone progress</p>
          </button>

          <button
            type="button"
            onClick={() => handleExport('/export/all', 'Complete JSON Backup')}
            className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20 text-left transition-all group"
          >
            <FileJson className="w-6 h-6 text-blue-600 dark:text-blue-400 mb-2" />
            <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600">
              Full Account (.JSON)
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Complete account schema & history</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
