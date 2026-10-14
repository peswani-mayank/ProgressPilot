import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import {
  BookOpen,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  BarChart2,
  Clock,
  History,
  AlertTriangle,
  RotateCcw,
  Check,
} from 'lucide-react';
import { format, subDays, addDays, isToday, parseISO } from 'date-fns';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import JournalEditor from '../components/journal/JournalEditor';
import StructuredReportView from '../components/journal/StructuredReportView';
import CreateTaskFromBulletModal from '../components/journal/CreateTaskFromBulletModal';
import JournalHistoryDrawer from '../components/journal/JournalHistoryDrawer';
import WeeklyInsightsModal from '../components/journal/WeeklyInsightsModal';

export const JournalPage = () => {
  const toast = useToast();
  const outlet = useOutletContext() || {};
  const [searchParams, setSearchParams] = useSearchParams();

  // Active date
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const currentDate = searchParams.get('date') || outlet.selectedDate || todayStr;

  // Active Journal Document State
  const [journalId, setJournalId] = useState(null);
  const [text, setText] = useState('');
  const [structuredReport, setStructuredReport] = useState(null);
  const [outputLanguage, setOutputLanguage] = useState('original');
  const [lastStructuredAt, setLastStructuredAt] = useState(null);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [saveState, setSaveState] = useState('saved'); // 'saved' | 'saving' | 'failed' | 'unsaved'

  // Loading & Processing States
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Modals & Drawers
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);
  const [taskModalData, setTaskModalData] = useState(null); // { bulletText, sourceSection }

  // Mobile View Toggle: 'editor' | 'report'
  const [mobileTab, setMobileTab] = useState('editor');

  // Debounce Timer Ref
  const saveTimeoutRef = useRef(null);
  const latestTextRef = useRef(text);
  latestTextRef.current = text;

  // Load journal for selected date
  const loadJournalForDate = useCallback(async (date) => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await api.get(`/journals/by-date/${date}`);
      if (res.journal) {
        setJournalId(res.journal._id);
        setText(res.journal.originalText || '');
        setStructuredReport(res.journal.structuredReport || null);
        setOutputLanguage(res.journal.outputLanguage || 'original');
        setLastStructuredAt(res.journal.lastStructuredAt || null);
        setLastSavedAt(res.journal.updatedAt || null);
        setSaveState('saved');
      } else {
        // No entry yet for this date
        setJournalId(null);
        setText('');
        setStructuredReport(null);
        setOutputLanguage('original');
        setLastStructuredAt(null);
        setLastSavedAt(null);
        setSaveState('saved');
      }
    } catch (err) {
      console.error('Failed to load journal:', err);
      toast.error('Failed to load journal entry');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJournalForDate(currentDate);
  }, [currentDate, loadJournalForDate]);

  // Save journal implementation
  const performSave = async (textToSave, lang = outputLanguage) => {
    setSaveState('saving');
    try {
      const payload = {
        journalDate: currentDate,
        originalText: textToSave,
        outputLanguage: lang,
      };

      const res = await api.post('/journals', payload);
      setJournalId(res._id);
      setLastSavedAt(res.updatedAt || new Date().toISOString());
      setSaveState('saved');
      return res;
    } catch (err) {
      console.error('Draft auto-save failed:', err);
      setSaveState('failed');
      throw err;
    }
  };

  // Debounced auto-save handler
  const handleTextChange = (newText) => {
    setText(newText);
    setSaveState('unsaved');

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      performSave(newText);
    }, 1200);
  };

  // Warn user before leaving page if unsaved changes exist
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (saveState === 'unsaved') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [saveState]);

  // Date switching
  const handleDateChange = (newDate) => {
    if (saveState === 'unsaved') {
      // Force instant save before switching
      performSave(text).catch(() => {});
    }
    setSearchParams({ date: newDate });
    if (outlet.onDateChange) {
      outlet.onDateChange(newDate);
    }
  };

  // AI Structuring action
  const handleGenerateReport = async () => {
    if (!text.trim()) {
      toast.error('Please write some notes before generating an AI report.');
      return;
    }

    setIsProcessingAI(true);
    setErrorMessage('');

    try {
      // 1. Ensure latest text is saved
      let currentId = journalId;
      if (!currentId || saveState === 'unsaved') {
        const saved = await performSave(text, outputLanguage);
        currentId = saved._id;
      }

      // 2. Trigger AI Structuring
      const response = await api.post(`/journals/${currentId}/structure`, {
        outputLanguage,
      });

      if (response.journal) {
        setStructuredReport(response.journal.structuredReport);
        setLastStructuredAt(response.journal.lastStructuredAt);
        toast.success('AI Structured Report generated successfully!');
        setMobileTab('report'); // On mobile, automatically show the generated report!
      }
    } catch (err) {
      console.error('AI Structuring error:', err);
      const msg = err.message || 'AI structuring failed. Your notes are safely preserved.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsProcessingAI(false);
    }
  };

  // Manual save of edited structured report
  const handleSaveEditedReport = async (updatedReport) => {
    if (!journalId) return;
    try {
      const res = await api.patch(`/journals/${journalId}`, {
        structuredReport: updatedReport,
      });
      setStructuredReport(res.structuredReport);
      setLastStructuredAt(res.lastStructuredAt);
    } catch (err) {
      toast.error('Failed to update report');
    }
  };

  // Language change
  const handleChangeLanguage = (newLang) => {
    setOutputLanguage(newLang);
    if (journalId) {
      api.patch(`/journals/${journalId}`, { outputLanguage: newLang }).catch(() => {});
    }
  };

  // Delete journal entry
  const handleDeleteJournal = async (idToDelete) => {
    try {
      await api.delete(`/journals/${idToDelete}`);
      toast.success('Journal entry deleted');
      if (idToDelete === journalId) {
        setText('');
        setStructuredReport(null);
        setJournalId(null);
        setSaveState('saved');
      }
    } catch (err) {
      toast.error('Failed to delete journal');
    }
  };

  const parsedCurrentDate = parseISO(currentDate);

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <BookOpen className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Daily Journal & Smart Notes
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Write freely in Hindi, Hinglish, or English — transformed into organized daily progress.
          </p>
        </div>

        {/* Global Toolbar Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Weekly Insights Button */}
          <button
            type="button"
            onClick={() => setIsInsightsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-sm transition-all"
          >
            <BarChart2 className="w-4 h-4 text-indigo-500" />
            <span>Weekly Insights</span>
          </button>

          {/* History & Calendar Drawer Toggle */}
          <button
            type="button"
            onClick={() => setIsHistoryOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-sm transition-all"
          >
            <History className="w-4 h-4 text-purple-500" />
            <span>History & Calendar</span>
          </button>
        </div>
      </div>

      {/* Date Navigation & Shortcuts Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2">
          {/* Previous Day */}
          <button
            type="button"
            onClick={() => handleDateChange(format(subDays(parsedCurrentDate, 1), 'yyyy-MM-dd'))}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Date Picker Input */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/60">
            <Calendar className="w-4 h-4 text-indigo-500" />
            <input
              type="date"
              value={currentDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="bg-transparent text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            />
          </div>

          {/* Next Day */}
          <button
            type="button"
            onClick={() => handleDateChange(format(addDays(parsedCurrentDate, 1), 'yyyy-MM-dd'))}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Date Heading Display */}
          <span className="hidden sm:inline-block text-xs font-semibold text-slate-500 dark:text-slate-400 ml-2">
            {format(parsedCurrentDate, 'EEEE, MMMM d, yyyy')}
          </span>
        </div>

        {/* Quick Date Jump Pills */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleDateChange(todayStr)}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
              currentDate === todayStr
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => handleDateChange(format(subDays(new Date(), 1), 'yyyy-MM-dd'))}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
              currentDate === format(subDays(new Date(), 1), 'yyyy-MM-dd')
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Yesterday
          </button>
        </div>
      </div>

      {/* Non-destructive Error Banner (if AI or save fails) */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-start justify-between gap-3 text-xs text-amber-900 dark:text-amber-200">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Note: </span>
              <span>{errorMessage}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage('')}
            className="text-amber-700 dark:text-amber-400 hover:underline font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Mobile Tab Switcher */}
      <div className="flex lg:hidden rounded-xl bg-slate-200/80 dark:bg-slate-800 p-1">
        <button
          type="button"
          onClick={() => setMobileTab('editor')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            mobileTab === 'editor'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Freeform Notes
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('report')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            mobileTab === 'report'
              ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          AI Structured Report
        </button>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch min-h-[580px]">
        {/* Left Column: Distraction-Free Multilingual Editor */}
        <div className={`${mobileTab === 'editor' ? 'block' : 'hidden lg:block'} h-full`}>
          <JournalEditor
            text={text}
            onChange={handleTextChange}
            saveState={saveState}
            lastSavedAt={lastSavedAt}
            onRetrySave={() => performSave(text)}
            selectedDate={currentDate}
            readOnly={isLoading}
          />
        </div>

        {/* Right Column: AI Structured Report */}
        <div className={`${mobileTab === 'report' ? 'block' : 'hidden lg:block'} h-full`}>
          <StructuredReportView
            report={structuredReport}
            isProcessing={isProcessingAI}
            onGenerate={handleGenerateReport}
            onSaveEditedReport={handleSaveEditedReport}
            outputLanguage={outputLanguage}
            onChangeLanguage={handleChangeLanguage}
            onCreateTaskFromBullet={(bullet, sectionKey) => {
              setTaskModalData({
                bulletText: bullet,
                sourceSection: sectionKey,
              });
            }}
            originalTextExists={Boolean(text && text.trim().length > 0)}
            lastStructuredAt={lastStructuredAt}
          />
        </div>
      </div>

      {/* Convert Journal Bullet to Actionable Task Modal */}
      {taskModalData && (
        <CreateTaskFromBulletModal
          isOpen={Boolean(taskModalData)}
          onClose={() => setTaskModalData(null)}
          bulletText={taskModalData.bulletText}
          sourceSection={taskModalData.sourceSection}
          journalDate={currentDate}
          onTaskCreated={() => {
            if (outlet.refreshGlobalStats) outlet.refreshGlobalStats();
          }}
        />
      )}

      {/* Journal History & Calendar Drawer */}
      <JournalHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        currentDate={currentDate}
        onSelectDate={handleDateChange}
        onDeleteJournal={handleDeleteJournal}
      />

      {/* Weekly Journal Insights Modal */}
      <WeeklyInsightsModal
        isOpen={isInsightsOpen}
        onClose={() => setIsInsightsOpen(false)}
      />
    </div>
  );
};

export default JournalPage;
