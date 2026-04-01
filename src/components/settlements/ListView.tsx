import React from 'react';
import { Settlement, SettlementStatus } from '../../types';
import { formatCurrency, getDerivedStatus } from '../../lib/settlements/calendarUtils';
import { format, differenceInDays, isSameMonth, isToday } from 'date-fns';
import { CheckCircle2, Clock, AlertCircle, Edit2, Trash2, Search, Filter, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ListViewProps {
  settlements: Settlement[];
  onSettlementClick: (s: Settlement) => void;
  onMarkReceived: (s: Settlement) => void;
  onEdit: (s: Settlement) => void;
  onDelete: (id: string) => void;
}

export const ListView = ({ settlements, onSettlementClick, onMarkReceived, onEdit, onDelete }: ListViewProps) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [pspFilter, setPspFilter] = React.useState<string>('All');
  const [statusFilter, setStatusFilter] = React.useState<string>('All');

  const filteredSettlements = React.useMemo(() => {
    return settlements
      .filter(s => {
        const matchesSearch = s.settlementNo.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             s.psp.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPsp = pspFilter === 'All' || s.psp === pspFilter;
        const matchesStatus = statusFilter === 'All' || getDerivedStatus(s) === statusFilter;
        return matchesSearch && matchesPsp && matchesStatus;
      })
      .sort((a, b) => new Date(a.expectedDate).getTime() - new Date(b.expectedDate).getTime());
  }, [settlements, searchQuery, pspFilter, statusFilter]);

  const groupedSettlements = React.useMemo(() => {
    const groups: { [key: string]: Settlement[] } = {};
    filteredSettlements.forEach(s => {
      const monthKey = format(new Date(s.expectedDate), 'MMMM yyyy');
      if (!groups[monthKey]) groups[monthKey] = [];
      groups[monthKey].push(s);
    });
    return groups;
  }, [filteredSettlements]);

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
        "px-2 py-0.5 border rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 w-fit",
        styles[status]
      )}>
        {status === 'Settled' ? <CheckCircle2 size={10} /> : status === 'Overdue' ? <AlertCircle size={10} /> : <Clock size={10} />}
        {status}
      </div>
    );
  };

  const getDaysUntil = (date: Date, status: SettlementStatus) => {
    if (status === 'Settled') return <span className="text-green-600 font-medium">Received</span>;
    
    const now = new Date();
    const diff = differenceInDays(new Date(date), now);
    
    if (isToday(new Date(date))) return <span className="text-amber-600 font-bold">Today</span>;
    if (diff < 0) return <span className="text-red-600 font-bold">{Math.abs(diff)} days late</span>;
    return <span className="text-green-600 font-medium">in {diff} days</span>;
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 border border-[#EBEBEB] rounded-xl shadow-sm">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" size={16} />
            <input 
              type="text"
              placeholder="Search by Settlement # or PSP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-bg-page border border-border-subtle rounded-lg text-[13px] focus:outline-none focus:border-accent-interactive transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <select 
                value={pspFilter}
                onChange={(e) => setPspFilter(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 bg-bg-page border border-border-subtle rounded-lg text-[13px] font-medium focus:outline-none focus:border-accent-interactive cursor-pointer"
              >
                <option value="All">All PSPs</option>
                {Array.from(new Set(settlements.map(s => s.psp))).map(psp => (
                  <option key={psp} value={psp}>{psp}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
            </div>
            <div className="relative">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 bg-bg-page border border-border-subtle rounded-lg text-[13px] font-medium focus:outline-none focus:border-accent-interactive cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Pending">Pending</option>
                <option value="Overdue">Overdue</option>
                <option value="Settled">Settled</option>
                <option value="Partial">Partial</option>
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#EBEBEB] rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-bg-page/50 border-b border-[#EBEBEB]">
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-text-tertiary">Status</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-text-tertiary">PSP</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-text-tertiary">Expected Date</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-text-tertiary">Amount</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-text-tertiary">Settlement #</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-text-tertiary">Days Until/Overdue</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-text-tertiary text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(groupedSettlements).map(([month, items]) => (
              <React.Fragment key={month}>
                <tr className="bg-[#F4F4F0] sticky top-0 z-10">
                  <td colSpan={7} className="px-6 py-2 text-[13px] font-bold text-text-secondary">
                    {month} — {formatCurrency((items as Settlement[]).reduce((acc, s) => acc + s.expectedAmount, 0))} expected
                  </td>
                </tr>
                {(items as Settlement[]).map((s) => {
                  const status = getDerivedStatus(s);
                  return (
                    <tr 
                      key={s.id} 
                      onClick={() => onSettlementClick(s)}
                      className="border-b border-[#F4F4F0] last:border-b-0 hover:bg-bg-page/30 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4">{getStatusPill(status)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-bg-page rounded-lg flex items-center justify-center border border-border-subtle">
                            <img 
                              src={`https://picsum.photos/seed/${s.psp}/100/100`} 
                              alt={s.psp} 
                              className="w-5 h-5 object-contain"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <span className="text-[13px] font-bold text-text-primary">{s.psp}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[13px] text-text-secondary">
                        {format(new Date(s.expectedDate), 'dd MMM yyyy')}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[13px] font-bold text-text-primary">
                          {formatCurrency(s.expectedAmount, s.currency)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[13px] font-mono text-text-tertiary">
                        {s.settlementNo}
                      </td>
                      <td className="px-6 py-4 text-[13px]">
                        {getDaysUntil(s.expectedDate, status)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                          {s.status !== 'Settled' && (
                            <button 
                              onClick={() => onMarkReceived(s)}
                              className="px-3 py-1.5 text-green-600 text-[11px] font-bold hover:bg-green-50 rounded-md transition-colors flex items-center gap-1.5"
                            >
                              <CheckCircle2 size={14} /> Mark Received
                            </button>
                          )}
                          <button 
                            onClick={() => onEdit(s)}
                            className="p-2 text-text-tertiary hover:text-accent-interactive hover:bg-accent-hover/30 rounded-md transition-colors"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            onClick={() => onDelete(s.id)}
                            className="p-2 text-text-tertiary hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
