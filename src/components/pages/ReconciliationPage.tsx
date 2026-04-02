import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  FileText,
  Upload,
  Play,
  Search,
  Download,
  Trash2,
  Link as LinkIcon,
  Calendar,
  ChevronDown,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { Transaction, ReconResult, Gateway } from '../../types';
import { Badge } from '../shared/Badge';
import { cn } from '../../lib/utils';

interface ReconciliationPageProps {
  allTransactions: Transaction[];
  pspFile: { name: string, rows: number, data: any[] } | null;
  reconResults: ReconResult[];
  isReconciling: boolean;
  onRunRecon: (gateway: Gateway, matchBy: string) => void;
  onManualMatch: (item: ReconResult) => void;
  onClearRecon: () => void;
  onExportRecon: () => void;
  onUploadPsp: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLoadDemoData: () => void;
}

type ReconFilter = 'All' | 'Matched' | 'Missing in PSP' | 'Not in system' | 'Amount diff';

export const ReconciliationPage = ({
  allTransactions,
  pspFile,
  reconResults,
  isReconciling,
  onRunRecon,
  onManualMatch,
  onClearRecon,
  onExportRecon,
  onUploadPsp,
  onLoadDemoData
}: ReconciliationPageProps) => {
  const [activeFilter, setActiveFilter] = useState<ReconFilter>('All');
  const [reconGateway, setReconGateway] = useState<Gateway>('Stripe');
  const [reconMatchBy, setReconMatchBy] = useState('Transaction ID');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const syntheticEvent = {
        target: { files }
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      onUploadPsp(syntheticEvent);
    }
  }, [onUploadPsp]);

  const filteredResults = useMemo(() => {
    let filtered = reconResults;
    if (activeFilter !== 'All') {
      filtered = filtered.filter(r => r.status === activeFilter);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        (r.txnId?.toLowerCase().includes(q)) ||
        (r.pspRefId?.toLowerCase().includes(q)) ||
        (r.client?.toLowerCase().includes(q))
      );
    }
    return filtered;
  }, [reconResults, activeFilter, searchQuery]);

  const stats = useMemo(() => {
    const total = reconResults.length;
    const matched = reconResults.filter(r => r.status === 'Matched').length;
    const missing = reconResults.filter(r => r.status === 'Missing in PSP').length;
    const notInSys = reconResults.filter(r => r.status === 'Not in system').length;
    const diff = reconResults.filter(r => r.status === 'Amount diff').length;
    return { total, matched, missing, notInSys, diff };
  }, [reconResults]);

  const canRun = !!pspFile && !isReconciling;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[22px] font-bold text-text-primary tracking-tight">Settlement Reconciliation</h1>
          <p className="text-[13px] text-text-tertiary">Upload PSP settlement files, configure matching parameters, and reconcile against internal records.</p>
        </div>
        {reconResults.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={onExportRecon}
              className="flex items-center gap-2 px-3 py-2 border border-border-subtle rounded-lg text-[12px] font-medium text-text-secondary hover:bg-white hover:text-text-primary transition-all"
            >
              <Download size={14} /> Export Report
            </button>
            <button
              onClick={onClearRecon}
              className="flex items-center gap-2 px-3 py-2 border border-border-subtle rounded-lg text-[12px] font-medium text-red-600 hover:bg-red-50 transition-all"
            >
              <Trash2 size={14} /> Clear
            </button>
          </div>
        )}
      </div>

      {/* Controls Panel */}
      <div className="bg-white border border-border-subtle rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border-subtle bg-bg-page/40">
          <span className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">Reconciliation Parameters</span>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1px_1fr] gap-6">
            {/* Left: File Upload */}
            <div className="flex flex-col gap-4">
              <label className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">Settlement File</label>
              {!pspFile ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={cn(
                    "border-2 border-dashed rounded-lg p-6 flex flex-col items-center gap-3 transition-all cursor-pointer",
                    isDragOver
                      ? "border-accent-interactive bg-accent-interactive/5"
                      : "border-border-subtle hover:border-text-tertiary bg-bg-page/30"
                  )}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="w-10 h-10 rounded-lg bg-bg-page flex items-center justify-center text-text-tertiary">
                    <Upload size={20} />
                  </div>
                  <div className="text-center">
                    <p className="text-[13px] font-medium text-text-primary">Drop settlement file here</p>
                    <p className="text-[11px] text-text-tertiary mt-0.5">CSV, XLSX, XLS supported</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".csv, .xlsx, .xls"
                    onChange={onUploadPsp}
                  />
                </div>
              ) : (
                <div className="border border-border-subtle rounded-lg p-4 bg-bg-page/30 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-green-50 text-green-600 flex items-center justify-center flex-shrink-0">
                    <FileText size={18} />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-[13px] font-semibold text-text-primary truncate">{pspFile.name}</span>
                    <span className="text-[11px] text-text-tertiary">{pspFile.rows} records &middot; Ready for reconciliation</span>
                  </div>
                  <button
                    onClick={onClearRecon}
                    className="p-1.5 text-text-tertiary hover:text-red-600 transition-colors flex-shrink-0"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 px-3 py-2 border border-border-subtle rounded-lg text-[12px] font-medium text-text-secondary hover:bg-bg-page transition-all cursor-pointer">
                  <Upload size={14} />
                  Choose File
                  <input type="file" className="hidden" accept=".csv, .xlsx, .xls" onChange={onUploadPsp} />
                </label>
                <button
                  onClick={onLoadDemoData}
                  className="px-3 py-2 border border-dashed border-border-subtle rounded-lg text-[12px] font-medium text-text-tertiary hover:text-text-secondary hover:border-text-tertiary transition-all"
                >
                  Load Demo Data
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="hidden lg:block bg-border-subtle" />

            {/* Right: Parameters */}
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">Payment Gateway</label>
                  <div className="relative">
                    <select
                      value={reconGateway}
                      onChange={(e) => setReconGateway(e.target.value as Gateway)}
                      className="w-full appearance-none bg-white border border-border-subtle rounded-lg px-3 py-2.5 text-[13px] font-medium text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-interactive focus:border-accent-interactive transition-all pr-8"
                    >
                      <option value="Stripe">Stripe</option>
                      <option value="Adyen">Adyen</option>
                      <option value="PayPal">PayPal</option>
                      <option value="Skrill">Skrill</option>
                      <option value="Neteller">Neteller</option>
                      <option value="Trustly">Trustly</option>
                      <option value="Paysafecard">Paysafecard</option>
                      <option value="MuchBetter">MuchBetter</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">Match Strategy</label>
                  <div className="relative">
                    <select
                      value={reconMatchBy}
                      onChange={(e) => setReconMatchBy(e.target.value)}
                      className="w-full appearance-none bg-white border border-border-subtle rounded-lg px-3 py-2.5 text-[13px] font-medium text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-interactive focus:border-accent-interactive transition-all pr-8"
                    >
                      <option value="Transaction ID">Transaction ID</option>
                      <option value="PSP Reference ID">PSP Reference ID</option>
                      <option value="Amount + Date">Amount + Date</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">Period From</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full bg-white border border-border-subtle rounded-lg px-3 py-2.5 text-[13px] font-medium text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-interactive focus:border-accent-interactive transition-all"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">Period To</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full bg-white border border-border-subtle rounded-lg px-3 py-2.5 text-[13px] font-medium text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-interactive focus:border-accent-interactive transition-all"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={() => onRunRecon(reconGateway, reconMatchBy)}
                disabled={!canRun}
                className={cn(
                  "flex items-center justify-center gap-2 w-full py-3 rounded-lg text-[13px] font-bold transition-all",
                  canRun
                    ? "bg-accent-interactive text-white hover:bg-accent-interactive/90"
                    : "bg-bg-page text-text-tertiary cursor-not-allowed border border-border-subtle"
                )}
              >
                {isReconciling ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Running Reconciliation...
                  </>
                ) : (
                  <>
                    <Play size={16} />
                    {pspFile ? 'Run Reconciliation' : 'Upload a file to begin'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      {reconResults.length > 0 && (
        <div className="flex flex-col gap-3">
          {/* Clickable Stats Tab Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-x-3 gap-y-3 lg:gap-y-0 relative z-10 mb-0">
            {([
              { key: 'All' as ReconFilter, label: 'Total Records', value: stats.total, labelColor: 'text-text-tertiary', valueColor: 'text-text-primary' },
              { key: 'Matched' as ReconFilter, label: 'Matched', value: stats.matched, labelColor: 'text-green-600', valueColor: 'text-green-600' },
              { key: 'Missing in PSP' as ReconFilter, label: 'Missing in PSP', value: stats.missing, labelColor: 'text-red-600', valueColor: 'text-red-600' },
              { key: 'Amount diff' as ReconFilter, label: 'Amount Diff', value: stats.diff, labelColor: 'text-amber-600', valueColor: 'text-amber-600' },
              { key: 'Not in system' as ReconFilter, label: 'Not in System', value: stats.notInSys, labelColor: 'text-text-tertiary', valueColor: 'text-text-secondary' },
            ]).map(({ key, label, value, labelColor, valueColor }) => (
              <button
                key={key}
                onClick={() => setActiveFilter(key)}
                className={cn(
                  "bg-white border p-4 flex flex-col gap-1 text-left transition-all",
                  activeFilter === key
                    ? "border-border-subtle border-b-white rounded-t-xl mb-[-14px] pb-8 z-10 relative"
                    : "border-border-subtle rounded-xl hover:border-text-tertiary"
                )}
              >
                <span className={cn("text-[10px] font-bold uppercase tracking-wider", labelColor)}>{label}</span>
                <span className={cn("text-[20px] font-bold tabular-nums", valueColor)}>{value}</span>
                {activeFilter === key && (
                  <span className="text-[10px] text-accent-interactive font-medium mt-0.5">Filtering</span>
                )}
              </button>
            ))}
          </div>

          {/* Results Table */}
          <div className="bg-white border border-border-subtle rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-border-subtle bg-bg-page/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-[12px] font-bold text-text-primary">
                  {activeFilter === 'All' ? 'All Results' : activeFilter}
                </span>
                <span className="text-[11px] text-text-tertiary bg-bg-page px-2 py-0.5 rounded-md font-medium">
                  {filteredResults.length} record{filteredResults.length !== 1 ? 's' : ''}
                </span>
                {activeFilter !== 'All' && (
                  <button
                    onClick={() => setActiveFilter('All')}
                    className="text-[11px] text-accent-interactive hover:underline font-medium"
                  >
                    Show all
                  </button>
                )}
              </div>
              <div className="relative w-full sm:w-56">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                <input
                  type="text"
                  placeholder="Search by ID, ref, client..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-border-subtle rounded-lg text-[12px] focus:outline-none focus:ring-1 focus:ring-accent-interactive focus:border-accent-interactive transition-all"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-bg-page/30 border-b border-border-subtle">
                    <th className="px-5 py-3 text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3 text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Internal Record</th>
                    <th className="px-5 py-3 text-[10px] font-bold text-text-tertiary uppercase tracking-wider">PSP Record</th>
                    <th className="px-5 py-3 text-[10px] font-bold text-text-tertiary uppercase tracking-wider text-right">Our Amount</th>
                    <th className="px-5 py-3 text-[10px] font-bold text-text-tertiary uppercase tracking-wider text-right">PSP Amount</th>
                    <th className="px-5 py-3 text-[10px] font-bold text-text-tertiary uppercase tracking-wider text-right">Difference</th>
                    <th className="px-5 py-3 text-[10px] font-bold text-text-tertiary uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {filteredResults.map((res) => (
                    <tr key={res.id} className="hover:bg-accent-hover/10 transition-colors">
                      <td className="px-5 py-3.5">
                        <Badge variant={res.status}>{res.status}</Badge>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col">
                          <span className="text-[12px] font-mono font-medium text-text-primary">{res.txnId || '—'}</span>
                          <span className="text-[11px] text-text-tertiary">{res.client || '—'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-[12px] font-mono font-medium text-text-secondary">{res.pspRefId || '—'}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="text-[12px] font-medium text-text-primary">
                          {res.ourAmount !== undefined ? `€${res.ourAmount.toLocaleString()}` : '—'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="text-[12px] font-medium text-text-primary">
                          {res.pspAmount !== undefined ? `€${res.pspAmount.toLocaleString()}` : '—'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className={cn(
                          "text-[12px] font-bold",
                          res.difference && res.difference > 0.01 ? "text-red-600" : "text-text-tertiary"
                        )}>
                          {res.difference !== undefined ? `€${res.difference.toLocaleString()}` : '—'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {res.status !== 'Matched' && (
                          <button
                            onClick={() => onManualMatch(res)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-bg-page border border-border-subtle rounded-lg text-[11px] font-bold text-text-secondary hover:text-accent-interactive hover:border-accent-interactive transition-all"
                          >
                            <LinkIcon size={12} /> Link manually
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredResults.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center">
                        <p className="text-[13px] text-text-tertiary">No records match the current filter.</p>
                        <button
                          onClick={() => { setActiveFilter('All'); setSearchQuery(''); }}
                          className="text-[12px] text-accent-interactive hover:underline font-medium mt-1"
                        >
                          Clear filters
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
