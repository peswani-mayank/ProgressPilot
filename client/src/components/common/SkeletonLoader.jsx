import React from 'react';

export const SkeletonCard = ({ count = 3 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-pulse"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-16" />
          </div>
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-3/4 mb-2" />
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
};

export const SkeletonStats = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-pulse"
        >
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2 mb-3" />
          <div className="h-7 bg-slate-200 dark:bg-slate-800 rounded w-3/4 mb-2" />
          <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded w-full" />
        </div>
      ))}
    </div>
  );
};
