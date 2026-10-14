import React from 'react';

export const ProgressBar = ({
  progress = 0,
  max = 100,
  height = 'h-2.5',
  color = 'bg-primary-600',
  showLabel = false,
  labelPrefix = '',
}) => {
  const safeProgress = Math.max(0, Number(progress) || 0);
  const safeMax = Math.max(1, Number(max) || 100);
  const percentage = Math.min(100, Math.round((safeProgress / safeMax) * 100));

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
          <span>{labelPrefix}</span>
          <span className="font-semibold text-slate-900 dark:text-white">{percentage}%</span>
        </div>
      )}
      <div className={`w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden ${height}`}>
        <div
          className={`${color} ${height} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
