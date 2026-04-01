import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Copy, ExternalLink, AlertCircle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { Transaction } from '../../types';
import { Badge } from '../shared/Badge';

interface TransactionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTxn: Transaction;
}

export const TransactionDetailsModal = ({ 
  isOpen, 
  onClose, 
  selectedTxn 
}: TransactionDetailsModalProps) => {
  if (!isOpen) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

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
        className="relative w-full max-w-[480px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="txn-details-title"
      >
        <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between">
          <h2 id="txn-details-title" className="text-[15px] font-bold text-text-primary">Transaction Details</h2>
          <button onClick={onClose} className="text-text-tertiary hover:text-text-primary transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-text-tertiary uppercase">Transaction ID</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[14px] font-semibold text-accent-interactive">{selectedTxn.txnId}</span>
                <button onClick={() => copyToClipboard(selectedTxn.txnId)} className="text-text-tertiary hover:text-accent-interactive transition-colors">
                  <Copy size={12} />
                </button>
              </div>
            </div>
            <Badge variant={selectedTxn.status}>{selectedTxn.status}</Badge>
          </div>

          <div className="grid grid-cols-2 gap-y-4 gap-x-8">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-text-tertiary uppercase">Timestamp</span>
              <p className="text-[13px] font-medium">{format(selectedTxn.timestamp, 'dd MMM yyyy HH:mm:ss')}</p>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-text-tertiary uppercase">Client</span>
              <p className="text-[13px] font-medium">{selectedTxn.client}</p>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-text-tertiary uppercase">Brand</span>
              <p className="text-[13px] font-medium">{selectedTxn.brand}</p>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-text-tertiary uppercase">Gateway</span>
              <p className="text-[13px] font-medium">{selectedTxn.gateway}</p>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-text-tertiary uppercase">Amount</span>
              <p className="text-[16px] font-bold text-accent-primary">{selectedTxn.amount.toLocaleString()} {selectedTxn.currency}</p>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-text-tertiary uppercase">Currency</span>
              <p className="text-[13px] font-medium">{selectedTxn.currency}</p>
            </div>
          </div>

          <div className="p-4 bg-bg-page border border-border-subtle rounded-xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-text-tertiary uppercase">Reconciliation Status</span>
              <Badge variant={selectedTxn.recon === 'Pending' ? 'ReconPending' : selectedTxn.recon}>{selectedTxn.recon}</Badge>
            </div>
            <div className="text-[12px] text-text-secondary leading-relaxed">
              {selectedTxn.recon === 'Matched' 
                ? "This transaction has been successfully matched with the gateway settlement report."
                : selectedTxn.recon === 'Unmatched'
                  ? "Discrepancy detected between internal ledger and gateway report. Manual review required."
                  : "Awaiting gateway statement for final reconciliation."}
            </div>
          </div>

          {selectedTxn.notes && (
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-text-tertiary uppercase">Internal Notes</span>
              <p className="text-[12px] text-text-secondary italic">"{selectedTxn.notes}"</p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border-subtle bg-bg-page flex items-center justify-between">
          <button className="text-[12px] font-semibold text-text-tertiary hover:text-text-primary transition-colors flex items-center gap-1.5">
            <ExternalLink size={14} /> View in Gateway
          </button>
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="px-6 py-2 border border-border-subtle rounded-lg text-[13px] font-medium text-text-secondary hover:bg-white transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
