import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Clock,
  Plus,
  Volume2,
  VolumeX,
  Target,
  Sparkles,
} from 'lucide-react';
import TimerDisplay from '../components/timer/TimerDisplay';
import ManualTimeModal from '../components/timer/ManualTimeModal';
import { useToast } from '../context/ToastContext';
import confetti from 'canvas-confetti';
import api from '../services/api';

const TIMER_MODES = {
  pomodoro: { label: 'Pomodoro', duration: 25 * 60 },
  short_break: { label: 'Short Break', duration: 5 * 60 },
  long_break: { label: 'Long Break', duration: 15 * 60 },
  custom: { label: 'Custom', duration: 45 * 60 },
};

export const FocusTimerPage = () => {
  const { addToast } = useToast();
  const [searchParams] = useSearchParams();

  // Params passed from task card focus button
  const paramTaskId = searchParams.get('taskId');
  const paramTitle = searchParams.get('title');
  const paramCategory = searchParams.get('category');

  const [mode, setMode] = useState('pomodoro');
  const [status, setStatus] = useState('idle'); // 'idle', 'running', 'paused'
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [totalDuration, setTotalDuration] = useState(25 * 60);

  // Selected task
  const [tasks, setTasks] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState(paramTaskId || '');
  const [selectedTaskTitle, setSelectedTaskTitle] = useState(paramTitle || '');
  const [selectedCategory, setSelectedCategory] = useState(paramCategory || 'personal');

  // Today stats & history
  const [todayStats, setTodayStats] = useState(null);
  const [recentSessions, setRecentSessions] = useState([]);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [customMinutes, setCustomMinutes] = useState(45);

  const timerIntervalRef = useRef(null);

  // Fetch today stats & user tasks
  const loadStatsAndTasks = async () => {
    try {
      const [stats, sessions, tasksRes] = await Promise.all([
        api.get('/focus-sessions/today'),
        api.get('/focus-sessions?limit=10'),
        api.get('/tasks?status=todo'),
      ]);
      setTodayStats(stats);
      setRecentSessions(sessions || []);
      setTasks(tasksRes.tasks || []);

      if (paramTaskId && !selectedTaskTitle) {
        const found = (tasksRes.tasks || []).find((t) => t._id === paramTaskId);
        if (found) {
          setSelectedTaskTitle(found.title);
          setSelectedCategory(found.category || 'personal');
        }
      }
    } catch (err) {
      console.error('Error loading timer data:', err);
    }
  };

  useEffect(() => {
    loadStatsAndTasks();
  }, []);

  // Restore persisted timer session from localStorage on mount (survives page refresh!)
  useEffect(() => {
    const savedSession = localStorage.getItem('progresspilot_active_timer');
    if (savedSession) {
      try {
        const data = JSON.parse(savedSession);
        const now = Date.now();

        if (data.status === 'running') {
          const remaining = Math.max(0, Math.round((data.targetEndTime - now) / 1000));
          if (remaining > 0) {
            setSecondsLeft(remaining);
            setTotalDuration(data.totalDuration);
            setMode(data.mode);
            setSelectedTaskId(data.taskId || '');
            setSelectedTaskTitle(data.taskTitle || '');
            setSelectedCategory(data.category || 'personal');
            setStatus('running');
          } else {
            // Timer expired while user was away
            setSecondsLeft(0);
            setStatus('idle');
            localStorage.removeItem('progresspilot_active_timer');
          }
        } else if (data.status === 'paused') {
          setSecondsLeft(data.secondsLeft);
          setTotalDuration(data.totalDuration);
          setMode(data.mode);
          setSelectedTaskId(data.taskId || '');
          setSelectedTaskTitle(data.taskTitle || '');
          setSelectedCategory(data.category || 'personal');
          setStatus('paused');
        }
      } catch (e) {
        localStorage.removeItem('progresspilot_active_timer');
      }
    }
  }, []);

  // Running timer ticker
  useEffect(() => {
    if (status === 'running') {
      timerIntervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current);
            handleSessionCompleted();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [status]);

  // Handle Mode Change
  const handleModeChange = (newMode) => {
    if (status === 'running') {
      if (!window.confirm('A timer is currently active. Switch mode and reset?')) return;
    }
    setMode(newMode);
    setStatus('idle');
    localStorage.removeItem('progresspilot_active_timer');

    let durationSec = TIMER_MODES[newMode]?.duration || 25 * 60;
    if (newMode === 'custom') {
      durationSec = customMinutes * 60;
    }

    setTotalDuration(durationSec);
    setSecondsLeft(durationSec);
  };

  // Start Timer
  const handleStart = () => {
    const targetEndTime = Date.now() + secondsLeft * 1000;
    const sessionData = {
      mode,
      totalDuration,
      secondsLeft,
      targetEndTime,
      status: 'running',
      taskId: selectedTaskId,
      taskTitle: selectedTaskTitle,
      category: selectedCategory,
      sessionStartTime: Date.now() - (totalDuration - secondsLeft) * 1000,
    };

    localStorage.setItem('progresspilot_active_timer', JSON.stringify(sessionData));
    setStatus('running');

    // Request browser notification permission if not yet decided
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  };

  // Pause Timer
  const handlePause = () => {
    const sessionData = {
      mode,
      totalDuration,
      secondsLeft,
      status: 'paused',
      taskId: selectedTaskId,
      taskTitle: selectedTaskTitle,
      category: selectedCategory,
    };
    localStorage.setItem('progresspilot_active_timer', JSON.stringify(sessionData));
    setStatus('paused');
  };

  // Reset Timer
  const handleReset = () => {
    setStatus('idle');
    localStorage.removeItem('progresspilot_active_timer');
    const dur = mode === 'custom' ? customMinutes * 60 : TIMER_MODES[mode].duration;
    setSecondsLeft(dur);
    setTotalDuration(dur);
  };

  // Log session to backend upon completion
  const handleSessionCompleted = async () => {
    setStatus('idle');
    localStorage.removeItem('progresspilot_active_timer');

    const durationMinutes = Math.round(totalDuration / 60);
    const isFocus = mode !== 'short_break' && mode !== 'long_break';

    // Play celebration & chime
    confetti({ particleCount: 75, spread: 70, origin: { y: 0.6 } });

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('ProgressPilot Focus Session Completed! 🎯', {
        body: `Great job! You focused for ${durationMinutes} minutes on "${selectedTaskTitle || 'Deep Work'}".`,
      });
    }

    if (isFocus) {
      try {
        const now = new Date();
        const startTime = new Date(now.getTime() - durationMinutes * 60000);

        await api.post('/focus-sessions', {
          taskId: selectedTaskId || null,
          taskTitle: selectedTaskTitle || 'General Focus Session',
          category: selectedCategory || 'personal',
          sessionType: mode === 'custom' ? 'custom_focus' : 'pomodoro',
          startTime: startTime.toISOString(),
          endTime: now.toISOString(),
          durationMinutes,
        });

        addToast({
          title: 'Session Logged! 🚀',
          message: `Logged ${durationMinutes} minutes of focused progress.`,
          type: 'success',
        });

        loadStatsAndTasks();
      } catch (err) {
        addToast({ title: 'Logging failed', message: err.message, type: 'error' });
      }
    } else {
      addToast({
        title: 'Break Finished! ☕',
        message: 'Ready to dive back into deep work?',
        type: 'info',
      });
    }
  };

  // Stop early & save partial work
  const handleStopAndSave = async () => {
    const elapsedSeconds = totalDuration - secondsLeft;
    const elapsedMinutes = Math.round(elapsedSeconds / 60);

    if (elapsedMinutes < 1) {
      handleReset();
      return;
    }

    const isFocus = mode !== 'short_break' && mode !== 'long_break';
    if (!isFocus) {
      handleReset();
      return;
    }

    try {
      const now = new Date();
      const startTime = new Date(now.getTime() - elapsedMinutes * 60000);

      await api.post('/focus-sessions', {
        taskId: selectedTaskId || null,
        taskTitle: selectedTaskTitle || 'Partial Focus Session',
        category: selectedCategory || 'personal',
        sessionType: 'custom_focus',
        startTime: startTime.toISOString(),
        endTime: now.toISOString(),
        durationMinutes: elapsedMinutes,
        notes: 'Stopped early and saved partial progress.',
      });

      addToast({
        title: 'Partial Session Saved',
        message: `Saved ${elapsedMinutes} minutes of focus.`,
        type: 'success',
      });

      handleReset();
      loadStatsAndTasks();
    } catch (err) {
      addToast({ title: 'Save failed', message: err.message, type: 'error' });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Focus Timer & Pomodoro
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Single-task focus sessions with persisted timers and automatic time logging.
          </p>
        </div>

        <button
          onClick={() => setIsManualModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Manual Log</span>
        </button>
      </div>

      {/* Main Timer Workspace */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-card flex flex-col items-center">
        {/* Mode Selector Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 mb-6">
          {Object.entries(TIMER_MODES).map(([key, config]) => (
            <button
              key={key}
              onClick={() => handleModeChange(key)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                mode === key
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {config.label}
            </button>
          ))}
        </div>

        {/* Task Selector Dropdown */}
        <div className="w-full max-w-md mb-4">
          <label className="block text-center text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
            Focusing on Task:
          </label>
          <select
            value={selectedTaskId}
            onChange={(e) => {
              const id = e.target.value;
              setSelectedTaskId(id);
              const found = tasks.find((t) => t._id === id);
              if (found) {
                setSelectedTaskTitle(found.title);
                setSelectedCategory(found.category || 'personal');
              } else {
                setSelectedTaskTitle('General Deep Work');
              }
            }}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="">General Deep Work (No specific task)</option>
            {tasks.map((t) => (
              <option key={t._id} value={t._id}>
                {t.title} ({t.category}) - {t.estimatedDuration}m planned
              </option>
            ))}
          </select>
        </div>

        {/* Custom Duration Input (if mode === 'custom') */}
        {mode === 'custom' && status === 'idle' && (
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Minutes:</span>
            <input
              type="number"
              min="5"
              max="180"
              value={customMinutes}
              onChange={(e) => {
                const val = Number(e.target.value);
                setCustomMinutes(val);
                setTotalDuration(val * 60);
                setSecondsLeft(val * 60);
              }}
              className="w-20 px-2 py-1 rounded-lg border text-xs font-bold text-center"
            />
          </div>
        )}

        {/* Circular Countdown Ring */}
        <TimerDisplay
          secondsLeft={secondsLeft}
          totalDuration={totalDuration}
          mode={mode}
          status={status}
        />

        {/* Action Controls */}
        <div className="flex items-center gap-3 mt-6">
          {status === 'idle' && (
            <button
              onClick={handleStart}
              className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-extrabold text-sm shadow-lg shadow-indigo-600/30 transition-all"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Start Focus</span>
            </button>
          )}

          {status === 'running' && (
            <button
              onClick={handlePause}
              className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-extrabold text-sm shadow-lg shadow-amber-500/30 transition-all"
            >
              <Pause className="w-5 h-5 fill-current" />
              <span>Pause</span>
            </button>
          )}

          {status === 'paused' && (
            <button
              onClick={handleStart}
              className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-extrabold text-sm shadow-lg shadow-indigo-600/30 transition-all"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Resume</span>
            </button>
          )}

          {status !== 'idle' && (
            <button
              onClick={handleStopAndSave}
              className="px-4 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors"
            >
              Stop & Save Work
            </button>
          )}

          <button
            onClick={handleReset}
            title="Reset timer"
            className="p-3.5 rounded-2xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Today's Focus Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-subtle flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Today's Focus Time
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">
              {todayStats?.totalHours || 0} hours
            </p>
            <p className="text-[11px] text-slate-400">
              {todayStats?.totalMinutes || 0} focused minutes logged today
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-subtle flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Sessions Completed
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">
              {todayStats?.totalSessions || 0}
            </p>
            <p className="text-[11px] text-slate-400">Completed focus blocks today</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Recent Focus Session Logs */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-subtle">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
          Recent Focus Sessions
        </h3>

        {recentSessions.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">
            No focus sessions logged yet. Hit "Start Focus" above to begin your first session!
          </p>
        ) : (
          <div className="space-y-2">
            {recentSessions.map((session) => (
              <div
                key={session._id}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-xs"
              >
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    {session.taskTitle}
                  </p>
                  <p className="text-[11px] text-slate-400 capitalize">
                    {session.category} • {session.sessionType?.replace('_', ' ')}
                    {session.isManualEntry ? ' (Manual entry)' : ''}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                    +{session.durationMinutes}m
                  </span>
                  <p className="text-[10px] text-slate-400">
                    {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manual Time Entry Modal */}
      <ManualTimeModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onLogged={loadStatsAndTasks}
        tasks={tasks}
        categories={[
          { id: 'dsa', name: 'DSA' },
          { id: 'fullstack', name: 'Full Stack Development' },
          { id: 'university', name: 'University Academics' },
          { id: 'core_cs', name: 'Core Computer Science' },
          { id: 'projects', name: 'Projects' },
          { id: 'personal', name: 'Personal' },
        ]}
      />
    </div>
  );
};

export default FocusTimerPage;
