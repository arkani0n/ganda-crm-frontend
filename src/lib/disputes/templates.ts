import { DisputeReasonCategory, PSPChargebackTemplate, TemplateTextBlock, PSPChargebackRules, Dispute } from '../../types';

const DEFAULT_TEMPLATES: Record<DisputeReasonCategory, Omit<PSPChargebackTemplate, 'reasonCategory'>> = {
  'Fraud': {
    textBlocks: [
      { id: 'fraud-1', title: 'Transaction Authentication', content: 'The transaction was authenticated using [3DS/AVS/CVV verification]. Authentication details: [describe authentication method and result].', order: 1 },
      { id: 'fraud-2', title: 'Customer Verification', content: 'The cardholder was verified through [describe verification steps]. IP address at time of transaction: [IP]. Device fingerprint: [device info].', order: 2 },
      { id: 'fraud-3', title: 'Transaction History', content: 'The cardholder has [N] previous successful transactions with no disputes. Account created on [date].', order: 3 },
    ],
    requiredEvidence: ['3DS authentication record', 'AVS match confirmation', 'Transaction authorization log'],
    optionalEvidence: ['IP geolocation data', 'Device fingerprint', 'Previous transaction history', 'Customer communication'],
    submissionNotes: undefined,
  },
  'Product not received': {
    textBlocks: [
      { id: 'pnr-1', title: 'Delivery Confirmation', content: 'The product/service was delivered on [date]. Tracking number: [tracking]. Carrier: [carrier name].', order: 1 },
      { id: 'pnr-2', title: 'Proof of Delivery', content: 'Delivery was confirmed by [signature/photo/GPS confirmation]. See attached proof of delivery documentation.', order: 2 },
      { id: 'pnr-3', title: 'Customer Communication', content: 'Customer was notified of delivery on [date] via [email/SMS]. [Include any post-delivery communication].', order: 3 },
    ],
    requiredEvidence: ['Proof of delivery', 'Shipping tracking confirmation'],
    optionalEvidence: ['Delivery signature', 'Customer delivery notification email', 'GPS delivery confirmation'],
  },
  'Not as described': {
    textBlocks: [
      { id: 'nad-1', title: 'Product/Service Description', content: 'The product/service was described as [original description] on [platform/page]. The customer agreed to these terms on [date].', order: 1 },
      { id: 'nad-2', title: 'Terms of Service', content: 'The customer accepted the terms of service on [date], which clearly state [relevant terms regarding the product/service].', order: 2 },
      { id: 'nad-3', title: 'Accuracy of Description', content: 'The product/service delivered matches the description provided. [Explain how the delivered item matches what was described].', order: 3 },
    ],
    requiredEvidence: ['Product description at time of purchase', 'Terms of service accepted by customer'],
    optionalEvidence: ['Customer communication logs', 'Screenshots of product listing', 'Comparison documentation'],
  },
  'Duplicate charge': {
    textBlocks: [
      { id: 'dup-1', title: 'Transaction Log', content: 'Our records show only a single charge of [amount] [currency] on [date] for transaction [txn ID]. No duplicate charge exists in our system.', order: 1 },
      { id: 'dup-2', title: 'Refund Status', content: '[If a refund was issued]: A refund of [amount] was processed on [date], reference [refund ID]. [If no duplicate exists]: No refund is applicable as no duplicate charge occurred.', order: 2 },
    ],
    requiredEvidence: ['Transaction log showing single charge', 'Payment processor settlement report'],
    optionalEvidence: ['Refund confirmation (if applicable)', 'Bank statement reconciliation'],
  },
  'Subscription cancelled': {
    textBlocks: [
      { id: 'sub-1', title: 'Subscription Terms', content: 'The customer subscribed on [date] and agreed to [billing cycle] billing. Cancellation policy states: [cancellation terms].', order: 1 },
      { id: 'sub-2', title: 'Cancellation Timeline', content: 'The customer requested cancellation on [date]. Per our policy, the charge on [disputed date] was [within/outside] the cancellation window.', order: 2 },
      { id: 'sub-3', title: 'Service Provided', content: 'The customer had full access to the service during the disputed billing period from [start] to [end].', order: 3 },
    ],
    requiredEvidence: ['Subscription agreement with cancellation policy', 'Cancellation request timestamp'],
    optionalEvidence: ['Service usage logs during disputed period', 'Customer communication about cancellation'],
  },
  'Other': {
    textBlocks: [
      { id: 'oth-1', title: 'Transaction Details', content: 'Transaction [txn ID] was processed on [date] for [amount] [currency] via [gateway]. The transaction was authorized and completed successfully.', order: 1 },
      { id: 'oth-2', title: 'Supporting Evidence', content: '[Describe any relevant evidence or circumstances that support the validity of this transaction].', order: 2 },
    ],
    requiredEvidence: ['Transaction authorization log'],
    optionalEvidence: ['Customer communication', 'Service/product delivery confirmation'],
  },
};

export function getDefaultTemplate(reasonCategory: DisputeReasonCategory): PSPChargebackTemplate {
  const template = DEFAULT_TEMPLATES[reasonCategory];
  return { reasonCategory, ...template };
}

export function getTemplateForDispute(
  reasonCategory: DisputeReasonCategory,
  pspRules: PSPChargebackRules | undefined
): PSPChargebackTemplate {
  if (pspRules) {
    const pspTemplate = pspRules.templates.find(t => t.reasonCategory === reasonCategory);
    if (pspTemplate) return pspTemplate;
  }
  return getDefaultTemplate(reasonCategory);
}

export function assembleDocument(
  dispute: Dispute,
  textBlocks: TemplateTextBlock[],
  evidenceNotes: Record<string, string>
): string {
  const lines: string[] = [];

  lines.push('COUNTER-CHARGEBACK SUBMISSION');
  lines.push('='.repeat(40));
  lines.push('');
  lines.push(`Date: ${dispute.openedDate.toLocaleDateString()}`);
  lines.push(`Transaction ID: ${dispute.transaction.txnId}`);
  lines.push(`Client: ${dispute.transaction.client}`);
  lines.push(`Amount: ${dispute.disputeAmount} ${dispute.currency}`);
  lines.push(`Gateway: ${dispute.transaction.gateway}`);
  lines.push(`Reason: ${dispute.reasonCategory}${dispute.rawReasonCode ? ` (${dispute.rawReasonCode})` : ''}`);
  lines.push('');
  lines.push('-'.repeat(40));

  for (const block of textBlocks.sort((a, b) => a.order - b.order)) {
    lines.push('');
    lines.push(block.title.toUpperCase());
    lines.push('-'.repeat(block.title.length));
    lines.push(block.content);
  }

  const evidenceEntries = Object.entries(evidenceNotes).filter(([, note]) => note.trim());
  if (evidenceEntries.length > 0) {
    lines.push('');
    lines.push('SUPPORTING EVIDENCE');
    lines.push('-'.repeat(19));
    for (const [item, note] of evidenceEntries) {
      lines.push(`• ${item}: ${note}`);
    }
  }

  lines.push('');
  lines.push('-'.repeat(40));
  lines.push('End of submission');

  return lines.join('\n');
}
