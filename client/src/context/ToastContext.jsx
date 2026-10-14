import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (toastArg) => {
      let toastObj = toastArg;
      if (typeof toastArg === 'string') {
        toastObj = { message: toastArg, type: 'info' };
      }
      const { title, message, type = 'info', duration = 4000 } = toastObj || {};
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const toast = { id, title, message: message || (typeof toastArg === 'string' ? toastArg : ''), type };

      setToasts((prev) => [...prev, toast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
      return id;
    },
    [removeToast]
  );

  const success = useCallback(
    (msg, title) => {
      if (typeof msg === 'object') return addToast({ ...msg, type: 'success' });
      return addToast({ message: msg, title, type: 'success' });
    },
    [addToast]
  );

  const error = useCallback(
    (msg, title) => {
      if (typeof msg === 'object') return addToast({ ...msg, type: 'error' });
      return addToast({ message: msg, title, type: 'error' });
    },
    [addToast]
  );

  const warning = useCallback(
    (msg, title) => {
      if (typeof msg === 'object') return addToast({ ...msg, type: 'warning' });
      return addToast({ message: msg, title, type: 'warning' });
    },
    [addToast]
  );

  const info = useCallback(
    (msg, title) => {
      if (typeof msg === 'object') return addToast({ ...msg, type: 'info' });
      return addToast({ message: msg, title, type: 'info' });
    },
    [addToast]
  );

  return (
    <ToastContext.Provider value={{ addToast, removeToast, success, error, warning, info }}>
      {children}
      {/* Toast Overlay Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4">
        {toasts.map((toast) => {
          let bgClass = 'bg-slate-900 text-white border-slate-700';
          let Icon = Info;
          let iconColor = 'text-blue-400';

          if (toast.type === 'success') {
            bgClass = 'bg-emerald-950/95 text-emerald-100 border-emerald-800';
            Icon = CheckCircle2;
            iconColor = 'text-emerald-400';
          } else if (toast.type === 'error') {
            bgClass = 'bg-rose-950/95 text-rose-100 border-rose-800';
            Icon = AlertCircle;
            iconColor = 'text-rose-400';
          } else if (toast.type === 'warning') {
            bgClass = 'bg-amber-950/95 text-amber-100 border-amber-800';
            Icon = AlertTriangle;
            iconColor = 'text-amber-400';
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-xl backdrop-blur-md animate-fade-in transition-all ${bgClass}`}
            >
              <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} />
              <div className="flex-1 min-w-0">
                {toast.title && <p className="text-sm font-semibold leading-tight">{toast.title}</p>}
                {toast.message && <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{toast.message}</p>}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 text-slate-400 hover:text-white transition-colors"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
