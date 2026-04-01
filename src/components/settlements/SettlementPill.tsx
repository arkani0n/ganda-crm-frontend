import React from 'react';
import { Settlement, SettlementStatus } from '../../types';
import { formatCurrency, getDerivedStatus } from '../../lib/settlements/calendarUtils';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SettlementPillProps {
  settlement: Settlement;
  onClick: (s: Settlement) => void;
  onMouseEnter: (e: React.MouseEvent, s: Settlement) => void;
  onMouseLeave: () => void;
}

export const SettlementPill: React.FC<SettlementPillProps> = ({ settlement, onClick, onMouseEnter, onMouseLeave }) => {
  const status = getDerivedStatus(settlement);
  
  const getStatusStyles = (status: SettlementStatus) => {
    switch (status) {
      case 'Scheduled':
        return 'bg-white border-[#EBEBEB] text-text-primary';
      case 'Pending':
        return 'bg-[#FFFBF0] border-[#F59E0B] text-[#92400E]';
      case 'Overdue':
        return 'bg-[#FFF5F5] border-[#EF4444] text-[#991B1B]';
      case 'Settled':
        return 'bg-[#F0FDF4] border-[#22C55E] text-[#166534]';
      case 'Partial':
        return 'bg-[#F5F3FF] border-[#6B5CE7] text-[#4338CA]';
      default:
        return 'bg-white border-[#EBEBEB] text-text-primary';
    }
  };

  const getDotColor = (psp: string) => {
    switch (psp) {
      case 'Stripe': return 'bg-blue-500';
      case 'PayPal': return 'bg-indigo-600';
      case 'Skrill': return 'bg-purple-600';
      case 'Neteller': return 'bg-green-600';
      case 'Trustly': return 'bg-teal-500';
      case 'Paysafecard': return 'bg-blue-400';
      case 'MuchBetter': return 'bg-orange-500';
      case 'Rapid Transfer': return 'bg-cyan-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div 
      className={cn(
        "flex items-center justify-between px-2 py-1 border rounded-md cursor-pointer transition-all hover:shadow-sm",
        getStatusStyles(status)
      )}
      onClick={() => onClick(settlement)}
      onMouseEnter={(e) => onMouseEnter(e, settlement)}
      onMouseLeave={onMouseLeave}
    >
      <div className="flex items-center gap-1.5 min-w-0">
        {status === 'Settled' && <CheckCircle2 size={10} className="shrink-0" />}
        <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", getDotColor(settlement.psp))} />
        <span className="text-[11px] font-medium truncate">{settlement.psp}</span>
      </div>
      <span className="text-[11px] font-bold shrink-0 ml-1">
        {settlement.status === 'Partial' && '~'}
        {formatCurrency(settlement.expectedAmount, settlement.currency)}
      </span>
    </div>
  );
};
