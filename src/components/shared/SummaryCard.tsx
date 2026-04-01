import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SummaryCardProps {
  title: string;
  value: string;
  label: string;
  trend?: string;
  icon: any;
  trendUp?: boolean;
  subline?: string;
  accentColor?: string;
}

export const SummaryCard = ({ 
  title, 
  value, 
  label, 
  trend, 
  icon: Icon, 
  trendUp, 
  subline, 
  accentColor 
}: SummaryCardProps) => (
  <div className="bg-white border border-border-subtle rounded-xl p-5 card-shadow group hover:border-accent-interactive/30 transition-all">
    <div className="flex items-start justify-between mb-4">
      <div className={cn(
        "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
        accentColor ? `bg-${accentColor}/10 text-${accentColor}` : "bg-accent-hover text-accent-interactive group-hover:bg-accent-interactive group-hover:text-white"
      )}>
        <Icon size={20} />
      </div>
      {trend && (
        <div className={cn(
          "flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full",
          trendUp ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"
        )}>
          {trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {trend}
        </div>
      )}
    </div>
    <div className="flex flex-col">
      <span className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider mb-1">{label}</span>
      <div className="flex items-baseline gap-2">
        <span className="text-[22px] font-bold text-text-primary tracking-tight">{value}</span>
        {subline && <span className="text-[11px] text-text-tertiary italic">{subline}</span>}
      </div>
    </div>
  </div>
);
