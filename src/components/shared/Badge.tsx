import React from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant: string;
}

export const Badge = ({ children, variant }: BadgeProps) => {
  const variants: Record<string, string> = {
    Completed: "bg-green-50 text-green-700 border-green-100",
    Pending: "bg-amber-50 text-amber-700 border-amber-100",
    Failed: "bg-red-50 text-red-700 border-red-100",
    Disputed: "bg-red-50 text-red-700 border-red-100",
    Matched: "bg-green-50 text-green-700 border-green-100",
    Unmatched: "bg-red-50 text-red-700 border-red-100",
    ReconPending: "bg-bg-page text-text-tertiary border-border-subtle",
    'Amount diff': "bg-amber-50 text-amber-700 border-amber-100",
    'Missing in PSP': "bg-red-50 text-red-700 border-red-100",
    'Not in system': "bg-amber-50 text-amber-700 border-amber-100",
    Active: "bg-green-50 text-green-700 border-green-100",
    Inactive: "bg-bg-page text-text-tertiary border-border-subtle",
    Testing: "bg-amber-50 text-amber-700 border-amber-100",
    // Dispute statuses
    Open: "bg-blue-50 text-blue-700 border-blue-100",
    'In Progress': "bg-amber-50 text-amber-700 border-amber-100",
    Won: "bg-green-50 text-green-700 border-green-100",
    Lost: "bg-red-50 text-red-700 border-red-100",
    Accepted: "bg-bg-page text-text-tertiary border-border-subtle",
    // Advisory badges
    Recommended: "bg-green-50 text-green-700 border-green-100",
    Neutral: "bg-amber-50 text-amber-700 border-amber-100",
    'Low chance': "bg-red-50 text-red-700 border-red-100",
  };

  return (
    <span className={cn(
      "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border",
      variants[variant] || "bg-bg-page text-text-tertiary border-border-subtle"
    )}>
      {children}
    </span>
  );
};
