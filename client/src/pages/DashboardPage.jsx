import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate, Link } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  Flame,
  AlertTriangle,
  Play,
  Calendar,
  ArrowRight,
  TrendingUp,
  Target,
  Sparkles,
  PieChart as PieIcon,
  ChevronRight,
} from 'lucide-react';
import TaskCard, { formatMinutes } from '../components/tasks/TaskCard';
import ProgressBar from '../components/common/ProgressBar';
import EmptyState from '../components/common/EmptyState';
import { SkeletonStats, SkeletonCard } from '../components/common/SkeletonLoader';
import DailyProgressTracker from '../components/analytics/DailyProgressTracker';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { format, parseISO } from 'date-fns';

const CATEGORY_COLORS = {
  dsa: '#6366f1',
  fullstack: '#3b82f6',
  university: '#8b5cf6',
  core_cs: '#06b6d4',
  projects: '#10b981',
  job_apps: '#f59e0b',
  personal: '#ec4899',
  health_fitness: '#14b8a6',
};

export const DashboardPage = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const { selectedDate, onOpenAddTask, onEditTask, onPostponeTask, refreshGlobalStats, onDateChange } = useOutletContext();

  const [loading, setLoading] = useState(true);
  const [dailyStats, setDailyStats] = useState(null);
  const [weeklyStats, setWeeklyStats] = useState(null);
  const [occurrences, setOccurrences] = useState([]);
  const [goals, setGoals] = useState([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [dailyRes, weeklyRes, occurrencesRes, goalsRes, tasksRes] = await Promise.all([
        api.get(`/analytics/daily?date=${selectedDate}`),
        api.get(`/analytics/weekly?date=${selectedDate}`),
        api.get(`/occurrences?date=${selectedDate}`),
        api.get('/goals?status=in_progress'),
        api.get('/tasks?limit=5&sortBy=dueDate&order=asc'),
      ]);

      setDailyStats(dailyRes);
      setWeeklyStats(weeklyRes);
      setOccurrences(occurrencesRes);
      setGoals(goalsRes);
      setUpcomingDeadlines(
        (tasksRes.tasks || []).filter((t) => t.status !== 'done' && t.dueDate)
      );
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      addToast({
        title: 'Error loading dashboard',
        message: err.message,
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [selectedDate]);

  const handleToggleComplete = async (task, occurrence) => {
    try {
      const isCurrentlyDone = occurrence ? occurrence.status === 'done' : task.status === 'done';
      const newStatus = isCurrentlyDone ? 'todo' : 'done';

      if (occurrence?._id) {
        await api.patch(`/occurrences/${occurrence._id}`, { status: newStatus });
      } else {
        await api.patch(`/tasks/${task._id}/complete`, { status: newStatus, date: selectedDate });
      }

      addToast({
        title: newStatus === 'done' ? 'Task completed! 🎉' : 'Task marked as to-do',
        type: 'success',
        duration: 2500,
      });

      loadDashboardData();
      refreshGlobalStats();
    } catch (err) {
      addToast({ title: 'Update failed', message: err.message, type: 'error' });
    }
  };

  if (loading && !dailyStats) {
    return (
      <div className="space-y-6 animate-fade-in">
        <SkeletonStats />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <SkeletonCard count={4} />
          </div>
          <div className="space-y-4">
            <SkeletonCard count={2} />
          </div>
        </div>
      </div>
    );
  }

  const completionRate = dailyStats?.completionRate || 0;
  const timeUtilization = dailyStats?.timeUtilizationRate || 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 6 Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Card 1: Today's Completion Rate */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-subtle hover:shadow-card transition-all">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Completion Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {completionRate}%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {dailyStats?.completedTasks || 0} of {dailyStats?.totalDueTasks || 0} tasks done
          </p>
          <div className="mt-2.5">
            <ProgressBar progress={completionRate} color="bg-emerald-500" height="h-1.5" />
          </div>
        </div>

        {/* Card 2: Planned vs Actual Focus Time */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-subtle hover:shadow-card transition-all">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Focus Time</span>
            <Clock className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="flex items-baseline gap-1 flex-wrap">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {formatMinutes(dailyStats?.actualFocusedMinutes || 0)}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              / {formatMinutes(dailyStats?.plannedMinutes || 0)} planned
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
            <span>{dailyStats?.focusSessionsCount || 0} {dailyStats?.focusSessionsCount === 1 ? 'session' : 'sessions'} logged</span>
            {dailyStats?.dailyImprovementMinutes !== undefined && dailyStats?.dailyImprovementMinutes !== 0 && (
              <span className={`font-bold ${dailyStats.dailyImprovementMinutes > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                {dailyStats.dailyImprovementMinutes > 0 ? `+${formatMinutes(dailyStats.dailyImprovementMinutes)}` : `-${formatMinutes(Math.abs(dailyStats.dailyImprovementMinutes))}`}
              </span>
            )}
          </div>
          <div className="mt-2.5">
            <ProgressBar
              progress={Math.min(100, timeUtilization)}
              color={timeUtilization > 100 ? 'bg-indigo-600' : 'bg-indigo-500'}
              height="h-1.5"
            />
          </div>
        </div>

        {/* Card 3: Time Utilization */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-subtle hover:shadow-card transition-all">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Time Utilization</span>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {(dailyStats?.actualFocusedMinutes || 0) > 0 && timeUtilization === 0 ? '<1%' : `${timeUtilization}%`}
            </span>
            {timeUtilization > 100 && (
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                (Extra focus!)
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Actual focused / planned duration
          </p>
          <div className="mt-2.5">
            <ProgressBar progress={Math.min(100, timeUtilization)} color="bg-blue-500" height="h-1.5" />
          </div>
        </div>

        {/* Card 4: High Priority Tasks */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-subtle hover:shadow-card transition-all">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">High Priority</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {dailyStats?.highPriorityCompleted || 0}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              / {dailyStats?.highPriorityTotal || 0} done
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {dailyStats?.highPriorityCompletionRate || 100}% high priority success
          </p>
          <div className="mt-2.5">
            <ProgressBar
              progress={dailyStats?.highPriorityCompletionRate || 100}
              color="bg-rose-500"
              height="h-1.5"
            />
          </div>
        </div>

        {/* Card 5: Pending & Overdue Tasks */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-subtle hover:shadow-card transition-all">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Tasks</span>
            <Target className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {dailyStats?.pendingTasks || 0}
            </span>
            <span className="text-xs text-slate-400 font-medium">tasks to do</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {dailyStats?.postponedTasks || 0} postponed today
          </p>
          <div className="mt-2.5">
            <ProgressBar
              progress={
                dailyStats?.totalDueTasks > 0
                  ? (dailyStats.pendingTasks / dailyStats.totalDueTasks) * 100
                  : 0
              }
              color="bg-amber-500"
              height="h-1.5"
            />
          </div>
        </div>

        {/* Card 6: Streak Counter */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 border border-amber-200 dark:border-amber-900/60 shadow-subtle hover:shadow-card transition-all">
          <div className="flex items-center justify-between text-amber-800 dark:text-amber-300 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Productivity Streak</span>
            <Flame className="w-4 h-4 text-orange-500 fill-orange-500 animate-bounce" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-amber-900 dark:text-amber-100 font-mono">
              {dailyStats?.streak || 0}
            </span>
            <span className="text-xs text-amber-800 dark:text-amber-300 font-bold">
              {dailyStats?.streak === 1 ? 'day' : 'days'}
            </span>
          </div>
          <p className="text-[11px] text-amber-700/80 dark:text-amber-300/80 mt-1">
            Consecutive active focus days
          </p>
          <div className="mt-2.5">
            <div className="w-full bg-amber-200/50 dark:bg-amber-900/40 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-orange-500 h-1.5 rounded-full"
                style={{ width: `${Math.min(100, ((dailyStats?.streak || 1) / 30) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Column (Tasks & Goals) + Right Column (Charts & Timer) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Today's Schedule & Tasks */}
        <div className="lg:col-span-2 space-y-6">
          {/* Daily Focus Time & Self-Improvement Breakdown */}
          <DailyProgressTracker
            dailyStats={dailyStats}
            weeklyStats={weeklyStats}
            selectedDate={selectedDate}
            onSelectDate={onDateChange}
          />

          {/* Today's Tasks Section */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-subtle">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Schedule for {format(parseISO(selectedDate), 'MMMM d, yyyy')}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {occurrences.length} {occurrences.length === 1 ? 'task' : 'tasks'} scheduled for this date
                </p>
              </div>
              <button
                onClick={() => onOpenAddTask(selectedDate)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all"
              >
                + Add Task
              </button>
            </div>

            {occurrences.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="No tasks scheduled for this day"
                description="Keep your day structured and productive by planning your key focus blocks."
                actionLabel="Add a Task for Today"
                onAction={() => onOpenAddTask(selectedDate)}
              />
            ) : (
              <div className="space-y-3">
                {occurrences.map((occ) => (
                  <TaskCard
                    key={occ._id}
                    task={occ.taskId}
                    occurrence={occ}
                    onToggleComplete={handleToggleComplete}
                    onEdit={onEditTask}
                    onPostpone={onPostponeTask}
                    onDelete={async (t) => {
                      await api.delete(`/tasks/${t._id}`);
                      loadDashboardData();
                      refreshGlobalStats();
                    }}
                    onDuplicate={async (t) => {
                      await api.post(`/tasks/${t._id}/duplicate`);
                      loadDashboardData();
                      refreshGlobalStats();
                    }}
                    onSessionLogged={() => {
                      loadDashboardData();
                      refreshGlobalStats();
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Weekly Productivity Trend Chart */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-subtle">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Weekly Productivity Trends
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Planned vs Actual focused hours across the week
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                  <span className="text-slate-600 dark:text-slate-400">Actual Hours</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                  <span className="text-slate-600 dark:text-slate-400">Planned Hours</span>
                </div>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={weeklyStats?.dailyTrends || []}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="actualColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="dayName"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    unit="h"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '12px',
                      border: 'none',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="plannedHours"
                    stroke="#94a3b8"
                    strokeDasharray="4 4"
                    fill="transparent"
                  />
                  <Area
                    type="monotone"
                    dataKey="actualHours"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#actualColor)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Column (1 col): Quick Timer, Goals, Category Distribution, Upcoming Deadlines */}
        <div className="space-y-6">
          {/* Quick Focus Timer Launch Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white shadow-lg shadow-indigo-600/20 relative overflow-hidden">
            <div className="relative z-10">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-white/20 text-indigo-100">
                Deep Work
              </span>
              <h3 className="text-lg font-black mt-2">Ready for a Focus Session?</h3>
              <p className="text-xs text-indigo-100/90 mt-1 leading-relaxed">
                Start a 25-minute Pomodoro session now to build momentum on your tasks.
              </p>

              <button
                onClick={() => navigate('/timer')}
                className="mt-4 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-indigo-700 font-bold text-xs hover:bg-indigo-50 shadow-sm transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Launch Focus Timer</span>
              </button>
            </div>
            {/* Background design elements */}
            <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
          </div>

          {/* Long-Term Goals Progress */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-subtle">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Active Goals Progress</span>
              </h3>
              <Link
                to="/goals"
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
              >
                <span>View all</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {goals.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No active goals yet. Create one!</p>
            ) : (
              <div className="space-y-4">
                {goals.slice(0, 3).map((g) => {
                  const pct = g.targetValue > 0 ? Math.round((g.currentProgress / g.targetValue) * 100) : 0;
                  return (
                    <div key={g._id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                          {g.title}
                        </span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                          {g.currentProgress}/{g.targetValue} {g.targetUnit}
                        </span>
                      </div>
                      <ProgressBar progress={pct} color="bg-indigo-600" height="h-2" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Category-wise Time Distribution */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-subtle">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Today's Time by Category</span>
              </h3>
            </div>

            {(!dailyStats?.categoryBreakdown || dailyStats.categoryBreakdown.length === 0) ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                No focus time logged today yet. Complete a focus block to see distribution.
              </p>
            ) : (
              <div className="space-y-3">
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dailyStats.categoryBreakdown}
                        dataKey="minutes"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={3}
                      >
                        {dailyStats.categoryBreakdown.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={CATEGORY_COLORS[entry.category] || '#6366f1'}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {dailyStats.categoryBreakdown.map((item) => (
                    <div key={item.category} className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: CATEGORY_COLORS[item.category] || '#6366f1' }}
                      />
                      <span className="truncate text-slate-600 dark:text-slate-400 capitalize">
                        {item.category}:
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white font-mono">
                        {item.hours}h
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Upcoming Deadlines */}
          {upcomingDeadlines.length > 0 && (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-subtle">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                Upcoming Deadlines
              </h3>
              <div className="space-y-2">
                {upcomingDeadlines.map((t) => (
                  <div
                    key={t._id}
                    onClick={() => onEditTask(t)}
                    className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800 cursor-pointer transition-colors"
                  >
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                      {t.title}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                      <span className="capitalize">{t.category}</span>
                      <span className="font-medium text-rose-600 dark:text-rose-400">
                        Due {t.dueDate}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
