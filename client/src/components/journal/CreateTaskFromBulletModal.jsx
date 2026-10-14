import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { CheckSquare, Calendar, Clock, Target, Tag, Sparkles } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { format, addDays } from 'date-fns';

const CATEGORIES = [
  { id: 'dsa', name: 'DSA' },
  { id: 'fullstack', name: 'Full Stack Development' },
  { id: 'university', name: 'University Academics' },
  { id: 'core_cs', name: 'Core Computer Science' },
  { id: 'projects', name: 'Projects' },
  { id: 'job_apps', name: 'Job Applications' },
  { id: 'personal', name: 'Personal' },
  { id: 'health_fitness', name: 'Health & Fitness' },
];

export const CreateTaskFromBulletModal = ({
  isOpen,
  onClose,
  bulletText = '',
  sourceSection = '',
  journalDate = '',
  onTaskCreated,
}) => {
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('projects');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState(45);
  const [goalId, setGoalId] = useState('');
  const [goalsList, setGoalsList] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Clean and set title from bullet
      const cleanTitle = bulletText.replace(/^[-*•\d.)\s]+/, '').trim();
      setTitle(cleanTitle);

      // Default due date: if from tomorrow's plan, default to tomorrow, else today
      const baseDate = journalDate ? new Date(journalDate) : new Date();
      if (sourceSection === 'tomorrowPlan') {
        setDueDate(format(addDays(baseDate, 1), 'yyyy-MM-dd'));
      } else {
        setDueDate(format(baseDate, 'yyyy-MM-dd'));
      }

      // Default category smart guess
      const lower = cleanTitle.toLowerCase();
      if (lower.includes('leetcode') || lower.includes('dsa') || lower.includes('algorithm')) {
        setCategory('dsa');
      } else if (lower.includes('study') || lower.includes('college') || lower.includes('exam')) {
        setCategory('university');
      } else if (lower.includes('apply') || lower.includes('interview') || lower.includes('resume')) {
        setCategory('job_apps');
      } else {
        setCategory('projects');
      }

      // Fetch active goals
      api.get('/goals')
        .then((data) => setGoalsList(Array.isArray(data) ? data : []))
        .catch(() => {});
    }
  }, [isOpen, bulletText, sourceSection, journalDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Task title is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const taskPayload = {
        title: title.trim(),
        description: `Created from AI Daily Journal bullet (${sourceSection || 'Journal'})${
          journalDate ? ` on ${journalDate}` : ''
        }`,
        category,
        priority,
        scheduleType: 'one_time',
        startDate: dueDate || format(new Date(), 'yyyy-MM-dd'),
        dueDate: dueDate || format(new Date(), 'yyyy-MM-dd'),
        estimatedDuration: parseInt(estimatedDuration, 10) || 30,
        goalId: goalId || undefined,
      };

      const newTask = await api.post('/tasks', taskPayload);
      toast.success(`Task "${title.substring(0, 30)}..." created!`);
      if (onTaskCreated) onTaskCreated(newTask);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Task from Journal Bullet"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mt-0.5 shrink-0" />
          <p className="text-xs text-indigo-900 dark:text-indigo-200">
            ProgressPilot turns journal insights into actionable, scheduled tasks with full database tracking.
          </p>
        </div>

        {/* Task Title */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            Task Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="e.g. Solve 3 LeetCode Mediums on Graphs"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        {/* Category & Priority */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="high">🔥 High Priority</option>
              <option value="medium">⚡ Medium Priority</option>
              <option value="low">🌱 Low Priority</option>
            </select>
          </div>
        </div>

        {/* Due Date & Estimated Duration */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Scheduled Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Duration (Minutes)
            </label>
            <input
              type="number"
              min="5"
              max="480"
              step="5"
              value={estimatedDuration}
              onChange={(e) => setEstimatedDuration(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Link to Goal (Optional) */}
        {goalsList.length > 0 && (
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Link to Long-Term Goal (Optional)
            </label>
            <select
              value={goalId}
              onChange={(e) => setGoalId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="">-- No Linked Goal --</option>
              {goalsList.map((g) => (
                <option key={g._id} value={g._id}>
                  {g.title} ({g.progress || 0}%)
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !title.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all"
          >
            <CheckSquare className="w-4 h-4" />
            <span>{isSubmitting ? 'Creating...' : 'Create Task'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateTaskFromBulletModal;
