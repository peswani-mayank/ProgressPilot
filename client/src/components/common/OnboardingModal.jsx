import React, { useState } from 'react';
import Modal from './Modal';
import { Rocket, Target, Clock, Check } from 'lucide-react';
import api from '../../services/api';

export const OnboardingModal = ({ isOpen, onClose, onCompleted }) => {
  const [step, setStep] = useState(1);
  const [dailyTaskTarget, setDailyTaskTarget] = useState(5);
  const [dailyFocusHoursTarget, setDailyFocusHoursTarget] = useState(4);
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      await api.post('/user/onboarding', {
        timezone,
        dailyTaskTarget: Number(dailyTaskTarget),
        dailyFocusHoursTarget: Number(dailyFocusHoursTarget),
      });
      if (onCompleted) onCompleted();
      onClose();
    } catch (err) {
      console.error('Onboarding update error:', err);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-lg">
      <div className="text-center py-2">
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto shadow-md">
              <Rocket className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Welcome to ProgressPilot!
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                "Plan Better. Focus Deeper. Progress Every Day." Let's configure your daily targets in 30 seconds.
              </p>
            </div>

            <div className="pt-4">
              <button
                onClick={() => setStep(2)}
                className="w-full py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/25 transition-all"
              >
                Set My Daily Targets →
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 text-left animate-fade-in">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Daily Targets</h3>
            </div>

            {/* Daily Task Target */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Tasks per Day
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="2"
                  max="15"
                  value={dailyTaskTarget}
                  onChange={(e) => setDailyTaskTarget(Number(e.target.value))}
                  className="flex-1 accent-indigo-600"
                />
                <span className="w-12 text-center text-sm font-bold text-indigo-600 dark:text-indigo-400">
                  {dailyTaskTarget} tasks
                </span>
              </div>
            </div>

            {/* Daily Focus Hours */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Focused Hours per Day
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="1"
                  max="12"
                  step="0.5"
                  value={dailyFocusHoursTarget}
                  onChange={(e) => setDailyFocusHoursTarget(Number(e.target.value))}
                  className="flex-1 accent-indigo-600"
                />
                <span className="w-12 text-center text-sm font-bold text-indigo-600 dark:text-indigo-400">
                  {dailyFocusHoursTarget} hrs
                </span>
              </div>
            </div>

            {/* Timezone */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Timezone
              </label>
              <input
                type="text"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium dark:text-white"
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs font-semibold text-slate-500"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={handleFinish}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/25 transition-all"
              >
                {isSubmitting ? 'Saving...' : 'Start Progressing! 🚀'}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default OnboardingModal;
