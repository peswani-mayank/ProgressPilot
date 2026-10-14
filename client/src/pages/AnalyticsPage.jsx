import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  PieChart as PieIcon,
  HelpCircle,
  Calendar,
  Sparkles,
} from 'lucide-react';
import ProgressBar from '../components/common/ProgressBar';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import api from '../services/api';
import { format } from 'date-fns';
import { formatMinutes } from '../components/tasks/TaskCard';

const CATEGORY_COLORS = ['#6366f1', '#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'];

export const AnalyticsPage = () => {
  const [timeRange, setTimeRange] = useState('weekly'); // 'daily', 'weekly', 'monthly'
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const endpoint = timeRange === 'monthly' ? '/analytics/monthly' : '/analytics/weekly';
      const data = await api.get(`${endpoint}?date=${todayStr}`);
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Page Header with Time Range Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Productivity Analytics & Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Transparent, database-calculated metrics without vanity scores or manipulation.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 self-start sm:self-auto">
          {['weekly', 'monthly'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                timeRange === range
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* 4 Core Transparent Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Task Completion Rate */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-subtle">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Completion Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">
              {analytics?.weeklyCompletionRate ?? analytics?.monthlyCompletionRate ?? 0}%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {analytics?.totalCompletedTasks || 0} of {analytics?.totalDueTasks || 0} due tasks finished
          </p>
          <div className="mt-3">
            <ProgressBar
              progress={analytics?.weeklyCompletionRate ?? analytics?.monthlyCompletionRate ?? 0}
              color="bg-emerald-500"
              height="h-2"
            />
          </div>
        </div>

        {/* Metric 2: Total Focused Hours */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-subtle">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Actual Focus Time</span>
            <Clock className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">
              {analytics?.totalActualMinutes !== undefined
                ? formatMinutes(analytics.totalActualMinutes)
                : `${analytics?.totalActualHours ?? analytics?.totalFocusedHours ?? 0}h`}
            </span>
            {(analytics?.totalPlannedMinutes !== undefined || analytics?.totalPlannedHours !== undefined) && (
              <span className="text-xs text-slate-400 font-medium">
                / {analytics.totalPlannedMinutes !== undefined ? formatMinutes(analytics.totalPlannedMinutes) : `${analytics.totalPlannedHours}h`} planned
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Deep focused work logged via timer and manual entries
          </p>
          <div className="mt-3">
            <ProgressBar
              progress={
                analytics?.totalPlannedHours > 0
                  ? (analytics.totalActualHours / analytics.totalPlannedHours) * 100
                  : 100
              }
              color="bg-indigo-600"
              height="h-2"
            />
          </div>
        </div>

        {/* Metric 3: Most Productive Day */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-subtle">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Most Productive Day</span>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {analytics?.mostProductiveDay?.dayName || 'This week'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {analytics?.mostProductiveDay?.actualMinutes !== undefined
              ? formatMinutes(analytics.mostProductiveDay.actualMinutes)
              : `${analytics?.mostProductiveDay?.actualHours || 0}h`} of deep work on this day
          </p>
          <div className="mt-3">
            <ProgressBar progress={100} color="bg-blue-500" height="h-2" />
          </div>
        </div>

        {/* Metric 4: Repeatedly Postponed */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-subtle">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Postponed Tasks</span>
            <AlertTriangle className="w-4 h-4 text-purple-500" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">
              {analytics?.repeatedlyPostponedTasks?.length || 0}
            </span>
            <span className="text-xs text-slate-400 font-medium">repeatedly moved</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Tasks postponed more than once
          </p>
          <div className="mt-3">
            <ProgressBar progress={25} color="bg-purple-500" height="h-2" />
          </div>
        </div>
      </div>

      {/* Main Charts: Trends + Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Daily Trends / Weekly Buckets Chart (2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-subtle">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {timeRange === 'monthly' ? 'Last 4 Weeks Focus Distribution' : 'Daily Planned vs Actual Hours'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Compare your estimated work against actual logged deep work
              </p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {timeRange === 'monthly' ? (
                <BarChart data={analytics?.weeklyBuckets || []}>
                  <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} unit="h" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '12px',
                      border: 'none',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="focusHours" fill="#6366f1" radius={[8, 8, 0, 0]} />
                </BarChart>
              ) : (
                <AreaChart data={analytics?.dailyTrends || []}>
                  <defs>
                    <linearGradient id="actualHoursGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="dayName" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} unit="h" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '12px',
                      border: 'none',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Area type="monotone" dataKey="plannedHours" stroke="#94a3b8" strokeDasharray="4 4" fill="transparent" />
                  <Area type="monotone" dataKey="actualHours" stroke="#6366f1" strokeWidth={2.5} fill="url(#actualHoursGrad)" />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Category Breakdown Pie (1 col) */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-subtle flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Time Distribution by Category
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Where your focus minutes were invested
            </p>

            {(!analytics?.categoryBreakdown || analytics.categoryBreakdown.length === 0) ? (
              <p className="text-xs text-slate-400 py-10 text-center">
                No focus logs available for this period.
              </p>
            ) : (
              <div>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.categoryBreakdown}
                        dataKey="minutes"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={3}
                      >
                        {analytics.categoryBreakdown.map((entry, index) => (
                          <Cell key={`c-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2 mt-4 text-xs">
                  {analytics.categoryBreakdown.map((item, idx) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }}
                        />
                        <span className="capitalize text-slate-700 dark:text-slate-300">{item.name}</span>
                      </div>
                      <span className="font-bold font-mono text-slate-900 dark:text-white">
                        {item.hours}h ({item.minutes}m)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Blocker & Distraction Trends + Transparent Formulas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Blocker Trends */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-subtle">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            Distraction & Blocker Trends
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Reasons recorded when tasks were postponed or delayed
          </p>

          {(!analytics?.blockerTrends || analytics.blockerTrends.length === 0) ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              No distractions or blockers logged for this period!
            </p>
          ) : (
            <div className="space-y-3">
              {analytics.blockerTrends.map((b) => (
                <div key={b.reason} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="capitalize text-slate-700 dark:text-slate-300 font-medium">
                      {b.reason}
                    </span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      {b.count} times
                    </span>
                  </div>
                  <ProgressBar progress={b.count * 20} color="bg-indigo-500" height="h-2" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Transparent Formula Explanations */}
        <div className="p-6 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>How Your Metrics Are Calculated</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            We believe in honest productivity—never black-box scores.
          </p>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
              <p className="font-bold text-slate-900 dark:text-white">Task Completion Rate</p>
              <p className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400 mt-0.5">
                (Completed Due Occurrences / Total Due Occurrences) × 100
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Reflects tasks scheduled for the active time window that were marked completed.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
              <p className="font-bold text-slate-900 dark:text-white">Time Utilization Rate</p>
              <p className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400 mt-0.5">
                (Actual Focused Minutes / Planned Minutes) × 100
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Values above 100% indicate extra focused study beyond planned estimates.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
              <p className="font-bold text-slate-900 dark:text-white">High Priority Success</p>
              <p className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400 mt-0.5">
                (Completed High Priority / Total Due High Priority) × 100
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
