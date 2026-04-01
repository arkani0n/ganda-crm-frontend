import React from 'react';
import { Settlement } from '../../types';
import { formatCurrency } from '../../lib/settlements/calendarUtils';
import { TrendingUp, TrendingDown, Clock, AlertCircle, CheckCircle2, Calendar } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SettlementSummaryStripProps {
  settlements: Settlement[];
}

export const SettlementSummaryStrip = ({ settlements }: SettlementSummaryStripProps) => {
  const stats = React.useMemo(() => {
    const expected = settlements.reduce((acc, s) => acc + s.expectedAmount, 0);
    const received = settlements
      .filter(s => s.status === 'Settled' || s.status === 'Partial')
      .reduce((acc, s) => acc + (s.actualAmountReceived || 0), 0);
    
    const settledCount = settlements.filter(s => s.status === 'Settled').length;
    const pending = settlements
      .filter(s => s.status === 'Pending' || s.status === 'Scheduled')
      .reduce((acc, s) => acc + s.expectedAmount, 0);
    
    const overdue = settlements
      .filter(s => s.status === 'Overdue')
      .reduce((acc, s) => acc + s.expectedAmount, 0);
    
    const overdueCount = settlements.filter(s => s.status === 'Overdue').length;
    const pspCount = new Set(settlements.map(s => s.psp)).size;

    return {
      expected,
      received,
      settledCount,
      totalCount: settlements.length,
      pending,
      overdue,
      overdueCount,
      pspCount
    };
  }, [settlements]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Expected This Month */}
      <div className="bg-white border border-border-subtle rounded-xl p-4 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-accent-interactive" />
        <div className="flex items-center justify-between mb-2">
          <span className="text-[12px] font-medium text-text-tertiary">Expected This Month</span>
          <Calendar size={16} className="text-accent-interactive" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[20px] font-bold text-text-primary tracking-tight">
            {formatCurrency(stats.expected)}
          </span>
          <span className="text-[11px] text-text-tertiary">across {stats.pspCount} PSPs</span>
        </div>
      </div>

      {/* Received */}
      <div className="bg-white border border-border-subtle rounded-xl p-4 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-green-500" />
        <div className="flex items-center justify-between mb-2">
          <span className="text-[12px] font-medium text-text-tertiary">Received</span>
          <CheckCircle2 size={16} className="text-green-500" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[20px] font-bold text-text-primary tracking-tight">
            {formatCurrency(stats.received)}
          </span>
          <span className="text-[11px] text-text-tertiary">{stats.settledCount} of {stats.totalCount} settlements</span>
        </div>
      </div>

      {/* Pending */}
      <div className="bg-white border border-border-subtle rounded-xl p-4 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
        <div className="flex items-center justify-between mb-2">
          <span className="text-[12px] font-medium text-text-tertiary">Pending</span>
          <Clock size={16} className="text-amber-500" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[20px] font-bold text-text-primary tracking-tight">
            {formatCurrency(stats.pending)}
          </span>
          <span className="text-[11px] text-text-tertiary">due in next few days</span>
        </div>
      </div>

      {/* Overdue */}
      <div className="bg-white border border-border-subtle rounded-xl p-4 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-red-500" />
        <div className="flex items-center justify-between mb-2">
          <span className="text-[12px] font-medium text-text-tertiary">Overdue</span>
          <AlertCircle size={16} className="text-red-500" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className={cn(
            "text-[20px] font-bold tracking-tight transition-opacity",
            stats.overdueCount > 0 ? "text-red-600 animate-pulse-subtle" : "text-text-primary"
          )}>
            {formatCurrency(stats.overdue)}
          </span>
          <span className="text-[11px] text-text-tertiary">{stats.overdueCount} settlements delayed</span>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse-subtle {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}} />
    </div>
  );
};
