import React from 'react';
import { Play, Pause, Square, X, Clock, Flame } from 'lucide-react';
import { useTimer } from '../../context/TimerContext';

export const GlobalFloatingTimer = ({ onSessionLogged }) => {
  const {
    activeSession,
    formattedElapsed,
    pauseTaskTimer,
    resumeTaskTimer,
    stopAndSaveTaskTimer,
    discardTaskTimer,
  } = useTimer();

  if (!activeSession) return null;

  const isRunning = activeSession.status === 'running';
  const isPaused = activeSession.status === 'paused';

  const handleStopAndSave = async () => {
    await stopAndSaveTaskTimer((duration) => {
      if (onSessionLogged) onSessionLogged(duration);
    });
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 w-full max-w-xl pointer-events-none animate-fade-in">
      <div className="pointer-events-auto flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-slate-900/95 dark:bg-slate-900/95 text-white border border-slate-700/80 shadow-2xl backdrop-blur-xl ring-2 ring-indigo-500/40">
        {/* Left: Task Name & Live Status */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
              <Clock className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
            </div>
            {isRunning && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900 animate-ping" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/30 text-indigo-300">
                {isPaused ? 'PAUSED' : 'FOCUSING'}
              </span>
              <p className="text-xs sm:text-sm font-bold truncate">
                {activeSession.taskTitle || 'Current Task'}
              </p>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 capitalize">
              {activeSession.category || 'General'}
            </p>
          </div>
        </div>

        {/* Center: Monospace Timer */}
        <div className="px-3 py-1 rounded-xl bg-slate-800/90 border border-slate-700 text-sm sm:text-base font-mono font-extrabold text-indigo-400 shrink-0">
          {formattedElapsed}
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {isRunning ? (
            <button
              type="button"
              onClick={pauseTaskTimer}
              title="Pause Timer"
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-colors"
            >
              <Pause className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Pause</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={resumeTaskTimer}
              title="Resume Timer"
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span className="hidden sm:inline">Resume</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleStopAndSave}
            title="Stop and save actual time spent to MongoDB"
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 transition-colors"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>Stop & Save</span>
          </button>

          <button
            type="button"
            onClick={() => discardTaskTimer(true)}
            title="Discard this session without saving"
            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default GlobalFloatingTimer;
