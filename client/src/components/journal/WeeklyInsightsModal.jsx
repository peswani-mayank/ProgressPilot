import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import {
  Sparkles,
  BookOpen,
  AlertTriangle,
  Trophy,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import api from '../../services/api';
import { format, subDays, addDays } from 'date-fns';

export const WeeklyInsightsModal = ({ isOpen, onClose }) => {
  const [insights, setInsights] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [startDate, setStartDate] = useState(() => format(subDays(new Date(), 6), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));

  const fetchInsights = async (start, end) => {
    setIsLoading(true);
    try {
      const data = await api.get(`/journals/insights/weekly?startDate=${start}&endDate=${end}`);
      setInsights(data);
    } catch (err) {
      console.error('Failed to fetch weekly journal insights:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchInsights(startDate, endDate);
    }
  }, [isOpen, startDate, endDate]);

  const handleShiftWeek = (direction) => {
    const shiftDays = direction === 'prev' ? -7 : 7;
    const newStart = format(addDays(new Date(startDate), shiftDays), 'yyyy-MM-dd');
    const newEnd = format(addDays(new Date(endDate), shiftDays), 'yyyy-MM-dd');
    setStartDate(newStart);
    setEndDate(newEnd);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Weekly Journal & Smart Notes Insights"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5">
        {/* Date Window Navigator */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => handleShiftWeek('prev')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Prev 7 Days</span>
          </button>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
            <Calendar className="w-4 h-4 text-indigo-500" />
            <span>
              {format(new Date(startDate), 'MMM d')} – {format(new Date(endDate), 'MMM d, yyyy')}
            </span>
          </div>

          <button
            type="button"
            onClick={() => handleShiftWeek('next')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <span>Next 7 Days</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-2 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <p className="text-xs">Synthesizing weekly notes and recurring themes...</p>
          </div>
        )}

        {!isLoading && insights && (
          <>
            {/* AI Synthesized Reflection Banner */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-transparent border border-indigo-200/60 dark:border-indigo-900/40 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-200">
                    Weekly AI Reflection
                  </span>
                </div>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                  AI SYNTHESIZED
                </span>
              </div>
              <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-normal">
                {insights.summaryReflection}
              </p>
            </div>

            {/* Quick Stat Pill */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Consistency
                </span>
                <p className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
                  {insights.totalDaysJournaled}{' '}
                  <span className="text-xs font-semibold text-slate-400">/ 7 days written</span>
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Key Wins Logged
                </span>
                <p className="text-2xl font-extrabold text-amber-500 mt-1">
                  {insights.keyAchievements?.length || 0}{' '}
                  <span className="text-xs font-semibold text-slate-400">milestones</span>
                </p>
              </div>
            </div>

            {/* Top Learning Topics */}
            {insights.frequentlyMentionedTopics && insights.frequentlyMentionedTopics.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-500" />
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Frequently Practiced Skills & Topics
                  </h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {insights.frequentlyMentionedTopics.map((topic, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/50 text-indigo-700 dark:text-indigo-300"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Recurring Blockers */}
            {insights.recurringBlockers && insights.recurringBlockers.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Identified Blockers & Friction Points
                  </h4>
                </div>
                <ul className="space-y-1.5">
                  {insights.recurringBlockers.map((blocker, i) => (
                    <li
                      key={i}
                      className="p-2.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40 text-xs text-rose-900 dark:text-rose-200 flex items-start gap-2"
                    >
                      <span className="text-rose-500 mt-0.5">•</span>
                      <span>{blocker}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Key Achievements */}
            {insights.keyAchievements && insights.keyAchievements.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Highlights & Lessons Learned
                  </h4>
                </div>
                <ul className="space-y-1.5">
                  {insights.keyAchievements.map((win, i) => (
                    <li
                      key={i}
                      className="p-2.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2"
                    >
                      <span className="text-amber-500 mt-0.5">🏆</span>
                      <span>{win}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Close Insights
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default WeeklyInsightsModal;
