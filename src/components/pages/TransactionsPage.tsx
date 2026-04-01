import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Filter, 
  Download, 
  Plus, 
  History, 
  Copy,
  ChevronLeft, 
  ChevronRight, 
  MoreVertical,
  Eye,
  ArrowUpDown,
  CreditCard,
  Activity,
  CheckCircle2,
  AlertCircle,
  Calendar,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { Transaction, TransactionFilters } from '../../types';
import { filterTransactions } from '../../lib/transactions/filters';
import { SummaryCard } from '../shared/SummaryCard';
import { MultiSelect } from '../shared/MultiSelect';
import { Badge } from '../shared/Badge';
import { cn } from '../../lib/utils';

interface TransactionsPageProps {
  allTransactions: Transaction[];
  onSelectTxn: (txn: Transaction) => void;
  onImport: () => void;
  onShowHistory: () => void;
  onExport: (format: 'csv' | 'excel') => void;
}

export const TransactionsPage = ({
  allTransactions,
  onSelectTxn,
  onImport,
  onShowHistory,
  onExport
}: TransactionsPageProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<TransactionFilters>({
    dateRange: { start: null, end: null },
    gateways: ['All'],
    brands: ['All'],
    status: 'All'
  });
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem('settlex.transactions.visibleColumns');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse visible columns', e);
      }
    }
    return ['#', 'Transaction ID', 'Date & Time', 'Settlement Date', 'Client', 'Brand', 'Gateway', 'Amount', 'Currency', 'Status', 'Recon'];
  });
  const [showColumnManager, setShowColumnManager] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Transaction, direction: 'asc' | 'desc' }>({
    key: 'timestamp',
    direction: 'desc'
  });

  const filteredTxns = useMemo(() => {
    return filterTransactions(allTransactions, filters, searchQuery);
  }, [allTransactions, filters, searchQuery]);

  const sortedTxns = useMemo(() => {
    const sortable = [...filteredTxns];
    sortable.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sortable;
  }, [filteredTxns, sortConfig]);

  const stats = useMemo(() => {
    const total = filteredTxns.length;
    const volume = filteredTxns.reduce((sum, t) => sum + t.amount, 0);
    const success = filteredTxns.filter(t => t.status === 'Completed').length;
    const successRate = total > 0 ? (success / total) * 100 : 0;
    const failed = filteredTxns.filter(t => t.status === 'Failed').length;
    
    return { total, volume, successRate, failed };
  }, [filteredTxns]);

  const paginatedTxns = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedTxns.slice(start, start + itemsPerPage);
  }, [sortedTxns, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedTxns.length / itemsPerPage);

  const handleSort = (key: keyof Transaction) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const gateways = ['All', ...Array.from(new Set(allTransactions.map(t => t.gateway)))];
  const brands = ['All', ...Array.from(new Set(allTransactions.map(t => t.brand)))];

  const allPossibleColumns = [
    { id: '#', label: '#' },
    { id: 'Transaction ID', label: 'Transaction ID' },
    { id: 'Date & Time', label: 'Date & Time' },
    { id: 'Settlement Date', label: 'Settlement Date' },
    { id: 'Client', label: 'Client' },
    { id: 'Brand', label: 'Brand' },
    { id: 'Gateway', label: 'Gateway' },
    { id: 'Amount', label: 'Amount' },
    { id: 'Currency', label: 'Currency' },
    { id: 'Status', label: 'Status' },
    { id: 'Recon', label: 'Recon' },
  ];

  const toggleColumn = (id: string) => {
    setVisibleColumns(prev => {
      let next;
      if (prev.includes(id)) {
        if (prev.length === 1) return prev; // Keep at least one
        next = prev.filter(c => c !== id);
      } else {
        next = [...prev, id];
      }
      localStorage.setItem('settlex.transactions.visibleColumns', JSON.stringify(next));
      return next;
    });
  };

  const selectAllColumns = () => {
    const all = allPossibleColumns.map(c => c.id);
    setVisibleColumns(all);
    localStorage.setItem('settlex.transactions.visibleColumns', JSON.stringify(all));
  };

  const resetDefaultColumns = () => {
    const defaults = ['#', 'Transaction ID', 'Date & Time', 'Settlement Date', 'Client', 'Brand', 'Gateway', 'Amount', 'Currency', 'Status', 'Recon'];
    setVisibleColumns(defaults);
    localStorage.setItem('settlex.transactions.visibleColumns', JSON.stringify(defaults));
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[24px] font-bold text-text-primary tracking-tight">Transactions</h1>
          <p className="text-[13px] text-text-tertiary">Monitor and manage all incoming payment activities across your gateways.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={onShowHistory}
            className="p-2.5 border border-border-subtle rounded-lg text-text-secondary hover:bg-white hover:text-text-primary transition-all"
            title="Import History"
          >
            <History size={18} />
          </button>
          <div className="relative group">
            <button className="flex items-center gap-2 px-4 py-2.5 border border-border-subtle rounded-lg text-[13px] font-medium text-text-secondary hover:bg-white hover:text-text-primary transition-all">
              <Download size={16} /> Export
            </button>
            <div className="absolute right-0 top-full mt-2 w-40 bg-white border border-border-subtle rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 overflow-hidden">
              <button onClick={() => onExport('csv')} className="w-full text-left px-4 py-2.5 text-[12px] hover:bg-bg-page transition-colors border-b border-border-subtle">CSV Format</button>
              <button onClick={() => onExport('excel')} className="w-full text-left px-4 py-2.5 text-[12px] hover:bg-bg-page transition-colors">Excel Format</button>
            </div>
          </div>
          <button 
            onClick={onImport}
            className="flex items-center gap-2 px-6 py-2.5 bg-accent-interactive text-white rounded-lg text-[13px] font-bold hover:bg-accent-interactive/90 transition-all shadow-lg shadow-accent-interactive/20"
          >
            <Plus size={18} /> Import Data
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard 
          label="Total Transactions" 
          title="Total" 
          value={stats.total.toLocaleString()} 
          icon={Activity} 
          trend="+12.5%" 
          trendUp={true} 
        />
        <SummaryCard 
          label="Total Volume" 
          title="Volume" 
          value={`€${stats.volume.toLocaleString()}`} 
          icon={CreditCard} 
          trend="+8.2%" 
          trendUp={true} 
          accentColor="accent-primary"
        />
        <SummaryCard 
          label="Success Rate" 
          title="Success" 
          value={`${stats.successRate.toFixed(1)}%`} 
          icon={CheckCircle2} 
          trend="+2.1%" 
          trendUp={true} 
          accentColor="green-600"
        />
        <SummaryCard 
          label="Failed Transactions" 
          title="Failed" 
          value={stats.failed.toLocaleString()} 
          icon={AlertCircle} 
          trend="-4.3%" 
          trendUp={false} 
          accentColor="red-600"
        />
      </div>

      {/* Filters & Table */}
      <div className="bg-white border border-border-subtle rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {/* Filter Bar */}
        <div className="px-6 py-4 border-b border-border-subtle bg-bg-page/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
              <input 
                type="text" 
                placeholder="Search ID, Client, or Brand..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-border-subtle rounded-lg text-[12px] focus:outline-none focus:ring-1 focus:ring-accent-interactive focus:border-accent-interactive transition-all"
              />
            </div>
            <MultiSelect 
              label="Gateways" 
              options={gateways} 
              selected={filters.gateways} 
              onChange={(val) => setFilters({ ...filters, gateways: val })} 
            />
            <MultiSelect 
              label="Brands" 
              options={brands} 
              selected={filters.brands} 
              onChange={(val) => setFilters({ ...filters, brands: val })} 
            />
            <div className="flex items-center gap-1 bg-white border border-border-subtle rounded-lg p-1">
              {['All', 'Completed', 'Pending', 'Failed'].map(s => (
                <button 
                  key={s}
                  onClick={() => setFilters({ ...filters, status: s as any })}
                  className={cn(
                    "px-3 py-1 text-[11px] font-bold rounded-md transition-all",
                    filters.status === s ? "bg-accent-interactive text-white shadow-sm" : "text-text-tertiary hover:text-text-primary"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button 
                onClick={() => setShowColumnManager(!showColumnManager)}
                className="flex items-center gap-2 px-4 py-2 border border-border-subtle rounded-lg text-[13px] font-medium text-text-secondary hover:bg-white hover:text-text-primary transition-all"
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
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border-subtle">
                      <button 
                        onClick={selectAllColumns}
                        className="flex-1 py-1.5 text-[11px] font-bold text-accent-interactive hover:bg-accent-hover/30 rounded-md transition-all"
                      >
                        Select All
                      </button>
                      <button 
                        onClick={resetDefaultColumns}
                        className="flex-1 py-1.5 text-[11px] font-bold text-text-tertiary hover:bg-bg-page rounded-md transition-all"
                      >
                        Reset Default
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button 
              onClick={() => setFilters({ dateRange: { start: null, end: null }, gateways: ['All'], brands: ['All'], status: 'All' })}
              className="text-[12px] font-semibold text-text-tertiary hover:text-accent-interactive transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bg-page/30 border-b border-border-subtle">
                {visibleColumns.includes('#') && (
                  <th className="px-6 py-3 text-[10px] font-bold text-text-tertiary uppercase tracking-wider">#</th>
                )}
                {visibleColumns.includes('Transaction ID') && (
                  <th className="px-6 py-3 text-[10px] font-bold text-text-tertiary uppercase tracking-wider">
                    <button onClick={() => handleSort('txnId')} className="flex items-center gap-1 hover:text-text-primary transition-colors">
                      Transaction ID <ArrowUpDown size={12} />
                    </button>
                  </th>
                )}
                {visibleColumns.includes('Date & Time') && (
                  <th className="px-6 py-3 text-[10px] font-bold text-text-tertiary uppercase tracking-wider">
                    <button onClick={() => handleSort('timestamp')} className="flex items-center gap-1 hover:text-text-primary transition-colors">
                      Date & Time <ArrowUpDown size={12} />
                    </button>
                  </th>
                )}
                {visibleColumns.includes('Settlement Date') && (
                  <th className="px-6 py-3 text-[10px] font-bold text-text-tertiary uppercase tracking-wider">
                    <button onClick={() => handleSort('scheduledSettlementDate' as any)} className="flex items-center gap-1 hover:text-text-primary transition-colors">
                      Settlement Date <ArrowUpDown size={12} />
                    </button>
                  </th>
                )}
                {(visibleColumns.includes('Client') || visibleColumns.includes('Brand')) && (
                  <th className="px-6 py-3 text-[10px] font-bold text-text-tertiary uppercase tracking-wider">
                    {visibleColumns.includes('Client') && visibleColumns.includes('Brand') ? 'Client & Brand' : visibleColumns.includes('Client') ? 'Client' : 'Brand'}
                  </th>
                )}
                {visibleColumns.includes('Gateway') && (
                  <th className="px-6 py-3 text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Gateway</th>
                )}
                {visibleColumns.includes('Amount') && (
                  <th className="px-6 py-3 text-[10px] font-bold text-text-tertiary uppercase tracking-wider">
                    <button onClick={() => handleSort('amount')} className="flex items-center gap-1 hover:text-text-primary transition-colors">
                      Amount <ArrowUpDown size={12} />
                    </button>
                  </th>
                )}
                {visibleColumns.includes('Currency') && (
                  <th className="px-6 py-3 text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Currency</th>
                )}
                {visibleColumns.includes('Status') && (
                  <th className="px-6 py-3 text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Status</th>
                )}
                {visibleColumns.includes('Recon') && (
                  <th className="px-6 py-3 text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Recon</th>
                )}
                <th className="px-6 py-3 text-[10px] font-bold text-text-tertiary uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {paginatedTxns.map((txn, idx) => (
                <tr key={txn.id} className="hover:bg-accent-hover/10 transition-colors group">
                  {visibleColumns.includes('#') && (
                    <td className="px-6 py-4">
                      <span className="text-[12px] text-text-tertiary">{(currentPage - 1) * itemsPerPage + idx + 1}</span>
                    </td>
                  )}
                  {visibleColumns.includes('Transaction ID') && (
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 group/id">
                        <span className="font-mono text-[12px] font-medium text-text-primary group-hover:text-accent-interactive transition-colors">{txn.txnId}</span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(txn.txnId);
                          }}
                          className="opacity-0 group-hover/id:opacity-100 p-1 hover:bg-bg-page rounded transition-all text-text-tertiary hover:text-accent-interactive"
                          title="Copy ID"
                        >
                          <Copy size={12} />
                        </button>
                      </div>
                    </td>
                  )}
                  {visibleColumns.includes('Date & Time') && (
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-[12px] font-medium text-text-primary">{format(txn.timestamp, 'dd MMM yyyy')}</span>
                        <span className="text-[11px] text-text-tertiary">{format(txn.timestamp, 'HH:mm:ss')}</span>
                      </div>
                    </td>
                  )}
                  {visibleColumns.includes('Settlement Date') && (
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className={cn(
                            "text-[12px] font-medium",
                            txn.actualSettlementDate ? "text-green-600" : "text-text-primary"
                          )}>
                            {format(txn.actualSettlementDate || txn.scheduledSettlementDate || new Date(), 'dd MMM yyyy')}
                          </span>
                          {txn.actualSettlementDate && <CheckCircle2 size={12} className="text-green-600" />}
                        </div>
                        {!txn.actualSettlementDate && (
                          <span className="text-[10px] text-text-tertiary uppercase font-bold tracking-wider">
                            {txn.settlementStatus || 'Scheduled'}
                          </span>
                        )}
                      </div>
                    </td>
                  )}
                  {(visibleColumns.includes('Client') || visibleColumns.includes('Brand')) && (
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        {visibleColumns.includes('Client') && (
                          <span className="text-[12px] font-bold text-text-primary">{txn.client}</span>
                        )}
                        {visibleColumns.includes('Brand') && (
                          <span className="text-[11px] text-text-tertiary">{txn.brand}</span>
                        )}
                      </div>
                    </td>
                  )}
                  {visibleColumns.includes('Gateway') && (
                    <td className="px-6 py-4">
                      <span className="text-[12px] font-medium text-text-secondary">{txn.gateway}</span>
                    </td>
                  )}
                  {visibleColumns.includes('Amount') && (
                    <td className="px-6 py-4">
                      <span className="text-[13px] font-bold text-text-primary">
                        {txn.amount.toLocaleString()} {visibleColumns.includes('Currency') ? '' : txn.currency}
                      </span>
                    </td>
                  )}
                  {visibleColumns.includes('Currency') && (
                    <td className="px-6 py-4">
                      <span className="text-[12px] font-medium text-text-secondary">{txn.currency}</span>
                    </td>
                  )}
                  {visibleColumns.includes('Status') && (
                    <td className="px-6 py-4">
                      <Badge variant={txn.status}>{txn.status}</Badge>
                    </td>
                  )}
                  {visibleColumns.includes('Recon') && (
                    <td className="px-6 py-4">
                      <Badge variant={txn.recon === 'Pending' ? 'ReconPending' : txn.recon}>{txn.recon}</Badge>
                    </td>
                  )}
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => onSelectTxn(txn)}
                        className="p-1.5 text-text-tertiary hover:text-accent-interactive hover:bg-accent-hover/30 rounded-md transition-all"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      <button className="p-1.5 text-text-tertiary hover:text-text-primary hover:bg-bg-page rounded-md transition-all">
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-border-subtle bg-bg-page/30 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-[12px] text-text-tertiary">
              Showing <span className="font-bold text-text-secondary">{Math.min((currentPage - 1) * itemsPerPage + 1, sortedTxns.length)}</span> to <span className="font-bold text-text-secondary">{Math.min(currentPage * itemsPerPage, sortedTxns.length)}</span> of <span className="font-bold text-text-secondary">{sortedTxns.length}</span> transactions
            </span>
            <select 
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="bg-transparent border-none text-[12px] font-bold text-accent-interactive focus:ring-0 cursor-pointer"
            >
              <option value={10}>10 per page</option>
              <option value={15}>15 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="p-2 border border-border-subtle rounded-lg text-text-tertiary hover:bg-white hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center gap-1">
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const pageNum = i + 1;
                return (
                  <button 
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={cn(
                      "w-8 h-8 rounded-lg text-[12px] font-bold transition-all",
                      currentPage === pageNum ? "bg-accent-interactive text-white shadow-md shadow-accent-interactive/20" : "text-text-tertiary hover:bg-white hover:text-text-primary"
                    )}
                  >
                    {pageNum}
                  </button>
                );
              })}
              {totalPages > 5 && <span className="text-text-tertiary px-1">...</span>}
            </div>
            <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="p-2 border border-border-subtle rounded-lg text-text-tertiary hover:bg-white hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
