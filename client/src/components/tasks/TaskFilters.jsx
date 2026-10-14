import React from 'react';
import { Search, Filter, ArrowUpDown } from 'lucide-react';

export const TaskFilters = ({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  priority,
  onPriorityChange,
  status,
  onStatusChange,
  scheduleType,
  onScheduleTypeChange,
  sortBy,
  onSortByChange,
  categories = [],
}) => {
  return (
    <div className="space-y-3">
      {/* Top Search & Primary Status Tabs */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tasks by title or keyword..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
          />
        </div>

        {/* Status Pill Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
          {[
            { id: '', label: 'All' },
            { id: 'todo', label: 'To Do' },
            { id: 'in_progress', label: 'In Progress' },
            { id: 'done', label: 'Completed' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => onStatusChange(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                status === tab.id
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Secondary Filter Dropdowns: Category, Priority, Schedule Type, Sort */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {/* Category filter */}
        <select
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-medium text-slate-700 dark:text-slate-300 focus:outline-none"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id || c.name} value={c.id || c.name}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Priority filter */}
        <select
          value={priority}
          onChange={(e) => onPriorityChange(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-medium text-slate-700 dark:text-slate-300 focus:outline-none"
        >
          <option value="">All Priorities</option>
          <option value="high">High Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="low">Low Priority</option>
        </select>

        {/* Schedule type */}
        <select
          value={scheduleType}
          onChange={(e) => onScheduleTypeChange(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-medium text-slate-700 dark:text-slate-300 focus:outline-none"
        >
          <option value="">All Schedules</option>
          <option value="one_time">One-time</option>
          <option value="daily">Daily Recurring</option>
          <option value="weekly">Weekly Recurring</option>
        </select>

        {/* Sort by */}
        <div className="ml-auto flex items-center gap-1.5">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-medium text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="createdAt">Date Created</option>
            <option value="dueDate">Due Date</option>
            <option value="priority">Priority</option>
            <option value="estimatedDuration">Estimated Duration</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default TaskFilters;
