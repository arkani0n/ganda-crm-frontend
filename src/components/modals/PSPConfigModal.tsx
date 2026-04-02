import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, AlertCircle, Info, Eye, EyeOff, Globe, CreditCard, Wallet, Building2, Smartphone, Bitcoin, Ticket, Plus, Trash2 } from 'lucide-react';
import { PSPConfig, PSPCategory, SettlementFrequency, Currency, PSPChargebackRules, DisputeReasonCategory } from '../../types';
import { cn } from '../../lib/utils';

interface PSPConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  psp: PSPConfig | null;
  onSave: (psp: PSPConfig) => void;
}

type Tab = 'General' | 'Fees' | 'Settlement' | 'API' | 'Chargeback Rules';

export const PSPConfigModal = ({ 
  isOpen, 
  onClose, 
  psp, 
  onSave 
}: PSPConfigModalProps) => {
  const [activeTab, setActiveTab] = useState<Tab>('General');
  const [showApiKey, setShowApiKey] = useState(false);
  const [showApiSecret, setShowApiSecret] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);

  const [draft, setDraft] = useState<PSPConfig>({
    id: '',
    name: '',
    category: 'Card Payments',
    status: 'Active',
    logoColor: '#6B5CE7',
    processingFeePercent: 0,
    processingFeeFixed: 0,
    refundFeePercent: 0,
    chargebackFeeFixed: 0,
    fxMarkupPercent: 0,
    minTransaction: 0,
    maxTransaction: 0,
    settlementFrequency: 'Daily',
    rollingReservePercent: 0,
    reservePeriodDays: 0,
    expectedDelayDays: 0,
    currencies: ['EUR'],
    countries: [],
    environment: 'Sandbox',
    endpoint: '',
    apiKey: '',
    apiSecret: '',
    webhookUrl: '',
    webhookSecret: '',
    ipWhitelist: '',
    connectionStatus: 'Never Tested'
  });

  useEffect(() => {
    if (psp) {
      setDraft({ ...psp });
    } else {
      setDraft({
        id: Math.random().toString(36).substr(2, 9),
        name: '',
        category: 'Card Payments',
        status: 'Active',
        logoColor: '#6B5CE7',
        processingFeePercent: 1.5,
        processingFeeFixed: 0.25,
        refundFeePercent: 0,
        chargebackFeeFixed: 15,
        fxMarkupPercent: 1.0,
        minTransaction: 1,
        maxTransaction: 10000,
        settlementFrequency: 'Daily',
        rollingReservePercent: 5,
        reservePeriodDays: 180,
        expectedDelayDays: 3,
        currencies: ['EUR', 'USD'],
        countries: [],
        environment: 'Sandbox',
        endpoint: '',
        apiKey: '',
        apiSecret: '',
        webhookUrl: '',
        webhookSecret: '',
        ipWhitelist: '',
        connectionStatus: 'Never Tested',
        chargebackRules: {
          defaultResponseWindowDays: 30,
          templates: [],
        },
      });
    }
    setActiveTab('General');
  }, [psp, isOpen]);

  if (!isOpen) return null;

  const categories: PSPCategory[] = ['Card Payments', 'E-Wallet', 'Bank Transfer', 'Open Banking', 'Crypto', 'Voucher'];
  const frequencies: SettlementFrequency[] = ['Daily', 'Weekly', 'Bi-weekly', 'Monthly'];
  const currencies: Currency[] = ['EUR', 'USD', 'GBP'];

  const toggleCurrency = (curr: Currency) => {
    setDraft(prev => ({
      ...prev,
      currencies: prev.currencies.includes(curr)
        ? prev.currencies.filter(c => c !== curr)
        : [...prev.currencies, curr]
    }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-[560px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-[14px]"
              style={{ backgroundColor: draft.logoColor }}
            >
              {draft.name ? draft.name.substring(0, 2).toUpperCase() : '??'}
            </div>
            <h2 className="text-[16px] font-bold text-text-primary">
              {psp ? `Edit ${psp.name}` : 'Add New PSP'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 text-text-tertiary hover:text-text-primary hover:bg-bg-page rounded-full transition-all">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border-subtle px-6 bg-bg-page/30">
          {(['General', 'Fees', 'Settlement', 'API', 'Chargeback Rules'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-3 text-[13px] font-bold transition-all border-b-2 -mb-px",
                activeTab === tab 
                  ? "border-accent-interactive text-accent-interactive" 
                  : "border-transparent text-text-tertiary hover:text-text-secondary"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {activeTab === 'General' && (
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">PSP Name</label>
                  <input 
                    type="text" 
                    value={draft.name}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    placeholder="e.g. Stripe, Adyen"
                    className="w-full px-4 py-2 bg-bg-page border border-border-subtle rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-accent-interactive/20 focus:border-accent-interactive transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">Category</label>
                  <select 
                    value={draft.category}
                    onChange={(e) => setDraft({ ...draft, category: e.target.value as PSPCategory })}
                    className="w-full px-4 py-2 bg-bg-page border border-border-subtle rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-accent-interactive/20 focus:border-accent-interactive transition-all"
                  >
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">Status</label>
                <div className="flex gap-3">
                  {(['Active', 'Inactive', 'Testing'] as const).map(status => (
                    <button
                      key={status}
                      onClick={() => setDraft({ ...draft, status })}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-[12px] font-bold border transition-all",
                        draft.status === status 
                          ? "bg-accent-hover/30 border-accent-interactive text-accent-interactive" 
                          : "bg-white border-border-subtle text-text-tertiary hover:bg-bg-page"
                      )}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">Supported Currencies</label>
                <div className="flex gap-2">
                  {currencies.map(curr => (
                    <button
                      key={curr}
                      onClick={() => toggleCurrency(curr)}
                      className={cn(
                        "px-4 py-1.5 rounded-full text-[12px] font-bold border transition-all",
                        draft.currencies.includes(curr)
                          ? "bg-accent-interactive text-white border-accent-interactive"
                          : "bg-white border-border-subtle text-text-tertiary hover:bg-bg-page"
                      )}
                    >
                      {curr}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">Countries Supported</label>
                <input 
                  type="text" 
                  value={draft.countries.join(', ')}
                  onChange={(e) => setDraft({ ...draft, countries: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  placeholder="e.g. US, GB, DE (comma separated)"
                  className="w-full px-4 py-2 bg-bg-page border border-border-subtle rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-accent-interactive/20 focus:border-accent-interactive transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">Notes</label>
                <textarea 
                  value={draft.notes}
                  onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                  placeholder="Internal notes about this provider..."
                  rows={3}
                  className="w-full px-4 py-2 bg-bg-page border border-border-subtle rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-accent-interactive/20 focus:border-accent-interactive transition-all resize-none"
                />
              </div>
            </div>
          )}

          {activeTab === 'Fees' && (
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">Processing Fee (%)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={draft.processingFeePercent}
                    onChange={(e) => setDraft({ ...draft, processingFeePercent: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 bg-bg-page border border-border-subtle rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-accent-interactive/20 focus:border-accent-interactive transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">Fixed Fee (EUR)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={draft.processingFeeFixed}
                    onChange={(e) => setDraft({ ...draft, processingFeeFixed: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 bg-bg-page border border-border-subtle rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-accent-interactive/20 focus:border-accent-interactive transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">Refund Fee (%)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={draft.refundFeePercent}
                    onChange={(e) => setDraft({ ...draft, refundFeePercent: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 bg-bg-page border border-border-subtle rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-accent-interactive/20 focus:border-accent-interactive transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">Chargeback Fee (EUR)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={draft.chargebackFeeFixed}
                    onChange={(e) => setDraft({ ...draft, chargebackFeeFixed: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 bg-bg-page border border-border-subtle rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-accent-interactive/20 focus:border-accent-interactive transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">FX Markup (%)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={draft.fxMarkupPercent}
                  onChange={(e) => setDraft({ ...draft, fxMarkupPercent: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 bg-bg-page border border-border-subtle rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-accent-interactive/20 focus:border-accent-interactive transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">Min Transaction</label>
                  <input 
                    type="number" 
                    value={draft.minTransaction}
                    onChange={(e) => setDraft({ ...draft, minTransaction: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 bg-bg-page border border-border-subtle rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-accent-interactive/20 focus:border-accent-interactive transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">Max Transaction</label>
                  <input 
                    type="number" 
                    value={draft.maxTransaction}
                    onChange={(e) => setDraft({ ...draft, maxTransaction: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 bg-bg-page border border-border-subtle rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-accent-interactive/20 focus:border-accent-interactive transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Settlement' && (
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">Frequency</label>
                  <select 
                    value={draft.settlementFrequency}
                    onChange={(e) => setDraft({ ...draft, settlementFrequency: e.target.value as SettlementFrequency })}
                    className="w-full px-4 py-2 bg-bg-page border border-border-subtle rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-accent-interactive/20 focus:border-accent-interactive transition-all"
                  >
                    {frequencies.map(freq => <option key={freq} value={freq}>{freq}</option>)}
                  </select>
                </div>
                {draft.settlementFrequency !== 'Daily' && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">Settlement Day</label>
                    <select 
                      value={draft.settlementDay || ''}
                      onChange={(e) => setDraft({ ...draft, settlementDay: e.target.value })}
                      className="w-full px-4 py-2 bg-bg-page border border-border-subtle rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-accent-interactive/20 focus:border-accent-interactive transition-all"
                    >
                      <option value="">Select Day</option>
                      <option value="Monday">Monday</option>
                      <option value="Tuesday">Tuesday</option>
                      <option value="Wednesday">Wednesday</option>
                      <option value="Thursday">Thursday</option>
                      <option value="Friday">Friday</option>
                      <option value="Saturday">Saturday</option>
                      <option value="Sunday">Sunday</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">Rolling Reserve (%)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={draft.rollingReservePercent}
                    onChange={(e) => setDraft({ ...draft, rollingReservePercent: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 bg-bg-page border border-border-subtle rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-accent-interactive/20 focus:border-accent-interactive transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">Reserve Period (days)</label>
                  <input 
                    type="number" 
                    value={draft.reservePeriodDays}
                    onChange={(e) => setDraft({ ...draft, reservePeriodDays: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-bg-page border border-border-subtle rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-accent-interactive/20 focus:border-accent-interactive transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">Expected Delay (days)</label>
                <input 
                  type="number" 
                  value={draft.expectedDelayDays}
                  onChange={(e) => setDraft({ ...draft, expectedDelayDays: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 bg-bg-page border border-border-subtle rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-accent-interactive/20 focus:border-accent-interactive transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">Settlement Notes</label>
                <textarea 
                  value={draft.settlementNotes}
                  onChange={(e) => setDraft({ ...draft, settlementNotes: e.target.value })}
                  placeholder="Specific settlement instructions..."
                  rows={3}
                  className="w-full px-4 py-2 bg-bg-page border border-border-subtle rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-accent-interactive/20 focus:border-accent-interactive transition-all resize-none"
                />
              </div>
            </div>
          )}

          {activeTab === 'API' && (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">Environment</label>
                <div className="flex bg-bg-page p-1 rounded-lg border border-border-subtle">
                  <button
                    onClick={() => setDraft({ ...draft, environment: 'Sandbox' })}
                    className={cn(
                      "flex-1 py-1.5 rounded-md text-[12px] font-bold transition-all",
                      draft.environment === 'Sandbox' ? "bg-white text-blue-600 shadow-sm" : "text-text-tertiary hover:text-text-secondary"
                    )}
                  >
                    Sandbox
                  </button>
                  <button
                    onClick={() => setDraft({ ...draft, environment: 'Live' })}
                    className={cn(
                      "flex-1 py-1.5 rounded-md text-[12px] font-bold transition-all",
                      draft.environment === 'Live' ? "bg-white text-green-600 shadow-sm" : "text-text-tertiary hover:text-text-secondary"
                    )}
                  >
                    Live
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">API Endpoint URL</label>
                <input 
                  type="text" 
                  value={draft.endpoint}
                  onChange={(e) => setDraft({ ...draft, endpoint: e.target.value })}
                  placeholder="https://api.provider.com/v1"
                  className="w-full px-4 py-2 bg-bg-page border border-border-subtle rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-accent-interactive/20 focus:border-accent-interactive transition-all"
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">API Key</label>
                  <div className="relative">
                    <input 
                      type={showApiKey ? "text" : "password"}
                      value={draft.apiKey}
                      onChange={(e) => setDraft({ ...draft, apiKey: e.target.value })}
                      placeholder="••••••••••••••••"
                      className="w-full px-4 py-2 bg-bg-page border border-border-subtle rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-accent-interactive/20 focus:border-accent-interactive transition-all pr-10"
                    />
                    <button 
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
                    >
                      {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">API Secret</label>
                  <div className="relative">
                    <input 
                      type={showApiSecret ? "text" : "password"}
                      value={draft.apiSecret}
                      onChange={(e) => setDraft({ ...draft, apiSecret: e.target.value })}
                      placeholder="••••••••••••••••"
                      className="w-full px-4 py-2 bg-bg-page border border-border-subtle rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-accent-interactive/20 focus:border-accent-interactive transition-all pr-10"
                    />
                    <button 
                      onClick={() => setShowApiSecret(!showApiSecret)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
                    >
                      {showApiSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">Webhook URL</label>
                <input 
                  type="text" 
                  value={draft.webhookUrl}
                  onChange={(e) => setDraft({ ...draft, webhookUrl: e.target.value })}
                  placeholder="https://your-app.com/api/webhooks/provider"
                  className="w-full px-4 py-2 bg-bg-page border border-border-subtle rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-accent-interactive/20 focus:border-accent-interactive transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">IP Whitelist</label>
                <textarea 
                  value={draft.ipWhitelist}
                  onChange={(e) => setDraft({ ...draft, ipWhitelist: e.target.value })}
                  placeholder="Enter IP addresses (one per line)..."
                  rows={2}
                  className="w-full px-4 py-2 bg-bg-page border border-border-subtle rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-accent-interactive/20 focus:border-accent-interactive transition-all resize-none"
                />
              </div>
            </div>
          )}

          {activeTab === 'Chargeback Rules' && (
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">Default Response Window (days)</label>
                  <input
                    type="number"
                    value={draft.chargebackRules?.defaultResponseWindowDays ?? 30}
                    onChange={(e) => setDraft({
                      ...draft,
                      chargebackRules: {
                        ...draft.chargebackRules!,
                        defaultResponseWindowDays: parseInt(e.target.value) || 30,
                      }
                    })}
                    className="w-full px-4 py-2 bg-bg-page border border-border-subtle rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-accent-interactive/20 focus:border-accent-interactive transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <label className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">Per-Reason Overrides (days)</label>
                {(['Fraud', 'Product not received', 'Not as described', 'Duplicate charge', 'Subscription cancelled', 'Other'] as DisputeReasonCategory[]).map(reason => (
                  <div key={reason} className="flex items-center gap-3">
                    <span className="text-[12px] text-text-secondary w-48 flex-shrink-0">{reason}</span>
                    <input
                      type="number"
                      placeholder={`${draft.chargebackRules?.defaultResponseWindowDays ?? 30} (default)`}
                      value={draft.chargebackRules?.reasonOverrides?.[reason] ?? ''}
                      onChange={(e) => {
                        const val = e.target.value ? parseInt(e.target.value) : undefined;
                        setDraft(prev => ({
                          ...prev,
                          chargebackRules: {
                            ...prev.chargebackRules!,
                            reasonOverrides: {
                              ...prev.chargebackRules?.reasonOverrides,
                              [reason]: val,
                            },
                          }
                        }));
                      }}
                      className="w-24 px-3 py-1.5 bg-bg-page border border-border-subtle rounded-lg text-[12px] focus:outline-none focus:ring-1 focus:ring-accent-interactive transition-all"
                    />
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-border-subtle">
                <div className="flex items-center gap-2 mb-3">
                  <Info size={14} className="text-text-tertiary" />
                  <span className="text-[11px] text-text-tertiary">
                    PSP-specific templates can be configured here. If no template is set for a reason category, the system default will be used.
                  </span>
                </div>
                <p className="text-[11px] text-text-tertiary italic">
                  Template editing for individual reason categories will be available in a future update. Current counter-chargeback documents use system defaults.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border-subtle bg-bg-page/50 flex items-center justify-end gap-3 sticky bottom-0 z-10">
          <button 
            onClick={onClose}
            className="px-6 py-2 text-[13px] font-bold text-text-tertiary hover:text-text-primary transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={() => onSave(draft)}
            className="px-8 py-2 bg-accent-interactive text-white rounded-lg text-[13px] font-bold hover:bg-accent-interactive/90 transition-all shadow-lg shadow-accent-interactive/20 flex items-center gap-2"
          >
            <Save size={16} /> Save PSP
          </button>
        </div>
      </motion.div>
    </div>
  );
};
