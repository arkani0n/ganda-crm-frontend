import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Settlement } from '../../types';
import { formatCurrency } from '../../lib/settlements/calendarUtils';
import { differenceInDays } from 'date-fns';

interface OverdueAlertsBannerProps {
  overdueSettlements: Settlement[];
  onReview: () => void;
  onDismiss: () => void;
}

export const OverdueAlertsBanner = ({ overdueSettlements, onReview, onDismiss }: OverdueAlertsBannerProps) => {
  if (overdueSettlements.length === 0) return null;

  const totalOverdue = overdueSettlements.reduce((acc, s) => acc + s.expectedAmount, 0);
  const now = new Date();

  return (
    <div className="bg-[#FFFBF0] border-l-[3px] border-[#F59E0B] rounded-lg p-3 flex items-center justify-between gap-4 shadow-sm mb-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-[#F59E0B]/10 rounded-full flex items-center justify-center text-[#F59E0B] shrink-0">
          <AlertTriangle size={18} />
        </div>
        <div className="flex flex-col">
          <span className="text-[13px] font-bold text-[#92400E]">
            {overdueSettlements.length} settlements overdue — total {formatCurrency(totalOverdue)} not received
          </span>
          <div className="flex items-center gap-2 text-[11px] text-[#B45309]">
            {overdueSettlements.slice(0, 3).map((s, idx) => (
              <React.Fragment key={s.id}>
                <span>{s.psp} ({differenceInDays(now, new Date(s.expectedDate))} days late)</span>
                {idx < Math.min(overdueSettlements.length, 3) - 1 && <span>·</span>}
              </React.Fragment>
            ))}
            {overdueSettlements.length > 3 && <span>and {overdueSettlements.length - 3} more</span>}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-3 shrink-0">
        <button 
          onClick={onReview}
          className="px-3 py-1.5 bg-[#F59E0B] text-white text-[11px] font-bold rounded-md hover:bg-[#D97706] transition-colors"
        >
          Review
        </button>
        <button 
          onClick={onDismiss}
          className="p-1 text-[#F59E0B] hover:bg-[#F59E0B]/10 rounded-md transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
