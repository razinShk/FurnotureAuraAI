import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext({
  showToast: () => {},
  toast: {
    success: () => {},
    error: () => {},
    info: () => {}
  }
});

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = 'toast_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const toast = {
    success: (msg, dur) => addToast(msg, 'success', dur),
    error: (msg, dur) => addToast(msg, 'error', dur || 4500),
    info: (msg, dur) => addToast(msg, 'info', dur)
  };

  return (
    <ToastContext.Provider value={{ showToast: addToast, toast }}>
      {children}
      {/* Toast Notification Container */}
      <div 
        aria-live="polite"
        className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto p-3.5 rounded-2xl shadow-xl border backdrop-blur-md flex items-start gap-3 transition-all transform animate-in fade-in slide-in-from-bottom-2 duration-200 ${
              t.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-100 border-emerald-500/40'
                : t.type === 'error'
                ? 'bg-rose-950/90 text-rose-100 border-rose-500/40'
                : 'bg-slate-900/90 text-slate-100 border-slate-700'
            }`}
          >
            {t.type === 'success' && <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />}
            {t.type === 'error' && <AlertCircle size={18} className="text-rose-400 shrink-0 mt-0.5" />}
            {t.type === 'info' && <Info size={18} className="text-brand-400 shrink-0 mt-0.5" />}

            <div className="flex-1 text-xs font-semibold leading-relaxed">
              {t.message}
            </div>

            <button
              onClick={() => removeToast(t.id)}
              className="text-white/60 hover:text-white p-0.5 rounded transition-colors"
              aria-label="Dismiss toast"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
