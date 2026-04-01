import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { format } from 'date-fns';
import { ReconResult } from '../../types';
import { Badge } from '../shared/Badge';

interface ManualMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  reconItem: ReconResult;
  pspFile: any[] | null;
  onMatch: (pspRow: any) => void;
}

export const ManualMatchModal = ({ 
  isOpen, 
  onClose, 
  reconItem, 
  pspFile, 
  onMatch 
}: ManualMatchModalProps) => {
  const [manualMatchSearch, setManualMatchSearch] = useState('');
  const [selectedPspMatch, setSelectedPspMatch] = useState<any | null>(null);

  const filteredPspRows = useMemo(() => {
    if (!isOpen || !pspFile) return [];
    
    return pspFile.filter(p => {
      const searchStr = manualMatchSearch.toLowerCase();
      const matchId = p['Transaction ID']?.toString().toLowerCase().includes(searchStr);
      const matchAmount = p['Amount']?.toString().includes(searchStr);
      const matchCurrency = p['Currency']?.toString().toLowerCase().includes(searchStr);
      
      const sameAmount = Math.abs(p['Amount'] - (reconItem.ourAmount || 0)) < 0.01;
      
      return (matchId || matchAmount || matchCurrency) && sameAmount;
    });
  }, [isOpen, pspFile, manualMatchSearch, reconItem]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/35 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-[720px] max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="manual-match-title"
      >
        <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between">
          <h2 id="manual-match-title" className="text-[15px] font-bold text-text-primary">Manual Reconciliation</h2>
          <button onClick={onClose} className="text-text-tertiary hover:text-text-primary transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          <div className="p-4 bg-bg-page border border-border-subtle rounded-xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-text-tertiary uppercase">System Transaction</span>
              <Badge variant={reconItem.status}>{reconItem.status}</Badge>
            </div>
            <div className="grid grid-cols-3 gap-y-4 gap-x-6">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-text-tertiary uppercase">Transaction ID</span>
                <p className="text-[13px] font-mono font-medium text-accent-interactive">{reconItem.txnId || '—'}</p>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-text-tertiary uppercase">Timestamp</span>
                <p className="text-[13px] font-medium">{format(reconItem.timestamp, 'dd MMM yyyy HH:mm')}</p>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-text-tertiary uppercase">Client</span>
                <p className="text-[13px] font-medium">{reconItem.client || '—'}</p>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-text-tertiary uppercase">Gateway</span>
                <p className="text-[13px] font-medium">{reconItem.gateway}</p>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-text-tertiary uppercase">Amount</span>
                <p className="text-[15px] font-bold text-text-primary">€{(reconItem.ourAmount || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[13px] font-bold text-text-primary">Find Matching PSP Record</h3>
              <div className="relative w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                <input 
                  type="text" 
                  placeholder="Search by ID or Amount..."
                  value={manualMatchSearch}
                  onChange={(e) => setManualMatchSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 bg-bg-page border border-border-subtle rounded-lg text-[12px] focus:outline-none focus:ring-1 focus:ring-accent-interactive focus:border-accent-interactive transition-all"
                />
              </div>
            </div>

            <div className="border border-border-subtle rounded-xl overflow-hidden">
              <div className="max-h-[300px] overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-bg-page z-10 border-b border-border-subtle">
                    <tr>
                      <th className="px-4 py-2 text-[10px] font-bold text-text-tertiary uppercase tracking-wider">PSP Trans ID</th>
                      <th className="px-4 py-2 text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Date</th>
                      <th className="px-4 py-2 text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Amount</th>
                      <th className="px-4 py-2 text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Currency</th>
                      <th className="px-4 py-2 text-[10px] font-bold text-text-tertiary uppercase tracking-wider text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {filteredPspRows.length > 0 ? (
                      filteredPspRows.map((p, idx) => (
                        <tr 
                          key={idx} 
                          className={`hover:bg-accent-hover/20 transition-colors cursor-pointer ${selectedPspMatch === p ? 'bg-accent-hover/40' : ''}`}
                          onClick={() => setSelectedPspMatch(p)}
                        >
                          <td className="px-4 py-3 text-[12px] font-mono font-medium text-text-primary">{p['Transaction ID'] || '—'}</td>
                          <td className="px-4 py-3 text-[12px] text-text-secondary">{p['Date'] || '—'}</td>
                          <td className="px-4 py-3 text-[12px] font-bold text-text-primary">€{p['Amount']?.toLocaleString() || '0'}</td>
                          <td className="px-4 py-3 text-[12px] text-text-secondary">{p['Currency'] || '—'}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {Math.abs(p['Amount'] - (reconItem.ourAmount || 0)) < 0.01 && (
                                <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded flex items-center gap-1">
                                  <CheckCircle2 size={10} /> Amount Match
                                </span>
                              )}
                              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${selectedPspMatch === p ? 'border-accent-interactive bg-accent-interactive' : 'border-border-subtle'}`}>
                                {selectedPspMatch === p && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <Info size={24} className="text-text-tertiary" />
                            <p className="text-[13px] text-text-secondary">No potential matches found in the uploaded PSP file.</p>
                            <p className="text-[11px] text-text-tertiary italic">Try searching for a different ID or amount.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border-subtle bg-bg-page flex items-center justify-between">
          <div className="flex items-center gap-2 text-[12px] text-text-tertiary">
            <AlertCircle size={14} />
            <span>Manual matches are logged in the audit trail.</span>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="px-6 py-2 border border-border-subtle rounded-lg text-[13px] font-medium text-text-secondary hover:bg-white transition-colors"
            >
              Cancel
            </button>
            <button 
              disabled={!selectedPspMatch}
              onClick={() => onMatch(selectedPspMatch)}
              className="px-8 py-2 bg-accent-interactive text-white rounded-lg text-[13px] font-bold hover:bg-accent-interactive/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-accent-interactive/20"
            >
              Confirm Match
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
