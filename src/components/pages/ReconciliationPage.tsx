import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Upload, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Download, 
  Trash2, 
  Link as LinkIcon,
  Info,
  ChevronRight,
  ArrowRight
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
  const [activeReconTab, setActiveReconTab] = useState<'All' | 'Matched' | 'Missing in PSP' | 'Not in system' | 'Amount diff'>('All');
  const [reconGateway, setReconGateway] = useState<Gateway>('Stripe');
  const [reconMatchBy, setReconMatchBy] = useState('Transaction ID');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredResults = useMemo(() => {
    let filtered = reconResults;
    if (activeReconTab !== 'All') {
      filtered = filtered.filter(r => r.status === activeReconTab);
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
  }, [reconResults, activeReconTab, searchQuery]);

  const stats = useMemo(() => {
    const total = reconResults.length;
    const matched = reconResults.filter(r => r.status === 'Matched').length;
    const missing = reconResults.filter(r => r.status === 'Missing in PSP').length;
    const notInSys = reconResults.filter(r => r.status === 'Not in system').length;
    const diff = reconResults.filter(r => r.status === 'Amount diff').length;
    
    return { total, matched, missing, notInSys, diff };
  }, [reconResults]);

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[24px] font-bold text-text-primary tracking-tight">Reconciliation</h1>
          <p className="text-[13px] text-text-tertiary">Match internal transaction records with external gateway settlement reports.</p>
        </div>
        {reconResults.length > 0 && (
          <div className="flex items-center gap-3">
            <button 
              onClick={onExportRecon}
              className="flex items-center gap-2 px-4 py-2.5 border border-border-subtle rounded-lg text-[13px] font-medium text-text-secondary hover:bg-white hover:text-text-primary transition-all"
            >
              <Download size={16} /> Export Results
            </button>
            <button 
              onClick={onClearRecon}
              className="flex items-center gap-2 px-4 py-2.5 border border-border-subtle rounded-lg text-[13px] font-medium text-red-600 hover:bg-red-50 transition-all"
            >
              <Trash2 size={16} /> Clear
            </button>
          </div>
        )}
      </div>

      {!pspFile ? (
        /* Empty State / Upload */
        <div className="bg-white border border-border-subtle rounded-2xl p-12 flex flex-col items-center text-center max-w-2xl mx-auto w-full shadow-sm">
          <div className="w-20 h-20 bg-accent-hover rounded-full flex items-center justify-center text-accent-interactive mb-6">
            <Upload size={32} />
          </div>
          <h2 className="text-[20px] font-bold text-text-primary mb-2">Upload Gateway Statement</h2>
          <p className="text-[14px] text-text-tertiary mb-8 leading-relaxed">
            To begin reconciliation, please upload a settlement report from your PSP (Stripe, Adyen, etc.) in CSV or Excel format.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-md">
            <label className="flex-1 w-full px-6 py-3 bg-accent-interactive text-white rounded-xl text-[14px] font-bold hover:bg-accent-interactive/90 transition-all shadow-lg shadow-accent-interactive/20 cursor-pointer flex items-center justify-center gap-2">
              <Upload size={18} />
              Choose File
              <input type="file" className="hidden" accept=".csv, .xlsx, .xls" onChange={onUploadPsp} />
            </label>
            <button 
              onClick={onLoadDemoData}
              className="flex-1 w-full px-6 py-3 border border-border-subtle rounded-xl text-[14px] font-bold text-text-secondary hover:bg-bg-page transition-all"
            >
              Load Demo Data
            </button>
          </div>
          
          <div className="mt-12 grid grid-cols-3 gap-8 w-full pt-8 border-t border-border-subtle">
            <div className="flex flex-col gap-1">
              <span className="text-[18px] font-bold text-text-primary">01</span>
              <span className="text-[11px] font-bold text-text-tertiary uppercase">Upload File</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[18px] font-bold text-text-primary">02</span>
              <span className="text-[11px] font-bold text-text-tertiary uppercase">Run Matching</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[18px] font-bold text-text-primary">03</span>
              <span className="text-[11px] font-bold text-text-tertiary uppercase">Resolve Diff</span>
            </div>
          </div>
        </div>
      ) : (
        /* Active State */
        <div className="flex flex-col gap-6">
          {/* Config Bar */}
          <div className="bg-white border border-border-subtle rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
                  <FileText size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[13px] font-bold text-text-primary">{pspFile.name}</span>
                  <span className="text-[11px] text-text-tertiary">{pspFile.rows} records found</span>
                </div>
                <button onClick={onClearRecon} className="p-1.5 text-text-tertiary hover:text-red-600 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
              
              <div className="h-8 w-px bg-border-subtle hidden lg:block" />
              
              <div className="flex items-center gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-text-tertiary uppercase">Gateway</label>
                  <select 
                    value={reconGateway}
                    onChange={(e) => setReconGateway(e.target.value as Gateway)}
                    className="bg-transparent border-none p-0 text-[13px] font-bold text-text-primary focus:ring-0 cursor-pointer"
                  >
                    <option value="Stripe">Stripe</option>
                    <option value="Adyen">Adyen</option>
                    <option value="PayPal">PayPal</option>
                    <option value="Braintree">Braintree</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-text-tertiary uppercase">Match By</label>
                  <select 
                    value={reconMatchBy}
                    onChange={(e) => setReconMatchBy(e.target.value)}
                    className="bg-transparent border-none p-0 text-[13px] font-bold text-text-primary focus:ring-0 cursor-pointer"
                  >
                    <option value="Transaction ID">Transaction ID</option>
                    <option value="PSP Reference ID">PSP Reference ID</option>
                    <option value="Amount + Date">Amount + Date</option>
                  </select>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => onRunRecon(reconGateway, reconMatchBy)}
              disabled={isReconciling}
              className={cn(
                "flex items-center justify-center gap-2 px-8 py-3 rounded-xl text-[14px] font-bold transition-all shadow-lg",
                isReconciling 
                  ? "bg-bg-page text-text-tertiary cursor-not-allowed" 
                  : "bg-accent-interactive text-white hover:bg-accent-interactive/90 shadow-accent-interactive/20"
              )}
            >
              {isReconciling ? (
                <>
                  <div className="w-4 h-4 border-2 border-text-tertiary border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Play size={18} />
                  Run Reconciliation
                </>
              )}
            </button>
          </div>

          {reconResults.length > 0 && (
            <div className="flex flex-col gap-6">
              {/* Recon Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white border border-border-subtle rounded-xl p-4 flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-text-tertiary uppercase">Total Records</span>
                  <span className="text-[18px] font-bold text-text-primary">{stats.total}</span>
                </div>
                <div className="bg-white border border-border-subtle rounded-xl p-4 flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-green-600 uppercase">Matched</span>
                  <span className="text-[18px] font-bold text-green-600">{stats.matched}</span>
                </div>
                <div className="bg-white border border-border-subtle rounded-xl p-4 flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-red-600 uppercase">Missing in PSP</span>
                  <span className="text-[18px] font-bold text-red-600">{stats.missing}</span>
                </div>
                <div className="bg-white border border-border-subtle rounded-xl p-4 flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-amber-600 uppercase">Amount Diff</span>
                  <span className="text-[18px] font-bold text-amber-600">{stats.diff}</span>
                </div>
                <div className="bg-white border border-border-subtle rounded-xl p-4 flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-text-tertiary uppercase">Not in System</span>
                  <span className="text-[18px] font-bold text-text-secondary">{stats.notInSys}</span>
                </div>
              </div>

              {/* Results Table */}
              <div className="bg-white border border-border-subtle rounded-2xl shadow-sm overflow-hidden flex flex-col">
                <div className="px-6 py-4 border-b border-border-subtle bg-bg-page/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-center gap-1 bg-white border border-border-subtle rounded-lg p-1">
                    {['All', 'Matched', 'Missing in PSP', 'Not in system', 'Amount diff'].map(t => (
                      <button 
                        key={t}
                        onClick={() => setActiveReconTab(t as any)}
                        className={cn(
                          "px-3 py-1 text-[11px] font-bold rounded-md transition-all whitespace-nowrap",
                          activeReconTab === t ? "bg-accent-interactive text-white shadow-sm" : "text-text-tertiary hover:text-text-primary"
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  <div className="relative w-full sm:w-64">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                    <input 
                      type="text" 
                      placeholder="Search results..."
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
                        <th className="px-6 py-3 text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Internal Record</th>
                        <th className="px-6 py-3 text-[10px] font-bold text-text-tertiary uppercase tracking-wider">PSP Record</th>
                        <th className="px-6 py-3 text-[10px] font-bold text-text-tertiary uppercase tracking-wider text-right">Our Amount</th>
                        <th className="px-6 py-3 text-[10px] font-bold text-text-tertiary uppercase tracking-wider text-right">PSP Amount</th>
                        <th className="px-6 py-3 text-[10px] font-bold text-text-tertiary uppercase tracking-wider text-right">Difference</th>
                        <th className="px-6 py-3 text-[10px] font-bold text-text-tertiary uppercase tracking-wider text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                      {filteredResults.map((res) => (
                        <tr key={res.id} className="hover:bg-accent-hover/10 transition-colors group">
                          <td className="px-6 py-4">
                            <Badge variant={res.status}>{res.status}</Badge>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-[12px] font-mono font-medium text-text-primary">{res.txnId || '—'}</span>
                              <span className="text-[11px] text-text-tertiary">{res.client || '—'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-[12px] font-mono font-medium text-text-secondary">{res.pspRefId || '—'}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-[12px] font-medium text-text-primary">
                              {res.ourAmount !== undefined ? `€${res.ourAmount.toLocaleString()}` : '—'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-[12px] font-medium text-text-primary">
                              {res.pspAmount !== undefined ? `€${res.pspAmount.toLocaleString()}` : '—'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className={cn(
                              "text-[12px] font-bold",
                              res.difference && res.difference > 0.01 ? "text-red-600" : "text-text-tertiary"
                            )}>
                              {res.difference !== undefined ? `€${res.difference.toLocaleString()}` : '—'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
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
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
