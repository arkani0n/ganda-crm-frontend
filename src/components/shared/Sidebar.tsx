import React from 'react';
import { 
  LayoutGrid, 
  RefreshCw, 
  BarChart3, 
  Settings, 
  Wallet, 
  Layers, 
  ShieldAlert, 
  Building2, 
  LogOut,
  ChevronLeft
} from 'lucide-react';
import { SidebarItem } from './SidebarItem';

interface SidebarProps {
  activePage: string;
  setActivePage: (page: any) => void;
}

export const Sidebar = ({ activePage, setActivePage }: SidebarProps) => {
  return (
    <aside className="w-64 bg-white border-r border-border-subtle flex flex-col h-screen sticky top-0 shrink-0">
      <div className="p-6 flex items-center gap-3 border-b border-border-subtle">
        <div className="w-8 h-8 bg-accent-interactive rounded-lg flex items-center justify-center text-white shadow-lg shadow-accent-interactive/20">
          <RefreshCw size={18} className="animate-spin-slow" />
        </div>
        <div className="flex flex-col">
          <span className="text-[15px] font-bold text-text-primary tracking-tight">ReconFlow</span>
          <span className="text-[10px] font-bold text-accent-interactive uppercase tracking-widest">Enterprise</span>
        </div>
      </div>

      <nav className="flex-1 py-6 flex flex-col gap-1 overflow-y-auto custom-scrollbar">
        <div className="px-6 mb-2">
          <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Main Menu</span>
        </div>
        <SidebarItem 
          icon={LayoutGrid} 
          label="Transactions" 
          active={activePage === 'Transactions'} 
          onClick={() => setActivePage('Transactions')} 
        />
        <SidebarItem
          icon={RefreshCw}
          label="Reconciliation"
          active={activePage === 'Reconciliation'}
          onClick={() => setActivePage('Reconciliation')}
        />
        <SidebarItem
          icon={ShieldAlert}
          label="Disputes"
          active={activePage === 'Disputes'}
          onClick={() => setActivePage('Disputes')}
        />
        <SidebarItem
          icon={BarChart3}
          label="Reports"
          active={activePage === 'Reports'}
          onClick={() => setActivePage('Reports')}
        />
        <SidebarItem 
          icon={Settings} 
          label="PSP Config" 
          active={activePage === 'PSP Config'} 
          onClick={() => setActivePage('PSP Config')} 
        />
        <SidebarItem 
          icon={Wallet} 
          label="Settlement Calendar" 
          active={activePage === 'Settlement Calendar'} 
          onClick={() => setActivePage('Settlement Calendar')} 
        />

        <div className="px-6 mt-8 mb-2">
          <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Operations</span>
        </div>
        <SidebarItem icon={Wallet} label="Settlement" />
        <SidebarItem icon={Layers} label="Gateways" />
        <SidebarItem icon={Building2} label="Brands" />
        <SidebarItem icon={Settings} label="Settings" />
      </nav>

      <div className="p-4 border-t border-border-subtle">
        <div className="bg-bg-page rounded-xl p-4 flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-accent-hover flex items-center justify-center text-accent-interactive font-bold text-[14px]">
            JD
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-[13px] font-bold text-text-primary truncate">John Doe</span>
            <span className="text-[11px] text-text-tertiary truncate">Admin Account</span>
          </div>
        </div>
        <button className="w-full flex items-center gap-3 px-4 py-2 text-text-tertiary hover:text-red-600 transition-colors text-[13px] font-medium">
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </aside>
  );
};
