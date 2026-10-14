import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  Target,
  Timer,
  BarChart3,
  BookOpen,
  BookOpenCheck,
  Bell,
  Settings,
  PlusCircle,
  Flame,
  LogOut,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = ({ isOpen, onClose, onOpenAddTask, unreadCount = 0, streak = 0 }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Dashboard', to: '/', icon: LayoutDashboard },
    { name: 'My Tasks', to: '/tasks', icon: CheckSquare },
    { name: 'Calendar', to: '/calendar', icon: Calendar },
    { name: 'Goals', to: '/goals', icon: Target },
    { name: 'Focus Timer', to: '/timer', icon: Timer },
    { name: 'Analytics & Reports', to: '/analytics', icon: BarChart3 },
    { name: 'Daily Journal', to: '/journal', icon: BookOpen },
    { name: 'Daily Review', to: '/review', icon: BookOpenCheck },
    { name: 'Notifications', to: '/notifications', icon: Bell, badge: unreadCount },
    { name: 'Settings & Export', to: '/settings', icon: Settings },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-6 h-18 border-b border-slate-100 dark:border-slate-800">
          <NavLink to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 19 21 12 17 5 21 12 2" fill="currentColor" fillOpacity="0.3"/>
              </svg>
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 to-indigo-800 dark:from-indigo-400 dark:to-indigo-300 bg-clip-text text-transparent">
                ProgressPilot
              </span>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium tracking-wide">
                FOCUS & PROGRESS
              </p>
            </div>
          </NavLink>

          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Add Task Action */}
        <div className="px-4 py-4">
          <button
            onClick={() => {
              if (onOpenAddTask) onOpenAddTask();
              if (onClose) onClose();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white shadow-md shadow-indigo-600/25 transition-all duration-150"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </div>

        {/* Main Navigation Links */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </div>
              {item.badge > 0 && (
                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-indigo-600 text-white animate-pulse">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom Section: Streak & User Card */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
          {/* Streak indicator */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/40 text-amber-900 dark:text-amber-200">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-500 fill-amber-500 animate-bounce" />
              <span className="text-xs font-semibold">Streak</span>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-200/70 dark:bg-amber-900/60 text-amber-900 dark:text-amber-100">
              {streak} {streak === 1 ? 'day' : 'days'}
            </span>
          </div>

          {/* User profile & logout */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={user?.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.displayName || 'PP'}`}
                alt={user?.displayName || 'User'}
                className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 object-cover shrink-0"
              />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {user?.displayName || 'Progress Pilot'}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                  {user?.email || 'pilot@progresspilot.dev'}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
