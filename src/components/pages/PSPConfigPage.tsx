import React, { useState } from 'react';
import { 
  Plus, 
  LayoutGrid, 
  List,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  History,
  Power,
  CheckCircle2,
  AlertCircle,
  Clock,
  MoreVertical,
  Search,
  Globe,
  CreditCard,
  Wallet,
  Building2,
  Smartphone,
  Bitcoin,
  Ticket
} from 'lucide-react';
import { format } from 'date-fns';
import { PSPConfig, PSPCategory } from '../../types';
import { Badge } from '../shared/Badge';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface PSPConfigPageProps {
  pspConfigs: PSPConfig[];
  onEditPsp: (psp: PSPConfig) => void;
  onAddPsp: () => void;
  onDeletePsp: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onViewHistory: (psp: PSPConfig) => void;
}

export const PSPConfigPage = ({
  pspConfigs,
  onEditPsp,
  onAddPsp,
  onDeletePsp,
  onToggleStatus,
  onViewHistory
}: PSPConfigPageProps) => {
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});
  const [pinging, setPinging] = useState<Record<string, boolean>>({});
  const [pingResult, setPingResult] = useState<Record<string, { success: boolean; message: string } | null>>({});
  const [confirmDisable, setConfirmDisable] = useState<string | null>(null);

  const toggleApiKey = (id: string) => {
    setShowApiKey(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handlePing = (id: string) => {
    setPinging(prev => ({ ...prev, [id]: true }));
    setPingResult(prev => ({ ...prev, [id]: null }));
    
    // Mock ping
    setTimeout(() => {
      setPinging(prev => ({ ...prev, [id]: false }));
      const success = Math.random() > 0.2;
      setPingResult(prev => ({ ...prev, [id]: { 
        success, 
        message: success ? 'Connection successful' : 'Connection failed: Timeout' 
      }}));
    }, 1500);
  };

  const getCategoryIcon = (category: PSPCategory) => {
    switch (category) {
      case 'Card Payments': return <CreditCard size={14} />;
      case 'E-Wallet': return <Wallet size={14} />;
      case 'Bank Transfer': return <Building2 size={14} />;
      case 'Open Banking': return <Smartphone size={14} />;
      case 'Crypto': return <Bitcoin size={14} />;
      case 'Voucher': return <Ticket size={14} />;
      default: return <CreditCard size={14} />;
    }
  };

  const activeCount = pspConfigs.filter(p => p.status === 'Active').length;
  const inactiveCount = pspConfigs.filter(p => p.status === 'Inactive').length;
  const minFee = pspConfigs.length > 0 ? Math.min(...pspConfigs.map(p => p.processingFeePercent)) : 0;
  const maxFee = pspConfigs.length > 0 ? Math.max(...pspConfigs.map(p => p.processingFeePercent)) : 0;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add a toast here
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Page Header Block */}
      <div className="flex items-center justify-between bg-white/50 p-1 rounded-xl">
        <div className="flex items-center gap-3 pl-2">
          <h1 className="text-[15px] font-semibold text-text-primary">PSP Configuration</h1>
          <div className="px-2 py-0.5 bg-accent-hover/50 text-accent-interactive text-[11px] font-bold rounded-full">
            {pspConfigs.length} gateways
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-bg-page p-1 rounded-lg border border-border-subtle">
            <button 
              onClick={() => setViewMode('card')}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md text-[12px] font-bold transition-all",
                viewMode === 'card' ? "bg-white text-accent-interactive shadow-sm" : "text-text-tertiary hover:text-text-secondary"
              )}
            >
              <LayoutGrid size={14} /> Card
            </button>
            <button 
              onClick={() => setViewMode('table')}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md text-[12px] font-bold transition-all",
                viewMode === 'table' ? "bg-white text-accent-interactive shadow-sm" : "text-text-tertiary hover:text-text-secondary"
              )}
            >
              <List size={14} /> Table
            </button>
          </div>
          
          <button 
            onClick={onAddPsp}
            className="flex items-center gap-2 px-4 py-2 bg-accent-interactive text-white rounded-lg text-[13px] font-bold hover:bg-accent-interactive/90 transition-all shadow-md shadow-accent-interactive/20"
          >
            <Plus size={16} /> Add New PSP
          </button>
        </div>
      </div>

      {/* Summary Strip */}
      <div className="flex items-center gap-6 bg-white border border-border-subtle rounded-xl px-5 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-[12px] text-text-tertiary">Active PSPs:</span>
          <span className="text-[12px] font-bold text-text-primary">{activeCount}</span>
        </div>
        <div className="w-px h-4 bg-border-subtle" />
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-[12px] text-text-tertiary">Inactive PSPs:</span>
          <span className="text-[12px] font-bold text-text-primary">{inactiveCount}</span>
        </div>
        <div className="w-px h-4 bg-border-subtle" />
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-text-tertiary" />
          <span className="text-[12px] text-text-tertiary">Avg Settlement Time:</span>
          <span className="text-[12px] font-bold text-text-primary">2.4 days</span>
        </div>
        <div className="w-px h-4 bg-border-subtle" />
        <div className="flex items-center gap-2">
          <CreditCard size={14} className="text-text-tertiary" />
          <span className="text-[12px] text-text-tertiary">Total Fee Range:</span>
          <span className="text-[12px] font-bold text-text-primary">{minFee}% - {maxFee}%</span>
        </div>
      </div>

      {viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pspConfigs.map((psp) => (
            <div key={psp.id} className="bg-white border border-border-subtle rounded-xl shadow-sm hover:border-accent-interactive/30 transition-all flex flex-col overflow-hidden">
              {/* Card Header */}
              <div className="p-5 flex items-start justify-between border-b border-border-subtle/50">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-[16px] shadow-sm"
                    style={{ backgroundColor: psp.logoColor }}
                  >
                    {psp.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[14px] font-bold text-text-primary">{psp.name}</h3>
                      <div className="flex items-center gap-1">
                        <div className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          psp.status === 'Active' ? "bg-green-500" : psp.status === 'Testing' ? "bg-blue-500" : "bg-red-500"
                        )} />
                        <span className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider">{psp.status}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-text-tertiary">{getCategoryIcon(psp.category)}</span>
                      <span className="text-[11px] text-text-tertiary">{psp.category}</span>
                    </div>
                  </div>
                </div>
                <button className="p-1.5 text-text-tertiary hover:bg-bg-page rounded-md transition-all">
                  <MoreVertical size={16} />
                </button>
              </div>

              {/* Fee Section */}
              <div className="px-5 py-4 grid grid-cols-3 gap-2 border-b border-border-subtle/50 bg-bg-page/30">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] font-bold text-text-tertiary uppercase">Processing</span>
                  <span className="text-[12px] font-bold text-text-secondary">{psp.processingFeePercent}% + {psp.processingFeeFixed}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] font-bold text-text-tertiary uppercase">Refund</span>
                  <span className="text-[12px] font-bold text-text-secondary">{psp.refundFeePercent}%</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] font-bold text-text-tertiary uppercase">Chargeback</span>
                  <span className="text-[12px] font-bold text-text-secondary">{psp.chargebackFeeFixed}</span>
                </div>
              </div>

              {/* Settlement Section */}
              <div className="px-5 py-4 flex flex-col gap-3 border-b border-border-subtle/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Clock size={12} className="text-text-tertiary" />
                    <span className="text-[11px] text-text-secondary font-medium">
                      {psp.settlementFrequency} {psp.settlementDay && `(${psp.settlementDay})`}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {psp.currencies.slice(0, 3).map(curr => (
                      <span key={curr} className="px-1.5 py-0.5 bg-bg-page border border-border-subtle rounded text-[9px] font-bold text-text-tertiary uppercase">
                        {curr}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="text-text-tertiary">Rolling Reserve:</span>
                  <span className="font-bold text-text-secondary">{psp.rollingReservePercent}% for {psp.reservePeriodDays}d</span>
                </div>
              </div>

              {/* API Snippet Section */}
              <div className="px-5 py-4 flex flex-col gap-2.5 bg-bg-page/20">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-0.5 overflow-hidden">
                    <span className="text-[9px] font-bold text-text-tertiary uppercase">Endpoint</span>
                    <span className="text-[11px] font-mono text-text-tertiary truncate max-w-[180px]">{psp.endpoint}</span>
                  </div>
                  <button 
                    onClick={() => copyToClipboard(psp.endpoint)}
                    className="p-1.5 text-text-tertiary hover:text-accent-interactive hover:bg-white rounded-md transition-all shadow-sm border border-transparent hover:border-border-subtle"
                  >
                    <Copy size={12} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] font-bold text-text-tertiary uppercase">API Key</span>
                    <span className="text-[11px] font-mono text-text-tertiary">
                      {showApiKey[psp.id] ? psp.apiKey : '••••••••••••••••'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => toggleApiKey(psp.id)}
                      className="p-1.5 text-text-tertiary hover:text-accent-interactive hover:bg-white rounded-md transition-all shadow-sm border border-transparent hover:border-border-subtle"
                    >
                      {showApiKey[psp.id] ? <EyeOff size={12} /> : <Eye size={12} />}
                    </button>
                    <button 
                      onClick={() => copyToClipboard(psp.apiKey)}
                      className="p-1.5 text-text-tertiary hover:text-accent-interactive hover:bg-white rounded-md transition-all shadow-sm border border-transparent hover:border-border-subtle"
                    >
                      <Copy size={12} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="mt-auto p-4 bg-bg-page/50 border-t border-border-subtle flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      psp.connectionStatus === 'Online' ? "bg-green-500" : psp.connectionStatus === 'Offline' ? "bg-red-500" : "bg-gray-400"
                    )} />
                    <span className="text-[11px] text-text-tertiary">
                      {psp.lastTested ? `Last tested: ${format(psp.lastTested, 'HH:mm')}` : 'Never tested'}
                    </span>
                  </div>
                  {pingResult[psp.id] && (
                    <span className={cn(
                      "text-[10px] font-bold",
                      pingResult[psp.id]?.success ? "text-green-600" : "text-red-600"
                    )}>
                      {pingResult[psp.id]?.message}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handlePing(psp.id)}
                    disabled={pinging[psp.id]}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-white border border-border-subtle rounded-lg text-[11px] font-bold text-text-secondary hover:bg-bg-page transition-all"
                  >
                    <RefreshCw size={12} className={cn(pinging[psp.id] && "animate-spin")} /> Ping
                  </button>
                  <button 
                    onClick={() => onEditPsp(psp)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-white border border-border-subtle rounded-lg text-[11px] font-bold text-text-secondary hover:bg-bg-page transition-all"
                  >
                    <RefreshCw size={12} className="rotate-90" /> Edit
                  </button>
                  <button 
                    onClick={() => onViewHistory(psp)}
                    className="p-1.5 bg-white border border-border-subtle rounded-lg text-text-tertiary hover:text-text-secondary transition-all"
                    title="History"
                  >
                    <History size={14} />
                  </button>
                  <button 
                    onClick={() => {
                      if (psp.status === 'Active') {
                        setConfirmDisable(psp.id);
                      } else {
                        onToggleStatus(psp.id);
                      }
                    }}
                    className={cn(
                      "p-1.5 border rounded-lg transition-all",
                      psp.status === 'Active' 
                        ? "bg-red-50 border-red-100 text-red-600 hover:bg-red-100" 
                        : "bg-green-50 border-green-100 text-green-600 hover:bg-green-100"
                    )}
                    title={psp.status === 'Active' ? "Disable" : "Enable"}
                  >
                    <Power size={14} />
                  </button>
                </div>

                <AnimatePresence>
                  {confirmDisable === psp.id && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-2 p-3 bg-red-50 border border-red-100 rounded-lg flex flex-col gap-2">
                        <p className="text-[11px] text-red-700 leading-tight">
                          Disabling this provider will pause all automated reconciliation for its transactions.
                        </p>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => {
                              onToggleStatus(psp.id);
                              setConfirmDisable(null);
                            }}
                            className="flex-1 py-1 bg-red-600 text-white rounded text-[10px] font-bold hover:bg-red-700 transition-all"
                          >
                            Confirm Disable
                          </button>
                          <button 
                            onClick={() => setConfirmDisable(null)}
                            className="flex-1 py-1 bg-white border border-red-200 text-red-700 rounded text-[10px] font-bold hover:bg-red-50 transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ))}

          {/* Add New Provider Card */}
          <button 
            onClick={onAddPsp}
            className="bg-bg-page border-2 border-dashed border-border-subtle rounded-xl p-6 flex flex-col items-center justify-center gap-4 hover:border-accent-interactive/50 hover:bg-accent-hover/20 transition-all group min-h-[400px]"
          >
            <div className="w-14 h-14 bg-white border border-border-subtle rounded-2xl flex items-center justify-center text-text-tertiary group-hover:text-accent-interactive group-hover:border-accent-interactive/30 transition-all shadow-sm">
              <Plus size={28} />
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <span className="text-[15px] font-bold text-text-secondary group-hover:text-text-primary transition-all">Add New Provider</span>
              <span className="text-[12px] text-text-tertiary">Connect a new gateway or acquirer</span>
            </div>
          </button>
        </div>
      ) : (
        <div className="bg-white border border-border-subtle rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-bg-page/50 border-b border-border-subtle">
                  <th className="px-6 py-4 text-[11px] font-bold text-text-tertiary uppercase tracking-wider">Logo</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-text-tertiary uppercase tracking-wider">PSP Name</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-text-tertiary uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-text-tertiary uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-text-tertiary uppercase tracking-wider">Processing Fee</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-text-tertiary uppercase tracking-wider">Settlement</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-text-tertiary uppercase tracking-wider">Currencies</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-text-tertiary uppercase tracking-wider">Last Tested</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-text-tertiary uppercase tracking-wider text-center">Connection</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-text-tertiary uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {pspConfigs.map((psp) => (
                  <tr key={psp.id} className="hover:bg-bg-page/30 transition-colors">
                    <td className="px-6 py-4">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-[12px]"
                        style={{ backgroundColor: psp.logoColor }}
                      >
                        {psp.name.substring(0, 2).toUpperCase()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[13px] font-bold text-text-primary">{psp.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-text-tertiary">
                        {getCategoryIcon(psp.category)}
                        <span className="text-[12px]">{psp.category}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={psp.status}>{psp.status}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[12px] font-medium text-text-secondary">
                        {psp.processingFeePercent}% + {psp.processingFeeFixed}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-[12px] font-medium text-text-secondary">{psp.settlementFrequency}</span>
                        {psp.settlementDay && <span className="text-[10px] text-text-tertiary">{psp.settlementDay}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1">
                        {psp.currencies.slice(0, 2).map(curr => (
                          <span key={curr} className="px-1 py-0.5 bg-bg-page border border-border-subtle rounded text-[9px] font-bold text-text-tertiary uppercase">
                            {curr}
                          </span>
                        ))}
                        {psp.currencies.length > 2 && (
                          <span className="text-[9px] text-text-tertiary font-bold">+{psp.currencies.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[12px] text-text-tertiary">
                        {psp.lastTested ? format(psp.lastTested, 'HH:mm') : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          psp.connectionStatus === 'Online' ? "bg-green-500" : psp.connectionStatus === 'Offline' ? "bg-red-500" : "bg-gray-400"
                        )} />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handlePing(psp.id)}
                          className="p-1.5 text-text-tertiary hover:text-accent-interactive hover:bg-accent-hover/20 rounded-md transition-all"
                          title="Ping"
                        >
                          <RefreshCw size={14} className={cn(pinging[psp.id] && "animate-spin")} />
                        </button>
                        <button 
                          onClick={() => onEditPsp(psp)}
                          className="p-1.5 text-text-tertiary hover:text-accent-interactive hover:bg-accent-hover/20 rounded-md transition-all"
                          title="Edit"
                        >
                          <RefreshCw size={14} className="rotate-90" />
                        </button>
                        <button 
                          onClick={() => onViewHistory(psp)}
                          className="p-1.5 text-text-tertiary hover:text-accent-interactive hover:bg-accent-hover/20 rounded-md transition-all"
                          title="History"
                        >
                          <History size={14} />
                        </button>
                        <button 
                          onClick={() => onToggleStatus(psp.id)}
                          className={cn(
                            "p-1.5 rounded-md transition-all",
                            psp.status === 'Active' ? "text-red-600 hover:bg-red-50" : "text-green-600 hover:bg-green-50"
                          )}
                          title={psp.status === 'Active' ? "Disable" : "Enable"}
                        >
                          <Power size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
