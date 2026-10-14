import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Rocket,
  CheckCircle2,
  Clock,
  Target,
  BarChart3,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Code,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const LoginPage = () => {
  const { loginWithGoogle, loginWithDevAccount, isFirebaseConfigured, isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If already authenticated, redirect
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
      addToast({
        title: 'Welcome to ProgressPilot! 🚀',
        message: 'Successfully signed in with Google.',
        type: 'success',
      });
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Google sign-in failed.');
      addToast({
        title: 'Sign In Failed',
        message: err.message || 'Could not authenticate with Google.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDevLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithDevAccount();
      addToast({
        title: 'Signed in with Developer Account 🛠️',
        message: 'Full access granted with real database persistence.',
        type: 'info',
      });
      navigate('/');
    } catch (err) {
      setError(err.message || 'Developer login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-indigo-500 selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand Icon */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-xl shadow-indigo-500/25 mx-auto mb-4">
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 19 21 12 17 5 21 12 2" fill="currentColor" fillOpacity="0.3"/>
          </svg>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          ProgressPilot
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
          Plan Better. Focus Deeper. Progress Every Day.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white dark:bg-slate-900 py-8 px-6 sm:px-10 rounded-3xl shadow-card border border-slate-200/80 dark:border-slate-800 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-400 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Google Sign-In Button */}
          <div>
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs hover:shadow transition-all disabled:opacity-50 active:scale-[0.99]"
            >
              {/* Google G Logo */}
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{loading ? 'Signing in...' : 'Sign in with Google'}</span>
            </button>
          </div>

          {/* Dev / Demo Login Option */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
            <span className="flex-shrink mx-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              OR TEST MODE
            </span>
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
          </div>

          <div>
            <button
              onClick={handleDevLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-xs font-semibold text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-900/60 transition-all"
            >
              <Code className="w-4 h-4" />
              <span>Launch Demo Pilot Account (Instant Access)</span>
            </button>
            <p className="text-[10px] text-center text-slate-400 dark:text-slate-500 mt-2">
              Instantly tests real MongoDB operations, timers, calendar, and analytics without configuring Google OAuth right away.
            </p>
          </div>

          {!isFirebaseConfigured && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
              <span className="font-bold">Firebase Keys Note:</span> To enable real Google Sign-In, add your Firebase Client Keys to <code className="font-mono text-[10px] bg-amber-100 dark:bg-amber-900/60 px-1 py-0.5 rounded">client/.env</code> and restart the client.
            </div>
          )}

          {/* Feature Highlights */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Daily & Weekly task management with recurrence</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>Built-in Pomodoro focus timer with offline persistence</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Long-term goal and milestone tracking</span>
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-500 shrink-0" />
              <span>Transparent real-time productivity analytics</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
