import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';
import { useToast } from './ToastContext';

const TimerContext = createContext(null);

const STORAGE_KEY = 'progresspilot_task_timer';

export const TimerProvider = ({ children }) => {
  const toast = useToast();

  // Active timer state
  // null or { taskId, occurrenceId, taskTitle, category, startTime, accumulatedSeconds, lastTickTime, pausedAt, status: 'running' | 'paused' }
  const [activeSession, setActiveSession] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const timerIntervalRef = useRef(null);

  // Restore timer session on mount from localStorage
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const session = JSON.parse(raw);
        if (session && session.taskId) {
          const now = Date.now();
          let currentElapsed = session.accumulatedSeconds || 0;

          if (session.status === 'running') {
            const added = Math.max(0, Math.floor((now - session.lastTickTime) / 1000));
            currentElapsed += added;
            session.lastTickTime = now;
            session.accumulatedSeconds = currentElapsed;
          }

          setActiveSession(session);
          setElapsedSeconds(currentElapsed);
        }
      } catch (err) {
        console.warn('Failed to restore active timer session:', err);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Timer tick interval
  useEffect(() => {
    if (activeSession && activeSession.status === 'running') {
      timerIntervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => {
          const next = prev + 1;
          // Periodically sync accumulatedSeconds to localStorage every 5 seconds
          if (next % 5 === 0) {
            const updated = {
              ...activeSession,
              accumulatedSeconds: next,
              lastTickTime: Date.now(),
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          }
          return next;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [activeSession?.status]);

  // Start timer for a task
  const startTaskTimer = useCallback(
    (task, occurrence = null) => {
      if (!task || !task._id) return;

      // Prevent overlapping / duplicate active sessions
      if (activeSession && activeSession.taskId !== task._id) {
        const confirmSwitch = window.confirm(
          `Focus timer is currently active for "${activeSession.taskTitle}".\nDo you want to stop and save it before starting "${task.title}"?`
        );
        if (!confirmSwitch) return false;
        // Stop current session first
        stopAndSaveTaskTimer();
      }

      const now = Date.now();
      const newSession = {
        taskId: task._id,
        occurrenceId: occurrence?._id || null,
        taskTitle: task.title,
        category: task.category || 'personal',
        startTime: now,
        accumulatedSeconds: 0,
        lastTickTime: now,
        status: 'running',
      };

      setActiveSession(newSession);
      setElapsedSeconds(0);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
      toast.success(`Focus timer started for "${task.title}"`);
      return true;
    },
    [activeSession, toast]
  );

  // Pause timer
  const pauseTaskTimer = useCallback(() => {
    if (!activeSession || activeSession.status !== 'running') return;

    const now = Date.now();
    const updated = {
      ...activeSession,
      status: 'paused',
      accumulatedSeconds: elapsedSeconds,
      pausedAt: now,
    };

    setActiveSession(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    toast.info(`Timer paused at ${formatTime(elapsedSeconds)}`);
  }, [activeSession, elapsedSeconds, toast]);

  // Resume timer
  const resumeTaskTimer = useCallback(() => {
    if (!activeSession || activeSession.status !== 'paused') return;

    const now = Date.now();
    const updated = {
      ...activeSession,
      status: 'running',
      lastTickTime: now,
    };

    setActiveSession(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    toast.success(`Timer resumed for "${activeSession.taskTitle}"`);
  }, [activeSession, toast]);

  // Stop & Save session to backend
  const stopAndSaveTaskTimer = useCallback(
    async (onSavedCallback) => {
      if (!activeSession) return;

      const totalSeconds = elapsedSeconds;
      if (totalSeconds < 10) {
        const confirmShort = window.confirm(
          'This focus session is less than 10 seconds. Discard it without saving?'
        );
        if (confirmShort) {
          discardTaskTimer(false);
          return;
        }
      }

      // Calculate validated actual focused minutes (min 1 minute)
      const durationMinutes = Math.max(1, Math.round(totalSeconds / 60));
      const clientSessionId = `session_${activeSession.startTime}_${activeSession.taskId}`;

      try {
        await api.post('/focus-sessions', {
          taskId: activeSession.taskId,
          occurrenceId: activeSession.occurrenceId,
          clientSessionId,
          taskTitle: activeSession.taskTitle,
          category: activeSession.category,
          sessionType: 'custom_focus',
          startTime: new Date(activeSession.startTime).toISOString(),
          endTime: new Date().toISOString(),
          durationMinutes,
        });

        toast.success(
          `Logged ${durationMinutes} min actual focus time for "${activeSession.taskTitle}"!`
        );

        // Clear active session
        localStorage.removeItem(STORAGE_KEY);
        setActiveSession(null);
        setElapsedSeconds(0);

        if (onSavedCallback) onSavedCallback(durationMinutes);
      } catch (err) {
        toast.error(err.message || 'Failed to save focus session');
      }
    },
    [activeSession, elapsedSeconds, toast]
  );

  // Discard timer without saving
  const discardTaskTimer = useCallback(
    (promptConfirm = true) => {
      if (promptConfirm) {
        const confirmDiscard = window.confirm(
          'Are you sure you want to discard this focus session without saving?'
        );
        if (!confirmDiscard) return;
      }

      localStorage.removeItem(STORAGE_KEY);
      setActiveSession(null);
      setElapsedSeconds(0);
      toast.info('Focus session discarded.');
    },
    [toast]
  );

  // Check if a given task ID is currently active
  const isTaskActive = useCallback(
    (taskId) => {
      return activeSession && activeSession.taskId === taskId;
    },
    [activeSession]
  );

  const formatTime = (secs) => {
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const seconds = secs % 60;

    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  return (
    <TimerContext.Provider
      value={{
        activeSession,
        elapsedSeconds,
        formattedElapsed: formatTime(elapsedSeconds),
        startTaskTimer,
        pauseTaskTimer,
        resumeTaskTimer,
        stopAndSaveTaskTimer,
        discardTaskTimer,
        isTaskActive,
        formatTime,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
};

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};

export default TimerContext;
