import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, AlertCircle, Info } from 'lucide-react';
import { PSPConfig } from '../../types';

interface PSPConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  psp: PSPConfig | null;
  onSave: (psp: PSPConfig) => void;
}

export const PSPConfigModal = ({ 
  isOpen, 
  onClose, 
  psp, 
  onSave 
}: PSPConfigModalProps) => {
  const [draft, setDraft] = useState<PSPConfig>({
    id: '',
    name: '',
    type: 'Gateway',
    status: 'Active',
    lastSync: new Date(),
    config: {
      endpoint: '',
      apiKey: '',
      webhookUrl: '',
    }
  });

  useEffect(() => {
    if (psp) {
      setDraft({ ...psp });
    } else {
      setDraft({
        id: Math.random().toString(36).substr(2, 9),
        name: '',
        type: 'Gateway',
        status: 'Active',
        lastSync: new Date(),
        config: {
          endpoint: '',
          apiKey: '',
          webhookUrl: '',
        }
      });
    }
  }, [psp, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/35 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-[520px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="psp-modal-title"
      >
        <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between">
          <h2 id="psp-modal-title" className="text-[15px] font-bold text-text-primary">
            {psp ? `Edit ${psp.name}` : 'Add New PSP'}
          </h2>
          <button onClick={onClose} className="text-text-tertiary hover:text-text-primary transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-text-tertiary uppercase">PSP Name</label>
              <input 
                type="text" 
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="e.g. Stripe, Adyen"
                className="w-full px-4 py-2 bg-bg-page border border-border-subtle rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-accent-interactive focus:border-accent-interactive transition-all"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-text-tertiary uppercase">Type</label>
              <select 
                value={draft.type}
                onChange={(e) => setDraft({ ...draft, type: e.target.value as any })}
                className="w-full px-4 py-2 bg-bg-page border border-border-subtle rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-accent-interactive focus:border-accent-interactive transition-all"
              >
                <option value="Gateway">Gateway</option>
                <option value="Acquirer">Acquirer</option>
                <option value="E-Wallet">E-Wallet</option>
                <option value="Bank">Bank</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <h3 className="text-[12px] font-bold text-text-primary border-b border-border-subtle pb-2">API Configuration</h3>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-text-tertiary uppercase">API Endpoint</label>
              <input 
                type="text" 
                value={draft.config.endpoint}
                onChange={(e) => setDraft({ ...draft, config: { ...draft.config, endpoint: e.target.value } })}
                placeholder="https://api.psp.com/v1"
                className="w-full px-4 py-2 bg-bg-page border border-border-subtle rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-accent-interactive focus:border-accent-interactive transition-all"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-text-tertiary uppercase">API Key / Secret</label>
              <input 
                type="password" 
                value={draft.config.apiKey}
                onChange={(e) => setDraft({ ...draft, config: { ...draft.config, apiKey: e.target.value } })}
                placeholder="••••••••••••••••"
                className="w-full px-4 py-2 bg-bg-page border border-border-subtle rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-accent-interactive focus:border-accent-interactive transition-all"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-text-tertiary uppercase">Webhook URL</label>
              <input 
                type="text" 
                value={draft.config.webhookUrl}
                onChange={(e) => setDraft({ ...draft, config: { ...draft.config, webhookUrl: e.target.value } })}
                placeholder="https://your-app.com/api/webhooks/psp"
                className="w-full px-4 py-2 bg-bg-page border border-border-subtle rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-accent-interactive focus:border-accent-interactive transition-all"
              />
            </div>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex gap-3">
            <Info size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <p className="text-[12px] font-bold text-amber-800">Security Note</p>
              <p className="text-[11px] text-amber-700 leading-relaxed">
                API keys are stored using industry-standard encryption. Ensure you have granted the necessary permissions in your PSP dashboard.
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border-subtle bg-bg-page flex items-center justify-between">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className="relative w-10 h-5 bg-border-subtle rounded-full transition-all group-hover:bg-border-subtle/80">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={draft.status === 'Active'}
                  onChange={(e) => setDraft({ ...draft, status: e.target.checked ? 'Active' : 'Inactive' })}
                />
                <div className={`absolute top-1 left-1 w-3 h-3 rounded-full transition-all ${draft.status === 'Active' ? 'translate-x-5 bg-accent-interactive' : 'bg-text-tertiary'}`} />
              </div>
              <span className="text-[12px] font-medium text-text-secondary">{draft.status}</span>
            </label>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="px-6 py-2 border border-border-subtle rounded-lg text-[13px] font-medium text-text-secondary hover:bg-white transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={() => onSave(draft)}
              className="px-8 py-2 bg-accent-interactive text-white rounded-lg text-[13px] font-bold hover:bg-accent-interactive/90 transition-all shadow-lg shadow-accent-interactive/20 flex items-center gap-2"
            >
              <Save size={16} /> Save Configuration
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
