import React from 'react';
import { cn } from '../../lib/utils';

interface SidebarItemProps {
  icon: any;
  label: string;
  active?: boolean;
  onClick?: () => void;
  badge?: string;
}

export const SidebarItem = ({ icon: Icon, label, active, onClick, badge }: SidebarItemProps) => (
  <button 
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-4 py-2.5 transition-all relative group",
      active 
        ? "text-accent-interactive bg-accent-hover/40 font-bold" 
        : "text-text-secondary hover:text-text-primary hover:bg-bg-page"
    )}
  >
    {active && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-accent-interactive rounded-r-full" />}
    <Icon size={18} className={cn("transition-colors", active ? "text-accent-interactive" : "text-text-tertiary group-hover:text-text-primary")} />
    <span className="text-[13px] tracking-tight">{label}</span>
    {badge && (
      <span className="ml-auto bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
        {badge}
      </span>
    )}
  </button>
);
