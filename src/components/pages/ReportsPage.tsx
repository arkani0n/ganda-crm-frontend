import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Download, 
  Filter, 
  ChevronRight,
  ArrowRight,
  PieChart,
  Target,
  Users,
  Zap
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay, differenceInDays } from 'date-fns';
import { Transaction } from '../../types';
import { MultiSelect } from '../shared/MultiSelect';
import { calculateKPIs, groupByDay, getTrendValue, getGatewayBreakdown, getTopClients } from '../../lib/reports/calculations';
import { cn } from '../../lib/utils';

interface ReportsPageProps {
  allTransactions: Transaction[];
  onExport: (data: any[], filename: string) => void;
}

export const ReportsPage = ({
  allTransactions,
  onExport
}: ReportsPageProps) => {
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
    if (reportData.length === 0 && allTransactions.length > 0) {
      generateReport();
    }
  }, [allTransactions]);

  const kpis = useMemo(() => calculateKPIs(reportData), [reportData]);
  const prevKpis = useMemo(() => calculateKPIs(prevReportData), [prevReportData]);
  
  const dailyData = useMemo(() => groupByDay(reportData), [reportData]);
  const gatewayBreakdown = useMemo(() => getGatewayBreakdown(reportData), [reportData]);
  const topClients = useMemo(() => getTopClients(reportData), [reportData]);

  const gateways = Array.from(new Set(allTransactions.map(t => t.gateway)));
  const brands = Array.from(new Set(allTransactions.map(t => t.brand)));

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[24px] font-bold text-text-primary tracking-tight">Analytics & Reports</h1>
          <p className="text-[13px] text-text-tertiary">Gain deep insights into your payment performance and gateway efficiency.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => onExport(reportData, `Report_${reportFromDate}_to_${reportToDate}.xlsx`)}
            className="flex items-center gap-2 px-4 py-2.5 border border-border-subtle rounded-lg text-[13px] font-medium text-text-secondary hover:bg-white hover:text-text-primary transition-all"
          >
            <Download size={16} /> Export Report
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-border-subtle rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-text-tertiary uppercase">Date From</label>
            <div className="relative">
              <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
              <input 
                type="date" 
                value={reportFromDate}
                onChange={(e) => setReportFromDate(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-bg-page border border-border-subtle rounded-lg text-[12px] focus:outline-none focus:ring-1 focus:ring-accent-interactive focus:border-accent-interactive transition-all"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-text-tertiary uppercase">Date To</label>
            <div className="relative">
              <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
              <input 
                type="date" 
                value={reportToDate}
                onChange={(e) => setReportToDate(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-bg-page border border-border-subtle rounded-lg text-[12px] focus:outline-none focus:ring-1 focus:ring-accent-interactive focus:border-accent-interactive transition-all"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-text-tertiary uppercase">Gateways</label>
            <MultiSelect 
              label="Select Gateways" 
              options={gateways} 
              selected={reportGateways} 
              onChange={setReportGateways} 
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-text-tertiary uppercase">Brands</label>
            <MultiSelect 
              label="Select Brands" 
              options={brands} 
              selected={reportBrands} 
              onChange={setReportBrands} 
            />
          </div>
        </div>
        <button 
          onClick={generateReport}
          disabled={isGeneratingReport}
          className="px-8 py-2.5 bg-accent-interactive text-white rounded-xl text-[14px] font-bold hover:bg-accent-interactive/90 transition-all shadow-lg shadow-accent-interactive/20 flex items-center justify-center gap-2 min-w-[160px]"
        >
          {isGeneratingReport ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Zap size={18} />
              Update Report
            </>
          )}
        </button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-border-subtle rounded-2xl p-6 shadow-sm flex flex-col gap-4 group hover:border-accent-interactive/30 transition-all">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 bg-accent-hover text-accent-interactive rounded-lg flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
            <div className={cn(
              "flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full",
              getTrendValue(kpis.totalVolume, prevKpis.totalVolume) >= 0 ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"
            )}>
              {getTrendValue(kpis.totalVolume, prevKpis.totalVolume) >= 0 ? '+' : ''}
              {getTrendValue(kpis.totalVolume, prevKpis.totalVolume).toFixed(1)}%
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider mb-1">Total Volume</span>
            <span className="text-[24px] font-bold text-text-primary tracking-tight">€{kpis.totalVolume.toLocaleString()}</span>
            <span className="text-[11px] text-text-tertiary mt-1 italic">vs. prev. period: €{prevKpis.totalVolume.toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-white border border-border-subtle rounded-2xl p-6 shadow-sm flex flex-col gap-4 group hover:border-accent-interactive/30 transition-all">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
              <Target size={20} />
            </div>
            <div className={cn(
              "flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full",
              getTrendValue(kpis.successRate, prevKpis.successRate) >= 0 ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"
            )}>
              {getTrendValue(kpis.successRate, prevKpis.successRate) >= 0 ? '+' : ''}
              {getTrendValue(kpis.successRate, prevKpis.successRate).toFixed(1)}%
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider mb-1">Success Rate</span>
            <span className="text-[24px] font-bold text-text-primary tracking-tight">{kpis.successRate.toFixed(1)}%</span>
            <span className="text-[11px] text-text-tertiary mt-1 italic">vs. prev. period: {prevKpis.successRate.toFixed(1)}%</span>
          </div>
        </div>

        <div className="bg-white border border-border-subtle rounded-2xl p-6 shadow-sm flex flex-col gap-4 group hover:border-accent-interactive/30 transition-all">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
              <Users size={20} />
            </div>
            <div className={cn(
              "flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full",
              getTrendValue(kpis.avgTicket, prevKpis.avgTicket) >= 0 ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"
            )}>
              {getTrendValue(kpis.avgTicket, prevKpis.avgTicket) >= 0 ? '+' : ''}
              {getTrendValue(kpis.avgTicket, prevKpis.avgTicket).toFixed(1)}%
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider mb-1">Avg. Ticket Size</span>
            <span className="text-[24px] font-bold text-text-primary tracking-tight">€{kpis.avgTicket.toLocaleString()}</span>
            <span className="text-[11px] text-text-tertiary mt-1 italic">vs. prev. period: €{prevKpis.avgTicket.toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-white border border-border-subtle rounded-2xl p-6 shadow-sm flex flex-col gap-4 group hover:border-accent-interactive/30 transition-all">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center">
              <BarChart3 size={20} />
            </div>
            <div className={cn(
              "flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full",
              getTrendValue(kpis.totalCount, prevKpis.totalCount) >= 0 ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"
            )}>
              {getTrendValue(kpis.totalCount, prevKpis.totalCount) >= 0 ? '+' : ''}
              {getTrendValue(kpis.totalCount, prevKpis.totalCount).toFixed(1)}%
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider mb-1">Txn Count</span>
            <span className="text-[24px] font-bold text-text-primary tracking-tight">{kpis.totalCount.toLocaleString()}</span>
            <span className="text-[11px] text-text-tertiary mt-1 italic">vs. prev. period: {prevKpis.totalCount.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Daily Volume Chart Placeholder */}
        <div className="lg:col-span-2 bg-white border border-border-subtle rounded-2xl p-6 shadow-sm flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <h3 className="text-[15px] font-bold text-text-primary">Daily Transaction Volume</h3>
              <p className="text-[12px] text-text-tertiary">Trend analysis over the selected period.</p>
            </div>
            <div className="flex items-center gap-2 bg-bg-page p-1 rounded-lg">
              <button className="px-3 py-1 text-[11px] font-bold bg-white text-accent-interactive shadow-sm rounded-md">Volume</button>
              <button className="px-3 py-1 text-[11px] font-bold text-text-tertiary hover:text-text-primary transition-colors">Count</button>
            </div>
          </div>
          
          <div className="h-[300px] w-full flex items-end gap-2 pb-6 border-b border-border-subtle relative">
            {dailyData.length > 0 ? (
              dailyData.map((d, i) => {
                const max = Math.max(...dailyData.map(x => x.volume));
                const height = max > 0 ? (d.volume / max) * 100 : 0;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative">
                    <div 
                      className="w-full bg-accent-interactive/20 group-hover:bg-accent-interactive transition-all rounded-t-sm relative"
                      style={{ height: `${height}%` }}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-text-primary text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                        €{d.volume.toLocaleString()}
                      </div>
                    </div>
                    <span className="text-[9px] font-bold text-text-tertiary uppercase rotate-45 mt-2 origin-left whitespace-nowrap">
                      {format(new Date(d.date), 'dd MMM')}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-text-tertiary text-[13px]">
                No data available for the selected period.
              </div>
            )}
          </div>
        </div>

        {/* Gateway Breakdown */}
        <div className="bg-white border border-border-subtle rounded-2xl p-6 shadow-sm flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h3 className="text-[15px] font-bold text-text-primary">Gateway Distribution</h3>
            <p className="text-[12px] text-text-tertiary">Volume share per payment provider.</p>
          </div>

          <div className="flex flex-col gap-4">
            {gatewayBreakdown.map((g, i) => (
              <div key={i} className="flex flex-col gap-2 group cursor-pointer" onClick={() => setDonutFilter(donutFilter === g.name ? null : g.name)}>
                <div className="flex items-center justify-between text-[12px]">
                  <span className={cn("font-bold transition-colors", donutFilter === g.name ? "text-accent-interactive" : "text-text-secondary group-hover:text-text-primary")}>
                    {g.name}
                  </span>
                  <span className="font-mono text-text-tertiary">{g.percentage.toFixed(1)}%</span>
                </div>
                <div className="h-2 w-full bg-bg-page rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${g.percentage}%` }}
                    className={cn(
                      "h-full transition-all",
                      donutFilter === g.name ? "bg-accent-interactive" : "bg-accent-interactive/40 group-hover:bg-accent-interactive/60"
                    )}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-text-tertiary">
                  <span>{g.count} txns</span>
                  <span className="font-bold">€{g.volume.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Clients Table */}
      <div className="bg-white border border-border-subtle rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-border-subtle bg-bg-page/50 flex items-center justify-between">
          <h3 className="text-[15px] font-bold text-text-primary">Top Clients by Volume</h3>
          <button className="text-[12px] font-bold text-accent-interactive hover:underline">View All Clients</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bg-page/30 border-b border-border-subtle">
                <th className="px-6 py-3 text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Client Name</th>
                <th className="px-6 py-3 text-[10px] font-bold text-text-tertiary uppercase tracking-wider text-right">Txn Count</th>
                <th className="px-6 py-3 text-[10px] font-bold text-text-tertiary uppercase tracking-wider text-right">Success Rate</th>
                <th className="px-6 py-3 text-[10px] font-bold text-text-tertiary uppercase tracking-wider text-right">Total Volume</th>
                <th className="px-6 py-3 text-[10px] font-bold text-text-tertiary uppercase tracking-wider text-right">Avg. Ticket</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {topClients.map((c, i) => (
                <tr key={i} className="hover:bg-accent-hover/10 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-[13px] font-bold text-text-primary">{c.name}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-[12px] text-text-secondary">{c.count}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-1.5 bg-bg-page rounded-full overflow-hidden">
                        <div className="h-full bg-green-500" style={{ width: `${c.successRate}%` }} />
                      </div>
                      <span className="text-[11px] font-bold text-text-tertiary">{c.successRate.toFixed(1)}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-[13px] font-bold text-text-primary">€{c.volume.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-[12px] text-text-secondary">€{c.avgTicket.toLocaleString()}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
