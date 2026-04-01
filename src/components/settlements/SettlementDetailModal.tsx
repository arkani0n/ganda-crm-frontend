import React from 'react';
import { X, Calendar, DollarSign, Clock, CheckCircle2, AlertCircle, Edit2, Trash2, FileText, ArrowRight } from 'lucide-react';
import { Settlement, SettlementStatus } from '../../types';
import { formatCurrency, getDerivedStatus } from '../../lib/settlements/calendarUtils';
import { format, differenceInDays } from 'date-fns';
import { cn } from '../../lib/utils';

interface SettlementDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  settlement: Settlement;
  onMarkReceived: (s: Settlement) => void;
  onEdit: (s: Settlement) => void;
  onDelete: (id: string) => void;
  onGenerateReminder: (s: Settlement) => void;
}

export const SettlementDetailModal = ({ 
  isOpen, 
  onClose, 
  settlement, 
  onMarkReceived, 
  onEdit, 
  onDelete,
  onGenerateReminder
}: SettlementDetailModalProps) => {
  if (!isOpen) return null;

  const status = getDerivedStatus(settlement);
  const now = new Date();
  const overdueDays = differenceInDays(now, new Date(settlement.expectedDate));

  const getStatusPill = (status: SettlementStatus) => {
    const styles = {
      'Scheduled': 'bg-bg-page text-text-tertiary border-[#EBEBEB]',
      'Pending': 'bg-[#FFFBF0] text-[#92400E] border-[#F59E0B]',
      'Overdue': 'bg-[#FFF5F5] text-[#991B1B] border-[#EF4444]',
      'Settled': 'bg-[#F0FDF4] text-[#166534] border-[#22C55E]',
      'Partial': 'bg-[#F5F3FF] text-[#4338CA] border-[#6B5CE7]',
      'Disputed': 'bg-red-50 text-red-600 border-red-200'
    };

    return (
      <div className={cn(
        "px-3 py-1 border rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5",
        styles[status]
      )}>
        {status === 'Settled' ? <CheckCircle2 size={12} /> : status === 'Overdue' ? <AlertCircle size={12} /> : <Clock size={12} />}
        {status}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-[520px] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between bg-bg-page/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-border-subtle shadow-sm">
              <img 
                src={`https://picsum.photos/seed/${settlement.psp}/100/100`} 
                alt={settlement.psp} 
                className="w-6 h-6 object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex flex-col">
              <h2 className="text-[18px] font-bold text-text-primary tracking-tight">{settlement.psp}</h2>
              <span className="text-[12px] text-text-tertiary">Settlement Details</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {getStatusPill(status)}
            <button onClick={onClose} className="p-2 hover:bg-bg-page rounded-full transition-colors text-text-tertiary">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col gap-8">
          {/* Detail Grid */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Settlement #</span>
                <span className="text-[14px] font-mono font-medium text-text-primary">{settlement.settlementNo}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Brand</span>
                <span className="text-[14px] font-medium text-text-primary">{settlement.brand}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Expected Date</span>
                <span className="text-[14px] font-medium text-text-primary">{format(new Date(settlement.expectedDate), 'EEEE, dd MMMM yyyy')}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Expected Amount</span>
                <span className="text-[16px] font-bold text-text-primary">{formatCurrency(settlement.expectedAmount, settlement.currency)}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Rolling Reserve</span>
                <span className="text-[14px] font-medium text-text-secondary">{formatCurrency(settlement.rollingReserve || 0, settlement.currency)}</span>
              </div>
              <div className="flex flex-col gap-1 pt-2 border-t border-border-subtle">
                <span className="text-[10px] font-bold text-accent-interactive uppercase tracking-wider">Net Expected</span>
                <span className="text-[18px] font-bold text-accent-interactive">{formatCurrency(settlement.netExpected, settlement.currency)}</span>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Status</span>
                <span className="text-[14px] font-medium text-text-primary">{status}</span>
              </div>
              {settlement.status === 'Settled' && (
                <>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Actual Received Date</span>
                    <span className="text-[14px] font-medium text-text-primary">
                      {settlement.actualReceivedDate ? format(new Date(settlement.actualReceivedDate), 'dd MMM yyyy') : '-'}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Actual Amount</span>
                    <span className="text-[16px] font-bold text-text-primary">
                      {formatCurrency(settlement.actualAmountReceived || 0, settlement.currency)}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Variance</span>
                    <div className={cn(
                      "flex items-center gap-1 text-[14px] font-bold",
                      (settlement.variance || 0) > 0 ? "text-green-600" : (settlement.variance || 0) < 0 ? "text-red-600" : "text-text-secondary"
                    )}>
                      {(settlement.variance || 0) > 0 ? '↑' : (settlement.variance || 0) < 0 ? '↓' : ''}
                      {formatCurrency(Math.abs(settlement.variance || 0), settlement.currency)}
                    </div>
                  </div>
                </>
              )}
              {status === 'Overdue' && (
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Days Overdue</span>
                  <span className="text-[20px] font-bold text-red-600">{overdueDays} days late</span>
                </div>
              )}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Notes</span>
                <p className="text-[13px] text-text-secondary leading-relaxed italic">
                  {settlement.notes || 'No internal notes provided.'}
                </p>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="flex flex-col gap-4">
            <h3 className="text-[13px] font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
              <Clock size={14} className="text-text-tertiary" /> Timeline
            </h3>
            <div className="flex flex-col gap-4 relative pl-4 border-l-2 border-border-subtle ml-2">
              {settlement.timeline.map((event, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-[25px] top-1 w-4 h-4 bg-white border-2 border-accent-interactive rounded-full" />
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-bold text-text-primary">Status changed to {event.status}</span>
                      <span className="text-[11px] text-text-tertiary">{format(new Date(event.timestamp), 'dd MMM, HH:mm')}</span>
                    </div>
                    {event.note && <p className="text-[12px] text-text-tertiary">{event.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border-subtle flex items-center justify-between bg-bg-page/30">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => onEdit(settlement)}
              className="p-2 text-text-tertiary hover:text-accent-interactive hover:bg-accent-hover/30 rounded-lg transition-all"
            >
              <Edit2 size={18} />
            </button>
            <button 
              onClick={() => onDelete(settlement.id)}
              className="p-2 text-text-tertiary hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
            >
              <Trash2 size={18} />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => onGenerateReminder(settlement)}
              className="px-4 py-2 text-[13px] font-bold text-accent-interactive hover:bg-accent-hover/30 rounded-lg transition-all"
            >
              Generate Reminder
            </button>
            {settlement.status !== 'Settled' && (
              <button 
                onClick={() => onMarkReceived(settlement)}
                className="px-6 py-2 bg-green-600 text-white text-[13px] font-bold rounded-lg hover:bg-green-700 transition-all shadow-lg shadow-green-600/20 flex items-center gap-2"
              >
                <CheckCircle2 size={16} /> Mark as Received
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
