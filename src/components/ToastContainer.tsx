import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  return (
    <div className="fixed bottom-16 sm:bottom-6 right-4 sm:right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';
          const isWarning = toast.type === 'warning';

          const icon = isSuccess ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : isError ? (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          ) : isWarning ? (
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          ) : (
            <Info className="w-5 h-5 text-sky-600 shrink-0" />
          );

          const borderClass = isSuccess
            ? 'border-emerald-200 bg-white/95 text-emerald-950 shadow-emerald-950/10'
            : isError
            ? 'border-rose-200 bg-white/95 text-rose-950 shadow-rose-950/10'
            : isWarning
            ? 'border-amber-200 bg-white/95 text-amber-950 shadow-amber-950/10'
            : 'border-slate-200 bg-white/95 text-slate-900 shadow-slate-950/10';

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className={`pointer-events-auto p-4 rounded-2xl border backdrop-blur-xl shadow-xl flex items-start justify-between gap-3 text-xs ${borderClass}`}
            >
              <div className="flex items-start gap-3">
                {icon}
                <div>
                  <div className="font-bold text-slate-900 text-sm">{toast.title}</div>
                  <div className="text-slate-600 mt-0.5 leading-relaxed">{toast.message}</div>
                </div>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 -mr-1 -mt-1"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
