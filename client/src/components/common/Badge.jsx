import React from 'react';

export const PriorityBadge = ({ priority }) => {
  const p = (priority || 'medium').toLowerCase();

  if (p === 'high') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
        High Priority
      </span>
    );
  }
  if (p === 'medium') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        Medium Priority
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
      Low Priority
    </span>
  );
};

export const StatusBadge = ({ status }) => {
  const s = (status || 'todo').toLowerCase();

  if (s === 'done') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
        Completed
      </span>
    );
  }
  if (s === 'in_progress') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
        In Progress
      </span>
    );
  }
  if (s === 'skipped') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
        Skipped
      </span>
    );
  }
  if (s === 'postponed') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
        Postponed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
      To Do
    </span>
  );
};

export const CategoryTag = ({ category, color }) => {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium border"
      style={{
        backgroundColor: color ? `${color}15` : '#6366f115',
        color: color || '#6366f1',
        borderColor: color ? `${color}30` : '#6366f130',
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: color || '#6366f1' }}
      />
      {category}
    </span>
  );
};
