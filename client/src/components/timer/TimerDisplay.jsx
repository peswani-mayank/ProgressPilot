import React from 'react';

export const TimerDisplay = ({
  secondsLeft,
  totalDuration,
  mode = 'pomodoro',
  status = 'idle',
}) => {
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // SVG Circular progress math
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = totalDuration > 0 ? (totalDuration - secondsLeft) / totalDuration : 0;
  const strokeDashoffset = circumference - progressRatio * circumference;

  let strokeColor = '#6366f1'; // Indigo for Pomodoro
  let badgeColor = 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300';
  let modeLabel = 'Focus Session';

  if (mode === 'short_break') {
    strokeColor = '#10b981'; // Emerald for short break
    badgeColor = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300';
    modeLabel = 'Short Break (Rest & Recharge)';
  } else if (mode === 'long_break') {
    strokeColor = '#06b6d4'; // Cyan for long break
    badgeColor = 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300';
    modeLabel = 'Long Break';
  } else if (mode === 'custom_focus') {
    strokeColor = '#8b5cf6';
    badgeColor = 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300';
    modeLabel = 'Custom Focus';
  }

  return (
    <div className="relative flex flex-col items-center justify-center p-6">
      {/* SVG Ring */}
      <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 280 280">
          {/* Background Track */}
          <circle
            cx="140"
            cy="140"
            r={radius}
            className="stroke-slate-100 dark:stroke-slate-800"
            strokeWidth="10"
            fill="transparent"
          />
          {/* Animated Progress Stroke */}
          <circle
            cx="140"
            cy="140"
            r={radius}
            stroke={strokeColor}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-300 ease-linear"
          />
        </svg>

        {/* Center Countdown & State Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold mb-2 ${badgeColor}`}>
            {modeLabel}
          </span>
          <span className="text-5xl sm:text-6xl font-black tracking-tight text-slate-900 dark:text-white font-mono">
            {formattedTime}
          </span>
          <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-2 capitalize">
            {status === 'running' ? 'Focus in progress' : status === 'paused' ? 'Paused' : 'Ready to start'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TimerDisplay;
