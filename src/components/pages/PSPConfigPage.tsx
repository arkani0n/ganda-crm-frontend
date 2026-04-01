import React from 'react';
import { 
  Settings, 
  Plus, 
  Trash2, 
  Edit2, 
  ExternalLink, 
  Activity, 
  Shield, 
  Zap,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { PSPConfig } from '../../types';
import { Badge } from '../shared/Badge';
import { cn } from '../../lib/utils';

interface PSPConfigPageProps {
  pspConfigs: PSPConfig[];
  onEditPsp: (psp: PSPConfig) => void;
  onAddPsp: () => void;
  onDeletePsp: (id: string) => void;
  onToggleStatus: (id: string) => void;
}

export const PSPConfigPage = ({
  pspConfigs,
  onEditPsp,
  onAddPsp,
  onDeletePsp,
  onToggleStatus
}: PSPConfigPageProps) => {
  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[24px] font-bold text-text-primary tracking-tight">PSP Configuration</h1>
          <p className="text-[13px] text-text-tertiary">Manage your payment service providers, API keys, and gateway connections.</p>
        </div>
        <button 
          onClick={onAddPsp}
          className="flex items-center gap-2 px-6 py-2.5 bg-accent-interactive text-white rounded-lg text-[13px] font-bold hover:bg-accent-interactive/90 transition-all shadow-lg shadow-accent-interactive/20"
        >
          <Plus size={18} /> Add New PSP
        </button>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-border-subtle rounded-2xl p-6 shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <Shield size={24} />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="text-[14px] font-bold text-text-primary">Secure Storage</h3>
            <p className="text-[12px] text-text-tertiary leading-relaxed">All API keys and secrets are encrypted using AES-256 before being stored in our secure vault.</p>
          </div>
        </div>
        <div className="bg-white border border-border-subtle rounded-2xl p-6 shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center shrink-0">
            <Zap size={24} />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="text-[14px] font-bold text-text-primary">Real-time Webhooks</h3>
            <p className="text-[12px] text-text-tertiary leading-relaxed">Configure webhooks to receive instant notifications for transaction status changes and disputes.</p>
          </div>
        </div>
        <div className="bg-white border border-border-subtle rounded-2xl p-6 shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center shrink-0">
            <Activity size={24} />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="text-[14px] font-bold text-text-primary">Health Monitoring</h3>
            <p className="text-[12px] text-text-tertiary leading-relaxed">Our system continuously monitors the health of your gateway connections and API endpoints.</p>
          </div>
        </div>
      </div>

      {/* PSP List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {pspConfigs.map((psp) => (
          <div key={psp.id} className="bg-white border border-border-subtle rounded-2xl p-6 shadow-sm group hover:border-accent-interactive/30 transition-all flex flex-col gap-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-bg-page rounded-xl flex items-center justify-center border border-border-subtle group-hover:border-accent-interactive/20 transition-all overflow-hidden">
                  <img 
                    src={`https://picsum.photos/seed/${psp.name}/100/100`} 
                    alt={psp.name} 
                    className="w-8 h-8 object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[16px] font-bold text-text-primary tracking-tight">{psp.name}</h3>
                    <Badge variant={psp.status}>{psp.status}</Badge>
                  </div>
                  <span className="text-[12px] text-text-tertiary">{psp.type} • ID: {psp.id}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => onEditPsp(psp)}
                  className="p-2 text-text-tertiary hover:text-accent-interactive hover:bg-accent-hover/30 rounded-lg transition-all"
                  title="Edit Configuration"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => onDeletePsp(psp.id)}
                  className="p-2 text-text-tertiary hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  title="Delete PSP"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-bg-page border border-border-subtle rounded-xl flex flex-col gap-1">
                <span className="text-[10px] font-bold text-text-tertiary uppercase">Last Sync</span>
                <div className="flex items-center gap-1.5 text-[12px] font-medium text-text-secondary">
                  <Clock size={12} />
                  {format(psp.lastSync, 'dd MMM, HH:mm')}
                </div>
              </div>
              <div className="p-3 bg-bg-page border border-border-subtle rounded-xl flex flex-col gap-1">
                <span className="text-[10px] font-bold text-text-tertiary uppercase">Endpoint Status</span>
                <div className="flex items-center gap-1.5 text-[12px] font-medium text-green-600">
                  <CheckCircle2 size={12} />
                  Operational
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-text-tertiary">API Endpoint</span>
                <span className="font-mono text-text-secondary truncate max-w-[200px]">{psp.config.endpoint}</span>
              </div>
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-text-tertiary">Webhook URL</span>
                <span className="font-mono text-text-secondary truncate max-w-[200px]">{psp.config.webhookUrl}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-border-subtle flex items-center justify-between">
              <button 
                onClick={() => onToggleStatus(psp.id)}
                className={cn(
                  "text-[12px] font-bold transition-colors",
                  psp.status === 'Active' ? "text-red-600 hover:text-red-700" : "text-green-600 hover:text-green-700"
                )}
              >
                {psp.status === 'Active' ? 'Deactivate Gateway' : 'Activate Gateway'}
              </button>
              <button className="flex items-center gap-1.5 text-[12px] font-bold text-accent-interactive hover:underline">
                <ExternalLink size={14} /> Documentation
              </button>
            </div>
          </div>
        ))}

        {/* Add New Card */}
        <button 
          onClick={onAddPsp}
          className="bg-bg-page border-2 border-dashed border-border-subtle rounded-2xl p-6 flex flex-col items-center justify-center gap-3 hover:border-accent-interactive/50 hover:bg-accent-hover/20 transition-all group min-h-[300px]"
        >
          <div className="w-12 h-12 bg-white border border-border-subtle rounded-xl flex items-center justify-center text-text-tertiary group-hover:text-accent-interactive group-hover:border-accent-interactive/30 transition-all shadow-sm">
            <Plus size={24} />
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-[14px] font-bold text-text-secondary group-hover:text-text-primary transition-all">Add New Provider</span>
            <span className="text-[11px] text-text-tertiary">Connect a new gateway or acquirer</span>
          </div>
        </button>
      </div>
    </div>
  );
};
