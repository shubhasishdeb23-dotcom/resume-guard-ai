import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

const ToastItem: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, toast.duration || 4000);
    
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);
  
  const getIcon = () => {
    switch (toast.type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-400" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-amber-400" />;
      default: return <Info className="w-5 h-5 text-blue-400" />;
    }
  };
  
  const getBgColor = () => {
    switch (toast.type) {
      case 'success': return 'bg-emerald-500/10 border-emerald-500/30';
      case 'error': return 'bg-red-500/10 border-red-500/30';
      case 'warning': return 'bg-amber-500/10 border-amber-500/30';
      default: return 'bg-blue-500/10 border-blue-500/30';
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${getBgColor()} shadow-lg`}
    >
      {getIcon()}
      <span className="text-white text-sm flex-1">{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-slate-400 hover:text-white transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      <AnimatePresence>
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ToastContainer;
