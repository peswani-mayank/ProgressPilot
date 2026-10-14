import React, { useState, useEffect } from 'react';
import {
  Menu,
  Sun,
  Moon,
  Plus,
  Bell,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Check,
  User as UserIcon,
  Settings as SettingsIcon,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { format, parseISO, addDays, subDays } from 'date-fns';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';

export const Header = ({
  onToggleSidebar,
  onOpenAddTask,
  selectedDate,
  onDateChange,
  unreadCount = 0,
}) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const activeDate = selectedDate || todayStr;
  const isToday = activeDate === todayStr;

  const handlePrevDay = () => {
    const newDate = format(subDays(parseISO(activeDate), 1), 'yyyy-MM-dd');
    if (onDateChange) onDateChange(newDate);
  };

  const handleNextDay = () => {
    const newDate = format(addDays(parseISO(activeDate), 1), 'yyyy-MM-dd');
    if (onDateChange) onDateChange(newDate);
  };

  const handleToday = () => {
    if (onDateChange) onDateChange(todayStr);
  };

  // Fetch quick notifications on dropdown open
  useEffect(() => {
    if (showNotifDropdown) {
      api.get('/notifications')
        .then((data) => setNotifications(data.notifications?.slice(0, 5) || []))
        .catch(() => {});
    }
  }, [showNotifDropdown]);

  return (
    <header className="sticky top-0 z-30 h-18 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 lg:px-8 flex items-center justify-between">
      {/* Left: Mobile hamburger & Greeting */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <span>{getGreeting()},</span>
            <span className="text-indigo-600 dark:text-indigo-400">
              {user?.displayName ? user.displayName.split(' ')[0] : 'Pilot'}
            </span>
            <span className="hidden sm:inline">🚀</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {format(parseISO(activeDate), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
      </div>

      {/* Center: Date Navigator (Prev, Today, Next) */}
      <div className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-xs">
        <button
          onClick={handlePrevDay}
          title="Previous Day"
          className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button
          onClick={handleToday}
          className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
            isToday
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
          }`}
        >
          {isToday ? 'Today' : format(parseISO(activeDate), 'MMM d')}
        </button>

        <button
          onClick={handleNextDay}
          title="Next Day"
          className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <input
          type="date"
          value={activeDate}
          onChange={(e) => onDateChange && onDateChange(e.target.value)}
          className="ml-1 opacity-0 w-4 cursor-pointer absolute pointer-events-none"
          id="header-date-picker"
        />
        <label
          htmlFor="header-date-picker"
          title="Select specific date"
          className="cursor-pointer p-1 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-500"
        >
          <CalendarIcon className="w-3.5 h-3.5" />
        </label>
      </div>

      {/* Right: Quick Add + Theme Toggle + Notifications + User Menu */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Add Task Button */}
        <button
          onClick={onOpenAddTask}
          className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow transition-all"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Task</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications Bell & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            title="Notifications"
            className="relative p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </button>

          {showNotifDropdown && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-3 z-50 animate-fade-in">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-900 dark:text-white">Recent Notifications</span>
                <Link
                  to="/notifications"
                  onClick={() => setShowNotifDropdown(false)}
                  className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  View All
                </Link>
              </div>

              {notifications.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">No notifications yet.</p>
              ) : (
                <div className="space-y-1.5">
                  {notifications.map((n) => (
                    <div
                      key={n._id}
                      onClick={() => {
                        setShowNotifDropdown(false);
                        navigate('/notifications');
                      }}
                      className="p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                    >
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">{n.title}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">{n.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Profile Avatar & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-indigo-500/30 transition-all"
          >
            <img
              src={user?.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.displayName || 'PP'}`}
              alt={user?.displayName || 'User'}
              className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 object-cover"
            />
          </button>

          {showUserDropdown && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-50 animate-fade-in">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user?.displayName}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
              </div>
              <div className="py-1">
                <Link
                  to="/settings"
                  onClick={() => setShowUserDropdown(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  <SettingsIcon className="w-3.5 h-3.5" />
                  <span>Settings & Preferences</span>
                </Link>
                <button
                  onClick={async () => {
                    setShowUserDropdown(false);
                    await logout();
                    navigate('/login');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
