import React from 'react';
import { motion } from 'motion/react';
import { X, Download, Clock } from 'lucide-react';
import { PSPConfig } from '../../types';
import { format } from 'date-fns';

interface PSPHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  psp: PSPConfig | null;
}

interface HistoryEntry {
  id: string;
  timestamp: Date;
  user: string;
  field: string;
  oldValue: string;
  newValue: string;
}

export const PSPHistoryModal = ({ isOpen, onClose, psp }: PSPHistoryModalProps) => {
  if (!isOpen || !psp) return null;

  // Mock history data
  const history: HistoryEntry[] = [
    {
      id: '1',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
      user: 'Alex Rivera',
      field: 'Processing Fee (%)',
      oldValue: '1.8%',
      newValue: '1.5%',
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), // 5 days ago
      user: 'Sarah Chen',
      field: 'Status',
      oldValue: 'Testing',
      newValue: 'Active',
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10), // 10 days ago
      user: 'Alex Rivera',
      field: 'API Endpoint',
      oldValue: 'https://sandbox.api.test',
      newValue: 'https://api.production.com/v1',
    },
    {
      id: '4',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15), // 15 days ago
      user: 'System',
      field: 'Connection Status',
      oldValue: 'Offline',
      newValue: 'Online',
    }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-[640px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-bg-page rounded-lg text-accent-interactive">
              <Clock size={20} />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-text-primary">
                {psp.name} — Change History
              </h2>
              <p className="text-[11px] text-text-tertiary">Audit log of all configuration updates</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-text-tertiary hover:text-text-primary hover:bg-bg-page rounded-full transition-all">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-bg-page/50 backdrop-blur-md z-10">
              <tr>
                <th className="px-6 py-3 text-[11px] font-bold text-text-tertiary uppercase tracking-wider border-b border-border-subtle">Date & Time</th>
                <th className="px-6 py-3 text-[11px] font-bold text-text-tertiary uppercase tracking-wider border-b border-border-subtle">Changed By</th>
                <th className="px-6 py-3 text-[11px] font-bold text-text-tertiary uppercase tracking-wider border-b border-border-subtle">Field</th>
                <th className="px-6 py-3 text-[11px] font-bold text-text-tertiary uppercase tracking-wider border-b border-border-subtle">New Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {history.map((entry) => (
                <tr key={entry.id} className="hover:bg-bg-page/30 transition-colors">
                  <td className="px-6 py-4 text-[12px] text-text-secondary whitespace-nowrap">
                    {format(entry.timestamp, 'MMM d, yyyy HH:mm')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-accent-interactive/10 flex items-center justify-center text-[10px] font-bold text-accent-interactive">
                        {entry.user.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="text-[12px] font-medium text-text-primary">{entry.user}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[12px] font-bold text-text-secondary">{entry.field}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[12px] text-text-primary font-medium">{entry.newValue}</span>
                      <span className="text-[10px] text-text-tertiary line-through opacity-60">from {entry.oldValue}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border-subtle bg-bg-page/50 flex items-center justify-between sticky bottom-0 z-10">
          <button 
            className="flex items-center gap-2 px-4 py-2 text-[12px] font-bold text-accent-interactive hover:bg-accent-interactive/10 rounded-lg transition-all"
            onClick={() => alert('Exporting history...')}
          >
            <Download size={16} /> Export History
          </button>
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-white border border-border-subtle text-text-primary rounded-lg text-[13px] font-bold hover:bg-bg-page transition-all"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};
