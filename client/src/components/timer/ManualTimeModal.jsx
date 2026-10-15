import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { Clock, AlertCircle } from 'lucide-react';
import api from '../../services/api';

export const ManualTimeModal = ({ isOpen, onClose, onLogged, tasks = [], categories = [] }) => {
  const [taskId, setTaskId] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [category, setCategory] = useState('personal');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (tasks.length > 0 && !taskId) {
      setTaskId(tasks[0]._id);
      setTaskTitle(tasks[0].title);
      setCategory(tasks[0].category || 'personal');
    }
  }, [tasks, taskId]);

  const handleTaskChange = (selectedId) => {
    setTaskId(selectedId);
    const found = tasks.find((t) => t._id === selectedId);
    if (found) {
      setTaskTitle(found.title);
      setCategory(found.category || 'personal');
    } else {
      setTaskTitle('General Offline Focus');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const duration = Number(durationMinutes);
    if (!duration || duration <= 0 || duration > 720) {
      setError('Please enter a valid duration between 1 and 720 minutes.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const now = new Date();
    const startTime = new Date(now.getTime() - duration * 60000);

    try {
      await api.post('/focus-sessions', {
        taskId: taskId || null,
        taskTitle: taskTitle || 'Manual Focus Log',
        category,
        sessionType: 'manual',
        startTime: startTime.toISOString(),
        endTime: now.toISOString(),
        durationMinutes: duration,
        notes,
        isManualEntry: true,
      });

      if (onLogged) onLogged();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to log manual time.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Manual Focus Time Entry"
      subtitle="Log offline study, textbook reading, or untracked deep work."
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-xs text-rose-600 dark:text-rose-400">
            {error}
          </div>
        )}

        {/* Task selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Associate with Task (Optional)
          </label>
          <select
            value={taskId}
            onChange={(e) => handleTaskChange(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium dark:text-white"
          >
            <option value="">No specific task (General study)</option>
            {tasks.map((t) => (
              <option key={t._id} value={t._id}>
                {t.title} ({t.category})
              </option>
            ))}
          </select>
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Category *
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium dark:text-white"
          >
            {categories.map((c) => (
              <option key={c.id || c.name} value={c.id || c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Duration in hours and minutes */}
        <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-500" />
              Focused Duration *
            </span>
            <span className="font-extrabold text-indigo-600 dark:text-indigo-400 font-mono text-xs bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-lg border border-indigo-200/50 dark:border-indigo-800/50">
              {Math.floor(durationMinutes / 60) > 0 ? `${Math.floor(durationMinutes / 60)}h ` : ''}
              {durationMinutes % 60}m ({durationMinutes} mins total)
            </span>
          </div>

          {/* Manual Numeric Inputs for Hours and Minutes */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Hours
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="12"
                  value={Math.floor(durationMinutes / 60) || ''}
                  onChange={(e) => {
                    const h = Math.max(0, parseInt(e.target.value, 10) || 0);
                    const m = durationMinutes % 60;
                    setDurationMinutes(h * 60 + m);
                  }}
                  className="w-full pl-3 pr-10 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  placeholder="0"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-semibold pointer-events-none">
                  hrs
                </span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Minutes
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="59"
                  step="5"
                  value={durationMinutes % 60}
                  onChange={(e) => {
                    const rawM = parseInt(e.target.value, 10) || 0;
                    const m = Math.max(0, Math.min(59, rawM));
                    const h = Math.floor(durationMinutes / 60);
                    setDurationMinutes(h * 60 + m);
                  }}
                  className="w-full pl-3 pr-10 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  placeholder="30"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-semibold pointer-events-none">
                  mins
                </span>
              </div>
            </div>
          </div>

          {/* Quick 1-Click Shortcuts */}
          <div>
            <span className="block text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
              Quick 1-Click Presets:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { mins: 15, label: '15m' },
                { mins: 25, label: '25m (Pomodoro)' },
                { mins: 30, label: '30m' },
                { mins: 45, label: '45m' },
                { mins: 60, label: '1 hour' },
                { mins: 90, label: '1.5 hours' },
                { mins: 120, label: '2 hours' },
                { mins: 180, label: '3 hours' },
              ].map((preset) => (
                <button
                  key={preset.mins}
                  type="button"
                  onClick={() => setDurationMinutes(preset.mins)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    durationMinutes === preset.mins
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Notes / Reflection
          </label>
          <textarea
            rows="2"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Completed chapters 4 and 5 on OS virtual memory..."
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium dark:text-white"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm disabled:opacity-50"
          >
            {isSubmitting ? 'Logging...' : 'Log Time'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ManualTimeModal;
