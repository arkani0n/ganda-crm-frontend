import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, ChevronRight, ChevronLeft, Download, Copy, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import { Dispute, DisputeReasonCategory, TemplateTextBlock, PSPChargebackRules } from '../../types';
import { getTemplateForDispute, assembleDocument } from '../../lib/disputes/templates';
import { cn } from '../../lib/utils';

interface DisputeTemplateWizardProps {
  isOpen: boolean;
  dispute: Dispute;
  pspChargebackRules?: PSPChargebackRules;
  onClose: () => void;
  onMarkSubmitted: (disputeId: string) => void;
}

type WizardStep = 1 | 2 | 3;

export const DisputeTemplateWizard = ({
  isOpen,
  dispute,
  pspChargebackRules,
  onClose,
  onMarkSubmitted,
}: DisputeTemplateWizardProps) => {
  const [step, setStep] = useState<WizardStep>(1);
  const [reasonCategory, setReasonCategory] = useState<DisputeReasonCategory>(dispute.reasonCategory);
  const [textBlocks, setTextBlocks] = useState<TemplateTextBlock[]>([]);
  const [evidenceNotes, setEvidenceNotes] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);

  const REASON_CATEGORIES: DisputeReasonCategory[] = [
    'Fraud', 'Product not received', 'Not as described', 'Duplicate charge', 'Subscription cancelled', 'Other'
  ];

  useEffect(() => {
    const template = getTemplateForDispute(reasonCategory, pspChargebackRules);
    setTextBlocks(template.textBlocks.map(b => ({ ...b })));
    const notes: Record<string, string> = {};
    for (const item of [...template.requiredEvidence, ...template.optionalEvidence]) {
      notes[item] = evidenceNotes[item] || '';
    }
    setEvidenceNotes(notes);
  }, [reasonCategory, pspChargebackRules]);

  if (!isOpen) return null;

  const template = getTemplateForDispute(reasonCategory, pspChargebackRules);
  const documentText = assembleDocument(dispute, textBlocks, evidenceNotes);

  const updateTextBlock = (id: string, field: 'title' | 'content', value: string) => {
    setTextBlocks(prev => prev.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const addTextBlock = () => {
    const newBlock: TemplateTextBlock = {
      id: `custom-${Date.now()}`,
      title: 'New Section',
      content: '',
      order: textBlocks.length + 1,
    };
    setTextBlocks(prev => [...prev, newBlock]);
  };

  const removeTextBlock = (id: string) => {
    setTextBlocks(prev => prev.filter(b => b.id !== id));
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(documentText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([documentText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `counter-chargeback-${dispute.transaction.txnId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleMarkSubmitted = () => {
    onMarkSubmitted(dispute.id);
    onClose();
  };

  const stepTitles = { 1: 'Choose Template', 2: 'Edit Template', 3: 'Preview Document' };

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
        className="relative w-full max-w-[900px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <h2 className="text-[16px] font-bold text-text-primary">Counter-Chargeback Builder</h2>
            <div className="flex items-center gap-1">
              {([1, 2, 3] as WizardStep[]).map(s => (
                <React.Fragment key={s}>
                  <div className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all",
                    step === s ? "bg-accent-interactive text-white" :
                    step > s ? "bg-green-100 text-green-700" :
                    "bg-bg-page text-text-tertiary"
                  )}>
                    {step > s ? <CheckCircle2 size={14} /> : s}
                  </div>
                  {s < 3 && <div className={cn("w-8 h-0.5 rounded-full", step > s ? "bg-green-300" : "bg-border-subtle")} />}
                </React.Fragment>
              ))}
            </div>
            <span className="text-[12px] text-text-tertiary">{stepTitles[step]}</span>
          </div>
          <button onClick={onClose} className="p-2 text-text-tertiary hover:text-text-primary hover:bg-bg-page rounded-full transition-all">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {step === 1 && (
            <div className="flex flex-col gap-6">
              <div className="bg-bg-page/50 rounded-xl p-5 border border-border-subtle">
                <h3 className="text-[13px] font-bold text-text-primary mb-4">Dispute Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Info label="Transaction ID" value={dispute.transaction.txnId} />
                  <Info label="Client" value={dispute.transaction.client} />
                  <Info label="Amount" value={`${dispute.disputeAmount.toLocaleString()} ${dispute.currency}`} />
                  <Info label="Gateway" value={dispute.transaction.gateway} />
                  <Info label="Dispute Date" value={dispute.openedDate.toLocaleDateString()} />
                  <Info label="Brand" value={dispute.transaction.brand} />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">Reason Category</label>
                <select
                  value={reasonCategory}
                  onChange={(e) => setReasonCategory(e.target.value as DisputeReasonCategory)}
                  className="w-full max-w-xs px-4 py-2.5 bg-white border border-border-subtle rounded-lg text-[13px] font-medium focus:outline-none focus:ring-1 focus:ring-accent-interactive"
                >
                  {REASON_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <p className="text-[11px] text-text-tertiary">
                  Template auto-selected for <strong>{dispute.transaction.gateway}</strong> + <strong>{reasonCategory}</strong>.
                  {!pspChargebackRules?.templates.find(t => t.reasonCategory === reasonCategory) && ' Using default template.'}
                </p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-6">
              {/* Text blocks */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[13px] font-bold text-text-primary">Document Sections</h3>
                  <button
                    onClick={addTextBlock}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-accent-interactive hover:bg-accent-hover/30 rounded-lg transition-all"
                  >
                    <Plus size={12} /> Add Section
                  </button>
                </div>

                {textBlocks.map((block) => (
                  <div key={block.id} className="border border-border-subtle rounded-lg p-4 bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <input
                        type="text"
                        value={block.title}
                        onChange={(e) => updateTextBlock(block.id, 'title', e.target.value)}
                        className="text-[13px] font-bold text-text-primary bg-transparent border-none focus:outline-none focus:ring-0 flex-1"
                      />
                      <button
                        onClick={() => removeTextBlock(block.id)}
                        className="p-1 text-text-tertiary hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <textarea
                      value={block.content}
                      onChange={(e) => updateTextBlock(block.id, 'content', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 bg-bg-page border border-border-subtle rounded-lg text-[12px] focus:outline-none focus:ring-1 focus:ring-accent-interactive resize-none"
                    />
                  </div>
                ))}
              </div>

              {/* Evidence checklist */}
              <div className="flex flex-col gap-3">
                <h3 className="text-[13px] font-bold text-text-primary">Evidence Checklist</h3>

                {template.requiredEvidence.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Required</span>
                    {template.requiredEvidence.map(item => (
                      <div key={item} className="flex items-start gap-3 bg-white border border-border-subtle rounded-lg p-3">
                        <input type="checkbox" checked={!!evidenceNotes[item]?.trim()} readOnly className="mt-0.5 w-4 h-4 rounded border-border-subtle text-accent-interactive" />
                        <div className="flex-1 flex flex-col gap-1">
                          <span className="text-[12px] font-medium text-text-primary">{item}</span>
                          <input
                            type="text"
                            placeholder="Describe or reference evidence..."
                            value={evidenceNotes[item] || ''}
                            onChange={(e) => setEvidenceNotes(prev => ({ ...prev, [item]: e.target.value }))}
                            className="w-full px-2 py-1 bg-bg-page border border-border-subtle rounded text-[11px] focus:outline-none focus:ring-1 focus:ring-accent-interactive"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {template.optionalEvidence.length > 0 && (
                  <div className="flex flex-col gap-2 mt-2">
                    <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Optional</span>
                    {template.optionalEvidence.map(item => (
                      <div key={item} className="flex items-start gap-3 bg-white border border-border-subtle rounded-lg p-3">
                        <input type="checkbox" checked={!!evidenceNotes[item]?.trim()} readOnly className="mt-0.5 w-4 h-4 rounded border-border-subtle text-accent-interactive" />
                        <div className="flex-1 flex flex-col gap-1">
                          <span className="text-[12px] font-medium text-text-secondary">{item}</span>
                          <input
                            type="text"
                            placeholder="Describe or reference evidence..."
                            value={evidenceNotes[item] || ''}
                            onChange={(e) => setEvidenceNotes(prev => ({ ...prev, [item]: e.target.value }))}
                            className="w-full px-2 py-1 bg-bg-page border border-border-subtle rounded text-[11px] focus:outline-none focus:ring-1 focus:ring-accent-interactive"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-4">
              <h3 className="text-[13px] font-bold text-text-primary">Document Preview</h3>
              <div className="bg-bg-page border border-border-subtle rounded-xl p-6 font-mono text-[12px] text-text-primary whitespace-pre-wrap leading-relaxed max-h-[50vh] overflow-y-auto custom-scrollbar">
                {documentText}
              </div>
            </div>
          )}
        </div>

        {/* Footer — persistent action buttons on every step */}
        <div className="px-6 py-4 border-t border-border-subtle bg-bg-page/50 flex items-center justify-between sticky bottom-0 z-10">
          <div className="flex items-center gap-2">
            {step > 1 && (
              <button
                onClick={() => setStep((step - 1) as WizardStep)}
                className="flex items-center gap-1.5 px-4 py-2 border border-border-subtle rounded-lg text-[12px] font-medium text-text-secondary hover:bg-white transition-all"
              >
                <ChevronLeft size={14} /> Back
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-2 border border-border-subtle rounded-lg text-[12px] font-medium text-text-secondary hover:bg-white transition-all"
            >
              <Download size={14} /> Download
            </button>
            <button
              onClick={handleCopyToClipboard}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 border rounded-lg text-[12px] font-medium transition-all",
                copied ? "border-green-300 text-green-600 bg-green-50" : "border-border-subtle text-text-secondary hover:bg-white"
              )}
            >
              <Copy size={14} /> {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={handleMarkSubmitted}
              className="flex items-center gap-1.5 px-3 py-2 border border-border-subtle rounded-lg text-[12px] font-medium text-blue-600 hover:bg-blue-50 transition-all"
            >
              <CheckCircle2 size={14} /> Mark as Submitted
            </button>

            {step < 3 && (
              <button
                onClick={() => setStep((step + 1) as WizardStep)}
                className="flex items-center gap-1.5 px-5 py-2 bg-accent-interactive text-white rounded-lg text-[12px] font-bold hover:bg-accent-interactive/90 transition-all shadow-sm"
              >
                Next <ChevronRight size={14} />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">{label}</span>
      <span className="text-[13px] font-medium text-text-primary">{value}</span>
    </div>
  );
}
