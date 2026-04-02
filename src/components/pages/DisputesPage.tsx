import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Filter,
  ShieldAlert,
  DollarSign,
  AlertTriangle,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { Dispute, DisputeStatus, DisputeReasonCategory, PSPConfig } from '../../types';
import { SummaryCard } from '../shared/SummaryCard';
import { MultiSelect } from '../shared/MultiSelect';
import { Badge } from '../shared/Badge';
import { DisputeDetailPanel } from '../disputes/DisputeDetailPanel';
import { getDeadlineUrgency, getDeadlineLabel } from '../../lib/disputes/deadlines';
import { cn } from '../../lib/utils';

type DisputeTab = 'All' | 'Open' | 'In Progress' | 'Closed';

interface DisputesPageProps {
  disputes: Dispute[];
  allTransactionsCount: number;
  pspConfigs: PSPConfig[];
  onStatusChange: (disputeId: string, newStatus: DisputeStatus) => void;
  onNotesChange: (disputeId: string, notes: string) => void;
  onBuildTemplate: (dispute: Dispute) => void;
  onExportCase: (dispute: Dispute) => void;
}

export const DisputesPage = ({
  disputes,
  allTransactionsCount,
  pspConfigs,
  onStatusChange,
  onNotesChange,
  onBuildTemplate,
  onExportCase,
}: DisputesPageProps) => {
  const [activeTab, setActiveTab] = useState<DisputeTab>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [gatewayFilter, setGatewayFilter] = useState<string[]>(['All']);
  const [reasonFilter, setReasonFilter] = useState<string[]>(['All']);
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showColumnManager, setShowColumnManager] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem('settlex.disputes.visibleColumns');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return ['Dispute ID', 'Transaction ID', 'Client', 'Gateway', 'Amount', 'Reason', 'Status', 'Deadline', 'Worth Fighting', 'PSP Fee'];
  });

  const allPossibleColumns = [
    { id: 'Dispute ID', label: 'Dispute ID' },
    { id: 'Transaction ID', label: 'Transaction ID' },
    { id: 'Client', label: 'Client' },
    { id: 'Gateway', label: 'Gateway' },
    { id: 'Amount', label: 'Amount' },
    { id: 'Reason', label: 'Reason' },
    { id: 'Status', label: 'Status' },
    { id: 'Deadline', label: 'Deadline' },
    { id: 'Worth Fighting', label: 'Worth Fighting' },
    { id: 'PSP Fee', label: 'PSP Fee' },
    { id: 'Raw Code', label: 'Raw Reason Code' },
    { id: 'Txn Date', label: 'Original Txn Date' },
    { id: 'Currency', label: 'Currency' },
    { id: 'Brand', label: 'Brand' },
    { id: 'Resolved Date', label: 'Resolution Date' },
    { id: 'Outcome Amount', label: 'Outcome Amount' },
  ];

  const toggleColumn = (id: string) => {
    setVisibleColumns(prev => {
      let next;
      if (prev.includes(id)) {
        if (prev.length === 1) return prev;
        next = prev.filter(c => c !== id);
      } else {
        next = [...prev, id];
      }
      localStorage.setItem('settlex.disputes.visibleColumns', JSON.stringify(next));
      return next;
    });
  };

  const gateways = ['All', ...Array.from(new Set(disputes.map(d => d.transaction.gateway)))];
  const reasons: string[] = ['All', 'Fraud', 'Product not received', 'Not as described', 'Duplicate charge', 'Subscription cancelled', 'Other'];

  const filteredDisputes = useMemo(() => {
    let result = disputes;

    if (activeTab === 'Open') result = result.filter(d => d.status === 'Open');
    else if (activeTab === 'In Progress') result = result.filter(d => d.status === 'In Progress');
    else if (activeTab === 'Closed') result = result.filter(d => ['Won', 'Lost', 'Accepted'].includes(d.status));

    if (urgentOnly) result = result.filter(d => getDeadlineUrgency(d.deadline) === 'urgent');

    if (!gatewayFilter.includes('All')) {
      result = result.filter(d => gatewayFilter.includes(d.transaction.gateway));
    }

    if (!reasonFilter.includes('All')) {
      result = result.filter(d => reasonFilter.includes(d.reasonCategory));
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(d =>
        d.id.toLowerCase().includes(q) ||
        d.transaction.txnId.toLowerCase().includes(q) ||
        d.transaction.client.toLowerCase().includes(q)
      );
    }

    return result;
  }, [disputes, activeTab, urgentOnly, gatewayFilter, reasonFilter, searchQuery]);

  const stats = useMemo(() => {
    const open = disputes.filter(d => d.status === 'Open' || d.status === 'In Progress').length;
    const exposure = disputes
      .filter(d => d.status === 'Open' || d.status === 'In Progress')
      .reduce((sum, d) => sum + d.disputeAmount, 0);
    const urgent = disputes.filter(d =>
      (d.status === 'Open' || d.status === 'In Progress') &&
      getDeadlineUrgency(d.deadline) === 'urgent'
    ).length;
    const chargebackRate = allTransactionsCount > 0
      ? (disputes.length / allTransactionsCount * 100)
      : 0;

    return { open, exposure, urgent, chargebackRate };
  }, [disputes, allTransactionsCount]);

  const tabs: { key: DisputeTab; label: string; count: number }[] = [
    { key: 'All', label: 'All', count: disputes.length },
    { key: 'Open', label: 'Open', count: disputes.filter(d => d.status === 'Open').length },
    { key: 'In Progress', label: 'In Progress', count: disputes.filter(d => d.status === 'In Progress').length },
    { key: 'Closed', label: 'Closed', count: disputes.filter(d => ['Won', 'Lost', 'Accepted'].includes(d.status)).length },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-[24px] font-bold text-text-primary tracking-tight">Disputes</h1>
        <p className="text-[13px] text-text-tertiary">Track chargebacks, manage deadlines, and build counter-chargeback documents.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard
          label="Open Disputes"
          title="Open"
          value={stats.open.toString()}
          icon={ShieldAlert}
        />
        <SummaryCard
          label="Total Exposure"
          title="Exposure"
          value={`€${stats.exposure.toLocaleString()}`}
          icon={DollarSign}
          accentColor="red-600"
        />
        <div
          onClick={() => { setUrgentOnly(!urgentOnly); setActiveTab('All'); }}
          className="cursor-pointer"
        >
          <SummaryCard
            label="Urgent (< 48h)"
            title="Urgent"
            value={stats.urgent.toString()}
            icon={AlertTriangle}
            accentColor="red-600"
            subline={urgentOnly ? 'Filtered' : 'Click to filter'}
          />
        </div>
        <SummaryCard
          label="Chargeback Rate"
          title="CB Rate"
          value={`${stats.chargebackRate.toFixed(2)}%`}
          icon={TrendingDown}
          accentColor="amber-600"
        />
      </div>

      {/* Tabs + Filters + Table */}
      <div className="bg-white border border-border-subtle rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {/* Filter Bar */}
        <div className="px-6 py-4 border-b border-border-subtle bg-bg-page/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 bg-white border border-border-subtle rounded-lg p-1">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => { setActiveTab(tab.key); setUrgentOnly(false); }}
                  className={cn(
                    "px-3 py-1 text-[11px] font-bold rounded-md transition-all flex items-center gap-1.5",
                    activeTab === tab.key ? "bg-accent-interactive text-white shadow-sm" : "text-text-tertiary hover:text-text-primary"
                  )}
                >
                  {tab.label}
                  <span className={cn(
                    "text-[9px] px-1.5 py-0.5 rounded-full font-bold",
                    activeTab === tab.key ? "bg-white/20 text-white" : "bg-bg-page text-text-tertiary"
                  )}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-56">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
              <input
                type="text"
                placeholder="Search ID, Client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-border-subtle rounded-lg text-[12px] focus:outline-none focus:ring-1 focus:ring-accent-interactive transition-all"
              />
            </div>

            <MultiSelect
              label="Gateways"
              options={gateways}
              selected={gatewayFilter}
              onChange={setGatewayFilter}
            />
            <MultiSelect
              label="Reason"
              options={reasons}
              selected={reasonFilter}
              onChange={setReasonFilter}
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setShowColumnManager(!showColumnManager)}
                className="flex items-center gap-2 px-4 py-2 border border-border-subtle rounded-lg text-[13px] font-medium text-text-secondary hover:bg-white transition-all"
              >
                <Filter size={16} /> Columns
              </button>

              <AnimatePresence>
                {showColumnManager && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 top-full mt-2 w-64 bg-white border border-border-subtle rounded-xl shadow-xl z-50 p-4"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-[14px] font-bold text-text-primary">Visible Columns</h3>
                      <button onClick={() => setShowColumnManager(false)} className="text-text-tertiary hover:text-text-primary">
                        <X size={16} />
                      </button>
                    </div>
                    <div className="flex flex-col gap-2 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                      {allPossibleColumns.map(col => (
                        <label key={col.id} className="flex items-center gap-3 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={visibleColumns.includes(col.id)}
                            onChange={() => toggleColumn(col.id)}
                            className="w-4 h-4 rounded border-border-subtle text-accent-interactive focus:ring-accent-interactive"
                          />
                          <span className="text-[13px] text-text-secondary group-hover:text-text-primary transition-colors">{col.label}</span>
                        </label>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {(urgentOnly || !gatewayFilter.includes('All') || !reasonFilter.includes('All') || searchQuery) && (
              <button
                onClick={() => { setSearchQuery(''); setGatewayFilter(['All']); setReasonFilter(['All']); setUrgentOnly(false); }}
                className="text-[12px] font-semibold text-text-tertiary hover:text-accent-interactive transition-colors"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bg-page/30 border-b border-border-subtle">
                <th className="px-3 py-3 w-8"></th>
                {visibleColumns.includes('Dispute ID') && <Th>Dispute ID</Th>}
                {visibleColumns.includes('Transaction ID') && <Th>Transaction ID</Th>}
                {visibleColumns.includes('Client') && <Th>Client</Th>}
                {visibleColumns.includes('Gateway') && <Th>Gateway</Th>}
                {visibleColumns.includes('Amount') && <Th>Amount</Th>}
                {visibleColumns.includes('Reason') && <Th>Reason</Th>}
                {visibleColumns.includes('Status') && <Th>Status</Th>}
                {visibleColumns.includes('Deadline') && <Th>Deadline</Th>}
                {visibleColumns.includes('Worth Fighting') && <Th>Worth Fighting</Th>}
                {visibleColumns.includes('PSP Fee') && <Th>PSP Fee</Th>}
                {visibleColumns.includes('Raw Code') && <Th>Raw Code</Th>}
                {visibleColumns.includes('Txn Date') && <Th>Txn Date</Th>}
                {visibleColumns.includes('Currency') && <Th>Currency</Th>}
                {visibleColumns.includes('Brand') && <Th>Brand</Th>}
                {visibleColumns.includes('Resolved Date') && <Th>Resolved Date</Th>}
                {visibleColumns.includes('Outcome Amount') && <Th>Outcome</Th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filteredDisputes.map((dispute) => {
                const isExpanded = expandedId === dispute.id;
                const urgency = getDeadlineUrgency(dispute.deadline);
                const deadlineLabel = getDeadlineLabel(dispute.deadline);
                const isResolved = ['Won', 'Lost', 'Accepted'].includes(dispute.status);

                const urgencyBg: Record<string, string> = {
                  safe: '',
                  warning: '',
                  urgent: 'bg-red-50/30',
                  expired: 'bg-red-50/50',
                };

                return (
                  <React.Fragment key={dispute.id}>
                    <tr
                      onClick={() => setExpandedId(isExpanded ? null : dispute.id)}
                      className={cn(
                        "hover:bg-accent-hover/10 transition-colors cursor-pointer",
                        urgencyBg[urgency],
                        isExpanded && "bg-accent-hover/5"
                      )}
                    >
                      <td className="px-3 py-4">
                        {isExpanded ? <ChevronUp size={14} className="text-text-tertiary" /> : <ChevronDown size={14} className="text-text-tertiary" />}
                      </td>
                      {visibleColumns.includes('Dispute ID') && (
                        <td className="px-4 py-4">
                          <span className="font-mono text-[12px] font-medium text-text-primary">{dispute.id}</span>
                        </td>
                      )}
                      {visibleColumns.includes('Transaction ID') && (
                        <td className="px-4 py-4">
                          <span className="font-mono text-[12px] font-medium text-text-secondary">{dispute.transaction.txnId}</span>
                        </td>
                      )}
                      {visibleColumns.includes('Client') && (
                        <td className="px-4 py-4">
                          <span className="text-[12px] font-bold text-text-primary">{dispute.transaction.client}</span>
                        </td>
                      )}
                      {visibleColumns.includes('Gateway') && (
                        <td className="px-4 py-4">
                          <span className="text-[12px] font-medium text-text-secondary">{dispute.transaction.gateway}</span>
                        </td>
                      )}
                      {visibleColumns.includes('Amount') && (
                        <td className="px-4 py-4">
                          <span className="text-[13px] font-bold text-text-primary">{dispute.disputeAmount.toLocaleString()} {dispute.currency}</span>
                        </td>
                      )}
                      {visibleColumns.includes('Reason') && (
                        <td className="px-4 py-4">
                          <span className="text-[12px] text-text-secondary">{dispute.reasonCategory}</span>
                        </td>
                      )}
                      {visibleColumns.includes('Status') && (
                        <td className="px-4 py-4">
                          <Badge variant={dispute.status}>{dispute.status}</Badge>
                        </td>
                      )}
                      {visibleColumns.includes('Deadline') && (
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[12px] font-medium text-text-primary">{format(dispute.deadline, 'dd MMM')}</span>
                            {!isResolved && (
                              <span className={cn(
                                "px-1.5 py-0.5 rounded-full text-[9px] font-bold",
                                urgency === 'safe' ? "text-green-600 bg-green-50" :
                                urgency === 'warning' ? "text-amber-600 bg-amber-50" :
                                urgency === 'urgent' ? "text-red-600 bg-red-50" :
                                "text-red-800 bg-red-100"
                              )}>
                                {deadlineLabel}
                              </span>
                            )}
                          </div>
                        </td>
                      )}
                      {visibleColumns.includes('Worth Fighting') && (
                        <td className="px-4 py-4">
                          <Badge variant={dispute.worthFighting.recommendation}>
                            {dispute.worthFighting.recommendation}
                          </Badge>
                        </td>
                      )}
                      {visibleColumns.includes('PSP Fee') && (
                        <td className="px-4 py-4">
                          <span className="text-[12px] font-medium text-text-secondary">{dispute.pspFee.toFixed(2)}</span>
                        </td>
                      )}
                      {visibleColumns.includes('Raw Code') && (
                        <td className="px-4 py-4">
                          <span className="text-[11px] font-mono text-text-tertiary">{dispute.rawReasonCode || '—'}</span>
                        </td>
                      )}
                      {visibleColumns.includes('Txn Date') && (
                        <td className="px-4 py-4">
                          <span className="text-[12px] text-text-secondary">{format(dispute.transaction.timestamp, 'dd MMM yyyy')}</span>
                        </td>
                      )}
                      {visibleColumns.includes('Currency') && (
                        <td className="px-4 py-4">
                          <span className="text-[12px] text-text-secondary">{dispute.currency}</span>
                        </td>
                      )}
                      {visibleColumns.includes('Brand') && (
                        <td className="px-4 py-4">
                          <span className="text-[12px] text-text-secondary">{dispute.transaction.brand}</span>
                        </td>
                      )}
                      {visibleColumns.includes('Resolved Date') && (
                        <td className="px-4 py-4">
                          <span className="text-[12px] text-text-secondary">
                            {dispute.resolvedDate ? format(dispute.resolvedDate, 'dd MMM yyyy') : '—'}
                          </span>
                        </td>
                      )}
                      {visibleColumns.includes('Outcome Amount') && (
                        <td className="px-4 py-4">
                          <span className="text-[12px] text-text-secondary">
                            {dispute.outcomeAmount !== undefined ? `${dispute.outcomeAmount.toLocaleString()} ${dispute.currency}` : '—'}
                          </span>
                        </td>
                      )}
                    </tr>

                    <AnimatePresence>
                      {isExpanded && (
                        <tr>
                          <td colSpan={visibleColumns.length + 1}>
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <DisputeDetailPanel
                                dispute={dispute}
                                onStatusChange={onStatusChange}
                                onNotesChange={onNotesChange}
                                onBuildTemplate={onBuildTemplate}
                                onExportCase={onExportCase}
                              />
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                );
              })}

              {filteredDisputes.length === 0 && (
                <tr>
                  <td colSpan={visibleColumns.length + 1} className="px-6 py-16 text-center">
                    <ShieldAlert size={32} className="mx-auto text-text-tertiary mb-3" />
                    <p className="text-[13px] text-text-tertiary">No disputes match the current filters.</p>
                    <button
                      onClick={() => { setActiveTab('All'); setSearchQuery(''); setGatewayFilter(['All']); setReasonFilter(['All']); setUrgentOnly(false); }}
                      className="text-[12px] text-accent-interactive hover:underline font-medium mt-1"
                    >
                      Clear all filters
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-3 border-t border-border-subtle bg-bg-page/30">
          <span className="text-[12px] text-text-tertiary">
            Showing <span className="font-bold text-text-secondary">{filteredDisputes.length}</span> of <span className="font-bold text-text-secondary">{disputes.length}</span> disputes
          </span>
        </div>
      </div>
    </div>
  );
};

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-[10px] font-bold text-text-tertiary uppercase tracking-wider">
      {children}
    </th>
  );
}
