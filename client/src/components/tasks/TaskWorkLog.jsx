import React, { useState, useEffect } from 'react';
import {
  FileText,
  Clock,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Loader2,
  Send,
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { format } from 'date-fns';

export const TaskWorkLog = ({ taskId, taskTitle, occurrenceId = null, onLogsCountChange }) => {
  const toast = useToast();
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New entry form state
  const [newText, setNewText] = useState('');
  const [newDuration, setNewDuration] = useState('');

  // Editing state
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [editDuration, setEditDuration] = useState('');

  // Load existing logs
  const loadLogs = async () => {
    if (!taskId) return;
    setIsLoading(true);
    try {
      const data = await api.get(`/tasks/${taskId}/work-logs`);
      const items = Array.isArray(data) ? data : [];
      setLogs(items);
      if (onLogsCountChange) onLogsCountChange(items.length);
    } catch (err) {
      console.warn('Failed to load task work logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [taskId]);

  // Submit new work log
  const handleAddLog = async (e) => {
    e.preventDefault();
    if (!newText.trim()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        text: newText.trim(),
        durationMinutes: newDuration ? parseInt(newDuration, 10) : null,
        occurrenceId,
      };

      const created = await api.post(`/tasks/${taskId}/work-logs`, payload);
      const updated = [...logs, created];
      setLogs(updated);
      setNewText('');
      setNewDuration('');
      if (onLogsCountChange) onLogsCountChange(updated.length);
      toast.success('Work log entry added!');
    } catch (err) {
      toast.error(err.message || 'Failed to add work log');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Start editing
  const handleStartEdit = (log) => {
    setEditingId(log._id);
    setEditText(log.text);
    setEditDuration(log.durationMinutes !== null && log.durationMinutes !== undefined ? String(log.durationMinutes) : '');
  };

  // Save edit
  const handleSaveEdit = async (id) => {
    if (!editText.trim()) return;
    try {
      const payload = {
        text: editText.trim(),
        durationMinutes: editDuration ? parseInt(editDuration, 10) : null,
      };

      const updated = await api.patch(`/tasks/${taskId}/work-logs/${id}`, payload);
      setLogs((prev) => prev.map((l) => (l._id === id ? updated : l)));
      setEditingId(null);
      toast.success('Work log updated!');
    } catch (err) {
      toast.error(err.message || 'Failed to update work log');
    }
  };

  // Delete log
  const handleDeleteLog = async (id) => {
    if (!window.confirm('Delete this work log entry?')) return;
    try {
      await api.delete(`/tasks/${taskId}/work-logs/${id}`);
      const updated = logs.filter((l) => l._id !== id);
      setLogs(updated);
      if (onLogsCountChange) onLogsCountChange(updated.length);
      toast.success('Work log entry deleted');
    } catch (err) {
      toast.error('Failed to delete work log');
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
        <div className="flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-indigo-500" />
          <span>Work Log / What I Did Today</span>
        </div>
        <span className="text-[11px] font-normal text-slate-400">
          {logs.length} {logs.length === 1 ? 'entry' : 'entries'}
        </span>
      </div>

      {/* Add New Entry Form */}
      <form onSubmit={handleAddLog} className="space-y-2">
        <textarea
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          rows={2}
          placeholder="e.g. Practiced 3 array problems, solved 2 independently in Java (Hindi/Hinglish/English supported)..."
          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/40 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="number"
              min="1"
              max="600"
              placeholder="Minutes spent (optional)"
              value={newDuration}
              onChange={(e) => setNewDuration(e.target.value)}
              className="w-40 px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/40 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !newText.trim()}
            className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-xs"
          >
            {isSubmitting ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Send className="w-3 h-3" />
            )}
            <span>Log Work</span>
          </button>
        </div>
      </form>

      {/* List of Previous Entries */}
      {isLoading ? (
        <div className="flex items-center justify-center py-3 text-slate-400 text-xs">
          <Loader2 className="w-4 h-4 animate-spin mr-1.5 text-indigo-500" />
          <span>Loading work logs...</span>
        </div>
      ) : logs.length === 0 ? (
        <p className="text-[11px] text-slate-400 italic py-1">
          No work logs recorded yet. Add what you accomplished above!
        </p>
      ) : (
        <ul className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {logs.map((log) => {
            const isEditingThis = editingId === log._id;
            const logTime = log.createdAt
              ? format(new Date(log.createdAt), 'h:mm a, MMM d')
              : 'Logged';

            if (isEditingThis) {
              return (
                <li
                  key={log._id}
                  className="p-2.5 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-2 text-xs"
                >
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={2}
                    className="w-full px-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none"
                  />
                  <div className="flex items-center justify-between">
                    <input
                      type="number"
                      min="1"
                      max="600"
                      placeholder="Minutes"
                      value={editDuration}
                      onChange={(e) => setEditDuration(e.target.value)}
                      className="w-24 px-2 py-0.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="px-2 py-0.5 rounded text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(log._id)}
                        className="px-2.5 py-0.5 rounded bg-indigo-600 text-white font-medium text-xs shadow-xs"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </li>
              );
            }

            return (
              <li
                key={log._id}
                className="group p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 hover:border-slate-200 dark:hover:border-slate-700 transition-all text-xs flex items-start justify-between gap-2"
              >
                <div className="space-y-0.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {log.durationMinutes !== null && log.durationMinutes !== undefined && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md font-bold text-[10px] bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                        <Clock className="w-2.5 h-2.5" />
                        <span>{log.durationMinutes}m</span>
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400">{logTime}</span>
                  </div>

                  <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words leading-relaxed text-[11px] sm:text-xs">
                    {log.text}
                  </p>
                </div>

                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0 pt-0.5">
                  <button
                    type="button"
                    onClick={() => handleStartEdit(log)}
                    className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    title="Edit work log"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteLog(log._id)}
                    className="p-1 rounded text-slate-400 hover:text-rose-500"
                    title="Delete work log"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default TaskWorkLog;
