import React, { useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, History, FileText, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ImportLog } from '../../types';

interface ImportHistoryPanelProps {
  history: ImportLog[];
  onUndo: (batchId: string) => void;
  onClear: () => void;
  onClose: () => void;
}

export const ImportHistoryPanel = ({ 
  history, 
  onUndo, 
  onClear, 
  onClose 
}: ImportHistoryPanelProps) => {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <motion.div 
      ref={panelRef}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="absolute top-full right-0 mt-2 w-72 bg-white border border-border-subtle rounded-xl shadow-xl z-50 overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-border-subtle bg-bg-page flex items-center justify-between">
        <h4 className="text-[12px] font-semibold text-text-primary uppercase tracking-wider">Import History</h4>
        <button onClick={onClose} className="text-text-tertiary hover:text-text-primary transition-colors">
          <X size={14} />
        </button>
      </div>
      <div className="max-h-80 overflow-y-auto custom-scrollbar">
        {history.length === 0 ? (
          <div className="p-8 text-center">
            <History size={24} className="mx-auto mb-2 text-text-tertiary opacity-20" />
            <p className="text-[11px] text-text-tertiary font-medium">No recent imports</p>
          </div>
        ) : (
          <div className="divide-y divide-border-subtle">
            {history.map((log) => (
              <div key={log.id} className="p-3 hover:bg-bg-page transition-colors group">
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileText size={14} className="text-accent-interactive shrink-0" />
                    <span className="text-[12px] font-semibold text-text-primary truncate">{log.filename}</span>
                  </div>
                  <button 
                    onClick={() => onUndo(log.batchId)}
                    className="text-[11px] font-medium text-destructive opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                  >
                    <Trash2 size={12} />
                    Undo
                  </button>
                </div>
                <div className="flex items-center justify-between text-[11px] text-text-tertiary">
                  <span>{format(log.timestamp, 'dd MMM, HH:mm')}</span>
                  <span className="font-medium text-text-secondary">{log.rowCount} rows</span>
                </div>
                {log.gateway && (
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 bg-bg-page border border-border-subtle rounded text-[9px] font-bold text-text-tertiary uppercase">
                      {log.gateway}
                    </span>
                    {log.method && (
                      <span className="text-[10px] text-text-tertiary italic">via {log.method}</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {history.length > 0 && (
        <div className="p-2 border-t border-border-subtle bg-bg-page">
          <button 
            onClick={onClear}
            className="w-full py-1.5 text-[11px] font-medium text-text-secondary hover:text-text-primary transition-colors text-center"
          >
            Clear history
          </button>
        </div>
      )}
    </motion.div>
  );
};
