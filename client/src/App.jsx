import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { TimerProvider } from './context/TimerContext';
import AppLayout from './components/layout/AppLayout';

import DashboardPage from './pages/DashboardPage';
import TasksPage from './pages/TasksPage';
import CalendarPage from './pages/CalendarPage';
import GoalsPage from './pages/GoalsPage';
import FocusTimerPage from './pages/FocusTimerPage';
import AnalyticsPage from './pages/AnalyticsPage';
import DailyReviewPage from './pages/DailyReviewPage';
import JournalPage from './pages/JournalPage';
import NotificationsPage from './pages/NotificationsPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-600/30 animate-pulse mb-4">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 19 21 12 17 5 21 12 2" fill="currentColor" fillOpacity="0.3"/>
          </svg>
        </div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest animate-pulse">
          Loading ProgressPilot...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <TimerProvider>
            <BrowserRouter>
              <Routes>
                {/* Public login route */}
                <Route path="/login" element={<LoginPage />} />

                {/* Protected application routes within main layout */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <AppLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<DashboardPage />} />
                  <Route path="tasks" element={<TasksPage />} />
                  <Route path="calendar" element={<CalendarPage />} />
                  <Route path="goals" element={<GoalsPage />} />
                  <Route path="timer" element={<FocusTimerPage />} />
                  <Route path="analytics" element={<AnalyticsPage />} />
                  <Route path="journal" element={<JournalPage />} />
                  <Route path="review" element={<DailyReviewPage />} />
                  <Route path="notifications" element={<NotificationsPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                </Route>

                {/* Fallback route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </TimerProvider>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
