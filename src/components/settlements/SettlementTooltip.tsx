import React from 'react';
import { Settlement, SettlementStatus } from '../../types';
import { formatCurrency, getDerivedStatus } from '../../lib/settlements/calendarUtils';
import { format, differenceInDays } from 'date-fns';
import { CheckCircle2, Edit2, Trash2, Clock, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SettlementTooltipProps {
  settlement: Settlement;
  position: { top: number, left: number };
  onMarkReceived: (s: Settlement) => void;
  onEdit: (s: Settlement) => void;
  onDelete: (id: string) => void;
}

export const SettlementTooltip = ({ settlement, position, onMarkReceived, onEdit, onDelete }: SettlementTooltipProps) => {
  const status = getDerivedStatus(settlement);
  const now = new Date();
  const overdueDays = differenceInDays(now, new Date(settlement.expectedDate));

  return (
    <div 
      className="fixed z-[1000] w-[220px] bg-white border border-[#EBEBEB] rounded-xl p-4 shadow-xl pointer-events-auto"
      style={{ top: position.top, left: position.left }}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-[14px] font-bold text-text-primary">{settlement.psp}</span>
          <div className={cn(
            "flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider",
            status === 'Overdue' ? "text-red-600" : 
            status === 'Settled' ? "text-green-600" : 
            status === 'Pending' ? "text-amber-600" : "text-text-tertiary"
          )}>
            {status === 'Settled' ? <CheckCircle2 size={10} /> : status === 'Overdue' ? <AlertCircle size={10} /> : <Clock size={10} />}
            {status}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-[11px]">
            <span className="text-text-tertiary">Expected:</span>
            <span className="font-medium text-text-secondary">{format(new Date(settlement.expectedDate), 'EEE dd MMM')}</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-text-tertiary">Amount:</span>
            <span className="font-bold text-text-primary">{formatCurrency(settlement.expectedAmount, settlement.currency)}</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-text-tertiary">Settlement #:</span>
            <span className="font-mono text-text-secondary">{settlement.settlementNo}</span>
          </div>
          {status === 'Overdue' && (
            <div className="flex justify-between text-[11px]">
              <span className="text-red-600 font-medium">Days overdue:</span>
              <span className="text-red-600 font-bold">{overdueDays}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 pt-2 border-t border-[#EBEBEB]">
          {settlement.status !== 'Settled' && (
            <button 
              onClick={(e) => { e.stopPropagation(); onMarkReceived(settlement); }}
              className="w-full py-1.5 bg-green-50 text-green-600 text-[11px] font-bold rounded-md hover:bg-green-100 transition-colors flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 size={12} /> Mark as Received
            </button>
          )}
          <div className="flex items-center gap-2">
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit(settlement); }}
              className="flex-1 py-1.5 bg-bg-page text-text-secondary text-[11px] font-bold rounded-md hover:bg-accent-hover/30 transition-colors flex items-center justify-center gap-1.5"
            >
              <Edit2 size={12} /> Edit
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(settlement.id); }}
              className="p-1.5 text-text-tertiary hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
