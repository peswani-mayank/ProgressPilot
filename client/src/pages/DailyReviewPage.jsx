import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  BookOpenCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Sparkles,
  Calendar,
  History,
  Save,
} from 'lucide-react';
import { format, parseISO, subDays } from 'date-fns';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

export const DailyReviewPage = () => {
  const { addToast } = useToast();
  const { selectedDate, onDateChange } = useOutletContext();

  const [review, setReview] = useState(null);
  const [liveStats, setLiveStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form fields
  const [wentWell, setWentWell] = useState('');
  const [notWell, setNotWell] = useState('');
  const [distractions, setDistractions] = useState('');
  const [learnedToday, setLearnedToday] = useState('');
  const [improveTomorrow, setImproveTomorrow] = useState('');
  const [topPriorities, setTopPriorities] = useState(['', '', '']);

  const activeDate = selectedDate || format(new Date(), 'yyyy-MM-dd');

  const loadReviewData = async () => {
    try {
      setLoading(true);
      const [reviewRes, historyRes] = await Promise.all([
        api.get(`/reviews?date=${activeDate}`),
        api.get('/reviews/history?limit=14'),
      ]);

      const rev = reviewRes.review;
      setReview(rev);
      setLiveStats(reviewRes.liveStats);
      setHistory(historyRes || []);

      if (rev) {
        setWentWell(rev.wentWell || '');
        setNotWell(rev.notWell || '');
        setDistractions(rev.distractions || '');
        setLearnedToday(rev.learnedToday || '');
        setImproveTomorrow(rev.improveTomorrow || '');
        setTopPriorities(
          Array.isArray(rev.topPrioritiesTomorrow) && rev.topPrioritiesTomorrow.length === 3
            ? rev.topPrioritiesTomorrow
            : ['', '', '']
        );
      } else {
        setWentWell('');
        setNotWell('');
        setDistractions('');
        setLearnedToday('');
        setImproveTomorrow('');
        setTopPriorities(['', '', '']);
      }
    } catch (err) {
      console.error('Failed to load review:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviewData();
  }, [activeDate]);

  const handlePriorityChange = (index, value) => {
    const updated = [...topPriorities];
    updated[index] = value;
    setTopPriorities(updated);
  };

  const handleSaveReview = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        date: activeDate,
        wentWell,
        notWell,
        distractions,
        learnedToday,
        improveTomorrow,
        topPrioritiesTomorrow: topPriorities,
      };

      const saved = await api.post('/reviews', payload);
      setReview(saved);
      addToast({
        title: 'Daily Review Saved! 🌟',
        message: 'Your reflections and top priorities for tomorrow have been stored.',
        type: 'success',
      });
      loadReviewData();
    } catch (err) {
      addToast({ title: 'Save failed', message: err.message, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpenCheck className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>Daily Review & Evening Reflection</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Reflecting on {format(parseISO(activeDate), 'EEEE, MMMM d, yyyy')}.
          </p>
        </div>

        {/* Date Selector input */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={activeDate}
            onChange={(e) => onDateChange && onDateChange(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold dark:text-white"
          />
        </div>
      </div>

      {/* Stats Snapshot for this day */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-subtle">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Completed</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">
            {liveStats?.completedTasks || 0} / {liveStats?.totalDueTasks || 0}
          </p>
          <p className="text-[11px] text-slate-400">{liveStats?.completionRate || 0}% completed</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-subtle">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Focused Time</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">
            {liveStats?.actualFocusedHours || 0}h
          </p>
          <p className="text-[11px] text-slate-400">{liveStats?.focusSessionsCount || 0} focus sessions</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-subtle">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">High Priority</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">
            {liveStats?.highPriorityCompleted || 0} / {liveStats?.highPriorityTotal || 0}
          </p>
          <p className="text-[11px] text-slate-400">{liveStats?.highPriorityCompletionRate || 100}% finished</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-subtle">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Postponed</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">
            {liveStats?.postponedTasks || 0}
          </p>
          <p className="text-[11px] text-slate-400">Rescheduled for later</p>
        </div>
      </div>

      {/* Main Review Form */}
      <form onSubmit={handleSaveReview} className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-card space-y-6">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
            End of Day Review Form
          </h2>
          <p className="text-xs text-slate-400">
            Take 3 minutes to evaluate what went well, identify blockers, and set tomorrow up for success.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Question 1: What went well? */}
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
              1. What went well today? ✨
            </label>
            <textarea
              rows="3"
              value={wentWell}
              onChange={(e) => setWentWell(e.target.value)}
              placeholder="e.g. Cleared 3 hard dynamic programming questions and stayed focused without social media..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Question 2: What did not go well? */}
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
              2. What did not go well? ⚠️
            </label>
            <textarea
              rows="3"
              value={notWell}
              onChange={(e) => setNotWell(e.target.value)}
              placeholder="e.g. Underestimated the time required for system design notes; started 1 hour late..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Question 3: What caused distractions? */}
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
              3. What caused distractions or delays? 📱
            </label>
            <textarea
              rows="3"
              value={distractions}
              onChange={(e) => setDistractions(e.target.value)}
              placeholder="e.g. Phone notifications during afternoon study block..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Question 4: What did I learn today? */}
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
              4. What key insight or concept did I learn today? 💡
            </label>
            <textarea
              rows="3"
              value={learnedToday}
              onChange={(e) => setLearnedToday(e.target.value)}
              placeholder="e.g. Understood MongoDB index compound rules and how explain() queries work..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Question 5: What should I improve tomorrow? */}
        <div>
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
            5. What should I improve or adjust tomorrow? 📈
          </label>
          <textarea
            rows="2"
            value={improveTomorrow}
            onChange={(e) => setImproveTomorrow(e.target.value)}
            placeholder="e.g. Put phone in another room before starting 9:00 AM focus session..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Question 6: Top 3 Priorities for Tomorrow */}
        <div>
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
            6. Top Three Priorities for Tomorrow 🎯
          </label>
          <div className="space-y-2">
            {topPriorities.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <input
                  type="text"
                  value={item}
                  onChange={(e) => handlePriorityChange(idx, e.target.value)}
                  placeholder={`Priority #${idx + 1}...`}
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/25 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Review...' : 'Save Daily Review'}</span>
          </button>
        </div>
      </form>

      {/* Historical Review Browser */}
      {history.length > 0 && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-subtle">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Past Daily Reviews</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {history.map((h) => (
              <div
                key={h._id}
                onClick={() => onDateChange && onDateChange(h.date)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  h.date === activeDate
                    ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span className="text-slate-800 dark:text-slate-200">{h.date}</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                    {h.statsSnapshot?.completionRate || 0}%
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2">
                  {h.wentWell || h.learnedToday || 'Review logged.'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyReviewPage;
