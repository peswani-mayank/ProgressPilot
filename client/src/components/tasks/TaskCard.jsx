import React, { useState } from 'react';
import {
  CheckCircle,
  Circle,
  Clock,
  Play,
  Pause,
  Square,
  X,
  Calendar,
  MoreVertical,
  Repeat,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Edit2,
  Copy,
  Trash2,
  Forward,
  FileText,
  Plus,
  Sparkles,
} from 'lucide-react';
import { PriorityBadge, CategoryTag } from '../common/Badge';
import confetti from 'canvas-confetti';
import { format } from 'date-fns';
import { useTimer } from '../../context/TimerContext';
import TaskWorkLog from './TaskWorkLog';

// Helper to format minutes into clean human-readable hours & minutes
// e.g. 180 -> "3h", 90 -> "1h 30m", 45 -> "45m", 0 -> "0m"
export const formatMinutes = (minutes) => {
  const mins = Math.max(0, Math.round(Number(minutes) || 0));
  if (mins === 0) return '0m';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m === 0) return `${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

export const TaskCard = ({
  task,
  occurrence = null,
  onToggleComplete,
  onEdit,
  onDuplicate,
  onDelete,
  onPostpone,
  onSessionLogged,
}) => {
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [showWorkLog, setShowWorkLog] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [workLogCount, setWorkLogCount] = useState(0);

  const {
    activeSession,
    elapsedSeconds,
    formattedElapsed,
    startTaskTimer,
    pauseTaskTimer,
    resumeTaskTimer,
    stopAndSaveTaskTimer,
    discardTaskTimer,
    isTaskActive,
  } = useTimer();

  const activeTask = task || occurrence?.taskId;
  if (!activeTask) return null;

  const isDone = occurrence ? occurrence.status === 'done' : activeTask.status === 'done';
  const isPostponed = occurrence ? occurrence.status === 'postponed' : false;

  // Overdue check
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const checkDate = occurrence?.scheduledDate || activeTask.dueDate;
  const isOverdue = checkDate && checkDate < todayStr && !isDone;

  // Planned vs Actual Times
  const plannedMinutes = activeTask.estimatedDuration || 30;
  // Use occurrence actualDuration if available, else task actualDuration
  const actualMinutes = occurrence?.actualDuration ?? activeTask.actualDuration ?? 0;
  const remainingMinutes = Math.max(0, plannedMinutes - actualMinutes);
  const overrunMinutes = Math.max(0, actualMinutes - plannedMinutes);
  const isOverrun = actualMinutes > plannedMinutes;

  // Percentage for progress bar
  const progressPercent = Math.min(100, Math.round((actualMinutes / plannedMinutes) * 100));

  // Timer active check for this specific task
  const isThisTaskTimerActive = isTaskActive(activeTask._id);
  const isThisTimerRunning = isThisTaskTimerActive && activeSession?.status === 'running';
  const isThisTimerPaused = isThisTaskTimerActive && activeSession?.status === 'paused';

  const handleCheckboxClick = () => {
    if (!isDone) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });
    }
    if (onToggleComplete) {
      onToggleComplete(activeTask, occurrence);
    }
  };

  const handleSaveTimer = async () => {
    await stopAndSaveTaskTimer((duration) => {
      if (onSessionLogged) onSessionLogged(duration);
    });
  };

  const completedSubtasksCount = activeTask.subtasks?.filter((s) => s.completed)?.length || 0;
  const totalSubtasksCount = activeTask.subtasks?.length || 0;

  return (
    <div
      className={`group relative p-4 rounded-2xl border transition-all duration-200 ${
        isThisTaskTimerActive
          ? 'bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 ring-2 ring-indigo-500/30 shadow-md'
          : isDone
          ? 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-80'
          : isOverdue
          ? 'bg-rose-50/30 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60 hover:shadow-card'
          : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800 hover:shadow-card'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Completion Checkbox */}
        <button
          onClick={handleCheckboxClick}
          className="mt-0.5 shrink-0 transition-transform active:scale-90"
          title={isDone ? 'Mark as incomplete' : 'Mark as completed'}
        >
          {isDone ? (
            <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 fill-emerald-100 dark:fill-emerald-950" />
          ) : (
            <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors" />
          )}
        </button>

        {/* Task Details */}
        <div className="flex-1 min-w-0">
          {/* Header Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <PriorityBadge priority={activeTask.priority} />
            <CategoryTag category={activeTask.category || 'General'} />

            {activeTask.scheduleType !== 'one_time' && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md">
                <Repeat className="w-3 h-3" />
                <span className="capitalize">{activeTask.scheduleType.replace('_', ' ')}</span>
              </span>
            )}

            {isOverdue && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/60 px-2 py-0.5 rounded-md animate-pulse">
                <AlertTriangle className="w-3 h-3" />
                Overdue
              </span>
            )}

            {isPostponed && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 px-2 py-0.5 rounded-md">
                Postponed
              </span>
            )}

            {/* Due date if present */}
            {activeTask.dueDate && (
              <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>Due {activeTask.dueDate}</span>
                {activeTask.deadlineTime && <span>at {activeTask.deadlineTime}</span>}
              </div>
            )}
          </div>

          {/* Task Title */}
          <h4
            className={`text-sm sm:text-base font-semibold leading-snug transition-all ${
              isDone
                ? 'line-through text-slate-400 dark:text-slate-500'
                : 'text-slate-900 dark:text-white'
            }`}
          >
            {activeTask.title}
          </h4>

          {activeTask.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
              {activeTask.description}
            </p>
          )}

          {/* 1. Planned Time vs Actual Time vs Remaining Time */}
          <div className="flex flex-wrap items-center gap-3 mt-3 py-1.5 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs">
            {/* Planned */}
            <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400 font-medium">
              <span className="text-slate-400">Planned:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {formatMinutes(plannedMinutes)}
              </span>
            </div>

            <span className="text-slate-300 dark:text-slate-700">•</span>

            {/* Spent */}
            <div className="flex items-center gap-1 font-medium">
              <span className="text-slate-400">Spent:</span>
              <span
                className={`font-bold ${
                  actualMinutes > 0
                    ? isOverrun
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-500'
                }`}
              >
                {formatMinutes(actualMinutes)}
              </span>
            </div>

            <span className="text-slate-300 dark:text-slate-700">•</span>

            {/* Remaining (or Overrun) */}
            <div className="flex items-center gap-1 font-medium">
              <span className="text-slate-400">Remaining:</span>
              {isOverrun ? (
                <span className="font-bold text-rose-600 dark:text-rose-400">
                  0m <span className="text-[10px] font-extrabold">(+{formatMinutes(overrunMinutes)} over)</span>
                </span>
              ) : (
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {formatMinutes(remainingMinutes)}
                </span>
              )}
            </div>
          </div>

          {/* 2. Progress Bar based on actual vs planned */}
          <div className="mt-2 space-y-1">
            <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  isOverrun
                    ? 'bg-amber-500'
                    : progressPercent >= 100
                    ? 'bg-emerald-500'
                    : 'bg-indigo-600'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* 3. Interactive Focus Timer Controls on Task Card */}
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-1">
            {/* When Timer is Idle */}
            {!isThisTaskTimerActive && !isDone && (
              <button
                type="button"
                onClick={() => startTaskTimer(activeTask, occurrence)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start Focus</span>
              </button>
            )}

            {/* When Timer is Running for this Task */}
            {isThisTimerRunning && (
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-600 text-white text-xs font-mono font-bold animate-pulse shadow-sm">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formattedElapsed}</span>
                </div>

                <button
                  type="button"
                  onClick={pauseTaskTimer}
                  title="Pause Focus Session"
                  className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50 hover:bg-amber-100 transition-colors"
                >
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveTimer}
                  title="Stop and Save Focused Time"
                  className="flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Stop & Save</span>
                </button>

                <button
                  type="button"
                  onClick={() => discardTaskTimer(true)}
                  title="Discard this session"
                  className="p-1 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* When Timer is Paused for this Task */}
            {isThisTimerPaused && (
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 text-xs font-mono font-bold">
                  <Pause className="w-3.5 h-3.5" />
                  <span>Paused: {formattedElapsed}</span>
                </div>

                <button
                  type="button"
                  onClick={resumeTaskTimer}
                  title="Resume Focus Session"
                  className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Resume</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveTimer}
                  title="Stop and Save Focused Time"
                  className="flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Stop & Save</span>
                </button>

                <button
                  type="button"
                  onClick={() => discardTaskTimer(true)}
                  title="Discard this session"
                  className="p-1 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* 4. Work Log Toggle Button */}
            <button
              type="button"
              onClick={() => setShowWorkLog(!showWorkLog)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium transition-all ${
                showWorkLog
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-indigo-500" />
              <span>{showWorkLog ? 'Hide Work Log' : '+ Add Work Log'}</span>
              {workLogCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                  {workLogCount}
                </span>
              )}
            </button>

            {/* Subtasks summary toggle */}
            {totalSubtasksCount > 0 && (
              <button
                type="button"
                onClick={() => setShowSubtasks(!showSubtasks)}
                className="flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <span>
                  {completedSubtasksCount}/{totalSubtasksCount} steps
                </span>
                {showSubtasks ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
          </div>

          {/* Subtasks List Dropdown */}
          {showSubtasks && totalSubtasksCount > 0 && (
            <div className="mt-3 pl-3 border-l-2 border-indigo-200 dark:border-indigo-900 space-y-1.5 animate-fade-in">
              {activeTask.subtasks.map((st) => (
                <div key={st.id} className="flex items-center gap-2 text-xs">
                  <span className={`w-1.5 h-1.5 rounded-full ${st.completed ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <span className={st.completed ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-300'}>
                    {st.title}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* 5. Collapsible Work Log / What I Did Section */}
          {showWorkLog && (
            <div className="animate-fade-in">
              <TaskWorkLog
                taskId={activeTask._id}
                taskTitle={activeTask.title}
                occurrenceId={occurrence?._id}
                onLogsCountChange={(count) => setWorkLogCount(count)}
              />
            </div>
          )}
        </div>

        {/* Action Controls Menu: Start Timer + Postpone + More Dropdown */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Quick Timer Button Right Near Each Task */}
          {!isDone && (
            <>
              {!isThisTaskTimerActive && (
                <button
                  type="button"
                  onClick={() => startTaskTimer(activeTask, occurrence)}
                  title="Turn on focus timer for this task"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white shadow-sm shadow-indigo-600/25 transition-all"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start Timer</span>
                </button>
              )}

              {isThisTimerRunning && (
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-indigo-600 text-white text-xs font-mono font-bold animate-pulse shadow-sm">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formattedElapsed}</span>
                  </div>
                  <button
                    type="button"
                    onClick={pauseTaskTimer}
                    title="Pause Focus Session"
                    className="p-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50 hover:bg-amber-100 transition-colors"
                  >
                    <Pause className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveTimer}
                    title="Stop and save actual time spent"
                    className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors"
                  >
                    <Square className="w-3 h-3 fill-current" />
                    <span>Stop & Save</span>
                  </button>
                </div>
              )}

              {isThisTimerPaused && (
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 text-xs font-mono font-bold">
                    <Pause className="w-3 h-3" />
                    <span>{formattedElapsed}</span>
                  </div>
                  <button
                    type="button"
                    onClick={resumeTaskTimer}
                    title="Resume Focus Session"
                    className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Resume</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveTimer}
                    title="Stop and save actual time spent"
                    className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors"
                  >
                    <Square className="w-3 h-3 fill-current" />
                    <span>Stop & Save</span>
                  </button>
                </div>
              )}

              <button
                onClick={() => onPostpone && onPostpone(activeTask, occurrence)}
                title="Postpone & Log Blocker"
                className="p-1.5 rounded-xl text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors"
              >
                <Forward className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Dropdown Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-1 z-30 animate-fade-in">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onEdit && onEdit(activeTask);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onDuplicate && onDuplicate(activeTask);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Duplicate</span>
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onDelete && onDelete(activeTask);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
