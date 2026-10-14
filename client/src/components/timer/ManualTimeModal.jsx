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

        {/* Duration in minutes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Focused Duration (Minutes) *
          </label>
          <input
            type="number"
            min="1"
            max="720"
            required
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold dark:text-white"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            {(Number(durationMinutes) / 60).toFixed(1)} hours of focused time
          </p>
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
