import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  LayoutGrid, 
  RefreshCw, 
  ArrowUpRight, 
  ArrowDownRight, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Download, 
  FileSpreadsheet, 
  Bell, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Copy,
  CreditCard,
  BarChart3,
  ShieldAlert,
  Layers,
  Building2,
  Wallet,
  LogOut,
  Filter,
  Upload,
  Check,
  Eye,
  EyeOff,
  Link2,
  Grid,
  List,
  Plus,
  Activity,
  History,
  Edit2,
  Power,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  MoreVertical,
  ArrowRight
} from 'lucide-react';
import { format, subDays, differenceInDays, startOfDay, endOfDay } from 'date-fns';
import { cn } from './lib/utils';
import { generateMockData, generatePSPMockData, generatePSPHistory } from './mockData';
import { Transaction, Gateway, Status, ReconStatus, ReconResult, ReconMatchStatus, PSPConfig, PSPHistoryEntry, PSPStatus, PSPCategory, SettlementFrequency } from './types';
import { motion, AnimatePresence } from 'motion/react';

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) => (
  <button 
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-4 py-2.5 text-[13px] transition-colors border-l-2",
      active 
        ? "bg-accent-hover text-accent-interactive border-accent-interactive font-medium" 
        : "text-text-secondary border-transparent hover:bg-bg-page"
    )}
  >
    <Icon size={18} />
    <span>{label}</span>
  </button>
);

const SummaryCard = ({ title, value, label, trend, icon: Icon, trendUp, subline, accentColor }: { title: string, value: string, label: string, trend?: string, icon: any, trendUp?: boolean, subline?: string, accentColor?: string }) => (
  <div className={cn(
    "bg-white border border-border-subtle rounded-xl p-4 card-shadow flex flex-col justify-between h-full relative overflow-hidden",
    accentColor && `border-t-4 ${accentColor}`
  )}>
    <div className="flex justify-between items-start">
      <div className="flex flex-col">
        <span className="text-[11px] uppercase tracking-wider text-text-secondary font-medium mb-1">{label}</span>
        <span className="text-2xl font-semibold text-text-primary">{value}</span>
      </div>
      <div className="p-2 bg-bg-page rounded-lg text-text-tertiary">
        <Icon size={20} />
      </div>
    </div>
    {trend && (
      <div className={cn(
        "flex items-center gap-1 text-[12px] mt-3 font-medium",
        trendUp ? "text-green-600" : "text-red-600"
      )}
      >
        {trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        <span>{trend}</span>
        <span className="text-text-tertiary font-normal ml-1">vs last month</span>
      </div>
    )}
    {subline && (
      <div className="text-[11px] text-text-tertiary mt-3 font-medium uppercase tracking-tight">
        {subline}
      </div>
    )}
  </div>
);

const Badge = ({ children, variant }: { children: React.ReactNode, variant: string }) => {
  const variants: Record<string, string> = {
    Completed: "bg-green-50 text-green-700 border-green-100",
    Pending: "bg-amber-50 text-amber-700 border-amber-100",
    Failed: "bg-red-50 text-red-700 border-red-100",
    Disputed: "bg-orange-50 text-orange-700 border-orange-100",
    Matched: "bg-green-50 text-green-700 border-green-100",
    Unmatched: "bg-red-50 text-red-700 border-red-100",
    ReconPending: "bg-gray-50 text-gray-600 border-gray-100",
    Stripe: "bg-blue-50 text-blue-700 border-blue-100",
    PayPal: "bg-indigo-50 text-indigo-700 border-indigo-100",
    Skrill: "bg-purple-50 text-purple-700 border-purple-100",
    Neteller: "bg-emerald-50 text-emerald-700 border-emerald-100",
    Trustly: "bg-teal-50 text-teal-700 border-teal-100",
    Paysafecard: "bg-pink-50 text-pink-700 border-pink-100",
    MuchBetter: "bg-orange-50 text-orange-700 border-orange-100",
    RapidTransfer: "bg-cyan-50 text-cyan-700 border-cyan-100",
    'Missing in PSP': "bg-red-50 text-red-700 border-red-100",
    'Not in system': "bg-amber-50 text-amber-700 border-amber-100",
    'Amount diff': "bg-purple-50 text-purple-700 border-purple-100",
  };

  return (
    <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-medium border", variants[variant] || "bg-gray-50 text-gray-600")}>
      {children}
    </span>
  );
};

const MultiSelect = ({ label, options, selected, onChange }: { label: string, options: string[], selected: string[], onChange: (val: string[]) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (opt: string) => {
    if (opt === 'All') {
      onChange(['All']);
    } else {
      let next = selected.filter(s => s !== 'All');
      if (next.includes(opt)) {
        next = next.filter(s => s !== opt);
        if (next.length === 0) next = ['All'];
      } else {
        next.push(opt);
      }
      onChange(next);
    }
  };

  return (
    <div className="flex flex-col gap-1 relative" ref={ref}>
      <label className="text-[10px] font-semibold text-text-tertiary uppercase">{label}</label>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="border border-border-subtle rounded-lg px-3 py-1.5 text-[13px] outline-none focus:border-accent-interactive transition-colors bg-white text-left min-w-[160px] flex justify-between items-center"
      >
        <span className="truncate max-w-[120px]">
          {selected.includes('All') ? 'All' : selected.join(', ')}
        </span>
        <ChevronRight size={14} className={cn("transition-transform", isOpen && "rotate-90")} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute top-full left-0 mt-1 w-full bg-white border border-border-subtle rounded-lg shadow-xl z-30 py-1 max-h-[200px] overflow-y-auto"
          >
            {options.map(opt => (
              <button
                key={opt}
                onClick={() => toggleOption(opt)}
                className="w-full text-left px-3 py-1.5 text-[13px] hover:bg-bg-page flex items-center justify-between"
              >
                <span>{opt}</span>
                {selected.includes(opt) && <Check size={14} className="text-accent-interactive" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const KPICard = ({ value, label, trend, trendUp, accentColor, subline }: { value: string, label: string, trend?: string, trendUp?: boolean, accentColor: string, subline?: string }) => (
  <div className={cn(
    "bg-white border border-border-subtle rounded-xl p-4 card-shadow flex flex-col justify-between h-full relative overflow-hidden border-t-2",
    accentColor
  )}>
    <div className="flex flex-col">
      <span className="text-[11px] uppercase tracking-wider text-text-secondary font-medium mb-1">{label}</span>
      <span className={cn("text-2xl font-semibold", accentColor.includes('green') ? 'text-green-600' : accentColor.includes('red') ? 'text-red-600' : 'text-text-primary')}>
        {value}
      </span>
    </div>
    <div className="mt-3 flex flex-col gap-1 text-left">
      {trend && (
        <div className={cn(
          "flex items-center gap-1 text-[11px] font-medium",
          trendUp ? "text-green-600" : "text-red-600"
        )}>
          <span>vs previous period: {trend}</span>
          {trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
        </div>
      )}
      {subline && <div className="text-[11px] text-text-tertiary font-medium uppercase tracking-tight">{subline}</div>}
    </div>
  </div>
);

const ReportsView = ({ 
  reportData, 
  prevReportData, 
  reportFromDate, 
  reportToDate, 
  setReportFromDate, 
  setReportToDate, 
  reportGateways, 
  setReportGateways, 
  reportBrands, 
  setReportBrands, 
  generateReport, 
  isGeneratingReport,
  setSelectedTxn,
  donutFilter,
  setDonutFilter
}: any) => {
  const chartRefs = {
    volume: useRef<HTMLCanvasElement>(null),
    gateway: useRef<HTMLCanvasElement>(null),
    success: useRef<HTMLCanvasElement>(null),
    clients: useRef<HTMLCanvasElement>(null),
  };
  const charts = useRef<any>({});

  const gateways = ['All', 'Stripe', 'PayPal', 'Skrill', 'Neteller', 'Trustly', 'Paysafecard', 'MuchBetter', 'Rapid Transfer'];
  const brands = ['All', 'BetNova', 'SpinOrbit', 'GalaxyBet', 'StarPlay', 'NebulaCasino'];

  useEffect(() => {
    if (!reportData.length) return;

    const Chart = (window as any).Chart;
    if (!Chart) return;

    // Helper: Group by day
    const groupByDay = (data: Transaction[]) => {
      const groups: any = {};
      data.forEach(t => {
        const d = format(t.timestamp, 'yyyy-MM-dd');
        if (!groups[d]) groups[d] = { vol: 0, count: 0, completed: 0, pending: 0, failed: 0, disputed: 0 };
        groups[d].vol += t.amount;
        groups[d].count += 1;
        if (t.status === 'Completed') groups[d].completed += 1;
        else if (t.status === 'Pending') groups[d].pending += 1;
        else if (t.status === 'Failed') groups[d].failed += 1;
        else if (t.status === 'Disputed') groups[d].disputed += 1;
      });
      return Object.entries(groups).sort((a: any, b: any) => a[0].localeCompare(b[0]));
    };

    const dailyData = groupByDay(reportData);
    const labels = dailyData.map(d => format(new Date(d[0]), 'dd MMM'));

    // 1. Volume Over Time
    if (charts.current.volume) charts.current.volume.destroy();
    charts.current.volume = new Chart(chartRefs.volume.current, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Total Volume (€)',
          data: dailyData.map((d: any) => d[1].vol),
          borderColor: '#6B5CE7',
          backgroundColor: 'rgba(107, 92, 231, 0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
        scales: {
          x: { grid: { display: false }, border: { display: false }, ticks: { font: { size: 10 } } },
          y: { grid: { color: '#F4F4F0' }, border: { display: false }, ticks: { font: { size: 10 }, callback: (v: any) => '€' + v.toLocaleString() } }
        }
      }
    });

    // 2. Gateway Breakdown
    const gwMap: any = {};
    reportData.forEach((t: any) => {
      gwMap[t.gateway] = (gwMap[t.gateway] || 0) + t.amount;
    });
    const gwLabels = Object.keys(gwMap);
    const gwValues = Object.values(gwMap);

    if (charts.current.gateway) charts.current.gateway.destroy();
    charts.current.gateway = new Chart(chartRefs.gateway.current, {
      type: 'doughnut',
      data: {
        labels: gwLabels,
        datasets: [{
          data: gwValues,
          backgroundColor: ['#6B5CE7', '#1A1A2E', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'],
          borderWidth: 0,
          hoverOffset: 10
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: { position: 'right', labels: { boxWidth: 12, font: { size: 11 }, padding: 15 } },
          tooltip: { callbacks: { label: (ctx: any) => ` €${ctx.raw.toLocaleString()}` } }
        },
        onClick: (e: any, elements: any) => {
          if (elements.length > 0) {
            const idx = elements[0].index;
            setDonutFilter(gwLabels[idx]);
          } else {
            setDonutFilter(null);
          }
        }
      }
    });

    // 3. Success Rate by Day
    if (charts.current.success) charts.current.success.destroy();
    charts.current.success = new Chart(chartRefs.success.current, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Completed', data: dailyData.map((d: any) => d[1].completed), backgroundColor: '#10B981' },
          { label: 'Pending', data: dailyData.map((d: any) => d[1].pending), backgroundColor: '#94A3B8' },
          { label: 'Failed', data: dailyData.map((d: any) => d[1].failed), backgroundColor: '#EF4444' },
          { label: 'Disputed', data: dailyData.map((d: any) => d[1].disputed), backgroundColor: '#F59E0B' },
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { stacked: true, grid: { display: false }, ticks: { font: { size: 10 } } },
          y: { stacked: true, grid: { color: '#F4F4F0' }, ticks: { font: { size: 10 } } }
        },
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } } }
      }
    });

    // 4. Top Clients
    const clientMap: any = {};
    reportData.forEach((t: any) => {
      clientMap[t.client] = (clientMap[t.client] || 0) + t.amount;
    });
    const topClients = Object.entries(clientMap)
      .sort((a: any, b: any) => b[1] - a[1])
      .slice(0, 10);

    if (charts.current.clients) charts.current.clients.destroy();
    charts.current.clients = new Chart(chartRefs.clients.current, {
      type: 'bar',
      data: {
        labels: topClients.map(c => c[0]),
        datasets: [{
          label: 'Volume (€)',
          data: topClients.map(c => c[1]),
          backgroundColor: '#6B5CE7',
          borderRadius: 4,
          barThickness: 20
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: '#F4F4F0' }, ticks: { font: { size: 10 }, callback: (v: any) => '€' + v.toLocaleString() } },
          y: { grid: { display: false }, ticks: { font: { size: 10 } } }
        }
      }
    });

    return () => {
      Object.values(charts.current).forEach((c: any) => c?.destroy());
    };
  }, [reportData]);

  const kpis = useMemo(() => {
    const calc = (data: Transaction[]) => {
      const vol = data.reduce((acc, t) => acc + t.amount, 0);
      const count = data.length;
      const avg = count > 0 ? vol / count : 0;
      const completed = data.filter(t => t.status === 'Completed').length;
      const successRate = count > 0 ? (completed / count) * 100 : 0;
      const failedDisputed = data.filter(t => t.status === 'Failed' || t.status === 'Disputed').length;
      const failedDisputedRate = count > 0 ? (failedDisputed / count) * 100 : 0;
      const matched = data.filter(t => t.recon === 'Matched').length;
      const reconRate = count > 0 ? (matched / count) * 100 : 0;
      return { vol, count, avg, successRate, failedDisputed, failedDisputedRate, reconRate };
    };

    const current = calc(reportData);
    const previous = calc(prevReportData);

    const getTrend = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? '+100%' : '0%';
      const diff = ((curr - prev) / prev) * 100;
      return `${diff > 0 ? '+' : ''}${diff.toFixed(1)}%`;
    };

    return {
      vol: { val: `€${current.vol.toLocaleString()}`, trend: getTrend(current.vol, previous.vol), up: current.vol >= previous.vol },
      count: { val: current.count.toLocaleString(), trend: getTrend(current.count, previous.count), up: current.count >= previous.count },
      avg: { val: `€${current.avg.toFixed(2)}`, trend: getTrend(current.avg, previous.avg), up: current.avg >= previous.avg },
      success: { val: `${current.successRate.toFixed(1)}%`, trend: getTrend(current.successRate, previous.successRate), up: current.successRate >= previous.successRate },
      failed: { val: `${current.failedDisputed} (${current.failedDisputedRate.toFixed(1)}%)`, trend: getTrend(current.failedDisputed, previous.failedDisputed), up: current.failedDisputed <= previous.failedDisputed },
      recon: { val: `${current.reconRate.toFixed(1)}%`, trend: getTrend(current.reconRate, previous.reconRate), up: current.reconRate >= previous.reconRate },
    };
  }, [reportData, prevReportData]);

  const topTransactions = useMemo(() => {
    return [...reportData].sort((a, b) => b.amount - a.amount).slice(0, 20);
  }, [reportData]);

  const handleExportExcel = () => {
    if (!(window as any).XLSX) return;
    const XLSX = (window as any).XLSX;
    const wb = XLSX.utils.book_new();

    // Sheet 1: KPI Summary
    const kpiData = [
      ['Metric', 'Current Value', 'Trend vs Previous'],
      ['Total Volume', kpis.vol.val, kpis.vol.trend],
      ['Total Transactions', kpis.count.val, kpis.count.trend],
      ['Avg Transaction Value', kpis.avg.val, kpis.avg.trend],
      ['Success Rate', kpis.success.val, kpis.success.trend],
      ['Failed & Disputed', kpis.failed.val, kpis.failed.trend],
      ['Reconciliation Rate', kpis.recon.val, kpis.recon.trend],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(kpiData), "KPI Summary");

    // Sheet 2: Gateway Breakdown
    const gwMap: any = {};
    reportData.forEach((t: any) => {
      gwMap[t.gateway] = (gwMap[t.gateway] || 0) + t.amount;
    });
    const gwData = [['Gateway', 'Volume', 'Percentage']];
    const totalVol = reportData.reduce((acc: number, t: any) => acc + t.amount, 0);
    Object.entries(gwMap).forEach(([gw, vol]: any) => {
      gwData.push([gw, vol, `${((vol / totalVol) * 100).toFixed(2)}%`]);
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(gwData), "Gateway Breakdown");

    // Sheet 3: Top Transactions
    const topData = topTransactions.map((t, i) => ({
      '#': i + 1,
      'TXN ID': t.txnId,
      'Date': format(t.timestamp, 'dd MMM yyyy HH:mm'),
      'Client': t.client,
      'Brand': t.brand,
      'Gateway': t.gateway,
      'Amount': t.amount,
      'Currency': t.currency,
      'Status': t.status,
      'Recon': t.recon
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(topData), "Top Transactions");

    XLSX.writeFile(wb, `settlex_report_${format(new Date(), 'yyyyMMdd')}.xlsx`);
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-6 print:p-0">
      {/* Filter Bar */}
      <div className="bg-white border border-border-subtle rounded-xl p-4 card-shadow flex flex-wrap items-center gap-4 print:hidden">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold text-text-tertiary uppercase">From</label>
          <input 
            type="date" 
            value={reportFromDate}
            onChange={(e) => setReportFromDate(e.target.value)}
            className="border border-border-subtle rounded-lg px-3 py-1.5 text-[13px] outline-none focus:border-accent-interactive transition-colors" 
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold text-text-tertiary uppercase">To</label>
          <input 
            type="date" 
            value={reportToDate}
            onChange={(e) => setReportToDate(e.target.value)}
            className="border border-border-subtle rounded-lg px-3 py-1.5 text-[13px] outline-none focus:border-accent-interactive transition-colors" 
          />
        </div>
        <MultiSelect label="Gateways" options={gateways} selected={reportGateways} onChange={setReportGateways} />
        <MultiSelect label="Brands" options={brands} selected={reportBrands} onChange={setReportBrands} />
        
        <div className="flex items-end gap-2 h-[46px]">
          <button 
            onClick={generateReport}
            disabled={isGeneratingReport}
            className="bg-accent-interactive text-white px-4 py-2 rounded-lg text-[13px] font-medium hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
          >
            {isGeneratingReport ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            Generate Report
          </button>
        </div>

        <div className="h-8 w-[1px] bg-border-subtle mx-2" />

        <div className="flex items-end gap-2 h-[46px]">
          <button 
            onClick={handleExportExcel}
            className="border border-accent-interactive text-accent-interactive px-4 py-2 rounded-lg text-[13px] font-medium hover:bg-accent-hover transition-colors flex items-center gap-2"
          >
            <FileSpreadsheet size={14} />
            Export Excel
          </button>
          <button 
            onClick={handleExportPDF}
            className="border border-accent-interactive text-accent-interactive px-4 py-2 rounded-lg text-[13px] font-medium hover:bg-accent-hover transition-colors flex items-center gap-2"
          >
            <Download size={14} />
            Export PDF
          </button>
        </div>
      </div>

      {/* Zone 1: KPI Summary */}
      <div className="grid grid-cols-3 gap-4">
        <KPICard label="Total Volume" value={kpis.vol.val} trend={kpis.vol.trend} trendUp={kpis.vol.up} accentColor="border-t-accent-interactive" />
        <KPICard label="Total Transactions" value={kpis.count.val} trend={kpis.count.trend} trendUp={kpis.count.up} accentColor="border-t-accent-interactive" />
        <KPICard label="Avg Transaction Value" value={kpis.avg.val} trend={kpis.avg.trend} trendUp={kpis.avg.up} accentColor="border-t-accent-interactive" />
        <KPICard label="Success Rate" value={kpis.success.val} trend={kpis.success.trend} trendUp={kpis.success.up} accentColor="border-t-green-500" />
        <KPICard label="Failed & Disputed" value={kpis.failed.val} trend={kpis.failed.trend} trendUp={kpis.failed.up} accentColor="border-t-red-500" />
        <KPICard label="Reconciliation Rate" value={kpis.recon.val} trend={kpis.recon.trend} trendUp={kpis.recon.up} accentColor="border-t-amber-500" />
      </div>

      {/* Zone 2: Charts Row 1 */}
      <div className="grid grid-cols-10 gap-4 h-[400px]">
        <div className="col-span-6 bg-white border border-border-subtle rounded-xl p-6 card-shadow flex flex-col">
          <h3 className="text-[13px] font-semibold mb-4">Volume Over Time</h3>
          <div className="flex-1 min-h-0">
            <canvas ref={chartRefs.volume} />
          </div>
        </div>
        <div className="col-span-4 bg-white border border-border-subtle rounded-xl p-6 card-shadow flex flex-col">
          <h3 className="text-[13px] font-semibold mb-4">Volume by Gateway</h3>
          <div className="flex-1 min-h-0 flex items-center justify-center relative">
            <canvas ref={chartRefs.gateway} />
          </div>
        </div>
      </div>

      {/* Zone 3: Charts Row 2 */}
      <div className="grid grid-cols-2 gap-4 h-[400px]">
        <div className="bg-white border border-border-subtle rounded-xl p-6 card-shadow flex flex-col">
          <h3 className="text-[13px] font-semibold mb-4">Success Rate by Day</h3>
          <div className="flex-1 min-h-0">
            <canvas ref={chartRefs.success} />
          </div>
        </div>
        <div className="bg-white border border-border-subtle rounded-xl p-6 card-shadow flex flex-col overflow-hidden">
          <h3 className="text-[13px] font-semibold mb-4">Top 10 Clients by Volume</h3>
          <div className="flex-1 min-h-0">
            <canvas ref={chartRefs.clients} />
          </div>
        </div>
      </div>

      {/* Zone 4: Reconciliation Stats */}
      <div className="bg-white border border-border-subtle rounded-xl p-6 card-shadow">
        <h3 className="text-[13px] font-semibold mb-6">Reconciliation Overview</h3>
        <div className="grid grid-cols-2 gap-12">
          <div className="grid grid-cols-2 gap-6">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-text-tertiary uppercase">Matched</span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-green-600">{reportData.filter((t: any) => t.recon === 'Matched').length}</span>
                <span className="text-[12px] text-text-secondary">({((reportData.filter((t: any) => t.recon === 'Matched').length / (reportData.length || 1)) * 100).toFixed(1)}%)</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-text-tertiary uppercase">Unmatched (Ours)</span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-red-600">{reportData.filter((t: any) => t.recon === 'Unmatched').length}</span>
                <span className="text-[12px] text-text-secondary">({((reportData.filter((t: any) => t.recon === 'Unmatched').length / (reportData.length || 1)) * 100).toFixed(1)}%)</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-text-tertiary uppercase">Unmatched (PSP)</span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-amber-600">0</span>
                <span className="text-[12px] text-text-secondary">(0.0%)</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-text-tertiary uppercase">Amount Mismatches</span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-accent-interactive">0</span>
                <span className="text-[12px] text-text-secondary">(€0.00 gap)</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col justify-center gap-4">
            <div className="h-4 w-full bg-bg-page rounded-full overflow-hidden flex">
              <div className="bg-green-500 h-full" style={{ width: `${(reportData.filter((t: any) => t.recon === 'Matched').length / (reportData.length || 1)) * 100}%` }} />
              <div className="bg-red-500 h-full" style={{ width: `${(reportData.filter((t: any) => t.recon === 'Unmatched').length / (reportData.length || 1)) * 100}%` }} />
              <div className="bg-gray-300 h-full" style={{ width: `${(reportData.filter((t: any) => t.recon === 'Pending').length / (reportData.length || 1)) * 100}%` }} />
            </div>
            <div className="flex justify-between text-[11px] text-text-tertiary font-medium">
              <span>Matched</span>
              <span>Unmatched</span>
              <span>Pending</span>
            </div>
            <div className="mt-2 flex flex-col gap-1">
              <div className="flex justify-between text-[12px]">
                <span className="text-text-secondary">Total reconciled value:</span>
                <span className="font-bold text-text-primary">€{reportData.filter((t: any) => t.recon === 'Matched').reduce((acc: number, t: any) => acc + t.amount, 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span className="text-text-secondary">Outstanding discrepancies:</span>
                <span className="font-bold text-red-600">€{reportData.filter((t: any) => t.recon === 'Unmatched').reduce((acc: number, t: any) => acc + t.amount, 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Zone 5: Top Transactions Table */}
      <div className="bg-white border border-border-subtle rounded-xl card-shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-[13px] font-semibold">Top Transactions</h3>
            <span className="bg-accent-hover text-accent-interactive px-2 py-0.5 rounded-full text-[11px] font-semibold">
              by volume
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white border-b border-border-subtle">
              <tr>
                <th className="px-6 py-3 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider w-12">#</th>
                <th className="px-6 py-3 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Transaction ID</th>
                <th className="px-6 py-3 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Client</th>
                <th className="px-6 py-3 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Brand</th>
                <th className="px-6 py-3 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Gateway</th>
                <th className="px-6 py-3 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider text-right">Amount</th>
                <th className="px-6 py-3 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Recon</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F4F4F0]">
              {topTransactions.map((txn, idx) => (
                <tr 
                  key={txn.id} 
                  className="hover:bg-[#F8F8FC] cursor-pointer transition-colors group"
                  onClick={() => setSelectedTxn(txn)}
                >
                  <td className="px-6 py-4 text-[13px] text-text-tertiary">{idx + 1}</td>
                  <td className="px-6 py-4 font-mono text-[13px] text-accent-interactive font-medium">{txn.txnId}</td>
                  <td className="px-6 py-4 text-[13px] text-text-secondary">{format(txn.timestamp, 'dd MMM yyyy')}</td>
                  <td className="px-6 py-4 text-[13px] font-medium text-text-primary">{txn.client}</td>
                  <td className="px-6 py-4 text-[13px] text-text-secondary">{txn.brand}</td>
                  <td className="px-6 py-4 text-[13px] text-text-secondary">{txn.gateway}</td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-[13px] font-semibold text-text-primary">{txn.amount.toLocaleString()}</span>
                    <span className="text-[11px] text-text-tertiary ml-1">{txn.currency}</span>
                  </td>
                  <td className="px-6 py-4"><Badge variant={txn.status}>{txn.status}</Badge></td>
                  <td className="px-6 py-4"><Badge variant={txn.recon === 'Pending' ? 'ReconPending' : txn.recon}>{txn.recon}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- PSP Config View ---

const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void, key?: any }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      className={cn(
        "fixed top-6 right-6 z-[100] bg-white border border-border-subtle rounded-xl p-4 shadow-2xl flex items-center gap-3 min-w-[300px]",
        type === 'success' ? "border-l-4 border-l-green-500" : "border-l-4 border-l-red-500"
      )}
    >
      {type === 'success' ? <CheckCircle2 className="text-green-500" size={20} /> : <AlertTriangle className="text-red-500" size={20} />}
      <span className="text-[13px] font-medium text-text-primary">{message}</span>
      <button onClick={onClose} className="ml-auto text-text-tertiary hover:text-text-primary transition-colors">
        <X size={16} />
      </button>
    </motion.div>
  );
};

const PSPConfigView = ({ 
  psps, 
  setPsps, 
  onAdd, 
  onEdit, 
  onHistory, 
  onPing, 
  onToggleStatus,
  viewMode,
  setViewMode
}: any) => {
  const [pingingId, setPingingId] = useState<string | null>(null);
  const [pingResult, setPingResult] = useState<Record<string, { success: boolean, msg: string }>>({});
  const [confirmDisable, setConfirmDisable] = useState<string | null>(null);
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});

  const toggleKey = (id: string) => {
    setRevealedKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handlePing = async (id: string) => {
    setPingingId(id);
    await new Promise(r => setTimeout(r, 1500));
    const success = Math.random() > 0.2;
    const result = success 
      ? { success: true, msg: `Connected — ${Math.floor(Math.random() * 300) + 100}ms response time` }
      : { success: false, msg: "Connection failed — timeout after 5000ms" };
    
    setPingResult(prev => ({ ...prev, [id]: result }));
    setPingingId(null);
    onPing(id, success);
    
    setTimeout(() => {
      setPingResult(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }, 5000);
  };

  const activeCount = psps.filter((p: any) => p.status === 'Active').length;
  const inactiveCount = psps.filter((p: any) => p.status === 'Inactive').length;
  const feeRange = useMemo(() => {
    const fees = psps.map((p: any) => p.processingFeePercent);
    return `${Math.min(...fees).toFixed(1)}% – ${Math.max(...fees).toFixed(1)}%`;
  }, [psps]);

  return (
    <div className="flex flex-col gap-6">
      {/* Top Bar */}
      <div className="bg-white border border-border-subtle rounded-xl p-4 card-shadow flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-[15px] font-semibold text-text-primary">PSP Configuration</h3>
          <span className="bg-accent-hover text-accent-interactive px-2 py-0.5 rounded-full text-[11px] font-semibold">
            {psps.length} gateways
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex bg-bg-page p-1 rounded-lg">
            <button 
              onClick={() => setViewMode('card')}
              className={cn(
                "p-1.5 rounded-md transition-all",
                viewMode === 'card' ? "bg-white text-accent-interactive shadow-sm" : "text-text-tertiary hover:text-text-secondary"
              )}
            >
              <Grid size={18} />
            </button>
            <button 
              onClick={() => setViewMode('table')}
              className={cn(
                "p-1.5 rounded-md transition-all",
                viewMode === 'table' ? "bg-white text-accent-interactive shadow-sm" : "text-text-tertiary hover:text-text-secondary"
              )}
            >
              <List size={18} />
            </button>
          </div>
          
          <button 
            onClick={onAdd}
            className="bg-accent-interactive text-white px-4 py-2 rounded-lg text-[13px] font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <Plus size={16} />
            Add New PSP
          </button>
        </div>
      </div>

      {/* Summary Strip */}
      <div className="bg-white border border-border-subtle rounded-full px-6 py-3 card-shadow flex items-center gap-8 self-start">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-[13px] text-text-secondary font-medium">Active PSPs:</span>
          <span className="text-[13px] font-bold">{activeCount}</span>
        </div>
        <div className="w-[1px] h-4 bg-border-subtle" />
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-gray-400" />
          <span className="text-[13px] text-text-secondary font-medium">Inactive PSPs:</span>
          <span className="text-[13px] font-bold">{inactiveCount}</span>
        </div>
        <div className="w-[1px] h-4 bg-border-subtle" />
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-text-tertiary" />
          <span className="text-[13px] text-text-secondary font-medium">Avg Settlement Time:</span>
          <span className="text-[13px] font-bold">2.4 days</span>
        </div>
        <div className="w-[1px] h-4 bg-border-subtle" />
        <div className="flex items-center gap-2">
          <Wallet size={14} className="text-text-tertiary" />
          <span className="text-[13px] text-text-secondary font-medium">Total Fee Range:</span>
          <span className="text-[13px] font-bold">{feeRange}</span>
        </div>
      </div>

      {/* Main Content */}
      {viewMode === 'card' ? (
        <div className="grid grid-cols-3 gap-6">
          {psps.map((psp: any) => (
            <div key={psp.id} className="bg-white border border-border-subtle rounded-xl p-5 card-shadow flex flex-col gap-5 hover:border-accent-interactive/30 transition-colors group">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm", psp.logoColor)}>
                    {psp.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <h4 className="text-[14px] font-bold text-text-primary">{psp.name}</h4>
                      <div className="flex items-center gap-1">
                        <div className={cn("w-1.5 h-1.5 rounded-full", psp.status === 'Active' ? 'bg-green-500' : psp.status === 'Inactive' ? 'bg-gray-400' : 'bg-amber-500')} />
                        <span className="text-[11px] font-medium text-text-secondary">{psp.status}</span>
                      </div>
                    </div>
                    <span className="text-[11px] text-text-tertiary font-medium bg-bg-page px-2 py-0.5 rounded-full mt-1 self-start">
                      {psp.category}
                    </span>
                  </div>
                </div>
              </div>

              <div className="h-[1px] bg-border-subtle" />

              {/* Fees */}
              <div className="flex flex-col gap-3">
                <h5 className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">Fee Structure</h5>
                <div className="grid grid-cols-2 gap-y-2">
                  <div className="flex flex-col">
                    <span className="text-[11px] text-text-tertiary font-medium">Processing</span>
                    <span className="text-[12px] font-semibold text-text-primary">{psp.processingFeePercent}% + {psp.processingFeeFixed} {psp.processingFeeCurrency}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] text-text-tertiary font-medium">Refund</span>
                    <span className="text-[12px] font-semibold text-text-primary">{psp.refundFeePercent}%</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] text-text-tertiary font-medium">Chargeback</span>
                    <span className="text-[12px] font-semibold text-text-primary">{psp.chargebackFee} {psp.chargebackFeeCurrency}</span>
                  </div>
                </div>
              </div>

              <div className="h-[1px] bg-border-subtle" />

              {/* Settlement */}
              <div className="flex flex-col gap-3">
                <h5 className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">Settlement Schedule</h5>
                <div className="grid grid-cols-2 gap-y-3">
                  <div className="flex flex-col">
                    <span className="text-[11px] text-text-tertiary font-medium">Frequency</span>
                    <span className="text-[12px] font-semibold text-text-primary">
                      {psp.frequency} {psp.settlementDay && `(every ${psp.settlementDay})`}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] text-text-tertiary font-medium">Currencies</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {psp.currencies.map((c: string) => (
                        <span key={c} className="text-[10px] font-bold bg-bg-page px-1.5 py-0.5 rounded border border-border-subtle">{c}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] text-text-tertiary font-medium">Rolling Reserve</span>
                    <span className="text-[12px] font-semibold text-text-primary">
                      {psp.rollingReservePercent > 0 ? `${psp.rollingReservePercent}% / ${psp.rollingReserveDays} days` : 'None'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="h-[1px] bg-border-subtle" />

              {/* API */}
              <div className="flex flex-col gap-3">
                <h5 className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">API Credentials</h5>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between bg-bg-page px-3 py-2 rounded-lg border border-border-subtle group/api">
                    <div className="flex flex-col min-w-0">
                      <span className="text-[9px] text-text-tertiary uppercase font-bold">Endpoint</span>
                      <span className="text-[11px] font-mono font-medium truncate text-accent-interactive">{psp.endpoint}</span>
                    </div>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(psp.endpoint);
                        // Tooltip logic would go here
                      }}
                      className="text-text-tertiary hover:text-accent-interactive transition-colors ml-2"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between bg-bg-page px-3 py-2 rounded-lg border border-border-subtle">
                    <div className="flex flex-col min-w-0">
                      <span className="text-[9px] text-text-tertiary uppercase font-bold">API Key</span>
                      <span className="text-[11px] font-mono font-medium truncate text-text-primary">
                        {revealedKeys[psp.id] ? psp.apiKey : '••••••••••••••••'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <button 
                        onClick={() => toggleKey(psp.id)}
                        className="text-text-tertiary hover:text-accent-interactive transition-colors"
                      >
                        {revealedKeys[psp.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button 
                        onClick={() => navigator.clipboard.writeText(psp.apiKey)}
                        className="text-text-tertiary hover:text-accent-interactive transition-colors"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-4 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      psp.connectionStatus === 'Online' ? 'bg-green-500' : psp.connectionStatus === 'Offline' ? 'bg-red-500' : 'bg-gray-400'
                    )} />
                    <span className="text-[11px] text-text-secondary">
                      {psp.lastTested ? `Last tested: ${format(psp.lastTested, 'dd MMM HH:mm')}` : 'Never tested'}
                    </span>
                    {psp.connectionStatus !== 'Never' && (
                      <span className={cn("text-[11px] font-bold", psp.connectionStatus === 'Online' ? 'text-green-600' : 'text-red-600')}>
                        {psp.connectionStatus === 'Online' ? '✓ Online' : '✗ Offline'}
                      </span>
                    )}
                  </div>
                </div>

                {confirmDisable === psp.id ? (
                  <div className="bg-red-50 border border-red-100 rounded-lg p-3 flex flex-col gap-2">
                    <p className="text-[11px] text-red-700 font-medium">
                      Disable {psp.name}? This will pause reconciliation for this gateway.
                    </p>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          onToggleStatus(psp.id);
                          setConfirmDisable(null);
                        }}
                        className="bg-red-600 text-white px-3 py-1 rounded text-[11px] font-bold hover:bg-red-700 transition-colors"
                      >
                        Confirm Disable
                      </button>
                      <button 
                        onClick={() => setConfirmDisable(null)}
                        className="bg-white border border-red-200 text-red-700 px-3 py-1 rounded text-[11px] font-bold hover:bg-red-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => handlePing(psp.id)}
                      disabled={pingingId === psp.id}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12px] font-semibold text-text-secondary hover:bg-bg-page transition-colors border border-transparent hover:border-border-subtle"
                    >
                      {pingingId === psp.id ? <RefreshCw size={14} className="animate-spin" /> : <Activity size={14} />}
                      Ping
                    </button>
                    <button 
                      onClick={() => onEdit(psp)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12px] font-semibold text-text-secondary hover:bg-bg-page transition-colors border border-transparent hover:border-border-subtle"
                    >
                      <Edit2 size={14} />
                      Edit
                    </button>
                    <button 
                      onClick={() => onHistory(psp)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12px] font-semibold text-text-secondary hover:bg-bg-page transition-colors border border-transparent hover:border-border-subtle"
                    >
                      <History size={14} />
                      History
                    </button>
                    <button 
                      onClick={() => psp.status === 'Active' ? setConfirmDisable(psp.id) : onToggleStatus(psp.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12px] font-semibold text-text-secondary hover:bg-bg-page transition-colors border border-transparent hover:border-border-subtle"
                    >
                      <Power size={14} className={psp.status === 'Active' ? 'text-red-500' : 'text-green-500'} />
                      {psp.status === 'Active' ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                )}

                {pingResult[psp.id] && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "text-[11px] font-medium p-2 rounded-lg flex items-center gap-2",
                      pingResult[psp.id].success ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"
                    )}
                  >
                    {pingResult[psp.id].success ? <Check size={14} /> : <X size={14} />}
                    {pingResult[psp.id].msg}
                  </motion.div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-border-subtle rounded-xl card-shadow overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white border-b border-border-subtle">
              <tr>
                <th className="px-6 py-4 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Logo</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">PSP Name</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Processing Fee</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Settlement</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Currencies</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Last Tested</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Connection</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F4F4F0]">
              {psps.map((psp: any) => (
                <tr key={psp.id} className="hover:bg-[#F8F8FC] transition-colors group">
                  <td className="px-6 py-4">
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-[10px]", psp.logoColor)}>
                      {psp.name.substring(0, 2).toUpperCase()}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[13px] font-bold text-text-primary">{psp.name}</td>
                  <td className="px-6 py-4">
                    <span className="text-[11px] text-text-secondary font-medium bg-bg-page px-2 py-0.5 rounded-full">
                      {psp.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <div className={cn("w-1.5 h-1.5 rounded-full", psp.status === 'Active' ? 'bg-green-500' : psp.status === 'Inactive' ? 'bg-gray-400' : 'bg-amber-500')} />
                      <span className="text-[12px] font-medium text-text-secondary">{psp.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[13px] font-medium text-text-primary">
                    {psp.processingFeePercent}% + {psp.processingFeeFixed} {psp.processingFeeCurrency}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col group/settle relative">
                      <span className="text-[13px] text-text-secondary">{psp.frequency}</span>
                      <div className="absolute bottom-full left-0 mb-2 hidden group-hover/settle:block z-30">
                        <div className="bg-text-primary text-white text-[11px] p-2 rounded shadow-xl whitespace-nowrap">
                          {psp.frequency} {psp.settlementDay && `(every ${psp.settlementDay})`}
                          <br />
                          Rolling: {psp.rollingReservePercent > 0 ? `${psp.rollingReservePercent}% / ${psp.rollingReserveDays}d` : 'None'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1">
                      {psp.currencies.slice(0, 2).map((c: string) => (
                        <span key={c} className="text-[10px] font-bold bg-bg-page px-1.5 py-0.5 rounded border border-border-subtle">{c}</span>
                      ))}
                      {psp.currencies.length > 2 && (
                        <span className="text-[10px] font-bold text-text-tertiary">+{psp.currencies.length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[12px] text-text-secondary">
                    {psp.lastTested ? format(psp.lastTested, 'dd MMM HH:mm') : '—'}
                  </td>
                  <td className="px-6 py-4">
                    {psp.connectionStatus !== 'Never' ? (
                      <div className="flex items-center gap-1.5">
                        {psp.connectionStatus === 'Online' ? <CheckCircle size={14} className="text-green-500" /> : <AlertCircle size={14} className="text-red-500" />}
                        <span className={cn("text-[12px] font-bold", psp.connectionStatus === 'Online' ? 'text-green-600' : 'text-red-600')}>
                          {psp.connectionStatus === 'Online' ? 'Online' : 'Offline'}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[12px] text-text-tertiary">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handlePing(psp.id)}
                        disabled={pingingId === psp.id}
                        className="p-1.5 text-text-tertiary hover:text-accent-interactive transition-colors relative group/ping"
                      >
                        {pingingId === psp.id ? <RefreshCw size={16} className="animate-spin" /> : <Activity size={16} />}
                        {pingResult[psp.id] && (
                          <div className="absolute bottom-full right-0 mb-2 z-30">
                            <div className={cn(
                              "text-[10px] p-2 rounded shadow-xl whitespace-nowrap",
                              pingResult[psp.id].success ? "bg-green-600 text-white" : "bg-red-600 text-white"
                            )}>
                              {pingResult[psp.id].msg}
                            </div>
                          </div>
                        )}
                      </button>
                      <button onClick={() => onEdit(psp)} className="p-1.5 text-text-tertiary hover:text-accent-interactive transition-colors"><Edit2 size={16} /></button>
                      <button onClick={() => onHistory(psp)} className="p-1.5 text-text-tertiary hover:text-accent-interactive transition-colors"><History size={16} /></button>
                      <button 
                        onClick={() => psp.status === 'Active' ? setConfirmDisable(psp.id) : onToggleStatus(psp.id)} 
                        className="p-1.5 text-text-tertiary hover:text-accent-interactive transition-colors"
                      >
                        <Power size={16} className={psp.status === 'Active' ? 'text-red-500' : 'text-green-500'} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const AddEditPSPModal = ({ psp, onClose, onSave }: { psp: PSPConfig | null, onClose: () => void, onSave: (data: any) => void }) => {
  const [activeTab, setActiveTab] = useState<'General' | 'Fees' | 'Settlement' | 'API'>('General');
  const [formData, setFormData] = useState<any>(psp || {
    name: '',
    category: 'Card Payments',
    status: 'Active',
    logoColor: 'bg-blue-600',
    processingFeePercent: 0,
    processingFeeFixed: 0,
    processingFeeCurrency: 'EUR',
    refundFeePercent: 0,
    chargebackFee: 0,
    chargebackFeeCurrency: 'EUR',
    fxMarkupPercent: 0,
    minTxn: 0,
    maxTxn: 0,
    frequency: 'Daily',
    currencies: ['EUR'],
    rollingReservePercent: 0,
    rollingReserveDays: 0,
    settlementDelayDays: 0,
    environment: 'Sandbox',
    endpoint: '',
    apiKey: '',
    apiSecret: '',
    webhookUrl: '',
    webhookSecret: '',
    ipWhitelist: '',
    countries: '',
    notes: ''
  });

  const [showKey, setShowKey] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/35 backdrop-blur-[2px]"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white w-full max-w-[560px] rounded-2xl shadow-2xl overflow-hidden relative z-10 flex flex-col max-h-[90vh]"
      >
        <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between bg-white">
          <h3 className="text-[16px] font-semibold text-text-primary">{psp ? `Edit ${psp.name}` : 'Add New PSP'}</h3>
          <button onClick={onClose} className="text-text-tertiary hover:text-text-primary transition-colors"><X size={20} /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border-subtle px-6 bg-bg-page">
          {['General', 'Fees', 'Settlement', 'API'].map((tab: any) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-3 text-[13px] font-medium transition-colors border-b-2 -mb-[1px]",
                activeTab === tab ? "border-accent-interactive text-accent-interactive" : "border-transparent text-text-tertiary hover:text-text-secondary"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'General' && (
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-text-tertiary uppercase">PSP Name</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="border border-border-subtle rounded-lg px-3 py-2 text-[13px] outline-none focus:border-accent-interactive transition-colors" 
                    placeholder="e.g. Stripe"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-text-tertiary uppercase">Category</label>
                  <select 
                    value={formData.category}
                    onChange={(e) => handleChange('category', e.target.value)}
                    className="border border-border-subtle rounded-lg px-3 py-2 text-[13px] outline-none focus:border-accent-interactive transition-colors"
                  >
                    <option>Card Payments</option>
                    <option>E-Wallet</option>
                    <option>Bank Transfer</option>
                    <option>Open Banking</option>
                    <option>Crypto</option>
                    <option>Voucher</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-text-tertiary uppercase">Status</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      checked={formData.status === 'Active'} 
                      onChange={() => handleChange('status', 'Active')}
                      className="w-4 h-4 text-accent-interactive"
                    />
                    <span className="text-[13px] font-medium">Active</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      checked={formData.status === 'Inactive'} 
                      onChange={() => handleChange('status', 'Inactive')}
                      className="w-4 h-4 text-accent-interactive"
                    />
                    <span className="text-[13px] font-medium">Inactive</span>
                  </label>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-text-tertiary uppercase">Supported Currencies</label>
                <div className="flex flex-wrap gap-2">
                  {['EUR', 'USD', 'GBP', 'CAD', 'AUD', 'SEK', 'NOK', 'PLN', 'CZK', 'BTC', 'USDT'].map(curr => (
                    <button
                      key={curr}
                      onClick={() => {
                        const next = formData.currencies.includes(curr)
                          ? formData.currencies.filter((c: string) => c !== curr)
                          : [...formData.currencies, curr];
                        handleChange('currencies', next);
                      }}
                      className={cn(
                        "px-3 py-1 rounded-full text-[11px] font-bold border transition-colors",
                        formData.currencies.includes(curr) 
                          ? "bg-accent-interactive text-white border-accent-interactive" 
                          : "bg-white text-text-secondary border-border-subtle hover:bg-bg-page"
                      )}
                    >
                      {curr}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-text-tertiary uppercase">Countries Supported</label>
                <input 
                  type="text" 
                  value={formData.countries}
                  onChange={(e) => handleChange('countries', e.target.value)}
                  className="border border-border-subtle rounded-lg px-3 py-2 text-[13px] outline-none focus:border-accent-interactive transition-colors" 
                  placeholder="e.g. Europe, UK, USA"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-text-tertiary uppercase">Notes</label>
                <textarea 
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  className="border border-border-subtle rounded-lg px-3 py-2 text-[13px] outline-none focus:border-accent-interactive transition-colors h-20 resize-none" 
                  placeholder="Internal notes..."
                />
              </div>
            </div>
          )}

          {activeTab === 'Fees' && (
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-text-tertiary uppercase">Processing Fee %</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={formData.processingFeePercent}
                    onChange={(e) => handleChange('processingFeePercent', parseFloat(e.target.value))}
                    className="border border-border-subtle rounded-lg px-3 py-2 text-[13px] outline-none focus:border-accent-interactive transition-colors" 
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-text-tertiary uppercase">Fixed Fee</label>
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      step="0.01"
                      value={formData.processingFeeFixed}
                      onChange={(e) => handleChange('processingFeeFixed', parseFloat(e.target.value))}
                      className="flex-1 border border-border-subtle rounded-lg px-3 py-2 text-[13px] outline-none focus:border-accent-interactive transition-colors" 
                    />
                    <select 
                      value={formData.processingFeeCurrency}
                      onChange={(e) => handleChange('processingFeeCurrency', e.target.value)}
                      className="w-20 border border-border-subtle rounded-lg px-2 py-2 text-[13px] outline-none focus:border-accent-interactive transition-colors"
                    >
                      <option>EUR</option>
                      <option>USD</option>
                      <option>GBP</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-text-tertiary uppercase">Refund Fee %</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={formData.refundFeePercent}
                    onChange={(e) => handleChange('refundFeePercent', parseFloat(e.target.value))}
                    className="border border-border-subtle rounded-lg px-3 py-2 text-[13px] outline-none focus:border-accent-interactive transition-colors" 
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-text-tertiary uppercase">Chargeback Fee</label>
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      step="0.01"
                      value={formData.chargebackFee}
                      onChange={(e) => handleChange('chargebackFee', parseFloat(e.target.value))}
                      className="flex-1 border border-border-subtle rounded-lg px-3 py-2 text-[13px] outline-none focus:border-accent-interactive transition-colors" 
                    />
                    <select 
                      value={formData.chargebackFeeCurrency}
                      onChange={(e) => handleChange('chargebackFeeCurrency', e.target.value)}
                      className="w-20 border border-border-subtle rounded-lg px-2 py-2 text-[13px] outline-none focus:border-accent-interactive transition-colors"
                    >
                      <option>EUR</option>
                      <option>USD</option>
                      <option>GBP</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-text-tertiary uppercase">FX Markup %</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={formData.fxMarkupPercent}
                  onChange={(e) => handleChange('fxMarkupPercent', parseFloat(e.target.value))}
                  className="border border-border-subtle rounded-lg px-3 py-2 text-[13px] outline-none focus:border-accent-interactive transition-colors" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-text-tertiary uppercase">Min Transaction</label>
                  <input 
                    type="number" 
                    value={formData.minTxn}
                    onChange={(e) => handleChange('minTxn', parseFloat(e.target.value))}
                    className="border border-border-subtle rounded-lg px-3 py-2 text-[13px] outline-none focus:border-accent-interactive transition-colors" 
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-text-tertiary uppercase">Max Transaction</label>
                  <input 
                    type="number" 
                    value={formData.maxTxn}
                    onChange={(e) => handleChange('maxTxn', parseFloat(e.target.value))}
                    className="border border-border-subtle rounded-lg px-3 py-2 text-[13px] outline-none focus:border-accent-interactive transition-colors" 
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Settlement' && (
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-text-tertiary uppercase">Settlement Frequency</label>
                  <select 
                    value={formData.frequency}
                    onChange={(e) => handleChange('frequency', e.target.value)}
                    className="border border-border-subtle rounded-lg px-3 py-2 text-[13px] outline-none focus:border-accent-interactive transition-colors"
                  >
                    <option>Daily</option>
                    <option>Weekly</option>
                    <option>Bi-weekly</option>
                    <option>Monthly</option>
                  </select>
                </div>
                {(formData.frequency === 'Weekly' || formData.frequency === 'Bi-weekly') && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-text-tertiary uppercase">Settlement Day</label>
                    <select 
                      value={formData.settlementDay}
                      onChange={(e) => handleChange('settlementDay', e.target.value)}
                      className="border border-border-subtle rounded-lg px-3 py-2 text-[13px] outline-none focus:border-accent-interactive transition-colors"
                    >
                      <option>Monday</option>
                      <option>Tuesday</option>
                      <option>Wednesday</option>
                      <option>Thursday</option>
                      <option>Friday</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-text-tertiary uppercase">Rolling Reserve %</label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={formData.rollingReservePercent}
                    onChange={(e) => handleChange('rollingReservePercent', parseFloat(e.target.value))}
                    className="border border-border-subtle rounded-lg px-3 py-2 text-[13px] outline-none focus:border-accent-interactive transition-colors" 
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-text-tertiary uppercase">Reserve Period (Days)</label>
                  <input 
                    type="number" 
                    value={formData.rollingReserveDays}
                    onChange={(e) => handleChange('rollingReserveDays', parseInt(e.target.value))}
                    className="border border-border-subtle rounded-lg px-3 py-2 text-[13px] outline-none focus:border-accent-interactive transition-colors" 
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-text-tertiary uppercase">Expected Delay (Days)</label>
                <input 
                  type="number" 
                  value={formData.settlementDelayDays}
                  onChange={(e) => handleChange('settlementDelayDays', parseInt(e.target.value))}
                  className="border border-border-subtle rounded-lg px-3 py-2 text-[13px] outline-none focus:border-accent-interactive transition-colors" 
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-text-tertiary uppercase">Settlement Notes</label>
                <textarea 
                  value={formData.settlementNotes}
                  onChange={(e) => handleChange('settlementNotes', e.target.value)}
                  className="border border-border-subtle rounded-lg px-3 py-2 text-[13px] outline-none focus:border-accent-interactive transition-colors h-20 resize-none" 
                  placeholder="Additional settlement terms..."
                />
              </div>
            </div>
          )}

          {activeTab === 'API' && (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-text-tertiary uppercase">Environment</label>
                <div className="flex bg-bg-page p-1 rounded-lg self-start">
                  <button 
                    onClick={() => handleChange('environment', 'Live')}
                    className={cn(
                      "px-4 py-1.5 rounded-md text-[12px] font-bold transition-all",
                      formData.environment === 'Live' ? "bg-red-600 text-white shadow-sm" : "text-text-tertiary hover:text-text-secondary"
                    )}
                  >
                    Live
                  </button>
                  <button 
                    onClick={() => handleChange('environment', 'Sandbox')}
                    className={cn(
                      "px-4 py-1.5 rounded-md text-[12px] font-bold transition-all",
                      formData.environment === 'Sandbox' ? "bg-amber-500 text-white shadow-sm" : "text-text-tertiary hover:text-text-secondary"
                    )}
                  >
                    Sandbox
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-text-tertiary uppercase">API Endpoint URL</label>
                <input 
                  type="text" 
                  value={formData.endpoint}
                  onChange={(e) => handleChange('endpoint', e.target.value)}
                  className="border border-border-subtle rounded-lg px-3 py-2 text-[13px] outline-none focus:border-accent-interactive transition-colors font-mono" 
                  placeholder="https://api.example.com/v1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-text-tertiary uppercase">API Key</label>
                  <div className="relative">
                    <input 
                      type={showKey ? "text" : "password"} 
                      value={formData.apiKey}
                      onChange={(e) => handleChange('apiKey', e.target.value)}
                      className="w-full border border-border-subtle rounded-lg pl-3 pr-10 py-2 text-[13px] outline-none focus:border-accent-interactive transition-colors font-mono" 
                    />
                    <button 
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary transition-colors"
                    >
                      {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-text-tertiary uppercase">API Secret</label>
                  <div className="relative">
                    <input 
                      type={showSecret ? "text" : "password"} 
                      value={formData.apiSecret}
                      onChange={(e) => handleChange('apiSecret', e.target.value)}
                      className="w-full border border-border-subtle rounded-lg pl-3 pr-10 py-2 text-[13px] outline-none focus:border-accent-interactive transition-colors font-mono" 
                    />
                    <button 
                      onClick={() => setShowSecret(!showSecret)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary transition-colors"
                    >
                      {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-text-tertiary uppercase">Webhook URL</label>
                <input 
                  type="text" 
                  value={formData.webhookUrl}
                  onChange={(e) => handleChange('webhookUrl', e.target.value)}
                  className="border border-border-subtle rounded-lg px-3 py-2 text-[13px] outline-none focus:border-accent-interactive transition-colors font-mono" 
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-text-tertiary uppercase">IP Whitelist</label>
                <textarea 
                  value={formData.ipWhitelist}
                  onChange={(e) => handleChange('ipWhitelist', e.target.value)}
                  className="border border-border-subtle rounded-lg px-3 py-2 text-[13px] outline-none focus:border-accent-interactive transition-colors h-20 resize-none font-mono" 
                  placeholder="One IP per line..."
                />
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border-subtle bg-bg-page flex items-center justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-[13px] font-medium text-text-secondary hover:bg-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="px-6 py-2 text-[13px] font-semibold bg-accent-interactive text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            Save PSP
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const HistoryModal = ({ psp, onClose }: { psp: PSPConfig, onClose: () => void }) => {
  const history = useMemo(() => generatePSPHistory(psp.id), [psp.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/35 backdrop-blur-[2px]"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white w-full max-w-[480px] rounded-2xl shadow-2xl overflow-hidden relative z-10 flex flex-col max-h-[80vh]"
      >
        <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between">
          <h3 className="text-[15px] font-semibold text-text-primary">{psp.name} — Change History</h3>
          <button onClick={onClose} className="text-text-tertiary hover:text-text-primary transition-colors"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-bg-page sticky top-0 z-10">
              <tr>
                <th className="px-4 py-2 text-[10px] font-bold text-text-tertiary uppercase">Date & Time</th>
                <th className="px-4 py-2 text-[10px] font-bold text-text-tertiary uppercase">Changed By</th>
                <th className="px-4 py-2 text-[10px] font-bold text-text-tertiary uppercase">Field</th>
                <th className="px-4 py-2 text-[10px] font-bold text-text-tertiary uppercase">New Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {history.map((h, i) => (
                <tr key={h.id} className={cn("text-[12px]", i % 2 === 1 && "bg-[#F8F8FC]")}>
                  <td className="px-4 py-3 text-text-secondary">{format(h.timestamp, 'dd MMM HH:mm')}</td>
                  <td className="px-4 py-3 font-medium text-text-primary">{h.changedBy}</td>
                  <td className="px-4 py-3 text-text-secondary">{h.field}</td>
                  <td className="px-4 py-3 text-text-primary font-medium">{h.newValue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-border-subtle bg-bg-page flex items-center justify-end gap-3">
          <button className="px-4 py-2 text-[12px] font-medium text-accent-interactive hover:bg-white rounded-lg transition-colors flex items-center gap-2">
            <Download size={14} />
            Export History
          </button>
          <button 
            onClick={onClose}
            className="px-4 py-2 text-[12px] font-medium text-text-secondary hover:bg-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default function App() {
  const [activePage, setActivePage] = useState<'Transactions' | 'Reconciliation' | 'Reports' | 'PSP Config'>('Transactions');
  const [allTransactions] = useState<Transaction[]>(generateMockData());
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>(allTransactions);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<'All' | 'Matched' | 'Unmatched' | 'Disputed'>('All');
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);
  const [copyTooltip, setCopyTooltip] = useState<string | null>(null);

  // PSP Config States
  const [psps, setPsps] = useState<PSPConfig[]>([]);
  const [pspViewMode, setPspViewMode] = useState<'card' | 'table'>('card');
  const [isAddEditPSPModalOpen, setIsAddEditPSPModalOpen] = useState(false);
  const [selectedPSP, setSelectedPSP] = useState<PSPConfig | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [toasts, setToasts] = useState<{ id: string, message: string, type: 'success' | 'error' }[]>([]);

  // Initialize PSP data
  useEffect(() => {
    setPsps(generatePSPMockData());
  }, []);

  const addToast = (message: string, type: 'success' | 'error') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleSavePSP = (data: any) => {
    if (selectedPSP) {
      setPsps(prev => prev.map(p => p.id === selectedPSP.id ? { ...data, id: p.id } : p));
      addToast(`${data.name} updated successfully`, 'success');
    } else {
      const newPSP = { ...data, id: `psp-${Date.now()}` };
      setPsps(prev => [...prev, newPSP]);
      addToast(`${data.name} added successfully`, 'success');
    }
    setIsAddEditPSPModalOpen(false);
    setSelectedPSP(null);
  };

  const handleTogglePSPStatus = (id: string) => {
    setPsps(prev => prev.map(p => {
      if (p.id === id) {
        const newStatus = p.status === 'Active' ? 'Inactive' : 'Active';
        addToast(`${p.name} is now ${newStatus}`, 'success');
        return { ...p, status: newStatus };
      }
      return p;
    }));
  };

  const handlePingPSP = (id: string, success: boolean) => {
    setPsps(prev => prev.map(p => {
      if (p.id === id) {
        return { 
          ...p, 
          lastTested: new Date(), 
          connectionStatus: success ? 'Online' : 'Offline' 
        };
      }
      return p;
    }));
  };

  // Reconciliation States
  const [pspFile, setPspFile] = useState<{ name: string, rows: number, data: any[] } | null>(null);
  const [reconResults, setReconResults] = useState<ReconResult[]>([]);
  const [filteredReconResults, setFilteredReconResults] = useState<ReconResult[]>([]);
  const [activeReconTab, setActiveReconTab] = useState<'All' | 'Matched' | 'Missing in PSP' | 'Not in system' | 'Amount diff'>('All');
  const [reconGateway, setReconGateway] = useState<Gateway>('Stripe');
  const [reconMatchBy, setReconMatchBy] = useState('Transaction ID');
  const [isReconciling, setIsReconciling] = useState(false);
  const [showManualMatch, setShowManualMatch] = useState<ReconResult | null>(null);
  const [manualMatchSearch, setManualMatchSearch] = useState('');
  const [selectedPspMatch, setSelectedPspMatch] = useState<any | null>(null);

  // Reports States
  const [reportFromDate, setReportFromDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [reportToDate, setReportToDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [reportGateways, setReportGateways] = useState<string[]>(['All']);
  const [reportBrands, setReportBrands] = useState<string[]>(['All']);
  const [reportData, setReportData] = useState<Transaction[]>([]);
  const [prevReportData, setPrevReportData] = useState<Transaction[]>([]);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [donutFilter, setDonutFilter] = useState<string | null>(null);

  const generateReport = () => {
    setIsGeneratingReport(true);
    setTimeout(() => {
      const from = startOfDay(new Date(reportFromDate));
      const to = endOfDay(new Date(reportToDate));
      const diff = differenceInDays(to, from) + 1;
      const prevFrom = startOfDay(subDays(from, diff));
      const prevTo = endOfDay(subDays(from, 1));

      const filterTxns = (data: Transaction[], start: Date, end: Date, gateways: string[], brands: string[]) => {
        return data.filter(t => {
          const dateMatch = t.timestamp >= start && t.timestamp <= end;
          const gatewayMatch = gateways.includes('All') || gateways.includes(t.gateway);
          const brandMatch = brands.includes('All') || brands.includes(t.brand);
          return dateMatch && gatewayMatch && brandMatch;
        });
      };

      const current = filterTxns(allTransactions, from, to, reportGateways, reportBrands);
      const previous = filterTxns(allTransactions, prevFrom, prevTo, reportGateways, reportBrands);

      setReportData(current);
      setPrevReportData(previous);
      setIsGeneratingReport(false);
      setDonutFilter(null);
    }, 600);
  };

  useEffect(() => {
    if (activePage === 'Reports' && reportData.length === 0) {
      generateReport();
    }
  }, [activePage]);

  const handleConfirmMatch = () => {
    if (!showManualMatch || !selectedPspMatch) return;

    // Update the recon results
    setReconResults(prev => prev.map(r => {
      if (r.id === showManualMatch.id) {
        const diff = Math.abs(selectedPspMatch['Amount'] - (r.ourAmount || 0));
        return {
          ...r,
          status: diff > 0.01 ? 'Amount diff' : 'Matched',
          pspRefId: selectedPspMatch['PSP Reference ID'],
          pspAmount: selectedPspMatch['Amount'],
          difference: diff
        };
      }
      return r;
    }));

    // If it was a "Not in system" row that we matched to an internal one, we might need to remove it or merge it.
    // But usually "Link manually" is clicked on a "Missing in PSP" or "Amount diff" row.
    // If it's "Not in system", we are linking it to an internal transaction.
    
    setShowManualMatch(null);
    setSelectedPspMatch(null);
    setManualMatchSearch('');
  };

  const handleMarkException = () => {
    // In a real app, this would save an exception note to the database
    setShowManualMatch(null);
    setSelectedPspMatch(null);
    setManualMatchSearch('');
  };

  const suggestedMatches = useMemo(() => {
    if (!showManualMatch || !pspFile) return [];
    
    const query = manualMatchSearch.toLowerCase();
    return pspFile.data.filter(p => {
      // Don't show already matched rows (in a real app we'd track this more strictly)
      const pRef = (p['PSP Reference ID'] || '').toLowerCase();
      const pAmount = (p['Amount'] || 0).toString();
      
      if (query) {
        return pRef.includes(query) || pAmount.includes(query);
      }

      // Default suggestions: same amount or similar date
      const sameAmount = Math.abs(p['Amount'] - (showManualMatch.ourAmount || 0)) < 0.01;
      return sameAmount;
    }).slice(0, 5);
  }, [showManualMatch, pspFile, manualMatchSearch]);

  const runReconciliation = () => {
    if (!pspFile) return;
    setIsReconciling(true);
    
    // Simulate a delay for UI feedback
    setTimeout(() => {
      const results: ReconResult[] = [];
      const internalTxns = allTransactions.filter(t => t.gateway === reconGateway);
      const pspRows = pspFile.data;
      
      const matchedInternalIds = new Set<string>();
      const matchedPspIndices = new Set<number>();

      // 1. Try to match internal transactions to PSP rows
      internalTxns.forEach(t => {
        let match: any = null;
        let matchIdx = -1;

        if (reconMatchBy === 'Transaction ID') {
          matchIdx = pspRows.findIndex((p, idx) => !matchedPspIndices.has(idx) && p['Transaction ID'] === t.txnId);
        } else if (reconMatchBy === 'PSP Reference ID') {
          matchIdx = pspRows.findIndex((p, idx) => !matchedPspIndices.has(idx) && p['PSP Reference ID'] === `PSP-${t.txnId.split('-')[1]}`);
        } else if (reconMatchBy === 'Amount + Date') {
          matchIdx = pspRows.findIndex((p, idx) => {
            if (matchedPspIndices.has(idx)) return false;
            const pDate = new Date(p['Date']);
            const tDate = new Date(t.timestamp);
            const sameDay = pDate.toDateString() === tDate.toDateString();
            const sameAmount = Math.abs(p['Amount'] - t.amount) < 0.01;
            return sameDay && sameAmount;
          });
        }

        if (matchIdx !== -1) {
          match = pspRows[matchIdx];
          matchedPspIndices.add(matchIdx);
          matchedInternalIds.add(t.id);

          const diff = Math.abs(match['Amount'] - t.amount);
          results.push({
            id: `recon-${t.id}`,
            status: diff > 0.01 ? 'Amount diff' : 'Matched',
            txnId: t.txnId,
            pspRefId: match['PSP Reference ID'] || `PSP-${t.txnId.split('-')[1]}`,
            timestamp: t.timestamp,
            client: t.client,
            gateway: t.gateway,
            ourAmount: t.amount,
            pspAmount: match['Amount'],
            difference: diff
          });
        } else {
          // Missing in PSP
          results.push({
            id: `recon-missing-${t.id}`,
            status: 'Missing in PSP',
            txnId: t.txnId,
            timestamp: t.timestamp,
            client: t.client,
            gateway: t.gateway,
            ourAmount: t.amount,
            difference: t.amount
          });
        }
      });

      // 2. Find PSP rows not matched to internal
      pspRows.forEach((p, idx) => {
        if (!matchedPspIndices.has(idx)) {
          results.push({
            id: `recon-not-in-sys-${idx}`,
            status: 'Not in system',
            pspRefId: p['PSP Reference ID'] || `PSP-UNKNOWN-${idx}`,
            timestamp: new Date(p['Date'] || new Date()),
            gateway: reconGateway,
            pspAmount: p['Amount'],
            difference: p['Amount']
          });
        }
      });

      setReconResults(results);
      setFilteredReconResults(results);
      setIsReconciling(false);
    }, 1200);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const XLSX = (window as any).XLSX;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);
      
      setPspFile({
        name: file.name,
        rows: data.length,
        data: data
      });
    };
    reader.readAsBinaryString(file);
  };

  const handleLoadDemoData = () => {
    // Generate some mock PSP data based on allTransactions
    const demoPspData = allTransactions.slice(0, 40).map(t => ({
      'Transaction ID': t.txnId,
      'PSP Reference ID': `PSP-${t.txnId.split('-')[1]}`,
      'Date': t.timestamp,
      'Amount': t.amount,
      'Currency': t.currency
    }));

    // Add some discrepancies
    // 1. Amount diff
    demoPspData[0]['Amount'] += 10.50;
    demoPspData[1]['Amount'] -= 5.00;

    // 2. Not in system (PSP only)
    demoPspData.push({
      'Transaction ID': '',
      'PSP Reference ID': 'PSP-EXTRA-999',
      'Date': new Date(),
      'Amount': 150.00,
      'Currency': 'EUR'
    });

    setPspFile({ 
      name: 'Demo_PSP_Report.xlsx', 
      rows: demoPspData.length,
      data: demoPspData
    });
  };

  const handleExportDiscrepancies = () => {
    if (!(window as any).XLSX) return;
    const XLSX = (window as any).XLSX;
    
    const discrepancies = reconResults.filter(r => r.status !== 'Matched');
    const data = discrepancies.map(r => ({
      'Status': r.status,
      'TXN ID (ours)': r.txnId || 'N/A',
      'PSP Ref ID': r.pspRefId || 'N/A',
      'Date': format(r.timestamp, 'dd MMM yyyy HH:mm'),
      'Client': r.client || 'N/A',
      'Gateway': r.gateway,
      'Our Amount': r.ourAmount || 0,
      'PSP Amount': r.pspAmount || 0,
      'Difference': r.difference,
      'Exception Notes': ''
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Discrepancies");
    XLSX.writeFile(wb, `discrepancies_${reconGateway}_${format(new Date(), 'yyyyMMdd')}.xlsx`);
  };

  useEffect(() => {
    let result = [...reconResults];
    if (activeReconTab !== 'All') {
      result = result.filter(r => r.status === activeReconTab);
    }
    setFilteredReconResults(result);
    setCurrentPage(1);
  }, [activeReconTab, reconResults]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedTxn(null);
        setShowManualMatch(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter States
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [gatewayFilter, setGatewayFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const rowsPerPage = 25;

  const applyFilters = () => {
    let result = [...allTransactions];

    if (fromDate) {
      result = result.filter(t => t.timestamp >= new Date(fromDate));
    }
    if (toDate) {
      result = result.filter(t => t.timestamp <= new Date(toDate));
    }
    if (gatewayFilter !== 'All') {
      result = result.filter(t => t.gateway === gatewayFilter);
    }
    if (statusFilter !== 'All') {
      result = result.filter(t => t.status === statusFilter);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t => 
        t.client.toLowerCase().includes(q) || 
        t.txnId.toLowerCase().includes(q)
      );
    }

    // Tab filtering (Recon status)
    if (activeTab === 'Matched') result = result.filter(t => t.recon === 'Matched');
    else if (activeTab === 'Unmatched') result = result.filter(t => t.recon === 'Unmatched');
    else if (activeTab === 'Disputed') result = result.filter(t => t.status === 'Disputed');

    setFilteredTransactions(result);
    setCurrentPage(1);
  };

  useEffect(() => {
    applyFilters();
  }, [activeTab]);

  const resetFilters = () => {
    setFromDate('');
    setToDate('');
    setGatewayFilter('All');
    setStatusFilter('All');
    setSearchQuery('');
    setFilteredTransactions(allTransactions);
    setCurrentPage(1);
  };

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredTransactions.slice(start, start + rowsPerPage);
  }, [filteredTransactions, currentPage]);

  const totalVolume = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => acc + t.amount, 0);
  }, [filteredTransactions]);

  const successRate = useMemo(() => {
    if (filteredTransactions.length === 0) return 0;
    const completed = filteredTransactions.filter(t => t.status === 'Completed').length;
    return Math.round((completed / filteredTransactions.length) * 100);
  }, [filteredTransactions]);

  const disputedCount = useMemo(() => {
    return filteredTransactions.filter(t => t.status === 'Disputed').length;
  }, [filteredTransactions]);

  const handleExportCSV = () => {
    const headers = ['#', 'Transaction ID', 'Date', 'Client', 'Brand', 'Gateway', 'Amount', 'Currency', 'Status', 'Recon'];
    const rows = filteredTransactions.map((t, i) => [
      i + 1,
      t.txnId,
      format(t.timestamp, 'dd MMM yyyy HH:mm'),
      t.client,
      t.brand,
      t.gateway,
      t.amount,
      t.currency,
      t.status,
      t.recon
    ]);

    const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `settlex_export_${format(new Date(), 'yyyyMMdd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExcel = () => {
    if (!(window as any).XLSX) {
      alert("Excel library not loaded yet.");
      return;
    }
    const XLSX = (window as any).XLSX;
    const data = filteredTransactions.map((t, i) => ({
      '#': i + 1,
      'Transaction ID': t.txnId,
      'Date': format(t.timestamp, 'dd MMM yyyy HH:mm'),
      'Client': t.client,
      'Brand': t.brand,
      'Gateway': t.gateway,
      'Amount': t.amount,
      'Currency': t.currency,
      'Status': t.status,
      'Reconciliation': t.recon
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");
    XLSX.writeFile(wb, `settlex_export_${format(new Date(), 'yyyyMMdd')}.xlsx`);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopyTooltip(text);
    setTimeout(() => setCopyTooltip(null), 1500);
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedTxn(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-[200px] bg-sidebar border-r border-border-subtle fixed h-full flex flex-col z-20 print:hidden">
        <div className="p-5 flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-accent-interactive rounded-lg flex items-center justify-center text-white">
            <RefreshCw size={18} />
          </div>
          <div>
            <h1 className="text-[15px] font-bold leading-tight">SettleX</h1>
            <p className="text-[10px] text-text-tertiary font-medium uppercase tracking-wider">iGaming CRM</p>
          </div>
        </div>

        <nav className="flex-1">
          <SidebarItem 
            icon={CreditCard} 
            label="Transactions" 
            active={activePage === 'Transactions'} 
            onClick={() => setActivePage('Transactions')}
          />
          <SidebarItem 
            icon={RefreshCw} 
            label="Reconciliation" 
            active={activePage === 'Reconciliation'} 
            onClick={() => setActivePage('Reconciliation')}
          />
          <SidebarItem 
            icon={BarChart3} 
            label="Reports" 
            active={activePage === 'Reports'} 
            onClick={() => setActivePage('Reports')}
          />
          <SidebarItem 
            icon={Settings} 
            label="PSP Config" 
            active={activePage === 'PSP Config'} 
            onClick={() => setActivePage('PSP Config')}
          />
          <SidebarItem icon={Wallet} label="Settlement" />
          <SidebarItem icon={Layers} label="Gateways" />
          <SidebarItem icon={ShieldAlert} label="Disputes" />
          <SidebarItem icon={Building2} label="Brands" />
          <SidebarItem icon={Settings} label="Settings" />
        </nav>

        <div className="p-4 border-t border-border-subtle flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-accent-hover flex items-center justify-center text-accent-interactive font-semibold text-xs">
            JD
          </div>
          <div className="flex flex-col">
            <span className="text-[12px] font-semibold">John Doe</span>
            <span className="text-[10px] text-text-tertiary uppercase font-medium">Settlement Lead</span>
          </div>
          <button className="ml-auto text-text-tertiary hover:text-red-500 transition-colors">
            <LogOut size={14} />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-[200px] flex flex-col min-h-screen print:ml-0">
        {/* Top Bar */}
        <header className="h-[52px] bg-white border-b border-border-subtle flex items-center justify-between px-6 sticky top-0 z-10 print:hidden">
          <h2 className="text-[15px] font-semibold">
            {activePage === 'Transactions' ? 'Transaction Database' : 
             activePage === 'Reconciliation' ? 'Reconciliation Center' : 
             activePage === 'Reports' ? 'Reporting & Analytics' : 
             'PSP Configuration'}
          </h2>
          
          <div className="flex bg-bg-page p-1 rounded-lg gap-1">
            {activePage === 'Transactions' ? (
              ['All', 'Matched', 'Unmatched', 'Disputed'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={cn(
                    "px-4 py-1.5 text-[12px] font-medium rounded-md transition-all",
                    activeTab === tab 
                      ? "bg-white text-accent-interactive shadow-sm" 
                      : "text-text-secondary hover:text-text-primary"
                  )}
                >
                  {tab === 'All' ? 'All Transactions' : tab}
                </button>
              ))
            ) : activePage === 'Reconciliation' ? (
              ['All', 'Matched', 'Missing in PSP', 'Not in system', 'Amount diff'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveReconTab(tab as any)}
                  className={cn(
                    "px-4 py-1.5 text-[12px] font-medium rounded-md transition-all",
                    activeReconTab === tab 
                      ? "bg-white text-accent-interactive shadow-sm" 
                      : "text-text-secondary hover:text-text-primary"
                  )}
                >
                  {tab === 'All' ? 'All Results' : tab}
                </button>
              ))
            ) : null}
          </div>

          <div className="flex items-center gap-4 text-text-secondary">
            <button className="hover:text-accent-interactive transition-colors"><Bell size={18} /></button>
            <button className="hover:text-accent-interactive transition-colors"><Settings size={18} /></button>
          </div>
        </header>

        <div className="p-6 flex flex-col gap-6">
          {activePage === 'Transactions' ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-4 gap-4">
                <SummaryCard 
                  title="Transactions" 
                  value={filteredTransactions.length.toString()} 
                  label="Total Transactions" 
                  trend="+12.5%" 
                  icon={LayoutGrid} 
                  trendUp={true} 
                />
                <SummaryCard 
                  title="Volume" 
                  value={`€${totalVolume.toLocaleString()}`} 
                  label="Total Volume" 
                  trend="+8.2%" 
                  icon={BarChart3} 
                  trendUp={true} 
                />
                <SummaryCard 
                  title="Success Rate" 
                  value={`${successRate}%`} 
                  label="Success Rate" 
                  trend="-1.4%" 
                  icon={CheckCircle2} 
                  trendUp={false} 
                />
                <SummaryCard 
                  title="Disputed" 
                  value={disputedCount.toString()} 
                  label="Disputed" 
                  trend="+2" 
                  icon={AlertTriangle} 
                  trendUp={false} 
                />
              </div>

              {/* Filter Toolbar */}
              <div className="bg-white border border-border-subtle rounded-xl p-4 card-shadow flex flex-wrap items-center gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-text-tertiary uppercase">From</label>
                  <input 
                    type="date" 
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="border border-border-subtle rounded-lg px-3 py-1.5 text-[13px] outline-none focus:border-accent-interactive transition-colors" 
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-text-tertiary uppercase">To</label>
                  <input 
                    type="date" 
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="border border-border-subtle rounded-lg px-3 py-1.5 text-[13px] outline-none focus:border-accent-interactive transition-colors" 
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-text-tertiary uppercase">Gateway</label>
                  <select 
                    value={gatewayFilter}
                    onChange={(e) => setGatewayFilter(e.target.value)}
                    className="border border-border-subtle rounded-lg px-3 py-1.5 text-[13px] outline-none focus:border-accent-interactive transition-colors min-w-[140px]"
                  >
                    <option value="All">All Gateways</option>
                    <option value="Stripe">Stripe</option>
                    <option value="PayPal">PayPal</option>
                    <option value="Skrill">Skrill</option>
                    <option value="Neteller">Neteller</option>
                    <option value="Trustly">Trustly</option>
                    <option value="Paysafecard">Paysafecard</option>
                    <option value="MuchBetter">MuchBetter</option>
                    <option value="Rapid Transfer">Rapid Transfer</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-text-tertiary uppercase">Status</label>
                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border border-border-subtle rounded-lg px-3 py-1.5 text-[13px] outline-none focus:border-accent-interactive transition-colors min-w-[140px]"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Completed">Completed</option>
                    <option value="Pending">Pending</option>
                    <option value="Failed">Failed</option>
                    <option value="Disputed">Disputed</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
                  <label className="text-[10px] font-semibold text-text-tertiary uppercase">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" size={16} />
                    <input 
                      type="text" 
                      placeholder="Search client or TXN ID..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full border border-border-subtle rounded-lg pl-10 pr-3 py-1.5 text-[13px] outline-none focus:border-accent-interactive transition-colors" 
                    />
                  </div>
                </div>
                
                <div className="flex items-end gap-2 h-[46px]">
                  <button 
                    onClick={applyFilters}
                    className="bg-accent-interactive text-white px-4 py-2 rounded-lg text-[13px] font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
                  >
                    <Filter size={14} />
                    Apply Filters
                  </button>
                  <button 
                    onClick={resetFilters}
                    className="border border-border-subtle text-text-secondary px-4 py-2 rounded-lg text-[13px] font-medium hover:bg-bg-page transition-colors"
                  >
                    Reset
                  </button>
                </div>

                <div className="ml-auto flex items-end gap-2 h-[46px]">
                  <button 
                    onClick={handleExportCSV}
                    className="border border-accent-interactive text-accent-interactive px-4 py-2 rounded-lg text-[13px] font-medium hover:bg-accent-hover transition-colors flex items-center gap-2"
                  >
                    <Download size={14} />
                    Export CSV
                  </button>
                  <button 
                    onClick={handleExportExcel}
                    className="bg-accent-interactive text-white px-4 py-2 rounded-lg text-[13px] font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
                  >
                    <FileSpreadsheet size={14} />
                    Export Excel
                  </button>
                </div>
              </div>

              {/* Table Container */}
              <div className="bg-white border border-border-subtle rounded-xl card-shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h3 className="text-[13px] font-semibold">Payments Ledger</h3>
                    <span className="bg-accent-hover text-accent-interactive px-2 py-0.5 rounded-full text-[11px] font-semibold">
                      {filteredTransactions.length} records
                    </span>
                  </div>
                  <div className="text-[12px] text-text-tertiary">
                    Showing {Math.min(filteredTransactions.length, (currentPage - 1) * rowsPerPage + 1)}–{Math.min(filteredTransactions.length, currentPage * rowsPerPage)} of {filteredTransactions.length}
                  </div>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-white sticky top-0 z-10 border-b border-border-subtle">
                      <tr>
                        <th className="px-6 py-3 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider w-12">#</th>
                        <th className="px-6 py-3 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Transaction ID</th>
                        <th className="px-6 py-3 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Date & Time</th>
                        <th className="px-6 py-3 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Client</th>
                        <th className="px-6 py-3 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Brand</th>
                        <th className="px-6 py-3 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Gateway</th>
                        <th className="px-6 py-3 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider text-right">Amount</th>
                        <th className="px-6 py-3 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Recon</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F4F4F0]">
                      {paginatedData.map((txn, idx) => (
                        <tr 
                          key={txn.id} 
                          className="hover:bg-[#F8F8FC] cursor-pointer transition-colors group"
                          onClick={() => setSelectedTxn(txn)}
                        >
                          <td className="px-6 py-4 text-[13px] text-text-tertiary">{(currentPage - 1) * rowsPerPage + idx + 1}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[13px] text-accent-interactive font-medium">{txn.txnId}</span>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(txn.txnId);
                                }}
                                className="text-text-tertiary opacity-0 group-hover:opacity-100 hover:text-accent-interactive transition-all relative"
                              >
                                <Copy size={12} />
                                {copyTooltip === txn.txnId && (
                                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-accent-primary text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-20">
                                    Copied!
                                  </span>
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-[13px] text-text-secondary">
                            {format(txn.timestamp, 'dd MMM yyyy HH:mm')}
                          </td>
                          <td className="px-6 py-4 text-[13px] font-medium text-text-primary">{txn.client}</td>
                          <td className="px-6 py-4 text-[13px] text-text-secondary">{txn.brand}</td>
                          <td className="px-6 py-4 text-[13px] text-text-secondary">{txn.gateway}</td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-[13px] font-semibold text-text-primary">{txn.amount.toLocaleString()}</span>
                            <span className="text-[11px] text-text-tertiary ml-1">{txn.currency}</span>
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant={txn.status}>{txn.status}</Badge>
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant={txn.recon === 'Pending' ? 'ReconPending' : txn.recon}>{txn.recon}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-border-subtle flex items-center justify-between">
                  <div className="text-[12px] text-text-tertiary">
                    Page {currentPage} of {Math.ceil(filteredTransactions.length / rowsPerPage) || 1}
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      className="p-1.5 rounded-lg border border-border-subtle text-text-secondary disabled:opacity-30 hover:bg-bg-page transition-colors"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.ceil(filteredTransactions.length / rowsPerPage) || 1 }).map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentPage(i + 1)}
                          className={cn(
                            "w-8 h-8 rounded-lg text-[12px] font-medium transition-colors",
                            currentPage === i + 1 
                              ? "bg-accent-interactive text-white" 
                              : "text-text-secondary hover:bg-bg-page"
                          )}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                    <button 
                      disabled={currentPage === Math.ceil(filteredTransactions.length / rowsPerPage) || filteredTransactions.length === 0}
                      onClick={() => setCurrentPage(p => p + 1)}
                      className="p-1.5 rounded-lg border border-border-subtle text-text-secondary disabled:opacity-30 hover:bg-bg-page transition-colors"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : activePage === 'Reconciliation' ? (
            <>
              {/* Reconciliation Page */}
              <input 
                type="file" 
                id="psp-upload" 
                className="hidden" 
                accept=".csv,.xlsx" 
                onChange={handleFileUpload}
              />
              <div className="bg-white border border-border-subtle rounded-xl p-6 card-shadow grid grid-cols-2 gap-8">
                {/* Left Side - Upload */}
                <div className="flex flex-col gap-4">
                  <div 
                    onClick={() => !pspFile && document.getElementById('psp-upload')?.click()}
                    className={cn(
                      "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors h-[200px] cursor-pointer",
                      pspFile ? "border-green-200 bg-green-50/30" : "border-border-subtle hover:border-accent-interactive"
                    )}
                  >
                    {pspFile ? (
                      <>
                        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3">
                          <Check size={24} />
                        </div>
                        <p className="text-[13px] font-semibold text-text-primary">{pspFile.name}</p>
                        <p className="text-[11px] text-text-secondary mt-1">{pspFile.rows} rows loaded</p>
                        <button 
                          onClick={() => { setPspFile(null); setReconResults([]); }}
                          className="text-[11px] text-red-500 font-semibold mt-4 hover:underline"
                        >
                          Clear file
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="w-12 h-12 bg-bg-page text-text-tertiary rounded-full flex items-center justify-center mb-3">
                          <Upload size={24} />
                        </div>
                        <p className="text-[13px] font-medium text-text-primary">Drop PSP settlement report here</p>
                        <p className="text-[11px] text-text-secondary mt-1">Supports CSV and Excel (.xlsx)</p>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            document.getElementById('psp-upload')?.click();
                          }}
                          className="text-[11px] text-accent-interactive font-semibold mt-4 hover:underline"
                        >
                          or browse files
                        </button>
                      </>
                    )}
                  </div>
                  {!pspFile && (
                    <button 
                      onClick={handleLoadDemoData}
                      className="text-[12px] text-accent-interactive font-medium border border-accent-interactive/20 bg-accent-hover py-2 rounded-lg hover:bg-accent-hover/80 transition-colors"
                    >
                      Load Demo Data
                    </button>
                  )}
                </div>

                {/* Right Side - Metadata */}
                <div className={cn("flex flex-col gap-4", !pspFile && "opacity-40 pointer-events-none")}>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-semibold text-text-tertiary uppercase">Gateway</label>
                      <select 
                        value={reconGateway}
                        onChange={(e) => setReconGateway(e.target.value as Gateway)}
                        className="border border-border-subtle rounded-lg px-3 py-2 text-[13px] outline-none focus:border-accent-interactive transition-colors"
                      >
                        <option value="Stripe">Stripe</option>
                        <option value="PayPal">PayPal</option>
                        <option value="Skrill">Skrill</option>
                        <option value="Neteller">Neteller</option>
                        <option value="Trustly">Trustly</option>
                        <option value="Paysafecard">Paysafecard</option>
                        <option value="MuchBetter">MuchBetter</option>
                        <option value="Rapid Transfer">Rapid Transfer</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-semibold text-text-tertiary uppercase">Match By</label>
                      <select 
                        value={reconMatchBy}
                        onChange={(e) => setReconMatchBy(e.target.value)}
                        className="border border-border-subtle rounded-lg px-3 py-2 text-[13px] outline-none focus:border-accent-interactive transition-colors"
                      >
                        <option>Transaction ID</option>
                        <option>PSP Reference ID</option>
                        <option>Amount + Date</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-semibold text-text-tertiary uppercase">Period From</label>
                      <input type="date" className="border border-border-subtle rounded-lg px-3 py-2 text-[13px] outline-none focus:border-accent-interactive transition-colors" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-semibold text-text-tertiary uppercase">Period To</label>
                      <input type="date" className="border border-border-subtle rounded-lg px-3 py-2 text-[13px] outline-none focus:border-accent-interactive transition-colors" />
                    </div>
                  </div>
                  <button 
                    onClick={runReconciliation}
                    disabled={!pspFile || isReconciling}
                    className="mt-auto bg-accent-interactive text-white h-10 rounded-lg text-[13px] font-semibold hover:opacity-90 transition-opacity disabled:bg-gray-200 disabled:text-gray-400 flex items-center justify-center gap-2"
                  >
                    {isReconciling ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        Reconciling...
                      </>
                    ) : (
                      'Run Reconciliation'
                    )}
                  </button>
                </div>
              </div>

              {/* Summary Cards - Recon */}
              {reconResults.length > 0 && (
                <div className="grid grid-cols-5 gap-4">
                  <SummaryCard 
                    title="Internal" 
                    value={allTransactions.filter(t => t.gateway === reconGateway).length.toString()} 
                    label="Total Internal" 
                    icon={LayoutGrid} 
                  />
                  <SummaryCard 
                    title="PSP" 
                    value={pspFile?.rows.toString() || "0"} 
                    label="Total PSP" 
                    icon={FileSpreadsheet} 
                  />
                  <SummaryCard 
                    title="Matched" 
                    value={reconResults.filter(r => r.status === 'Matched').length.toString()} 
                    label="Matched" 
                    icon={CheckCircle2} 
                    accentColor="border-t-green-500"
                  />
                  <SummaryCard 
                    title="Unmatched" 
                    value={(reconResults.filter(r => r.status === 'Missing in PSP').length + reconResults.filter(r => r.status === 'Not in system').length).toString()} 
                    label="Unmatched" 
                    icon={AlertTriangle} 
                    accentColor="border-t-red-500"
                    subline={`Ours: ${reconResults.filter(r => r.status === 'Missing in PSP').length} | PSP: ${reconResults.filter(r => r.status === 'Not in system').length}`}
                  />
                  <SummaryCard 
                    title="Amount Gap" 
                    value={`€${reconResults.reduce((acc, r) => acc + r.difference, 0).toFixed(2)}`} 
                    label="Amount Gap" 
                    icon={RefreshCw} 
                    accentColor="border-t-amber-500"
                  />
                </div>
              )}

              {/* Recon Table Container */}
              {reconResults.length > 0 && (
                <div className="bg-white border border-border-subtle rounded-xl card-shadow overflow-hidden">
                  <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h3 className="text-[13px] font-semibold">Match Results</h3>
                      <span className="bg-accent-hover text-accent-interactive px-2 py-0.5 rounded-full text-[11px] font-semibold">
                        {filteredReconResults.length} records
                      </span>
                    </div>
                    <button 
                      onClick={handleExportDiscrepancies}
                      className="border border-accent-interactive text-accent-interactive px-4 py-2 rounded-lg text-[13px] font-medium hover:bg-accent-hover transition-colors flex items-center gap-2"
                    >
                      <Download size={14} />
                      Export Discrepancy Report
                    </button>
                  </div>

                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-white sticky top-0 z-10 border-b border-border-subtle">
                        <tr>
                          <th className="px-6 py-3 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">TXN ID (ours)</th>
                          <th className="px-6 py-3 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">PSP Ref ID</th>
                          <th className="px-6 py-3 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Client</th>
                          <th className="px-6 py-3 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Gateway</th>
                          <th className="px-6 py-3 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider text-right">Our Amount</th>
                          <th className="px-6 py-3 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider text-right">PSP Amount</th>
                          <th className="px-6 py-3 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider text-right">Difference</th>
                          <th className="px-6 py-3 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F4F4F0]">
                        {filteredReconResults.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage).map((r) => (
                          <tr 
                            key={r.id} 
                            className={cn(
                              "hover:bg-[#F8F8FC] transition-colors",
                              r.status === 'Missing in PSP' && "border-l-[3px] border-l-red-500 bg-red-50/10",
                              r.status === 'Not in system' && "border-l-[3px] border-l-amber-500 bg-amber-50/10",
                              r.status === 'Amount diff' && "border-l-[3px] border-l-accent-interactive bg-accent-hover/20"
                            )}
                          >
                            <td className="px-6 py-4">
                              <Badge variant={r.status}>{r.status}</Badge>
                            </td>
                            <td className="px-6 py-4 font-mono text-[12px] text-text-primary">{r.txnId || '—'}</td>
                            <td className="px-6 py-4 font-mono text-[12px] text-text-secondary">{r.pspRefId || '—'}</td>
                            <td className="px-6 py-4 text-[12px] text-text-secondary">{format(r.timestamp, 'dd MMM yyyy')}</td>
                            <td className="px-6 py-4 text-[12px] font-medium text-text-primary">{r.client || '—'}</td>
                            <td className="px-6 py-4 text-[12px] text-text-secondary">{r.gateway}</td>
                            <td className="px-6 py-4 text-right text-[12px] font-medium">
                              {r.ourAmount ? `€${r.ourAmount.toLocaleString()}` : '—'}
                            </td>
                            <td className="px-6 py-4 text-right text-[12px] font-medium">
                              {r.pspAmount ? `€${r.pspAmount.toLocaleString()}` : '—'}
                            </td>
                            <td className="px-6 py-4 text-right">
                              {r.difference !== 0 ? (
                                <div className="flex items-center justify-end gap-1 text-red-600 font-semibold text-[12px]">
                                  <span>€{r.difference.toFixed(2)}</span>
                                  <RefreshCw size={10} />
                                </div>
                              ) : (
                                <span className="text-text-tertiary text-[12px]">0.00</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-center">
                              {r.status === 'Matched' ? (
                                <button className="text-text-tertiary hover:text-accent-interactive transition-colors">
                                  <Eye size={16} />
                                </button>
                              ) : r.status === 'Amount diff' ? (
                                <button className="text-[11px] font-semibold text-accent-interactive hover:underline">Review</button>
                              ) : (
                                <button 
                                  onClick={() => setShowManualMatch(r)}
                                  className="text-[11px] font-semibold text-accent-interactive hover:underline flex items-center gap-1 justify-center mx-auto"
                                >
                                  <Link2 size={12} />
                                  Link manually
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination - Recon */}
                  <div className="px-6 py-4 border-t border-border-subtle flex items-center justify-between">
                    <div className="text-[12px] text-text-tertiary">
                      Page {currentPage} of {Math.ceil(filteredReconResults.length / rowsPerPage) || 1}
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        className="p-1.5 rounded-lg border border-border-subtle text-text-secondary disabled:opacity-30 hover:bg-bg-page transition-colors"
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <button 
                        disabled={currentPage === Math.ceil(filteredReconResults.length / rowsPerPage) || filteredReconResults.length === 0}
                        onClick={() => setCurrentPage(p => p + 1)}
                        className="p-1.5 rounded-lg border border-border-subtle text-text-secondary disabled:opacity-30 hover:bg-bg-page transition-colors"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : activePage === 'Reports' ? (
            <ReportsView 
              reportData={reportData}
              prevReportData={prevReportData}
              reportFromDate={reportFromDate}
              reportToDate={reportToDate}
              setReportFromDate={setReportFromDate}
              setReportToDate={setReportToDate}
              reportGateways={reportGateways}
              setReportGateways={setReportGateways}
              reportBrands={reportBrands}
              setReportBrands={setReportBrands}
              generateReport={generateReport}
              isGeneratingReport={isGeneratingReport}
              setSelectedTxn={setSelectedTxn}
              donutFilter={donutFilter}
              setDonutFilter={setDonutFilter}
            />
          ) : (
            <PSPConfigView 
              psps={psps}
              setPsps={setPsps}
              onAdd={() => { setSelectedPSP(null); setIsAddEditPSPModalOpen(true); }}
              onEdit={(psp: any) => { setSelectedPSP(psp); setIsAddEditPSPModalOpen(true); }}
              onHistory={(psp: any) => { setSelectedPSP(psp); setIsHistoryModalOpen(true); }}
              onPing={handlePingPSP}
              onToggleStatus={handleTogglePSPStatus}
              viewMode={pspViewMode}
              setViewMode={setPspViewMode}
            />
          )}
        </div>
      </main>

      {/* Manual Match Modal */}
      <AnimatePresence>
        {showManualMatch && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowManualMatch(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between bg-white sticky top-0 z-10">
                <h3 className="text-[16px] font-semibold text-text-primary">Manual Match</h3>
                <button 
                  onClick={() => setShowManualMatch(null)}
                  className="p-2 hover:bg-bg-page rounded-full text-text-tertiary transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 gap-8">
                {/* Left Panel - Our Transaction */}
                <div className="flex flex-col gap-6">
                  <h4 className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">Internal Transaction</h4>
                  <div className="bg-bg-page rounded-xl p-6 border border-border-subtle">
                    <div className="grid grid-cols-2 gap-y-6">
                      <div>
                        <p className="text-[10px] font-semibold text-text-tertiary uppercase mb-1">Status</p>
                        <Badge variant={showManualMatch.status}>{showManualMatch.status}</Badge>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-text-tertiary uppercase mb-1">TXN ID</p>
                        <p className="text-[13px] font-mono font-medium text-accent-interactive">{showManualMatch.txnId || '—'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-text-tertiary uppercase mb-1">Date</p>
                        <p className="text-[13px] font-medium">{format(showManualMatch.timestamp, 'dd MMM yyyy HH:mm')}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-text-tertiary uppercase mb-1">Client</p>
                        <p className="text-[13px] font-medium">{showManualMatch.client || '—'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-text-tertiary uppercase mb-1">Gateway</p>
                        <p className="text-[13px] font-medium">{showManualMatch.gateway}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-text-tertiary uppercase mb-1">Amount</p>
                        <p className="text-[15px] font-bold text-text-primary">€{(showManualMatch.ourAmount || 0).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Panel - PSP Search */}
                <div className="flex flex-col gap-6">
                  <h4 className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">Find PSP Record</h4>
                  <div className="flex flex-col gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" size={16} />
                      <input 
                        type="text" 
                        placeholder="Search by PSP Ref or Amount..." 
                        value={manualMatchSearch}
                        onChange={(e) => setManualMatchSearch(e.target.value)}
                        className="w-full border border-border-subtle rounded-lg pl-10 pr-3 py-2 text-[13px] outline-none focus:border-accent-interactive transition-colors" 
                      />
                    </div>
                    
                    <div className="border border-border-subtle rounded-xl overflow-hidden">
                      <div className="bg-bg-page px-4 py-2 text-[10px] font-bold text-text-tertiary uppercase border-b border-border-subtle">
                        Suggested Matches
                      </div>
                      <div className="divide-y divide-border-subtle max-h-[300px] overflow-y-auto">
                        {suggestedMatches.length > 0 ? suggestedMatches.map((p, i) => (
                          <label key={i} className="flex items-center gap-4 p-4 hover:bg-bg-page cursor-pointer transition-colors">
                            <input 
                              type="radio" 
                              name="psp-match" 
                              className="w-4 h-4 text-accent-interactive" 
                              checked={selectedPspMatch === p}
                              onChange={() => setSelectedPspMatch(p)}
                            />
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <span className="text-[13px] font-mono font-medium">{p['PSP Reference ID'] || 'N/A'}</span>
                                <span className="text-[13px] font-bold text-text-primary">€{(p['Amount'] || 0).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between items-center mt-1">
                                <span className="text-[11px] text-text-tertiary">{p['Date'] ? format(new Date(p['Date']), 'dd MMM yyyy') : '—'}</span>
                                {Math.abs(p['Amount'] - (showManualMatch?.ourAmount || 0)) < 0.01 && (
                                  <span className="text-[11px] text-green-600 font-medium">Amount Match</span>
                                )}
                              </div>
                            </div>
                          </label>
                        )) : (
                          <div className="p-8 text-center text-text-tertiary text-[12px]">
                            No matches found. Try searching.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-border-subtle bg-bg-page flex items-center justify-end gap-3 sticky bottom-0 z-10">
                <button 
                  onClick={() => setShowManualMatch(null)}
                  className="px-4 py-2 text-[13px] font-medium text-text-secondary hover:bg-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleMarkException}
                  className="px-4 py-2 text-[13px] font-medium border border-accent-interactive text-accent-interactive hover:bg-accent-hover rounded-lg transition-colors"
                >
                  Mark as Exception
                </button>
                <button 
                  onClick={handleConfirmMatch}
                  disabled={!selectedPspMatch}
                  className="px-6 py-2 text-[13px] font-semibold bg-accent-interactive text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm Match
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Transaction Detail Modal */}
      <AnimatePresence>
        {selectedTxn && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTxn(null)}
              className="absolute inset-0 bg-black/35 backdrop-blur-[2px]"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-[480px] rounded-2xl shadow-2xl overflow-hidden relative z-10"
            >
              <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[14px] font-semibold text-accent-interactive">{selectedTxn.txnId}</span>
                  <Badge variant={selectedTxn.status}>{selectedTxn.status}</Badge>
                </div>
                <button 
                  onClick={() => setSelectedTxn(null)}
                  className="text-text-tertiary hover:text-text-primary transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                  <div>
                    <p className="text-[10px] font-semibold text-text-tertiary uppercase mb-1">Date & Time</p>
                    <p className="text-[13px] font-medium">{format(selectedTxn.timestamp, 'dd MMM yyyy HH:mm:ss')}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-text-tertiary uppercase mb-1">Client Name</p>
                    <p className="text-[13px] font-medium">{selectedTxn.client}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-text-tertiary uppercase mb-1">Brand</p>
                    <p className="text-[13px] font-medium">{selectedTxn.brand}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-text-tertiary uppercase mb-1">Gateway</p>
                    <p className="text-[13px] font-medium">{selectedTxn.gateway}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-text-tertiary uppercase mb-1">Amount</p>
                    <p className="text-[16px] font-bold text-accent-primary">{selectedTxn.amount.toLocaleString()} {selectedTxn.currency}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-text-tertiary uppercase mb-1">Currency</p>
                    <p className="text-[13px] font-medium">{selectedTxn.currency}</p>
                  </div>
                </div>

                <div className="mt-8 p-4 bg-bg-page rounded-xl border border-border-subtle">
                  <h4 className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider mb-3">Settlement Section</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-text-secondary">Reconciliation Status</span>
                    <Badge variant={selectedTxn.recon === 'Pending' ? 'ReconPending' : selectedTxn.recon}>{selectedTxn.recon}</Badge>
                  </div>
                  <div className="mt-3 text-[12px] text-text-tertiary leading-relaxed">
                    {selectedTxn.recon === 'Matched' 
                      ? "Transaction has been successfully reconciled with the gateway provider's statement."
                      : selectedTxn.recon === 'Unmatched'
                      ? "Discrepancy detected between internal ledger and gateway report. Manual review required."
                      : "Awaiting gateway statement for final reconciliation."}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t border-border-subtle flex justify-end">
                <button 
                  onClick={() => setSelectedTxn(null)}
                  className="bg-white border border-border-subtle text-text-primary px-6 py-2 rounded-lg text-[13px] font-semibold hover:bg-bg-page transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* PSP Modals & Toasts */}
      <AnimatePresence>
        {isAddEditPSPModalOpen && (
          <AddEditPSPModal 
            psp={selectedPSP}
            onClose={() => { setIsAddEditPSPModalOpen(false); setSelectedPSP(null); }}
            onSave={handleSavePSP}
          />
        )}
        {isHistoryModalOpen && selectedPSP && (
          <HistoryModal 
            psp={selectedPSP}
            onClose={() => { setIsHistoryModalOpen(false); setSelectedPSP(null); }}
          />
        )}
        {toasts.map(toast => (
          <Toast 
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
