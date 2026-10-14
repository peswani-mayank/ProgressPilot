import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import {
  Plus,
  Trash2,
  Calendar,
  Clock,
  Target,
  Repeat,
  Tag,
  AlertCircle,
  CheckSquare,
  AlignLeft,
  Sparkles,
} from 'lucide-react';
import { format } from 'date-fns';
import api from '../../services/api';

const DEFAULT_CATEGORIES = [
  { id: 'dsa', name: 'DSA' },
  { id: 'fullstack', name: 'Full Stack Development' },
  { id: 'university', name: 'University Academics' },
  { id: 'core_cs', name: 'Core Computer Science' },
  { id: 'projects', name: 'Projects' },
  { id: 'job_apps', name: 'Job Applications' },
  { id: 'personal', name: 'Personal' },
  { id: 'health_fitness', name: 'Health and Fitness' },
];

const DAYS_OF_WEEK = [
  { label: 'Sun', value: 0 },
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
];

export const TaskModal = ({ isOpen, onClose, task = null, initialDate = null, onSaved }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('personal');
  const [priority, setPriority] = useState('medium');
  const [scheduleType, setScheduleType] = useState('one_time');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [deadlineTime, setDeadlineTime] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState(30);
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [goalId, setGoalId] = useState('');
  const [notes, setNotes] = useState('');

  // Recurrence rule
  const [recurrenceFrequency, setRecurrenceFrequency] = useState('daily');
  const [recurrenceInterval, setRecurrenceInterval] = useState(1);
  const [selectedDays, setSelectedDays] = useState([1, 2, 3, 4, 5]);

  const [goalsList, setGoalsList] = useState([]);
  const [categoriesList, setCategoriesList] = useState(DEFAULT_CATEGORIES);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    if (isOpen) {
      api.get('/goals').then(setGoalsList).catch(() => {});
      api.get('/user/profile').then((user) => {
        if (user?.preferences?.categories?.length) {
          setCategoriesList(user.preferences.categories);
        }
      }).catch(() => {});
    }
  }, [isOpen]);

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setCategory(task.category || 'personal');
      setPriority(task.priority || 'medium');
      setScheduleType(task.scheduleType || 'one_time');
      setStartDate(task.startDate || '');
      setStartTime(task.startTime || '');
      setDueDate(task.dueDate || '');
      setDeadlineTime(task.deadlineTime || '');
      setEstimatedDuration(task.estimatedDuration || 30);
      setSubtasks(task.subtasks || []);
      setGoalId(task.goalId?._id || task.goalId || '');
      setNotes(task.notes || '');

      if (task.recurrenceRule) {
        setRecurrenceFrequency(task.recurrenceRule.frequency || 'daily');
        setRecurrenceInterval(task.recurrenceRule.interval || 1);
        setSelectedDays(task.recurrenceRule.daysOfWeek || []);
      }
    } else {
      const defaultDate = initialDate || todayStr;
      setTitle('');
      setDescription('');
      setCategory('personal');
      setPriority('medium');
      setScheduleType('one_time');
      setStartDate(defaultDate);
      setStartTime('');
      setDueDate(defaultDate);
      setDeadlineTime('');
      setEstimatedDuration(30);
      setSubtasks([]);
      setNewSubtaskTitle('');
      setGoalId('');
      setNotes('');
      setRecurrenceFrequency('daily');
      setRecurrenceInterval(1);
      setSelectedDays([1, 2, 3, 4, 5]);
    }
    setError('');
  }, [task, initialDate, isOpen, todayStr]);

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    setSubtasks([
      ...subtasks,
      {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        title: newSubtaskTitle.trim(),
        completed: false,
      },
    ]);
    setNewSubtaskTitle('');
  };

  const handleRemoveSubtask = (id) => {
    setSubtasks(subtasks.filter((s) => s.id !== id));
  };

  const toggleDayOfWeek = (dayVal) => {
    if (selectedDays.includes(dayVal)) {
      setSelectedDays(selectedDays.filter((d) => d !== dayVal));
    } else {
      setSelectedDays([...selectedDays, dayVal].sort());
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const payload = {
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
      scheduleType,
      startDate: startDate || null,
      startTime: startTime || '',
      dueDate: dueDate || null,
      deadlineTime: deadlineTime || '',
      estimatedDuration: Number(estimatedDuration),
      subtasks,
      notes,
      goalId: goalId || null,
      recurrenceRule:
        scheduleType !== 'one_time'
          ? {
              frequency: recurrenceFrequency,
              interval: Number(recurrenceInterval),
              daysOfWeek: scheduleType === 'weekly' || recurrenceFrequency === 'weekly' ? selectedDays : [],
              startDate: startDate || todayStr,
            }
          : undefined,
    };

    try {
      if (task?._id) {
        await api.patch(`/tasks/${task._id}`, payload);
      } else {
        await api.post('/tasks', payload);
      }
      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={task ? 'Edit Task Details' : 'Create New Task'}
      subtitle="Define schedule, duration, priority, and link to your goals."
      icon={CheckSquare}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-600 dark:text-rose-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            Task Title *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Implement Binary Search Tree and AVL Rotations"
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/80 text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
          />
        </div>

        {/* Category & Priority Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/80 text-xs font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
            >
              {categoriesList.map((cat) => (
                <option key={cat.id || cat.name} value={cat.id || cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Priority
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'low', label: 'Low', color: 'border-slate-300 text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300' },
                { id: 'medium', label: 'Medium', color: 'border-amber-400 text-amber-700 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-300' },
                { id: 'high', label: 'High', color: 'border-rose-400 text-rose-700 bg-rose-50 dark:bg-rose-950/60 dark:text-rose-300' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPriority(p.id)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    priority === p.id
                      ? `${p.color} ring-2 ring-indigo-500/30 font-extrabold shadow-xs`
                      : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Schedule Type */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            Recurrence & Schedule
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'one_time', label: 'One-time' },
              { id: 'daily', label: 'Daily Recurrence' },
              { id: 'weekly', label: 'Weekly' },
              { id: 'custom_recurrence', label: 'Custom' },
            ].map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => setScheduleType(type.id)}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                  scheduleType === type.id
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Recurrence Days Selector */}
        {(scheduleType === 'weekly' || scheduleType === 'custom_recurrence') && (
          <div className="p-4 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 space-y-2">
            <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 uppercase tracking-wider">
              Repeat on Days of Week:
            </span>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map((day) => {
                const isSelected = selectedDays.includes(day.value);
                return (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDayOfWeek(day.value)}
                    className={`w-10 h-10 rounded-xl text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Start Date & Due Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Start Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/80 text-xs font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Due Date / Deadline
            </label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/80 text-xs font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Estimated Duration */}
        <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Planned Focus Time
            </span>
            <span className="font-extrabold text-indigo-600 dark:text-indigo-400 font-mono text-sm">
              {estimatedDuration} minutes ({(estimatedDuration / 60).toFixed(1)} hrs)
            </span>
          </div>
          <input
            type="range"
            min="10"
            max="240"
            step="5"
            value={estimatedDuration}
            onChange={(e) => setEstimatedDuration(Number(e.target.value))}
            className="w-full accent-indigo-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-medium">
            <span>15m</span>
            <span>30m</span>
            <span>45m</span>
            <span>1h</span>
            <span>1.5h</span>
            <span>2h</span>
            <span>3h</span>
            <span>4h</span>
          </div>
        </div>

        {/* Subtasks Builder */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            Checklist / Subtasks ({subtasks.length})
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSubtask();
                }
              }}
              placeholder="Add step (e.g. Read problem description, write test cases)..."
              className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/80 text-xs font-medium text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 outline-none"
            />
            <button
              type="button"
              onClick={handleAddSubtask}
              className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
            >
              Add Step
            </button>
          </div>

          {subtasks.length > 0 && (
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {subtasks.map((st) => (
                <div
                  key={st.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
                >
                  <span className="text-slate-800 dark:text-slate-200">{st.title}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSubtask(st.id)}
                    className="text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Goal Linkage */}
        {goalsList.length > 0 && (
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Link to Long-Term Goal
            </label>
            <select
              value={goalId}
              onChange={(e) => setGoalId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/80 text-xs font-semibold text-slate-900 dark:text-white focus:border-indigo-500 outline-none"
            >
              <option value="">No goal linked</option>
              {goalsList.map((g) => (
                <option key={g._id} value={g._id}>
                  {g.title} ({g.targetValue} {g.targetUnit})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            Notes & Implementation Details
          </label>
          <textarea
            rows="2"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Helpful links, edge cases, formulas, or reminders..."
            className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/80 text-xs font-medium text-slate-900 dark:text-white focus:border-indigo-500 outline-none"
          />
        </div>

        {/* Action Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/25 active:scale-95 transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : task ? 'Update Task' : 'Create Task 🚀'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default TaskModal;
