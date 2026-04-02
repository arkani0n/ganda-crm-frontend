import React from 'react';
import { format } from 'date-fns';
import { FileText, ArrowRightLeft, Download } from 'lucide-react';
import { Dispute, DisputeStatus } from '../../types';
import { Badge } from '../shared/Badge';
import { DisputeTimeline } from './DisputeTimeline';
import { getDeadlineUrgency, getDeadlineLabel } from '../../lib/disputes/deadlines';
import { cn } from '../../lib/utils';

interface DisputeDetailPanelProps {
  dispute: Dispute;
  onStatusChange: (disputeId: string, newStatus: DisputeStatus) => void;
  onNotesChange: (disputeId: string, notes: string) => void;
  onBuildTemplate: (dispute: Dispute) => void;
  onExportCase: (dispute: Dispute) => void;
}

export const DisputeDetailPanel = ({
  dispute,
  onStatusChange,
  onNotesChange,
  onBuildTemplate,
  onExportCase,
}: DisputeDetailPanelProps) => {
  const urgency = getDeadlineUrgency(dispute.deadline);
  const deadlineLabel = getDeadlineLabel(dispute.deadline);
  const isResolved = ['Won', 'Lost', 'Accepted'].includes(dispute.status);

  const urgencyColors: Record<string, string> = {
    safe: 'text-green-600 bg-green-50',
    warning: 'text-amber-600 bg-amber-50',
    urgent: 'text-red-600 bg-red-50',
    expired: 'text-red-800 bg-red-100',
  };

  return (
    <div className="bg-bg-page/50 border-t border-border-subtle px-6 py-5">
      {/* Timeline */}
      <DisputeTimeline timeline={dispute.timeline} deadline={dispute.deadline} />

      {/* Two-column detail layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Left column */}
        <div className="flex flex-col gap-3">
          <DetailRow label="Transaction ID" value={dispute.transaction.txnId} mono />
          <DetailRow label="Client" value={dispute.transaction.client} />
          <DetailRow label="Amount & Currency" value={`${dispute.disputeAmount.toLocaleString()} ${dispute.currency}`} bold />
          <DetailRow label="Brand" value={dispute.transaction.brand} />
          <DetailRow label="Gateway" value={dispute.transaction.gateway} />
          <DetailRow
            label="Dispute vs Original"
            value={`${dispute.disputeAmount.toLocaleString()} / ${dispute.transaction.amount.toLocaleString()} ${dispute.currency}`}
          />
          <DetailRow label="PSP Fee" value={`${dispute.pspFee.toFixed(2)} ${dispute.currency}`} />

          {/* Status dropdown */}
          <div className="flex items-center gap-3 mt-1">
            <span className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider w-36 flex-shrink-0">Status</span>
            <select
              value={dispute.status}
              onChange={(e) => onStatusChange(dispute.id, e.target.value as DisputeStatus)}
              className="px-3 py-1.5 bg-white border border-border-subtle rounded-lg text-[12px] font-medium focus:outline-none focus:ring-1 focus:ring-accent-interactive"
            >
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Won">Won</option>
              <option value="Lost">Lost</option>
              <option value="Accepted">Accepted</option>
            </select>
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-3">
          <DetailRow label="Reason Category" value={dispute.reasonCategory} />
          {dispute.rawReasonCode && (
            <DetailRow label="Raw Reason Code" value={dispute.rawReasonCode} mono />
          )}

          {/* Deadline with urgency */}
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider w-36 flex-shrink-0">Deadline</span>
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-medium text-text-primary">
                {format(dispute.deadline, 'dd MMM yyyy')}
              </span>
              {!isResolved && (
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold",
                  urgencyColors[urgency]
                )}>
                  {deadlineLabel}
                </span>
              )}
            </div>
          </div>

          {/* Worth fighting */}
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider w-36 flex-shrink-0">Worth Fighting?</span>
            <div className="flex items-center gap-2">
              <Badge variant={dispute.worthFighting.recommendation}>
                {dispute.worthFighting.recommendation}
              </Badge>
              <span className="text-[11px] text-text-tertiary">{dispute.worthFighting.reasoning}</span>
            </div>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1.5 mt-1">
            <span className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">Notes</span>
            <textarea
              value={dispute.notes}
              onChange={(e) => onNotesChange(dispute.id, e.target.value)}
              placeholder="Add notes about this dispute..."
              rows={3}
              className="w-full px-3 py-2 bg-white border border-border-subtle rounded-lg text-[12px] focus:outline-none focus:ring-1 focus:ring-accent-interactive transition-all resize-none"
            />
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3 mt-6 pt-4 border-t border-border-subtle">
        <button
          onClick={() => onBuildTemplate(dispute)}
          className="flex items-center gap-2 px-4 py-2 bg-accent-interactive text-white rounded-lg text-[12px] font-bold hover:bg-accent-interactive/90 transition-all shadow-sm"
        >
          <FileText size={14} /> Build Counter-Chargeback
        </button>
        <button
          onClick={() => onStatusChange(dispute.id, dispute.status)}
          className="flex items-center gap-2 px-4 py-2 border border-border-subtle rounded-lg text-[12px] font-medium text-text-secondary hover:bg-white transition-all"
        >
          <ArrowRightLeft size={14} /> Change Status
        </button>
        <button
          onClick={() => onExportCase(dispute)}
          className="flex items-center gap-2 px-4 py-2 border border-border-subtle rounded-lg text-[12px] font-medium text-text-secondary hover:bg-white transition-all"
        >
          <Download size={14} /> Export Case
        </button>
      </div>
    </div>
  );
};

function DetailRow({ label, value, mono, bold }: { label: string; value: string; mono?: boolean; bold?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider w-36 flex-shrink-0">{label}</span>
      <span className={cn(
        "text-[12px] text-text-primary",
        mono && "font-mono",
        bold && "font-bold"
      )}>
        {value}
      </span>
    </div>
  );
}
