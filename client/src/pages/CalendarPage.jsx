import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import {
  format,
  parseISO,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
} from 'date-fns';
import api from '../services/api';

const PRIORITY_COLOR_MAP = {
  high: 'border-l-4 border-l-rose-500 bg-rose-50/60 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200',
  medium: 'border-l-4 border-l-amber-500 bg-amber-50/60 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200',
  low: 'border-l-4 border-l-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-200',
};

export const CalendarPage = () => {
  const { onOpenAddTask, onEditTask, taskUpdateTrigger } = useOutletContext();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'month', 'week', 'day'
  const [occurrences, setOccurrences] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  // Compute date range based on view
  let rangeStart;
  let rangeEnd;

  if (viewMode === 'month') {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    rangeStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    rangeEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  } else if (viewMode === 'week') {
    rangeStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    rangeEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  } else {
    rangeStart = currentDate;
    rangeEnd = currentDate;
  }

  const startDateStr = format(rangeStart, 'yyyy-MM-dd');
  const endDateStr = format(rangeEnd, 'yyyy-MM-dd');

  const fetchCalendarOccurrences = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await api.get(`/occurrences?startDate=${startDateStr}&endDate=${endDateStr}`);
      setOccurrences(data || []);
    } catch (err) {
      console.error('Failed to fetch calendar occurrences:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarOccurrences();
  }, [startDateStr, endDateStr, taskUpdateTrigger]);

  useEffect(() => {
    const handleTaskUpdated = () => {
      fetchCalendarOccurrences(true);
    };
    window.addEventListener('task-updated', handleTaskUpdated);
    return () => window.removeEventListener('task-updated', handleTaskUpdated);
  }, [startDateStr, endDateStr]);

  const handlePrev = () => {
    if (viewMode === 'month') setCurrentDate(subMonths(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subDays(currentDate, 1));
  };

  const handleNext = () => {
    if (viewMode === 'month') setCurrentDate(addMonths(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addDays(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Filter occurrences
  const filteredOccurrences = occurrences.filter((occ) => {
    if (categoryFilter && occ.taskId?.category !== categoryFilter) return false;
    if (priorityFilter && occ.taskId?.priority !== priorityFilter) return false;
    return true;
  });

  const getDayOccurrences = (dayStr) => {
    return filteredOccurrences.filter((o) => o.scheduledDate === dayStr);
  };

  const daysInView = eachDayOfInterval({ start: rangeStart, end: rangeEnd });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Calendar Control Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-subtle">
        {/* Navigation buttons */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
            >
              Today
            </button>
            <button
              onClick={handleNext}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            {format(currentDate, viewMode === 'month' ? 'MMMM yyyy' : 'MMMM d, yyyy')}
          </h2>
        </div>

        {/* View mode toggle (Month, Week, Day) */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
            {['month', 'week', 'day'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                  viewMode === mode
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <button
            onClick={() => onOpenAddTask(format(currentDate, 'yyyy-MM-dd'))}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule</span>
          </button>
        </div>
      </div>

      {/* MONTH VIEW GRID */}
      {viewMode === 'month' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-subtle">
          {/* Weekday headers (Mon-Sun) */}
          <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-center py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div key={day}>{day}</div>
            ))}
          </div>

          {/* Month Days Grid */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 dark:divide-slate-800">
            {daysInView.map((day) => {
              const dayStr = format(day, 'yyyy-MM-dd');
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isCurrentDay = dayStr === todayStr;
              const dayTasks = getDayOccurrences(dayStr);

              return (
                <div
                  key={dayStr}
                  onClick={() => onOpenAddTask(dayStr)}
                  className={`min-h-[110px] p-2 transition-colors cursor-pointer group hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 ${
                    !isCurrentMonth ? 'bg-slate-50/40 dark:bg-slate-900/40 text-slate-300 dark:text-slate-600' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        isCurrentDay
                          ? 'bg-indigo-600 text-white'
                          : isCurrentMonth
                          ? 'text-slate-700 dark:text-slate-300'
                          : 'text-slate-400'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenAddTask(dayStr);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-indigo-600 p-0.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Task Pills */}
                  <div className="space-y-1">
                    {dayTasks.slice(0, 3).map((occ) => {
                      const t = occ.taskId;
                      if (!t) return null;
                      const isDone = occ.status === 'done';
                      const pClass = PRIORITY_COLOR_MAP[t.priority] || PRIORITY_COLOR_MAP.medium;

                      return (
                        <div
                          key={occ._id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditTask(t);
                          }}
                          className={`px-2 py-1 rounded-md text-[11px] font-medium truncate cursor-pointer transition-transform hover:scale-[1.02] ${pClass} ${
                            isDone ? 'line-through opacity-60' : ''
                          }`}
                        >
                          {t.title}
                        </div>
                      );
                    })}

                    {dayTasks.length > 3 && (
                      <div className="text-[10px] text-slate-500 font-bold px-1">
                        +{dayTasks.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* WEEK VIEW */}
      {viewMode === 'week' && (
        <div className="grid grid-cols-1 sm:grid-cols-7 gap-3">
          {daysInView.map((day) => {
            const dayStr = format(day, 'yyyy-MM-dd');
            const isCurrentDay = dayStr === todayStr;
            const dayTasks = getDayOccurrences(dayStr);

            return (
              <div
                key={dayStr}
                className={`p-3 rounded-2xl border min-h-[350px] flex flex-col ${
                  isCurrentDay
                    ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase">
                      {format(day, 'EEE')}
                    </span>
                    <p className={`text-base font-extrabold ${isCurrentDay ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-200'}`}>
                      {format(day, 'd')}
                    </p>
                  </div>
                  <button
                    onClick={() => onOpenAddTask(dayStr)}
                    className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 space-y-2 overflow-y-auto pr-0.5">
                  {dayTasks.map((occ) => (
                    <div
                      key={occ._id}
                      onClick={() => onEditTask(occ.taskId)}
                      className={`p-2 rounded-xl text-xs font-medium border cursor-pointer hover:shadow-xs transition-all ${
                        PRIORITY_COLOR_MAP[occ.taskId?.priority] || PRIORITY_COLOR_MAP.medium
                      } ${occ.status === 'done' ? 'line-through opacity-60' : ''}`}
                    >
                      <p className="font-semibold line-clamp-1">{occ.taskId?.title}</p>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                        <span>{occ.taskId?.estimatedDuration}m</span>
                        <span className="capitalize">{occ.taskId?.category}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DAY VIEW */}
      {viewMode === 'day' && (
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-subtle space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Detailed Timeline for {format(currentDate, 'EEEE, MMMM d, yyyy')}
              </h3>
              <p className="text-xs text-slate-500">
                {getDayOccurrences(startDateStr).length} tasks scheduled
              </p>
            </div>
            <button
              onClick={() => onOpenAddTask(startDateStr)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Plus className="w-4 h-4" />
              <span>Add Task</span>
            </button>
          </div>

          <div className="space-y-3">
            {getDayOccurrences(startDateStr).map((occ) => (
              <div
                key={occ._id}
                onClick={() => onEditTask(occ.taskId)}
                className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer hover:shadow-card transition-all ${
                  PRIORITY_COLOR_MAP[occ.taskId?.priority] || PRIORITY_COLOR_MAP.medium
                }`}
              >
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {occ.taskId?.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">{occ.taskId?.description}</p>
                </div>
                <div className="text-right text-xs">
                  <span className="font-bold">{occ.taskId?.estimatedDuration || 30}m planned</span>
                  {occ.actualDuration > 0 && (
                    <p className="text-indigo-600 dark:text-indigo-400 font-bold">
                      {occ.actualDuration}m spent
                    </p>
                  )}
                  <p className="text-slate-400 capitalize">{occ.taskId?.category}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPage;
