import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Search,
  X,
  Sparkles,
  FileText,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Filter,
} from 'lucide-react';
import api from '../../services/api';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from 'date-fns';

export const JournalHistoryDrawer = ({
  isOpen,
  onClose,
  currentDate,
  onSelectDate,
  onDeleteJournal,
}) => {
  const [journals, setJournals] = useState([]);
  const [datesMarkers, setDatesMarkers] = useState([]);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [calendarMonth, setCalendarMonth] = useState(new Date(currentDate || new Date()));
  const [isLoading, setIsLoading] = useState(false);

  // Fetch journal history and calendar markers
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [listRes, datesRes] = await Promise.all([
        api.get(`/journals?search=${encodeURIComponent(search)}&startDate=${startDate}&endDate=${endDate}&limit=30`),
        api.get('/journals/dates'),
      ]);

      setJournals(listRes.journals || []);
      setDatesMarkers(Array.isArray(datesRes) ? datesRes : []);
    } catch (err) {
      console.error('Failed to load journal history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, search, startDate, endDate]);

  // Compute month days for the mini calendar
  const monthStart = startOfMonth(calendarMonth);
  const monthEnd = endOfMonth(calendarMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Map dates to markers
  const markerMap = new Map();
  datesMarkers.forEach((m) => {
    markerMap.set(m.journalDate, m);
  });

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Slide-over Drawer */}
      <aside
        className={`fixed top-0 bottom-0 right-0 z-50 w-full sm:w-96 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Journal History & Calendar
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mini Calendar View with Indicators */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {format(calendarMonth, 'MMMM yyyy')}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  const prev = new Date(calendarMonth);
                  prev.setMonth(prev.getMonth() - 1);
                  setCalendarMonth(prev);
                }}
                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  const next = new Date(calendarMonth);
                  next.setMonth(next.getMonth() + 1);
                  setCalendarMonth(next);
                }}
                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 mb-1">
            <span>Su</span>
            <span>Mo</span>
            <span>Tu</span>
            <span>We</span>
            <span>Th</span>
            <span>Fr</span>
            <span>Sa</span>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {/* Pad initial days */}
            {Array.from({ length: monthStart.getDay() }).map((_, i) => (
              <div key={`pad-${i}`} />
            ))}

            {daysInMonth.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const isSelected = dateStr === currentDate;
              const marker = markerMap.get(dateStr);
              const hasReport = marker?.hasStructuredReport;
              const hasDraft = marker?.hasContent;

              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => {
                    onSelectDate(dateStr);
                    onClose();
                  }}
                  className={`relative py-1.5 rounded-lg text-xs font-semibold flex flex-col items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-indigo-600 text-white font-bold shadow-sm'
                      : isToday(day)
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{format(day, 'd')}</span>
                  {/* Indicators */}
                  <div className="flex gap-0.5 mt-0.5">
                    {hasReport ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500" title="AI Report Generated" />
                    ) : hasDraft ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Journal Note Saved" />
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-center gap-4 mt-3 text-[10px] text-slate-400">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Note Written</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              <span>AI Structured</span>
            </div>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="p-3 border-b border-slate-100 dark:border-slate-800 space-y-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search past notes or topics..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <input
              type="date"
              placeholder="Start"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] text-slate-700 dark:text-slate-300"
            />
            <input
              type="date"
              placeholder="End"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] text-slate-700 dark:text-slate-300"
            />
          </div>
        </div>

        {/* Reverse Chronological Timeline */}
        <div className="flex-1 p-3 overflow-y-auto space-y-2.5">
          {isLoading && (
            <p className="text-center text-xs text-slate-400 py-6">Loading entries...</p>
          )}

          {!isLoading && journals.length === 0 && (
            <div className="py-8 text-center text-slate-400 text-xs">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>No journal entries found</p>
              <p className="text-[11px] mt-1 text-slate-500">
                {search ? 'Try clearing your search query' : 'Your saved daily journals will appear here'}
              </p>
            </div>
          )}

          {!isLoading &&
            journals.map((entry) => {
              const isSelected = entry.journalDate === currentDate;
              const hasReport = Boolean(entry.lastStructuredAt || entry.structuredReport?.summary);
              const preview =
                entry.structuredReport?.summary ||
                entry.originalText?.substring(0, 100) ||
                'Empty journal note';

              return (
                <div
                  key={entry._id}
                  onClick={() => {
                    onSelectDate(entry.journalDate);
                    onClose();
                  }}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 shadow-sm'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {format(new Date(entry.journalDate), 'EEE, MMM d, yyyy')}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {hasReport && (
                        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>Structured</span>
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete journal entry for ${entry.journalDate}?`)) {
                            onDeleteJournal(entry._id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                        title="Delete journal entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {preview}
                  </p>
                </div>
              );
            })}
        </div>
      </aside>
    </>
  );
};

export default JournalHistoryDrawer;
