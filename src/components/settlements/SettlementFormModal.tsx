import React from 'react';
import { X, Calendar, DollarSign, Info, ChevronDown } from 'lucide-react';
import { Settlement, SettlementStatus, Gateway, Brand, Currency } from '../../types';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';

interface SettlementFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (s: Settlement) => void;
  settlement?: Settlement | null;
  gateways: Gateway[];
  brands: Brand[];
}

export const SettlementFormModal = ({ isOpen, onClose, onSave, settlement, gateways, brands }: SettlementFormModalProps) => {
  const [formData, setFormData] = React.useState<Partial<Settlement>>({
    psp: gateways[0],
    brand: brands[0],
    settlementNo: `STL-${Math.floor(1000 + Math.random() * 9000)}`,
    expectedDate: new Date(),
    expectedAmount: 0,
    currency: 'EUR',
    rollingReserve: 0,
    status: 'Scheduled',
    notes: '',
    timeline: []
  });

  React.useEffect(() => {
    if (settlement) {
      setFormData({
        ...settlement,
        expectedDate: new Date(settlement.expectedDate),
        actualReceivedDate: settlement.actualReceivedDate ? new Date(settlement.actualReceivedDate) : undefined
      });
    } else {
      setFormData({
        psp: gateways[0],
        brand: brands[0],
        settlementNo: `STL-${Math.floor(1000 + Math.random() * 9000)}`,
        expectedDate: new Date(),
        expectedAmount: 0,
        currency: 'EUR',
        rollingReserve: 0,
        status: 'Scheduled',
        notes: '',
        timeline: []
      });
    }
  }, [settlement, gateways, brands]);

  if (!isOpen) return null;

  const netExpected = (formData.expectedAmount || 0) - (formData.rollingReserve || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newSettlement: Settlement = {
      ...formData as Settlement,
      id: settlement?.id || `stl-${Date.now()}`,
      netExpected,
      timeline: settlement?.timeline || [{ status: formData.status as SettlementStatus, timestamp: new Date() }]
    };
    onSave(newSettlement);
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-[480px] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between bg-bg-page/30">
          <div className="flex flex-col">
            <h2 className="text-[18px] font-bold text-text-primary tracking-tight">
              {settlement ? 'Edit Settlement' : 'Add Expected Settlement'}
            </h2>
            <span className="text-[12px] text-text-tertiary">Enter the details for the upcoming payment</span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-bg-page rounded-full transition-colors text-text-tertiary">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">PSP</label>
              <div className="relative">
                <select 
                  value={formData.psp}
                  onChange={(e) => setFormData({ ...formData, psp: e.target.value as Gateway })}
                  className="w-full appearance-none pl-3 pr-8 py-2 bg-bg-page border border-border-subtle rounded-lg text-[13px] font-medium focus:outline-none focus:border-accent-interactive cursor-pointer"
                >
                  {gateways.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">Brand</label>
              <div className="relative">
                <select 
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value as Brand })}
                  className="w-full appearance-none pl-3 pr-8 py-2 bg-bg-page border border-border-subtle rounded-lg text-[13px] font-medium focus:outline-none focus:border-accent-interactive cursor-pointer"
                >
                  {brands.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">Settlement #</label>
              <input 
                type="text"
                value={formData.settlementNo}
                onChange={(e) => setFormData({ ...formData, settlementNo: e.target.value })}
                className="w-full px-3 py-2 bg-bg-page border border-border-subtle rounded-lg text-[13px] font-mono focus:outline-none focus:border-accent-interactive"
                placeholder="STL-0000"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">Expected Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" size={14} />
                <input 
                  type="date"
                  value={formData.expectedDate ? format(formData.expectedDate, 'yyyy-MM-dd') : ''}
                  onChange={(e) => setFormData({ ...formData, expectedDate: new Date(e.target.value) })}
                  className="w-full pl-9 pr-3 py-2 bg-bg-page border border-border-subtle rounded-lg text-[13px] focus:outline-none focus:border-accent-interactive"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">Expected Amount</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" size={14} />
                  <input 
                    type="number"
                    value={formData.expectedAmount}
                    onChange={(e) => setFormData({ ...formData, expectedAmount: parseFloat(e.target.value) })}
                    className="w-full pl-9 pr-3 py-2 bg-bg-page border border-border-subtle rounded-lg text-[13px] focus:outline-none focus:border-accent-interactive"
                    placeholder="0.00"
                  />
                </div>
                <select 
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value as Currency })}
                  className="w-20 px-2 py-2 bg-bg-page border border-border-subtle rounded-lg text-[12px] font-bold focus:outline-none focus:border-accent-interactive"
                >
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">Rolling Reserve</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" size={14} />
                <input 
                  type="number"
                  value={formData.rollingReserve}
                  onChange={(e) => setFormData({ ...formData, rollingReserve: parseFloat(e.target.value) })}
                  className="w-full pl-9 pr-3 py-2 bg-bg-page border border-border-subtle rounded-lg text-[13px] focus:outline-none focus:border-accent-interactive"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          <div className="p-3 bg-accent-interactive/5 border border-accent-interactive/20 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info size={14} className="text-accent-interactive" />
              <span className="text-[12px] font-medium text-accent-interactive">Net Amount to be received</span>
            </div>
            <span className="text-[14px] font-bold text-accent-interactive">
              {new Intl.NumberFormat('en-IE', { style: 'currency', currency: formData.currency }).format(netExpected)}
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">Status</label>
            <div className="relative">
              <select 
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as SettlementStatus })}
                className="w-full appearance-none pl-3 pr-8 py-2 bg-bg-page border border-border-subtle rounded-lg text-[13px] font-medium focus:outline-none focus:border-accent-interactive cursor-pointer"
              >
                <option value="Scheduled">Scheduled</option>
                <option value="Pending">Pending</option>
                <option value="Settled">Settled</option>
                <option value="Partial">Partial</option>
                <option value="Disputed">Disputed</option>
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
            </div>
          </div>

          {formData.status === 'Settled' && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-green-50/50 border border-green-100 rounded-xl animate-in slide-in-from-top-2 duration-200">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-green-700 uppercase tracking-wider">Received Date</label>
                <input 
                  type="date"
                  value={formData.actualReceivedDate ? format(formData.actualReceivedDate, 'yyyy-MM-dd') : ''}
                  onChange={(e) => setFormData({ ...formData, actualReceivedDate: new Date(e.target.value) })}
                  className="w-full px-3 py-2 bg-white border border-green-200 rounded-lg text-[13px] focus:outline-none focus:border-green-500"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-green-700 uppercase tracking-wider">Actual Amount</label>
                <input 
                  type="number"
                  value={formData.actualAmountReceived}
                  onChange={(e) => setFormData({ ...formData, actualAmountReceived: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 bg-white border border-green-200 rounded-lg text-[13px] focus:outline-none focus:border-green-500"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">Notes</label>
            <textarea 
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 bg-bg-page border border-border-subtle rounded-lg text-[13px] focus:outline-none focus:border-accent-interactive min-h-[80px]"
              placeholder="Add any internal notes here..."
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border-subtle flex items-center justify-end gap-3 bg-bg-page/30">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-[13px] font-bold text-text-secondary hover:bg-bg-page rounded-lg transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            className="px-6 py-2 bg-accent-interactive text-white text-[13px] font-bold rounded-lg hover:bg-accent-interactive/90 transition-all shadow-lg shadow-accent-interactive/20"
          >
            {settlement ? 'Update Settlement' : 'Save Settlement'}
          </button>
        </div>
      </div>
    </div>
  );
};
