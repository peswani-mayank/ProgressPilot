import React, { useState, useEffect } from 'react';
import {
  Target,
  Plus,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Trash2,
  Edit2,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  Flag,
  Sparkles,
  Layers,
  Hash,
  FileText,
} from 'lucide-react';
import ProgressBar from '../components/common/ProgressBar';
import Modal from '../components/common/Modal';
import EmptyState from '../components/common/EmptyState';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { format } from 'date-fns';

const CATEGORY_STYLES = {
  dsa: { bg: 'bg-indigo-50 dark:bg-indigo-950/60', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-200 dark:border-indigo-900', bar: 'bg-indigo-600' },
  fullstack: { bg: 'bg-blue-50 dark:bg-blue-950/60', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-900', bar: 'bg-blue-600' },
  university: { bg: 'bg-purple-50 dark:bg-purple-950/60', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-900', bar: 'bg-purple-600' },
  projects: { bg: 'bg-emerald-50 dark:bg-emerald-950/60', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-900', bar: 'bg-emerald-600' },
  job_apps: { bg: 'bg-amber-50 dark:bg-amber-950/60', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-900', bar: 'bg-amber-600' },
  personal: { bg: 'bg-pink-50 dark:bg-pink-950/60', text: 'text-pink-600 dark:text-pink-400', border: 'border-pink-200 dark:border-pink-900', bar: 'bg-pink-600' },
};

export const GoalsPage = () => {
  const { addToast } = useToast();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [deleteGoalId, setDeleteGoalId] = useState(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('projects');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [targetDeadline, setTargetDeadline] = useState('');
  const [targetValue, setTargetValue] = useState(10);
  const [targetUnit, setTargetUnit] = useState('Problems');
  const [currentProgress, setCurrentProgress] = useState(0);
  const [milestones, setMilestones] = useState([]);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');

  const fetchGoals = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await api.get('/goals');
      setGoals(data || []);
    } catch (err) {
      addToast({ title: 'Error loading goals', message: err.message, type: 'error' });
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  useEffect(() => {
    const handleTaskUpdated = () => {
      fetchGoals(true);
    };
    window.addEventListener('task-updated', handleTaskUpdated);
    return () => window.removeEventListener('task-updated', handleTaskUpdated);
  }, []);

  const openCreateModal = () => {
    setEditingGoal(null);
    setTitle('');
    setDescription('');
    setCategory('projects');
    setStartDate(format(new Date(), 'yyyy-MM-dd'));
    setTargetDeadline('');
    setTargetValue(10);
    setTargetUnit('Problems');
    setCurrentProgress(0);
    setMilestones([]);
    setIsModalOpen(true);
  };

  const openEditModal = (goal) => {
    setEditingGoal(goal);
    setTitle(goal.title);
    setDescription(goal.description || '');
    setCategory(goal.category || 'projects');
    setStartDate(goal.startDate);
    setTargetDeadline(goal.targetDeadline);
    setTargetValue(goal.targetValue);
    setTargetUnit(goal.targetUnit);
    setCurrentProgress(goal.currentProgress || 0);
    setMilestones(goal.milestones || []);
    setIsModalOpen(true);
  };

  const handleAddMilestone = () => {
    if (!newMilestoneTitle.trim()) return;
    setMilestones([
      ...milestones,
      {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        title: newMilestoneTitle.trim(),
        targetDeadline: targetDeadline || null,
        targetValue: 0,
        currentProgress: 0,
        status: 'pending',
      },
    ]);
    setNewMilestoneTitle('');
  };

  const handleToggleMilestone = async (goal, milestoneId) => {
    const updatedMilestones = goal.milestones.map((m) => {
      if (m.id === milestoneId) {
        const nextStatus = m.status === 'completed' ? 'pending' : 'completed';
        return {
          ...m,
          status: nextStatus,
          completedAt: nextStatus === 'completed' ? new Date().toISOString() : null,
        };
      }
      return m;
    });

    try {
      await api.patch(`/goals/${goal._id}`, { milestones: updatedMilestones });
      addToast({ title: 'Milestone updated', type: 'success' });
      fetchGoals();
    } catch (err) {
      addToast({ title: 'Update failed', message: err.message, type: 'error' });
    }
  };

  const handleIncrementProgress = async (goal, amount = 1) => {
    const newProgress = Math.max(0, (goal.currentProgress || 0) + amount);
    try {
      await api.patch(`/goals/${goal._id}`, { currentProgress: newProgress });
      fetchGoals();
    } catch (err) {
      addToast({ title: 'Progress update failed', message: err.message, type: 'error' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !targetDeadline || !targetValue || !targetUnit) {
      addToast({ title: 'Missing required fields', message: 'Please provide Title, Target Value, Unit, and Deadline.', type: 'warning' });
      return;
    }

    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        category,
        startDate,
        targetDeadline,
        targetValue: Number(targetValue),
        targetUnit: targetUnit.trim(),
        currentProgress: Number(currentProgress),
        milestones,
      };

      if (editingGoal) {
        await api.patch(`/goals/${editingGoal._id}`, payload);
        addToast({ title: 'Goal updated successfully', type: 'success' });
      } else {
        await api.post('/goals', payload);
        addToast({ title: 'Goal created! 🎯', message: `Tracking ${payload.title}`, type: 'success' });
      }

      setIsModalOpen(false);
      fetchGoals();
    } catch (err) {
      addToast({ title: 'Save failed', message: err.message, type: 'error' });
    }
  };

  const handleDeleteGoal = async () => {
    if (!deleteGoalId) return;
    try {
      await api.delete(`/goals/${deleteGoalId}`);
      addToast({ title: 'Goal deleted', type: 'info' });
      setDeleteGoalId(null);
      fetchGoals();
    } catch (err) {
      addToast({ title: 'Delete failed', message: err.message, type: 'error' });
    }
  };

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white shadow-xl shadow-indigo-950/20 border border-indigo-800/40 relative overflow-hidden">
        <div className="relative z-10 space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Progress Hierarchy</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Long-Term Goals & Milestones
          </h1>
          <p className="text-xs sm:text-sm text-indigo-200/80 max-w-xl font-medium">
            Goal ➔ Monthly Milestone ➔ Weekly Target ➔ Daily Focused Tasks. Turn ambitious dreams into predictable daily habits.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="relative z-10 inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white shadow-lg shadow-indigo-500/30 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>New Long-Term Goal</span>
        </button>

        {/* Ambient background blur */}
        <div className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
      </div>

      {/* Goal Cards Grid */}
      {goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No goals set yet"
          description="Define your big ambitions—like mastering DSA, shipping a full-stack SaaS, or acing semester exams."
          actionLabel="Create Your First Goal"
          onAction={openCreateModal}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {goals.map((g) => {
            const pct = g.targetValue > 0 ? Math.round((g.currentProgress / g.targetValue) * 100) : 0;
            const isCompleted = g.status === 'completed' || pct >= 100;
            const style = CATEGORY_STYLES[g.category] || CATEGORY_STYLES.projects;

            return (
              <div
                key={g._id}
                className="group relative p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-card hover:shadow-card-hover hover:border-indigo-300 dark:hover:border-indigo-800 transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  {/* Category Pill & Action Buttons */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider border ${style.bg} ${style.text} ${style.border}`}>
                      <Target className="w-3.5 h-3.5" />
                      <span>{g.category?.replace('_', ' ')}</span>
                    </span>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditModal(g)}
                        title="Edit Goal"
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteGoalId(g._id)}
                        title="Delete Goal"
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                    {g.title}
                  </h3>

                  {g.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                      {g.description}
                    </p>
                  )}

                  {/* Progress Metric Card */}
                  <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 my-4 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-600 dark:text-slate-400">Total Progress</span>
                      <span className="font-extrabold text-indigo-600 dark:text-indigo-400 font-mono text-sm">
                        {g.currentProgress} <span className="text-slate-400 font-normal">/ {g.targetValue}</span> {g.targetUnit} ({pct}%)
                      </span>
                    </div>
                    <ProgressBar
                      progress={pct}
                      color={isCompleted ? 'bg-emerald-500' : 'bg-gradient-to-r from-indigo-600 to-indigo-500'}
                      height="h-3"
                    />
                  </div>

                  {/* Quick Increment Stepper */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs font-semibold text-slate-400">Quick Log:</span>
                    <button
                      onClick={() => handleIncrementProgress(g, 1)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 text-slate-700 dark:text-slate-200 hover:text-indigo-600 transition-all shadow-xs"
                    >
                      +1 {g.targetUnit}
                    </button>
                    <button
                      onClick={() => handleIncrementProgress(g, 5)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 text-slate-700 dark:text-slate-200 hover:text-indigo-600 transition-all shadow-xs"
                    >
                      +5 {g.targetUnit}
                    </button>
                    {g.currentProgress > 0 && (
                      <button
                        onClick={() => handleIncrementProgress(g, -1)}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                      >
                        -1
                      </button>
                    )}
                  </div>

                  {/* Milestones Checklist */}
                  {g.milestones && g.milestones.length > 0 && (
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                        <span className="flex items-center gap-1.5">
                          <Flag className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Milestones</span>
                        </span>
                        <span className="text-slate-400 font-mono text-[11px]">
                          {g.milestones.filter((m) => m.status === 'completed').length} / {g.milestones.length} done
                        </span>
                      </div>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {g.milestones.map((m) => (
                          <div
                            key={m.id}
                            onClick={() => handleToggleMilestone(g, m.id)}
                            className="flex items-center gap-2.5 text-xs p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                          >
                            {m.status === 'completed' ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                            ) : (
                              <Circle className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
                            )}
                            <span
                              className={
                                m.status === 'completed'
                                  ? 'line-through text-slate-400 dark:text-slate-500'
                                  : 'font-medium text-slate-800 dark:text-slate-200'
                              }
                            >
                              {m.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Metadata */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 mt-4 font-medium">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Target: {g.targetDeadline}</span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md">
                    {g.linkedTasksCount || 0} linked tasks
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Goal Modal (Upgraded Design) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingGoal ? 'Edit Long-Term Goal' : 'Create New Long-Term Goal'}
        subtitle="Define big milestones, target metrics, and align your daily focused tasks."
        icon={Target}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Goal Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Goal Title *
            </label>
            <div className="relative">
              <Target className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Master 150 LeetCode Problems for Campus Placements"
                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/80 text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Description / Why This Matters
            </label>
            <textarea
              rows="2"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What makes this goal critical? What will achieving it unlock for you?"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/80 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
            />
          </div>

          {/* Category & Target Deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/80 text-xs font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
              >
                <option value="dsa">DSA (Data Structures & Algorithms)</option>
                <option value="fullstack">Full Stack Development</option>
                <option value="university">University Academics</option>
                <option value="projects">Projects & SaaS</option>
                <option value="job_apps">Job Applications & Networking</option>
                <option value="personal">Personal Growth</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Target Deadline *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="date"
                  required
                  value={targetDeadline}
                  onChange={(e) => setTargetDeadline(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/80 text-xs font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
                />
              </div>
            </div>
          </div>

          {/* Target Quantity & Unit */}
          <div className="p-4 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 space-y-3">
            <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 uppercase tracking-wider flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Measurable Target</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Target Number *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={targetValue}
                  onChange={(e) => setTargetValue(Number(e.target.value))}
                  placeholder="e.g. 150"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Metric Unit (Problems, Hours, Modules) *
                </label>
                <input
                  type="text"
                  required
                  value={targetUnit}
                  onChange={(e) => setTargetUnit(e.target.value)}
                  placeholder="Problems, Hours, Modules..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Key Milestones Builder */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Flag className="w-3.5 h-3.5 text-indigo-500" />
                <span>Monthly Milestones ({milestones.length})</span>
              </label>
            </div>

            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newMilestoneTitle}
                onChange={(e) => setNewMilestoneTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddMilestone();
                  }
                }}
                placeholder="Add milestone (e.g. Complete Trees, DP & Graphs)..."
                className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/80 text-xs font-medium text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 outline-none"
              />
              <button
                type="button"
                onClick={handleAddMilestone}
                className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
              >
                + Add Milestone
              </button>
            </div>

            {milestones.length > 0 && (
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {milestones.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs font-medium"
                  >
                    <span className="text-slate-800 dark:text-slate-200">{m.title}</span>
                    <button
                      type="button"
                      onClick={() => setMilestones(milestones.filter((x) => x.id !== m.id))}
                      className="text-slate-400 hover:text-rose-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sticky Action Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/25 active:scale-95 transition-all"
            >
              {editingGoal ? 'Update Goal' : 'Save & Track Goal 🎯'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteGoalId)}
        onClose={() => setDeleteGoalId(null)}
        onConfirm={handleDeleteGoal}
        title="Delete Goal?"
        message="Are you sure you want to delete this goal? Linked tasks will not be deleted but will become unlinked."
        confirmText="Delete Goal"
        isDestructive={true}
      />
    </div>
  );
};

export default GoalsPage;
