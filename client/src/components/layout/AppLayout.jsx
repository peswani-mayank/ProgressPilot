import React, { useState, useEffect } from 'react';
import { Outlet, useSearchParams } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import TaskModal from '../tasks/TaskModal';
import PostponeModal from '../tasks/PostponeModal';
import OnboardingModal from '../common/OnboardingModal';
import GlobalFloatingTimer from '../timer/GlobalFloatingTimer';
import api from '../../services/api';
import { format } from 'date-fns';

export const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [postponeData, setPostponeData] = useState(null); // { task, occurrence }
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const selectedDate = searchParams.get('date') || format(new Date(), 'yyyy-MM-dd');

  const [unreadCount, setUnreadCount] = useState(0);
  const [streak, setStreak] = useState(0);

  // Sync date changes via search query parameter
  const handleDateChange = (newDate) => {
    setSearchParams({ date: newDate });
  };

  const fetchGlobalStats = () => {
    api.get('/notifications')
      .then((data) => setUnreadCount(data.unreadCount || 0))
      .catch(() => {});

    api.get(`/analytics/daily?date=${selectedDate}`)
      .then((data) => setStreak(data.streak || 0))
      .catch(() => {});

    api.get('/user/profile')
      .then((profile) => {
        if (profile && profile.onboardingCompleted === false) {
          setIsOnboardingOpen(true);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchGlobalStats();
  }, [selectedDate]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex transition-colors duration-150">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenAddTask={() => {
          setEditingTask(null);
          setIsTaskModalOpen(true);
        }}
        unreadCount={unreadCount}
        streak={streak}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <Header
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onOpenAddTask={() => {
            setEditingTask(null);
            setIsTaskModalOpen(true);
          }}
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
          unreadCount={unreadCount}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <Outlet
            context={{
              selectedDate,
              onDateChange: handleDateChange,
              onOpenAddTask: (initialDate = null) => {
                setEditingTask(null);
                setIsTaskModalOpen(true);
              },
              onEditTask: (task) => {
                setEditingTask(task);
                setIsTaskModalOpen(true);
              },
              onPostponeTask: (task, occurrence) => {
                setPostponeData({ task, occurrence });
              },
              refreshGlobalStats: fetchGlobalStats,
            }}
          />
        </main>
      </div>

      {/* Global Modals */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        task={editingTask}
        initialDate={selectedDate}
        onSaved={fetchGlobalStats}
      />

      <PostponeModal
        isOpen={Boolean(postponeData)}
        onClose={() => setPostponeData(null)}
        task={postponeData?.task}
        occurrence={postponeData?.occurrence}
        onPostponed={fetchGlobalStats}
      />

      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onCompleted={fetchGlobalStats}
      />

      {/* Floating Active Timer Widget */}
      <GlobalFloatingTimer onSessionLogged={fetchGlobalStats} />
    </div>
  );
};

export default AppLayout;
