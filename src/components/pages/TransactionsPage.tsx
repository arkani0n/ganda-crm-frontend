import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Filter, 
  Download, 
  Plus, 
  History, 
  ChevronLeft, 
  ChevronRight, 
  MoreVertical,
  Eye,
  ArrowUpDown,
  CreditCard,
  Activity,
  CheckCircle2,
  AlertCircle,
  Calendar
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
    gateways: [],
    brands: [],
    status: 'All'
  });
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

  const gateways = Array.from(new Set(allTransactions.map(t => t.gateway)));
  const brands = Array.from(new Set(allTransactions.map(t => t.brand)));

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
            <button 
              onClick={() => setFilters({ dateRange: { start: null, end: null }, gateways: [], brands: [], status: 'All' })}
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
                <th className="px-6 py-3 text-[10px] font-bold text-text-tertiary uppercase tracking-wider">
                  <button onClick={() => handleSort('txnId')} className="flex items-center gap-1 hover:text-text-primary transition-colors">
                    Transaction ID <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="px-6 py-3 text-[10px] font-bold text-text-tertiary uppercase tracking-wider">
                  <button onClick={() => handleSort('timestamp')} className="flex items-center gap-1 hover:text-text-primary transition-colors">
                    Date & Time <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="px-6 py-3 text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Client & Brand</th>
                <th className="px-6 py-3 text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Gateway</th>
                <th className="px-6 py-3 text-[10px] font-bold text-text-tertiary uppercase tracking-wider">
                  <button onClick={() => handleSort('amount')} className="flex items-center gap-1 hover:text-text-primary transition-colors">
                    Amount <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="px-6 py-3 text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Recon</th>
                <th className="px-6 py-3 text-[10px] font-bold text-text-tertiary uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {paginatedTxns.map((txn) => (
                <tr key={txn.id} className="hover:bg-accent-hover/10 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="font-mono text-[12px] font-medium text-text-primary group-hover:text-accent-interactive transition-colors">{txn.txnId}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-[12px] font-medium text-text-primary">{format(txn.timestamp, 'dd MMM yyyy')}</span>
                      <span className="text-[11px] text-text-tertiary">{format(txn.timestamp, 'HH:mm:ss')}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-[12px] font-bold text-text-primary">{txn.client}</span>
                      <span className="text-[11px] text-text-tertiary">{txn.brand}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[12px] font-medium text-text-secondary">{txn.gateway}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[13px] font-bold text-text-primary">{txn.amount.toLocaleString()} {txn.currency}</span>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={txn.status}>{txn.status}</Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={txn.recon === 'Pending' ? 'ReconPending' : txn.recon}>{txn.recon}</Badge>
                  </td>
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
