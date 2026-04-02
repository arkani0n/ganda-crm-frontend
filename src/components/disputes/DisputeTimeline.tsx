import React, { useState } from 'react';
import { format } from 'date-fns';
import { DisputeTimelineEntry, DisputePhase } from '../../types';
import { cn } from '../../lib/utils';

interface DisputeTimelineProps {
  timeline: DisputeTimelineEntry[];
  deadline: Date;
}

const PHASE_COLORS: Record<DisputePhase, string> = {
  'Transaction created': 'bg-gray-300',
  'Settled by PSP': 'bg-green-500',
  'Chargeback issued': 'bg-yellow-500',
  'Deadline approaching': 'bg-orange-500',
  'Deadline urgent': 'bg-red-500',
  'Counter-chargeback submitted': 'bg-blue-500',
  'Accepted': 'bg-gray-400',
  'Won': 'bg-green-700',
  'Lost': 'bg-red-700',
};

const PHASE_DOT_COLORS: Record<DisputePhase, string> = {
  'Transaction created': 'bg-gray-400 border-gray-300',
  'Settled by PSP': 'bg-green-600 border-green-400',
  'Chargeback issued': 'bg-yellow-600 border-yellow-400',
  'Deadline approaching': 'bg-orange-600 border-orange-400',
  'Deadline urgent': 'bg-red-600 border-red-400',
  'Counter-chargeback submitted': 'bg-blue-600 border-blue-400',
  'Accepted': 'bg-gray-500 border-gray-400',
  'Won': 'bg-green-800 border-green-600',
  'Lost': 'bg-red-800 border-red-600',
};

export const DisputeTimeline = ({ timeline, deadline }: DisputeTimelineProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (timeline.length === 0) return null;

  const sortedTimeline = [...timeline].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  const lastEntry = sortedTimeline[sortedTimeline.length - 1];
  const isResolved = ['Won', 'Lost', 'Accepted'].includes(lastEntry.phase);

  return (
    <div className="w-full px-2 py-4">
      <div className="relative flex items-center w-full">
        {sortedTimeline.map((entry, index) => {
          const isLast = index === sortedTimeline.length - 1;
          const segmentColor = PHASE_COLORS[entry.phase];
          const dotColor = PHASE_DOT_COLORS[entry.phase];
          const isCurrentPhase = isLast && !isResolved;

          return (
            <React.Fragment key={entry.id}>
              {/* Node */}
              <div
                className="relative flex flex-col items-center z-10 flex-shrink-0"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Tooltip */}
                {hoveredIndex === index && (
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-gray-900 text-white text-[11px] font-medium rounded-lg whitespace-nowrap z-50 shadow-lg">
                    {entry.phase}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
                  </div>
                )}

                {/* Dot */}
                <div className={cn(
                  "rounded-full border-2 transition-all cursor-default",
                  dotColor,
                  isCurrentPhase ? "w-4 h-4 ring-4 ring-current/10" : "w-3 h-3"
                )} />

                {/* Date label below */}
                <span className="absolute top-6 text-[9px] font-medium text-text-tertiary whitespace-nowrap">
                  {format(entry.timestamp, 'dd MMM')}
                </span>
              </div>

              {/* Segment line between nodes */}
              {!isLast && (
                <div className={cn(
                  "h-1 flex-1 min-w-[24px] rounded-full mx-1",
                  segmentColor
                )} />
              )}
            </React.Fragment>
          );
        })}

        {/* Future dashed segment if not resolved */}
        {!isResolved && (
          <>
            <div className="h-1 flex-1 min-w-[24px] mx-1 rounded-full border-2 border-dashed border-gray-300 bg-transparent" />
            <div className="relative flex flex-col items-center z-10 flex-shrink-0">
              <div className="w-3 h-3 rounded-full border-2 border-dashed border-gray-300 bg-white" />
              <span className="absolute top-6 text-[9px] font-medium text-text-tertiary whitespace-nowrap">
                {format(deadline, 'dd MMM')}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
