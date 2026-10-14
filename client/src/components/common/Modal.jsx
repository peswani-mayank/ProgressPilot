import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export const Modal = ({ isOpen, onClose, title, subtitle, icon: Icon = null, children, maxWidth = 'max-w-xl' }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Centering wrapper */}
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6 text-center">
        {/* Modal Dialog Content */}
        <div
          className={`relative w-full ${maxWidth} transform rounded-3xl bg-white dark:bg-slate-900 text-left shadow-2xl shadow-indigo-950/20 border border-slate-200/90 dark:border-slate-800/90 overflow-hidden transition-all animate-fade-in my-6`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          {(title || subtitle) && (
            <div className="flex items-center justify-between px-6 py-4.5 bg-slate-50/80 dark:bg-slate-800/50 backdrop-blur-sm border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-3">
                {Icon && (
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                )}
                <div>
                  {title && (
                    <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
                      {title}
                    </h3>
                  )}
                  {subtitle && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Body */}
          <div className="p-6 sm:p-7 max-h-[calc(85vh-6rem)] overflow-y-auto">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
