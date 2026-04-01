import React, { useState, useRef, useEffect } from 'react';
import { Filter, Check, X, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

interface MultiSelectProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (val: string[]) => void;
}

export const MultiSelect = ({ label, options, selected, onChange }: MultiSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (opt: string) => {
    if (opt === 'All') {
      onChange(['All']);
      setIsOpen(false);
      return;
    }
    
    let newSelected = [...selected];
    if (newSelected.includes('All')) {
      newSelected = [opt];
    } else if (newSelected.includes(opt)) {
      newSelected = newSelected.filter(o => o !== opt);
      if (newSelected.length === 0) newSelected = ['All'];
    } else {
      newSelected.push(opt);
    }
    onChange(newSelected);
  };

  return (
    <div className="flex flex-col gap-1 relative" ref={dropdownRef}>
      <label className="text-[10px] font-semibold text-text-tertiary uppercase">{label}</label>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-2 border border-border-subtle rounded-lg px-3 py-1.5 text-[13px] bg-white min-w-[140px] hover:border-accent-interactive transition-colors"
      >
        <span className="truncate max-w-[100px]">
          {selected.includes('All') ? 'All' : selected.join(', ')}
        </span>
        <ChevronDown size={14} className={cn("text-text-tertiary transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full min-w-[180px] bg-white border border-border-subtle rounded-xl shadow-xl z-50 py-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="max-h-60 overflow-y-auto custom-scrollbar">
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => toggleOption(opt)}
                className="w-full px-4 py-2 text-left text-[13px] hover:bg-bg-page flex items-center justify-between group"
              >
                <span className={cn(selected.includes(opt) ? "text-accent-interactive font-semibold" : "text-text-secondary")}>
                  {opt}
                </span>
                {selected.includes(opt) && <Check size={14} className="text-accent-interactive" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
