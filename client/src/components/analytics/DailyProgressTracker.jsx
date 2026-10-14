import React from 'react';
import {
  TrendingUp,
  Clock,
  Calendar,
  Flame,
  Trophy,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Zap,
} from 'lucide-react';
import { formatMinutes } from '../tasks/TaskCard';
import ProgressBar from '../common/ProgressBar';

export const DailyProgressTracker = ({
  dailyStats,
  weeklyStats,
  selectedDate,
  onSelectDate,
}) => {
  const actualMins = dailyStats?.actualFocusedMinutes || 0;
  const plannedMins = dailyStats?.plannedMinutes || 0;
  const yesterdayMins = dailyStats?.yesterdayFocusedMinutes || 0;
  const improvementMins = dailyStats?.dailyImprovementMinutes || 0;
  const improvementPct = dailyStats?.improvementPercentage || 0;
  const streak = dailyStats?.streak || 0;

  const dailyTrends = weeklyStats?.dailyTrends || [];
  const totalWeeklyMins = weeklyStats?.totalActualMinutes || 0;
  const mostProductive = weeklyStats?.mostProductiveDay;

  // Determine encouragement feedback
  let improvementBadgeText = 'First focus session today! 🎉';
  let badgeColor = 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300';

  if (actualMins > 0 && yesterdayMins > 0) {
    if (improvementMins > 0) {
      improvementBadgeText = `+${formatMinutes(improvementMins)} more focus than yesterday (+${improvementPct}%) 🚀`;
      badgeColor = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800';
    } else if (improvementMins < 0) {
      improvementBadgeText = `${formatMinutes(Math.abs(improvementMins))} less than yesterday (${formatMinutes(yesterdayMins)})`;
      badgeColor = 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800';
    } else {
      improvementBadgeText = 'Matching yesterday\'s pace! ⚡';
      badgeColor = 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800';
    }
  } else if (actualMins > 0 && yesterdayMins === 0) {
    improvementBadgeText = 'Great momentum started today! ✨';
    badgeColor = 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800';
  } else if (actualMins === 0) {
    improvementBadgeText = 'No focus time logged yet today. Click "Start Timer" on a task to log minutes!';
    badgeColor = 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
  }

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-subtle space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Daily Focus Time & Self-Improvement Breakdown
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Track exactly how much time you spend each day and measure your daily progress
              </p>
            </div>
          </div>
        </div>

        {/* Improvement status pill */}
        <div className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto ${badgeColor}`}>
          <Sparkles className="w-3.5 h-3.5" />
          <span>{improvementBadgeText}</span>
        </div>
      </div>

      {/* 4 Quick Performance Metric Chips */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1: Selected Day's Focus */}
        <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Selected Day Time
          </span>
          <p className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-1 font-mono">
            {formatMinutes(actualMins)}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            of {formatMinutes(plannedMins)} planned
          </p>
        </div>

        {/* Metric 2: Weekly Total Focus */}
        <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            This Week Total
          </span>
          <p className="text-xl font-black text-slate-800 dark:text-slate-200 mt-1 font-mono">
            {formatMinutes(totalWeeklyMins)}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            avg {formatMinutes(weeklyStats?.averageDailyMinutes || 0)} / day
          </p>
        </div>

        {/* Metric 3: Most Productive Day */}
        <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Best Day This Week
          </span>
          <p className="text-xl font-black text-amber-500 mt-1 font-mono">
            {mostProductive && mostProductive.actualMinutes > 0
              ? `${mostProductive.dayName} (${formatMinutes(mostProductive.actualMinutes)})`
              : '—'}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            peak focus day
          </p>
        </div>

        {/* Metric 4: Consecutive Streak */}
        <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Productivity Streak
          </span>
          <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1 font-mono flex items-center gap-1">
            <Flame className="w-5 h-5 text-amber-500 fill-amber-500" />
            <span>{streak} {streak === 1 ? 'day' : 'days'}</span>
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            active focus streak
          </p>
        </div>
      </div>

      {/* Day-by-Day Time Spent Breakdown Table / Bar List */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
          <span>Day-by-Day Focus Comparison</span>
          <span className="text-[11px] font-normal text-slate-400">Click any day to inspect</span>
        </div>

        <div className="space-y-2">
          {dailyTrends.map((trend) => {
            const isCurrentSelected = trend.date === selectedDate;
            const dayActual = trend.actualMinutes || 0;
            const dayPlanned = trend.plannedMinutes || 0;
            const pct = dayPlanned > 0 ? Math.min(100, Math.round((dayActual / dayPlanned) * 100)) : (dayActual > 0 ? 100 : 0);

            return (
              <div
                key={trend.date}
                onClick={() => onSelectDate && onSelectDate(trend.date)}
                className={`group p-3 rounded-xl border cursor-pointer transition-all ${
                  isCurrentSelected
                    ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 shadow-sm ring-1 ring-indigo-500/30'
                    : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-3 text-xs mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {trend.dayName}, {trend.date}
                    </span>
                    {isCurrentSelected && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-indigo-600 text-white">
                        Selected
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Time spent */}
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span className={`font-bold font-mono ${dayActual > 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
                        {formatMinutes(dayActual)} spent
                      </span>
                      <span className="text-slate-400">/ {formatMinutes(dayPlanned)} planned</span>
                    </div>

                    {/* Task completion badge */}
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
                      {trend.completed}/{trend.totalDue} tasks done
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      dayActual >= dayPlanned && dayPlanned > 0
                        ? 'bg-emerald-500'
                        : dayActual > 0
                        ? 'bg-indigo-600'
                        : 'bg-transparent'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Daily Improvement Coaching Note */}
      <div className="p-3.5 rounded-xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-transparent border border-purple-200/50 dark:border-purple-900/40 flex items-start gap-3">
        <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5 shrink-0" />
        <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
          <span className="font-bold text-slate-900 dark:text-slate-100">Daily Self-Improvement Tip: </span>
          {actualMins > 0 ? (
            <span>
              You have logged <strong>{formatMinutes(actualMins)}</strong> of focused effort today. Building a consistent daily habit of 1–2 hours compounds into over 500 hours of mastery per year.
            </span>
          ) : (
            <span>
              Start your first task today by clicking <strong>"Start Timer"</strong> right on the task card. Even a single 25-minute Pomodoro session will visibly register your daily progress!
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default DailyProgressTracker;
