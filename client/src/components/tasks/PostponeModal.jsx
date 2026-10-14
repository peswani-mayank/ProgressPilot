import React, { useState } from 'react';
import Modal from '../common/Modal';
import { Calendar, AlertCircle } from 'lucide-react';
import { format, addDays } from 'date-fns';
import api from '../../services/api';

const DISTRACTION_REASONS = [
  { id: 'unexpected_time_constraints', label: 'Unexpected time constraints' },
  { id: 'harder_than_expected', label: 'Task was more difficult than expected' },
  { id: 'distraction', label: 'Distraction / Lost focus' },
  { id: 'incorrect_estimate', label: 'Incorrect time estimate' },
  { id: 'not_a_priority', label: 'Task was not high priority today' },
  { id: 'other', label: 'Other reason' },
];

export const PostponeModal = ({ isOpen, onClose, task, occurrence, onPostponed }) => {
  const tomorrowStr = format(addDays(new Date(), 1), 'yyyy-MM-dd');
  const [newDate, setNewDate] = useState(tomorrowStr);
  const [reason, setReason] = useState('unexpected_time_constraints');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!task && !occurrence) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newDate) {
      setError('Please select a target date.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      if (occurrence?._id) {
        await api.post(`/occurrences/${occurrence._id}/reschedule`, {
          newDate,
          reason,
          notes,
        });
      } else if (task?._id) {
        await api.post(`/tasks/${task._id}/postpone`, {
          newDate,
          reason,
          notes,
        });
      }

      if (onPostponed) onPostponed();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to postpone task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Postpone & Log Blocker"
      subtitle="Keep your schedule realistic without losing progress or shame."
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-xs text-rose-600 dark:text-rose-400">
            {error}
          </div>
        )}

        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            Task
          </p>
          <p className="text-sm font-bold text-slate-900 dark:text-white">
            {task?.title || occurrence?.taskId?.title}
          </p>
        </div>

        {/* Reschedule Date */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Move to Date *
          </label>
          <input
            type="date"
            required
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium dark:text-white"
          />
        </div>

        {/* Reason */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Why was this postponed? (Helps your weekly review)
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium dark:text-white"
          >
            {DISTRACTION_REASONS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        {/* Optional Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Additional Reflection (Optional)
          </label>
          <textarea
            rows="2"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What will you do differently next time?"
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
            {isSubmitting ? 'Rescheduling...' : 'Reschedule Task'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default PostponeModal;
