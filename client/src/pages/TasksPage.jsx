import React, { useState, useEffect } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { Plus, CheckSquare, Trash2, Calendar, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import TaskCard from '../components/tasks/TaskCard';
import TaskFilters from '../components/tasks/TaskFilters';
import EmptyState from '../components/common/EmptyState';
import { SkeletonCard } from '../components/common/SkeletonLoader';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { format } from 'date-fns';

export const TasksPage = () => {
  const { onOpenAddTask, onEditTask, onPostponeTask, refreshGlobalStats } = useOutletContext();
  const { addToast } = useToast();
  const [searchParams] = useSearchParams();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState([]);

  // Filters state
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('');
  const [status, setStatus] = useState('');
  const [scheduleType, setScheduleType] = useState('');
  const [sortBy, setSortBy] = useState('dueDate');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'today', 'upcoming', 'overdue'

  // Bulk actions state
  const [selectedIds, setSelectedIds] = useState([]);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  // Load user categories
  useEffect(() => {
    api.get('/user/profile')
      .then((user) => {
        if (user?.preferences?.categories?.length) {
          setCategories(user.preferences.categories);
        }
      })
      .catch(() => {});
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (category) params.append('category', category);
      if (priority) params.append('priority', priority);
      if (status) params.append('status', status);
      if (scheduleType) params.append('scheduleType', scheduleType);
      if (sortBy) params.append('sortBy', sortBy);
      params.append('page', page);
      params.append('limit', 50);

      const data = await api.get(`/tasks?${params.toString()}`);
      setTasks(data.tasks || []);
      setTotal(data.total || 0);
    } catch (err) {
      addToast({ title: 'Error loading tasks', message: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [search, category, priority, status, scheduleType, sortBy, page]);

  // Tab Filtering client-side on top of fetched items
  const filteredTasks = tasks.filter((t) => {
    if (activeTab === 'today') {
      return t.dueDate === todayStr || t.startDate === todayStr;
    }
    if (activeTab === 'upcoming') {
      return t.dueDate && t.dueDate > todayStr && t.status !== 'done';
    }
    if (activeTab === 'overdue') {
      return t.dueDate && t.dueDate < todayStr && t.status !== 'done';
    }
    return true;
  });

  const handleToggleComplete = async (task) => {
    try {
      const newStatus = task.status === 'done' ? 'todo' : 'done';
      await api.patch(`/tasks/${task._id}/complete`, { status: newStatus });
      addToast({
        title: newStatus === 'done' ? 'Task completed! 🎉' : 'Task marked as to-do',
        type: 'success',
      });
      fetchTasks();
      refreshGlobalStats();
    } catch (err) {
      addToast({ title: 'Update failed', message: err.message, type: 'error' });
    }
  };

  const handleDelete = async (task) => {
    try {
      await api.delete(`/tasks/${task._id}`);
      addToast({ title: 'Task deleted', type: 'info' });
      fetchTasks();
      refreshGlobalStats();
    } catch (err) {
      addToast({ title: 'Delete failed', message: err.message, type: 'error' });
    }
  };

  const handleDuplicate = async (task) => {
    try {
      await api.post(`/tasks/${task._id}/duplicate`);
      addToast({ title: 'Task duplicated successfully', type: 'success' });
      fetchTasks();
      refreshGlobalStats();
    } catch (err) {
      addToast({ title: 'Duplicate failed', message: err.message, type: 'error' });
    }
  };

  // Bulk actions
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredTasks.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredTasks.map((t) => t._id));
    }
  };

  const toggleSelectOne = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkComplete = async () => {
    try {
      await Promise.all(
        selectedIds.map((id) => api.patch(`/tasks/${id}/complete`, { status: 'done' }))
      );
      addToast({ title: `${selectedIds.length} tasks marked completed!`, type: 'success' });
      setSelectedIds([]);
      fetchTasks();
      refreshGlobalStats();
    } catch (err) {
      addToast({ title: 'Bulk complete failed', message: err.message, type: 'error' });
    }
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(selectedIds.map((id) => api.delete(`/tasks/${id}`)));
      addToast({ title: `${selectedIds.length} tasks deleted`, type: 'info' });
      setSelectedIds([]);
      fetchTasks();
      refreshGlobalStats();
    } catch (err) {
      addToast({ title: 'Bulk delete failed', message: err.message, type: 'error' });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            My Tasks & Planning
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage your daily tasks, recurrence schedules, deadlines, and priorities.
          </p>
        </div>

        <button
          onClick={() => onOpenAddTask()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/25 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </button>
      </div>

      {/* Quick View Tabs: All, Due Today, Upcoming, Overdue */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800">
        {[
          { id: 'all', label: 'All Tasks', count: total },
          { id: 'today', label: 'Due Today', count: tasks.filter((t) => t.dueDate === todayStr).length },
          { id: 'upcoming', label: 'Upcoming', count: tasks.filter((t) => t.dueDate > todayStr && t.status !== 'done').length },
          { id: 'overdue', label: 'Overdue', count: tasks.filter((t) => t.dueDate < todayStr && t.status !== 'done').length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === tab.id ? 'bg-indigo-700 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Filter Component */}
      <TaskFilters
        search={search}
        onSearchChange={setSearch}
        category={category}
        onCategoryChange={setCategory}
        priority={priority}
        onPriorityChange={setPriority}
        status={status}
        onStatusChange={setStatus}
        scheduleType={scheduleType}
        onScheduleTypeChange={setScheduleType}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        categories={categories}
      />

      {/* Bulk Action Bar (appears when items selected) */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-900 animate-fade-in text-xs font-semibold">
          <span className="text-indigo-900 dark:text-indigo-200">
            {selectedIds.length} {selectedIds.length === 1 ? 'task' : 'tasks'} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkComplete}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mark Done</span>
            </button>
            <button
              onClick={() => setShowBulkDeleteConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Task List */}
      {loading ? (
        <SkeletonCard count={5} />
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks match your filters"
          description="Try clearing search filters or create a new task to get started."
          actionLabel="Create a Task"
          onAction={() => onOpenAddTask()}
        />
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((t) => (
            <div key={t._id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedIds.includes(t._id)}
                onChange={() => toggleSelectOne(t._id)}
                className="w-4 h-4 rounded text-indigo-600 accent-indigo-600 cursor-pointer"
              />
              <div className="flex-1 min-w-0">
                <TaskCard
                  task={t}
                  onToggleComplete={handleToggleComplete}
                  onEdit={onEditTask}
                  onDuplicate={handleDuplicate}
                  onDelete={handleDelete}
                  onPostpone={onPostponeTask}
                  onSessionLogged={fetchTasks}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Dialog for Bulk Delete */}
      <ConfirmDialog
        isOpen={showBulkDeleteConfirm}
        onClose={() => setShowBulkDeleteConfirm(false)}
        onConfirm={handleBulkDelete}
        title="Delete Selected Tasks?"
        message={`Are you sure you want to delete ${selectedIds.length} tasks? This will remove them from your active task list.`}
        confirmText="Delete Tasks"
        isDestructive={true}
      />
    </div>
  );
};

export default TasksPage;
