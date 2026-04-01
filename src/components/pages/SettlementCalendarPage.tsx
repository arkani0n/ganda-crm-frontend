import React from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  addWeeks, 
  subWeeks, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth,
  startOfDay
} from 'date-fns';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon, 
  List, 
  LayoutGrid,
  Search,
  Filter,
  Download
} from 'lucide-react';
import { Settlement, Gateway, Brand } from '../../types';
import { SettlementSummaryStrip } from '../settlements/SettlementSummaryStrip';
import { MonthView } from '../settlements/MonthView';
import { WeekView } from '../settlements/WeekView';
import { ListView } from '../settlements/ListView';
import { OverdueAlertsBanner } from '../settlements/OverdueAlertsBanner';
import { SettlementTooltip } from '../settlements/SettlementTooltip';
import { SettlementFormModal } from '../settlements/SettlementFormModal';
import { SettlementDetailModal } from '../settlements/SettlementDetailModal';
import { cn } from '../../lib/utils';

interface SettlementCalendarPageProps {
  settlements: Settlement[];
  onAddSettlement: (s: Settlement) => void;
  onUpdateSettlement: (s: Settlement) => void;
  onDeleteSettlement: (id: string) => void;
  gateways: Gateway[];
  brands: Brand[];
}

export const SettlementCalendarPage = ({ 
  settlements, 
  onAddSettlement, 
  onUpdateSettlement, 
  onDeleteSettlement,
  gateways,
  brands
}: SettlementCalendarPageProps) => {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [view, setView] = React.useState<'Month' | 'Week' | 'List'>('Month');
  const [showFormModal, setShowFormModal] = React.useState(false);
  const [editingSettlement, setEditingSettlement] = React.useState<Settlement | null>(null);
  const [selectedSettlement, setSelectedSettlement] = React.useState<Settlement | null>(null);
  const [hoveredSettlement, setHoveredSettlement] = React.useState<{ s: Settlement, pos: { top: number, left: number } } | null>(null);
  const [bannerDismissed, setBannerDismissed] = React.useState(false);

  const overdueSettlements = React.useMemo(() => 
    settlements.filter(s => s.status === 'Overdue'), 
  [settlements]);

  const currentMonthSettlements = React.useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return settlements.filter(s => {
      const d = new Date(s.expectedDate);
      return d >= start && d <= end;
    });
  }, [settlements, currentDate]);

  const handlePrev = () => {
    if (view === 'Month' || view === 'List') setCurrentDate(subMonths(currentDate, 1));
    else setCurrentDate(subWeeks(currentDate, 1));
  };

  const handleNext = () => {
    if (view === 'Month' || view === 'List') setCurrentDate(addMonths(currentDate, 1));
    else setCurrentDate(addWeeks(currentDate, 1));
  };

  const handleSettlementHover = (e: React.MouseEvent, s: Settlement) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredSettlement({
      s,
      pos: {
        top: rect.top - 10, // Position above
        left: rect.left + rect.width / 2 - 110 // Center horizontally
      }
    });
  };

  const handleMarkReceived = (s: Settlement) => {
    const updated: Settlement = {
      ...s,
      status: 'Settled',
      actualReceivedDate: new Date(),
      actualAmountReceived: s.expectedAmount,
      variance: 0,
      timeline: [...s.timeline, { status: 'Settled', timestamp: new Date(), note: 'Marked as received' }]
    };
    onUpdateSettlement(updated);
    setHoveredSettlement(null);
    setSelectedSettlement(null);
  };

  const handleGenerateReminder = (s: Settlement) => {
    const text = `Hi ${s.psp}, settlement ${s.settlementNo} for ${new Intl.NumberFormat('en-IE', { style: 'currency', currency: s.currency }).format(s.expectedAmount)} was expected on ${format(new Date(s.expectedDate), 'dd MMM yyyy')} and has not been received. Please provide an update.`;
    navigator.clipboard.writeText(text);
    // In a real app, show a toast
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[24px] font-bold text-text-primary tracking-tight">Settlement Calendar</h1>
          <p className="text-[13px] text-text-tertiary">
            {view === 'Month' || view === 'List' ? format(currentDate, 'MMMM yyyy') : `Week of ${format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'dd MMM')} - ${format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'dd MMM yyyy')}`}
          </p>
        </div>

        <div className="flex items-center gap-6">
          {/* Navigation */}
          <div className="flex items-center gap-2 bg-white border border-[#EBEBEB] rounded-lg p-1 shadow-sm">
            <button 
              onClick={handlePrev}
              className="p-1.5 hover:bg-bg-page rounded-md transition-colors text-text-secondary"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-[13px] font-bold px-2 min-w-[120px] text-center">
              {view === 'Month' || view === 'List' ? format(currentDate, 'MMMM yyyy') : format(currentDate, 'MMM yyyy')}
            </span>
            <button 
              onClick={handleNext}
              className="p-1.5 hover:bg-bg-page rounded-md transition-colors text-text-secondary"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* View Toggle */}
          <div className="flex items-center bg-white border border-[#EBEBEB] rounded-lg p-1 shadow-sm">
            {[
              { id: 'Month', icon: LayoutGrid },
              { id: 'Week', icon: CalendarIcon },
              { id: 'List', icon: List }
            ].map(v => (
              <button
                key={v.id}
                onClick={() => setView(v.id as any)}
                className={cn(
                  "flex items-center gap-2 px-4 py-1.5 rounded-md text-[13px] font-bold transition-all",
                  view === v.id ? "bg-accent-interactive text-white shadow-md" : "text-text-tertiary hover:text-text-secondary hover:bg-bg-page"
                )}
              >
                <v.icon size={16} /> {v.id}
              </button>
            ))}
          </div>

          <button 
            onClick={() => { setEditingSettlement(null); setShowFormModal(true); }}
            className="flex items-center gap-2 px-6 py-2.5 bg-accent-interactive text-white rounded-lg text-[13px] font-bold hover:bg-accent-interactive/90 transition-all shadow-lg shadow-accent-interactive/20"
          >
            <Plus size={18} /> Add Expected Settlement
          </button>
        </div>
      </div>

      {/* Overdue Banner */}
      {!bannerDismissed && (
        <OverdueAlertsBanner 
          overdueSettlements={overdueSettlements}
          onReview={() => { setView('List'); setBannerDismissed(true); }}
          onDismiss={() => setBannerDismissed(true)}
        />
      )}

      {/* Summary Strip */}
      <SettlementSummaryStrip settlements={currentMonthSettlements} />

      {/* Main View Area */}
      <div className="relative">
        {view === 'Month' && (
          <MonthView 
            currentDate={currentDate}
            settlements={settlements}
            onSettlementClick={setSelectedSettlement}
            onSettlementHover={handleSettlementHover}
            onSettlementLeave={() => setHoveredSettlement(null)}
          />
        )}
        {view === 'Week' && (
          <WeekView 
            currentDate={currentDate}
            settlements={settlements}
            onSettlementClick={setSelectedSettlement}
            onSettlementHover={handleSettlementHover}
            onSettlementLeave={() => setHoveredSettlement(null)}
          />
        )}
        {view === 'List' && (
          <ListView 
            settlements={settlements}
            onSettlementClick={setSelectedSettlement}
            onMarkReceived={handleMarkReceived}
            onEdit={(s) => { setEditingSettlement(s); setShowFormModal(true); }}
            onDelete={onDeleteSettlement}
          />
        )}

        {/* Hover Tooltip */}
        {hoveredSettlement && (
          <SettlementTooltip 
            settlement={hoveredSettlement.s}
            position={hoveredSettlement.pos}
            onMarkReceived={handleMarkReceived}
            onEdit={(s) => { setEditingSettlement(s); setShowFormModal(true); setHoveredSettlement(null); }}
            onDelete={(id) => { onDeleteSettlement(id); setHoveredSettlement(null); }}
          />
        )}
      </div>

      {/* Modals */}
      <SettlementFormModal 
        isOpen={showFormModal}
        onClose={() => { setShowFormModal(false); setEditingSettlement(null); }}
        onSave={(s) => {
          if (editingSettlement) onUpdateSettlement(s);
          else onAddSettlement(s);
          setShowFormModal(false);
          setEditingSettlement(null);
        }}
        settlement={editingSettlement}
        gateways={gateways}
        brands={brands}
      />

      {selectedSettlement && (
        <SettlementDetailModal 
          isOpen={!!selectedSettlement}
          onClose={() => setSelectedSettlement(null)}
          settlement={selectedSettlement}
          onMarkReceived={handleMarkReceived}
          onEdit={(s) => { setEditingSettlement(s); setShowFormModal(true); setSelectedSettlement(null); }}
          onDelete={(id) => { onDeleteSettlement(id); setSelectedSettlement(null); }}
          onGenerateReminder={handleGenerateReminder}
        />
      )}
    </div>
  );
};
