import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className={cn(
        "flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border min-w-[320px] z-[200]",
        type === 'success' ? "bg-white text-green-700 border-green-100" : "bg-white text-red-700 border-red-100"
      )}
    >
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
        type === 'success' ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
      )}>
        {type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
      </div>
      <p className="text-[13px] font-bold flex-1">{message}</p>
      <button onClick={onClose} className="text-text-tertiary hover:text-text-primary transition-colors">
        <X size={16} />
      </button>
    </motion.div>
  );
};
