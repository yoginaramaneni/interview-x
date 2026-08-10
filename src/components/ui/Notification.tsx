import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export interface ToastProps {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ id, message, type = 'info', onClose }) => {
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
  };

  const borderColors = {
    success: 'border-emerald-500/20 dark:border-emerald-500/30',
    error: 'border-red-500/20 dark:border-red-500/30',
    info: 'border-blue-500/20 dark:border-blue-500/30',
    warning: 'border-amber-500/20 dark:border-amber-500/30',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 15, scale: 0.9 }}
      className={`flex items-center gap-3.5 p-4 bg-white dark:bg-slate-900 border ${borderColors[type]} rounded-[16px] shadow-lg max-w-sm w-full pointer-events-auto`}
    >
      <div className="shrink-0">{icons[type]}</div>
      <p className="text-sm font-medium text-slate-700 dark:text-slate-200 flex-1">
        {message}
      </p>
      <button
        onClick={() => onClose(id)}
        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 p-1 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

interface ToastContainerProps {
  toasts: Omit<ToastProps, 'onClose'>[];
  onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
  return (
    <div className="fixed bottom-6 right-6 z-150 flex flex-col gap-3 w-full max-w-sm pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={onClose}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};
