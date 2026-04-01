import React from 'react';
import { 
  format, 
  isToday, 
  isSameDay, 
  startOfDay 
} from 'date-fns';
import { Settlement, SettlementStatus } from '../../types';
import { getWeekDays, getSettlementsForDay, formatCurrency, getDerivedStatus } from '../../lib/settlements/calendarUtils';
import { cn } from '../../lib/utils';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface WeekViewProps {
  currentDate: Date;
  settlements: Settlement[];
  onSettlementClick: (s: Settlement) => void;
  onSettlementHover: (e: React.MouseEvent, s: Settlement) => void;
  onSettlementLeave: () => void;
}

export const WeekView = ({ 
  currentDate, 
  settlements, 
  onSettlementClick, 
  onSettlementHover, 
  onSettlementLeave 
}: WeekViewProps) => {
  const days = React.useMemo(() => getWeekDays(currentDate), [currentDate]);

  const getStatusStyles = (status: SettlementStatus) => {
    switch (status) {
      case 'Scheduled':
        return 'border-[#EBEBEB] text-text-primary';
      case 'Pending':
        return 'border-[#F59E0B] bg-[#FFFBF0] text-[#92400E]';
      case 'Overdue':
        return 'border-[#EF4444] bg-[#FFF5F5] text-[#991B1B]';
      case 'Settled':
        return 'border-[#22C55E] bg-[#F0FDF4] text-[#166534]';
      case 'Partial':
        return 'border-[#6B5CE7] bg-[#F5F3FF] text-[#4338CA]';
      default:
        return 'border-[#EBEBEB] text-text-primary';
    }
  };

  return (
    <div className="bg-white border border-[#EBEBEB] rounded-xl overflow-hidden shadow-sm">
      <div className="grid grid-cols-7 min-h-[600px]">
        {days.map((day) => {
          const daySettlements = getSettlementsForDay(settlements, day);
          const isTdy = isToday(day);

          return (
            <div 
              key={day.toString()} 
              className={cn(
                "flex flex-col border-r border-[#F4F4F0] last:border-r-0",
                isTdy && "bg-[#EEF0FB]/30"
              )}
            >
              {/* Header */}
              <div className={cn(
                "p-4 border-b border-[#F4F4F0] flex flex-col items-center gap-1",
                isTdy && "bg-[#EEF0FB] text-accent-interactive"
              )}>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#B0B0BF]">
                  {format(day, 'EEE')}
                </span>
                <span className="text-[18px] font-bold">
                  {format(day, 'dd')}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 p-3 flex flex-col gap-3 overflow-y-auto custom-scrollbar">
                {daySettlements.map(s => {
                  const status = getDerivedStatus(s);
                  return (
                    <div 
                      key={s.id}
                      onClick={() => onSettlementClick(s)}
                      onMouseEnter={(e) => onSettlementHover(e, s)}
                      onMouseLeave={onSettlementLeave}
                      className={cn(
                        "p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md flex flex-col gap-2",
                        getStatusStyles(status)
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-bold truncate">{s.psp}</span>
                        {status === 'Settled' && <CheckCircle2 size={14} />}
                      </div>
                      <span className="text-[16px] font-bold">
                        {formatCurrency(s.expectedAmount, s.currency)}
                      </span>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
                        {status === 'Settled' ? <CheckCircle2 size={10} /> : status === 'Overdue' ? <AlertCircle size={10} /> : <Clock size={10} />}
                        {status}
                      </div>
                      <div className="text-[10px] text-text-tertiary font-medium">
                        Due: {format(new Date(s.expectedDate), 'EEE dd MMM')}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
