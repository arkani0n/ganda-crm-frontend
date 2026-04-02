import React from 'react';
import { 
  format, 
  isSameMonth, 
  isSameDay, 
  isToday, 
  isWeekend, 
  isBefore, 
  startOfDay 
} from 'date-fns';
import { Settlement } from '../../types';
import { getCalendarDays, getSettlementsForDay } from '../../lib/settlements/calendarUtils';
import { SettlementPill } from './SettlementPill';
import { cn } from '../../lib/utils';

interface MonthViewProps {
  currentDate: Date;
  settlements: Settlement[];
  onSettlementClick: (s: Settlement) => void;
  onSettlementHover: (e: React.MouseEvent, s: Settlement) => void;
  onSettlementLeave: () => void;
}

export const MonthView = ({ 
  currentDate, 
  settlements, 
  onSettlementClick, 
  onSettlementHover, 
  onSettlementLeave 
}: MonthViewProps) => {
  const days = React.useMemo(() => getCalendarDays(currentDate), [currentDate]);
  const now = startOfDay(new Date());

  return (
    <div className="bg-white border border-[#EBEBEB] rounded-xl overflow-hidden shadow-sm">
      {/* Header Row */}
      <div className="grid grid-cols-7 border-b border-[#EBEBEB]">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
          <div key={day} className="py-3 text-center text-[11px] font-bold uppercase tracking-wider text-[#B0B0BF]">
            {day}
          </div>
        ))}
      </div>

      {/* Day Cells */}
      <div className="grid grid-cols-7">
        {days.map((day, idx) => {
          const daySettlements = getSettlementsForDay(settlements, day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isPast = isBefore(day, now);
          const isWknd = isWeekend(day);
          const isTdy = isToday(day);

          return (
            <div 
              key={day.toString()} 
              className={cn(
                "min-h-[120px] p-2 border-r border-b border-[#F4F4F0] flex flex-col gap-2 transition-colors",
                isTdy && "bg-accent-interactive/10 border-accent-interactive/20",
                !isCurrentMonth && !isTdy && "bg-[#FAFAFA]/50",
                isPast && !isTdy && "bg-[#FAFAFA]",
                isWknd && !isTdy && "bg-[#FAFAFA]/80",
                idx % 7 === 6 && "border-r-0"
              )}
            >
              <div className="flex items-start justify-between">
                <span className={cn(
                  "text-[12px] font-medium",
                  !isCurrentMonth ? "text-[#D0D0D0]" : "text-text-primary",
                  isTdy && "text-accent-interactive font-bold"
                )}>
                  {format(day, 'd')}
                </span>
              </div>

              <div className="flex flex-col gap-1 overflow-y-auto custom-scrollbar max-h-[80px]">
                {daySettlements.slice(0, 3).map(s => (
                  <SettlementPill 
                    key={s.id} 
                    settlement={s} 
                    onClick={onSettlementClick}
                    onMouseEnter={onSettlementHover}
                    onMouseLeave={onSettlementLeave}
                  />
                ))}
                {daySettlements.length > 3 && (
                  <div className="text-[10px] font-bold text-text-tertiary px-2 py-1 bg-bg-page rounded-md text-center">
                    +{daySettlements.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
