# Disputes Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Disputes page to the CRM that surfaces disputed transactions, tracks chargeback lifecycles with deadline awareness, and provides a PSP-specific counter-chargeback template builder.

**Architecture:** The Disputes module derives its data from transactions with status "Disputed". A new `Dispute` type wraps each disputed transaction with chargeback-specific metadata (reason, deadline, timeline, advisory). The page follows the same layout pattern as Transactions/Reconciliation: summary cards, tabs, filter bar, table with expandable detail rows. A 3-step wizard modal handles counter-chargeback document assembly. PSP Config is extended with a "Chargeback Rules" tab.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, date-fns, motion/react, lucide-react

**Spec:** `docs/superpowers/specs/2026-04-02-disputes-module-design.md`

---

## File Structure

### New Files

| File | Responsibility |
|---|---|
| `src/components/pages/DisputesPage.tsx` | Main page: summary cards, tabs, filters, table, expandable rows |
| `src/components/disputes/DisputeDetailPanel.tsx` | Expandable inline panel with timeline + two-column detail layout + action buttons |
| `src/components/disputes/DisputeTimeline.tsx` | Horizontal color-coded timeline bar with hover tooltips |
| `src/components/disputes/DisputeTemplateWizard.tsx` | Full-page 3-step wizard modal (Choose Template, Edit Template, Preview) |
| `src/lib/disputes/advisory.ts` | "Worth fighting?" logic based on reason category |
| `src/lib/disputes/deadlines.ts` | Deadline calculation from PSP chargeback rules |
| `src/lib/disputes/templates.ts` | Default templates per reason category + template assembly |

### Modified Files

| File | Changes |
|---|---|
| `src/types.ts` | Add dispute types, extend PSPConfig with chargebackRules |
| `src/mockData.ts` | Add `generateDisputeMockData()` |
| `src/App.tsx` | Add Disputes page routing, state, and handlers |
| `src/components/shared/Sidebar.tsx` | Wire up Disputes nav entry |
| `src/components/shared/Badge.tsx` | Add dispute-related badge variants |
| `src/components/modals/PSPConfigModal.tsx` | Add "Chargeback Rules" tab |

---

## Task 1: Types & Data Model

**Files:**
- Modify: `src/types.ts`

- [ ] **Step 1: Add dispute types to types.ts**

Add the following types at the end of `src/types.ts`, before the closing of the file (after the `ImportLog` interface):

```typescript
// --- Disputes ---

export type DisputeStatus = 'Open' | 'In Progress' | 'Won' | 'Lost' | 'Accepted';

export type DisputeReasonCategory = 'Fraud' | 'Product not received' | 'Not as described' | 'Duplicate charge' | 'Subscription cancelled' | 'Other';

export type DisputePhase =
  | 'Transaction created'
  | 'Settled by PSP'
  | 'Chargeback issued'
  | 'Deadline approaching'
  | 'Deadline urgent'
  | 'Counter-chargeback submitted'
  | 'Accepted'
  | 'Won'
  | 'Lost';

export interface DisputeTimelineEntry {
  id: string;
  timestamp: Date;
  phase: DisputePhase;
  description: string;
  addedBy?: string;
}

export interface WorthFightingAdvice {
  recommendation: 'Recommended' | 'Neutral' | 'Low chance';
  reasoning: string;
}

export interface Dispute {
  id: string;
  transactionId: string;
  transaction: Transaction;
  status: DisputeStatus;
  reasonCategory: DisputeReasonCategory;
  rawReasonCode?: string;
  disputeAmount: number;
  pspFee: number;
  currency: Currency;
  openedDate: Date;
  deadline: Date;
  resolvedDate?: Date;
  outcomeAmount?: number;
  worthFighting: WorthFightingAdvice;
  notes: string;
  timeline: DisputeTimelineEntry[];
}

// --- PSP Chargeback Rules ---

export interface TemplateTextBlock {
  id: string;
  title: string;
  content: string;
  order: number;
}

export interface PSPChargebackTemplate {
  reasonCategory: DisputeReasonCategory;
  textBlocks: TemplateTextBlock[];
  requiredEvidence: string[];
  optionalEvidence: string[];
  submissionNotes?: string;
}

export interface PSPChargebackRules {
  defaultResponseWindowDays: number;
  reasonOverrides?: Partial<Record<DisputeReasonCategory, number>>;
  templates: PSPChargebackTemplate[];
}
```

- [ ] **Step 2: Extend PSPConfig interface with chargebackRules**

In the `PSPConfig` interface in `src/types.ts`, add at the end (before the closing `}`), after the `notes?: string;` line:

```typescript
  // Chargeback Rules
  chargebackRules?: PSPChargebackRules;
```

- [ ] **Step 3: Verify the app still compiles**

Run: `cd /home/arknion/CursorProjects/ganda-crm-frontend && npm run build`
Expected: Build succeeds with no type errors.

- [ ] **Step 4: Commit**

```bash
cd /home/arknion/CursorProjects/ganda-crm-frontend
git add src/types.ts
git commit -m "feat(disputes): add dispute types and extend PSPConfig with chargeback rules"
```

---

## Task 2: Advisory Logic

**Files:**
- Create: `src/lib/disputes/advisory.ts`

- [ ] **Step 1: Create the advisory module**

Create `src/lib/disputes/advisory.ts`:

```typescript
import { DisputeReasonCategory, WorthFightingAdvice } from '../../types';

const ADVISORY_RULES: Record<DisputeReasonCategory, WorthFightingAdvice> = {
  'Fraud': {
    recommendation: 'Low chance',
    reasoning: 'Fraud disputes are rarely overturned without strong 3DS or AVS authentication proof',
  },
  'Product not received': {
    recommendation: 'Recommended',
    reasoning: 'High win rate when proof of delivery or shipping tracking is available',
  },
  'Not as described': {
    recommendation: 'Neutral',
    reasoning: 'Outcome depends on quality of evidence — product specs, terms, customer communication',
  },
  'Duplicate charge': {
    recommendation: 'Recommended',
    reasoning: 'Usually straightforward to prove with transaction logs showing a single charge',
  },
  'Subscription cancelled': {
    recommendation: 'Neutral',
    reasoning: 'Depends on cancellation policy clarity and timing of the request vs. charge',
  },
  'Other': {
    recommendation: 'Neutral',
    reasoning: 'Assess on a case-by-case basis — no standard pattern for this category',
  },
};

export function getWorthFightingAdvice(reasonCategory: DisputeReasonCategory): WorthFightingAdvice {
  return ADVISORY_RULES[reasonCategory];
}
```

- [ ] **Step 2: Verify build**

Run: `cd /home/arknion/CursorProjects/ganda-crm-frontend && npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
cd /home/arknion/CursorProjects/ganda-crm-frontend
git add src/lib/disputes/advisory.ts
git commit -m "feat(disputes): add worth-fighting advisory logic"
```

---

## Task 3: Deadline Calculation

**Files:**
- Create: `src/lib/disputes/deadlines.ts`

- [ ] **Step 1: Create the deadlines module**

Create `src/lib/disputes/deadlines.ts`:

```typescript
import { addDays, differenceInHours, differenceInDays } from 'date-fns';
import { PSPChargebackRules, DisputeReasonCategory } from '../../types';

export function calculateDeadline(
  openedDate: Date,
  rules: PSPChargebackRules | undefined,
  reasonCategory: DisputeReasonCategory
): Date {
  const defaultWindow = 30; // fallback if no PSP rules
  if (!rules) {
    return addDays(openedDate, defaultWindow);
  }
  const windowDays = rules.reasonOverrides?.[reasonCategory] ?? rules.defaultResponseWindowDays;
  return addDays(openedDate, windowDays);
}

export type DeadlineUrgency = 'safe' | 'warning' | 'urgent' | 'expired';

export function getDeadlineUrgency(deadline: Date, now: Date = new Date()): DeadlineUrgency {
  const hoursLeft = differenceInHours(deadline, now);
  if (hoursLeft <= 0) return 'expired';
  if (hoursLeft <= 48) return 'urgent';
  const daysLeft = differenceInDays(deadline, now);
  if (daysLeft <= 7) return 'warning';
  return 'safe';
}

export function getDeadlineLabel(deadline: Date, now: Date = new Date()): string {
  const hoursLeft = differenceInHours(deadline, now);
  if (hoursLeft <= 0) return 'Expired';
  if (hoursLeft <= 48) return `${hoursLeft}h left`;
  const daysLeft = differenceInDays(deadline, now);
  return `${daysLeft}d left`;
}
```

- [ ] **Step 2: Verify build**

Run: `cd /home/arknion/CursorProjects/ganda-crm-frontend && npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
cd /home/arknion/CursorProjects/ganda-crm-frontend
git add src/lib/disputes/deadlines.ts
git commit -m "feat(disputes): add deadline calculation and urgency helpers"
```

---

## Task 4: Default Templates

**Files:**
- Create: `src/lib/disputes/templates.ts`

- [ ] **Step 1: Create the templates module**

Create `src/lib/disputes/templates.ts`:

```typescript
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
```

- [ ] **Step 2: Verify build**

Run: `cd /home/arknion/CursorProjects/ganda-crm-frontend && npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
cd /home/arknion/CursorProjects/ganda-crm-frontend
git add src/lib/disputes/templates.ts
git commit -m "feat(disputes): add default counter-chargeback templates and document assembly"
```

---

## Task 5: Mock Data Generator

**Files:**
- Modify: `src/mockData.ts`

- [ ] **Step 1: Add the dispute mock data generator**

Add the following imports at the top of `src/mockData.ts` (extend the existing import from `./types`):

```typescript
import { 
  Transaction, Gateway, Status, ReconStatus, Currency, Brand, PSPConfig, PSPHistoryEntry, Settlement, SettlementStatus,
  Dispute, DisputeStatus, DisputeReasonCategory, DisputePhase, DisputeTimelineEntry
} from './types';
```

Also add `addDays` to the date-fns import if not already present:

```typescript
import { subDays, startOfMinute, subHours, addDays, startOfDay, isBefore } from 'date-fns';
```

Add this at the end of the file, before any closing exports:

```typescript
const DISPUTE_REASON_CATEGORIES: DisputeReasonCategory[] = [
  'Fraud', 'Product not received', 'Not as described', 'Duplicate charge', 'Subscription cancelled', 'Other'
];

const DISPUTE_STATUSES: DisputeStatus[] = ['Open', 'In Progress', 'Won', 'Lost', 'Accepted'];

const RAW_REASON_CODES: Record<DisputeReasonCategory, string[]> = {
  'Fraud': ['VISA-10.4', 'MC-4837', 'MC-4863'],
  'Product not received': ['VISA-13.1', 'MC-4855'],
  'Not as described': ['VISA-13.3', 'MC-4853'],
  'Duplicate charge': ['VISA-12.6.1', 'MC-4834'],
  'Subscription cancelled': ['VISA-13.7', 'MC-4841'],
  'Other': ['VISA-13.6', 'MC-4860'],
};

const ADVISORY_MAP: Record<DisputeReasonCategory, { recommendation: 'Recommended' | 'Neutral' | 'Low chance'; reasoning: string }> = {
  'Fraud': { recommendation: 'Low chance', reasoning: 'Fraud disputes rarely overturned without strong auth proof' },
  'Product not received': { recommendation: 'Recommended', reasoning: 'High win rate with delivery proof' },
  'Not as described': { recommendation: 'Neutral', reasoning: 'Depends on evidence quality' },
  'Duplicate charge': { recommendation: 'Recommended', reasoning: 'Usually straightforward to prove' },
  'Subscription cancelled': { recommendation: 'Neutral', reasoning: 'Depends on policy clarity and timing' },
  'Other': { recommendation: 'Neutral', reasoning: 'Assess on case-by-case basis' },
};

export const generateDisputeMockData = (transactions: Transaction[], pspConfigs: PSPConfig[]): Dispute[] => {
  const now = new Date();
  const disputedTxns = transactions.filter(t => t.status === 'Disputed');

  return disputedTxns.map((txn, i) => {
    const reasonCategory = getRandom(DISPUTE_REASON_CATEGORIES);
    const rawCodes = RAW_REASON_CODES[reasonCategory];
    const rawReasonCode = getRandom(rawCodes);

    // Determine status with distribution: ~30% Open, ~25% In Progress, ~15% Won, ~15% Lost, ~15% Accepted
    let status: DisputeStatus;
    const statusRand = Math.random();
    if (statusRand < 0.30) status = 'Open';
    else if (statusRand < 0.55) status = 'In Progress';
    else if (statusRand < 0.70) status = 'Won';
    else if (statusRand < 0.85) status = 'Lost';
    else status = 'Accepted';

    const openedDate = subDays(txn.timestamp, -Math.floor(Math.random() * 5 + 1));

    // Find PSP rules for deadline calculation
    const pspConfig = pspConfigs.find(p => p.name === txn.gateway);
    const defaultWindowDays = pspConfig?.chargebackRules?.defaultResponseWindowDays ?? 30;
    const reasonWindowDays = pspConfig?.chargebackRules?.reasonOverrides?.[reasonCategory] ?? defaultWindowDays;
    const deadline = addDays(openedDate, reasonWindowDays);

    const pspFee = pspConfig?.chargebackFeeFixed ?? 15;

    const isResolved = status === 'Won' || status === 'Lost' || status === 'Accepted';
    const resolvedDate = isResolved ? subDays(now, Math.floor(Math.random() * 10)) : undefined;

    // Build timeline
    const timeline: DisputeTimelineEntry[] = [
      {
        id: `tl-${i}-1`,
        timestamp: txn.timestamp,
        phase: 'Transaction created',
        description: `Transaction ${txn.txnId} created`,
      },
    ];

    // Add settlement event if transaction was settled
    if (txn.actualSettlementDate) {
      timeline.push({
        id: `tl-${i}-2`,
        timestamp: txn.actualSettlementDate,
        phase: 'Settled by PSP',
        description: `Settled by ${txn.gateway}`,
      });
    }

    timeline.push({
      id: `tl-${i}-3`,
      timestamp: openedDate,
      phase: 'Chargeback issued',
      description: `Chargeback issued — ${reasonCategory}`,
    });

    if (status === 'In Progress' || isResolved) {
      const submitDate = addDays(openedDate, Math.floor(Math.random() * 5 + 1));
      timeline.push({
        id: `tl-${i}-4`,
        timestamp: submitDate,
        phase: 'Counter-chargeback submitted',
        description: 'Counter-chargeback document submitted',
      });
    }

    if (isResolved && resolvedDate) {
      const phase: DisputePhase = status === 'Won' ? 'Won' : status === 'Lost' ? 'Lost' : 'Accepted';
      timeline.push({
        id: `tl-${i}-5`,
        timestamp: resolvedDate,
        phase,
        description: `Dispute ${status.toLowerCase()}`,
      });
    }

    timeline.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    return {
      id: `disp-${i + 1}`,
      transactionId: txn.id,
      transaction: txn,
      status,
      reasonCategory,
      rawReasonCode,
      disputeAmount: txn.amount,
      pspFee,
      currency: txn.currency,
      openedDate,
      deadline,
      resolvedDate,
      outcomeAmount: isResolved ? (status === 'Won' ? txn.amount : 0) : undefined,
      worthFighting: ADVISORY_MAP[reasonCategory],
      notes: '',
      timeline,
    };
  });
};
```

- [ ] **Step 2: Add default chargeback rules to existing PSP mock data**

In the `generatePSPMockData` function in `src/mockData.ts`, add `chargebackRules` to each PSP object. Add to the Stripe config (after `notes: 'Main gateway for card payments.'`):

```typescript
      chargebackRules: {
        defaultResponseWindowDays: 21,
        reasonOverrides: { 'Fraud': 10, 'Duplicate charge': 30 },
        templates: [],
      },
```

Add to PayPal (after `connectionStatus: 'Online'`):

```typescript
      chargebackRules: {
        defaultResponseWindowDays: 20,
        reasonOverrides: { 'Fraud': 10 },
        templates: [],
      },
```

Add to Skrill (after `connectionStatus: 'Online'`):

```typescript
      chargebackRules: {
        defaultResponseWindowDays: 14,
        templates: [],
      },
```

Add to Trustly (after `connectionStatus: 'Offline'`):

```typescript
      chargebackRules: {
        defaultResponseWindowDays: 30,
        templates: [],
      },
```

- [ ] **Step 3: Verify build**

Run: `cd /home/arknion/CursorProjects/ganda-crm-frontend && npm run build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
cd /home/arknion/CursorProjects/ganda-crm-frontend
git add src/mockData.ts
git commit -m "feat(disputes): add dispute mock data generator and PSP chargeback rules"
```

---

## Task 6: Badge Variants for Disputes

**Files:**
- Modify: `src/components/shared/Badge.tsx`

- [ ] **Step 1: Add dispute badge variants**

In `src/components/shared/Badge.tsx`, add these entries to the `variants` object inside the `Badge` component:

```typescript
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
```

- [ ] **Step 2: Verify build**

Run: `cd /home/arknion/CursorProjects/ganda-crm-frontend && npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
cd /home/arknion/CursorProjects/ganda-crm-frontend
git add src/components/shared/Badge.tsx
git commit -m "feat(disputes): add dispute and advisory badge variants"
```

---

## Task 7: Sidebar Wiring

**Files:**
- Modify: `src/components/shared/Sidebar.tsx`

- [ ] **Step 1: Wire up the Disputes sidebar entry**

In `src/components/shared/Sidebar.tsx`, the existing Disputes entry under "Operations" is a placeholder (`<SidebarItem icon={ShieldAlert} label="Disputes" />`). Move it to the "Main Menu" section between Reconciliation and Reports, and wire it up:

Replace the Main Menu nav items section. The updated nav should have this order:

```tsx
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
```

Remove the duplicate `<SidebarItem icon={ShieldAlert} label="Disputes" />` from the "Operations" section.

- [ ] **Step 2: Verify build**

Run: `cd /home/arknion/CursorProjects/ganda-crm-frontend && npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
cd /home/arknion/CursorProjects/ganda-crm-frontend
git add src/components/shared/Sidebar.tsx
git commit -m "feat(disputes): wire up Disputes in sidebar navigation"
```

---

## Task 8: Dispute Timeline Component

**Files:**
- Create: `src/components/disputes/DisputeTimeline.tsx`

- [ ] **Step 1: Create the timeline component**

Create `src/components/disputes/DisputeTimeline.tsx`:

```tsx
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
```

- [ ] **Step 2: Verify build**

Run: `cd /home/arknion/CursorProjects/ganda-crm-frontend && npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
cd /home/arknion/CursorProjects/ganda-crm-frontend
git add src/components/disputes/DisputeTimeline.tsx
git commit -m "feat(disputes): add horizontal color-coded timeline component"
```

---

## Task 9: Dispute Detail Panel

**Files:**
- Create: `src/components/disputes/DisputeDetailPanel.tsx`

- [ ] **Step 1: Create the detail panel component**

Create `src/components/disputes/DisputeDetailPanel.tsx`:

```tsx
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
```

- [ ] **Step 2: Verify build**

Run: `cd /home/arknion/CursorProjects/ganda-crm-frontend && npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
cd /home/arknion/CursorProjects/ganda-crm-frontend
git add src/components/disputes/DisputeDetailPanel.tsx
git commit -m "feat(disputes): add expandable detail panel with timeline and actions"
```

---

## Task 10: Counter-Chargeback Template Wizard

**Files:**
- Create: `src/components/disputes/DisputeTemplateWizard.tsx`

- [ ] **Step 1: Create the wizard component**

Create `src/components/disputes/DisputeTemplateWizard.tsx`:

```tsx
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
```

- [ ] **Step 2: Verify build**

Run: `cd /home/arknion/CursorProjects/ganda-crm-frontend && npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
cd /home/arknion/CursorProjects/ganda-crm-frontend
git add src/components/disputes/DisputeTemplateWizard.tsx
git commit -m "feat(disputes): add 3-step counter-chargeback template wizard"
```

---

## Task 11: Disputes Page

**Files:**
- Create: `src/components/pages/DisputesPage.tsx`

- [ ] **Step 1: Create the main disputes page**

Create `src/components/pages/DisputesPage.tsx`:

```tsx
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Filter,
  ShieldAlert,
  DollarSign,
  AlertTriangle,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { Dispute, DisputeStatus, DisputeReasonCategory, PSPConfig } from '../../types';
import { SummaryCard } from '../shared/SummaryCard';
import { MultiSelect } from '../shared/MultiSelect';
import { Badge } from '../shared/Badge';
import { DisputeDetailPanel } from '../disputes/DisputeDetailPanel';
import { getDeadlineUrgency, getDeadlineLabel } from '../../lib/disputes/deadlines';
import { cn } from '../../lib/utils';

type DisputeTab = 'All' | 'Open' | 'In Progress' | 'Closed';

interface DisputesPageProps {
  disputes: Dispute[];
  allTransactionsCount: number;
  pspConfigs: PSPConfig[];
  onStatusChange: (disputeId: string, newStatus: DisputeStatus) => void;
  onNotesChange: (disputeId: string, notes: string) => void;
  onBuildTemplate: (dispute: Dispute) => void;
  onExportCase: (dispute: Dispute) => void;
}

export const DisputesPage = ({
  disputes,
  allTransactionsCount,
  pspConfigs,
  onStatusChange,
  onNotesChange,
  onBuildTemplate,
  onExportCase,
}: DisputesPageProps) => {
  const [activeTab, setActiveTab] = useState<DisputeTab>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [gatewayFilter, setGatewayFilter] = useState<string[]>(['All']);
  const [reasonFilter, setReasonFilter] = useState<string[]>(['All']);
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showColumnManager, setShowColumnManager] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem('settlex.disputes.visibleColumns');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return ['Dispute ID', 'Transaction ID', 'Client', 'Gateway', 'Amount', 'Reason', 'Status', 'Deadline', 'Worth Fighting', 'PSP Fee'];
  });

  const allPossibleColumns = [
    { id: 'Dispute ID', label: 'Dispute ID' },
    { id: 'Transaction ID', label: 'Transaction ID' },
    { id: 'Client', label: 'Client' },
    { id: 'Gateway', label: 'Gateway' },
    { id: 'Amount', label: 'Amount' },
    { id: 'Reason', label: 'Reason' },
    { id: 'Status', label: 'Status' },
    { id: 'Deadline', label: 'Deadline' },
    { id: 'Worth Fighting', label: 'Worth Fighting' },
    { id: 'PSP Fee', label: 'PSP Fee' },
    { id: 'Raw Code', label: 'Raw Reason Code' },
    { id: 'Txn Date', label: 'Original Txn Date' },
    { id: 'Currency', label: 'Currency' },
    { id: 'Brand', label: 'Brand' },
    { id: 'Resolved Date', label: 'Resolution Date' },
    { id: 'Outcome Amount', label: 'Outcome Amount' },
  ];

  const toggleColumn = (id: string) => {
    setVisibleColumns(prev => {
      let next;
      if (prev.includes(id)) {
        if (prev.length === 1) return prev;
        next = prev.filter(c => c !== id);
      } else {
        next = [...prev, id];
      }
      localStorage.setItem('settlex.disputes.visibleColumns', JSON.stringify(next));
      return next;
    });
  };

  const gateways = ['All', ...Array.from(new Set(disputes.map(d => d.transaction.gateway)))];
  const reasons: string[] = ['All', 'Fraud', 'Product not received', 'Not as described', 'Duplicate charge', 'Subscription cancelled', 'Other'];

  const filteredDisputes = useMemo(() => {
    let result = disputes;

    // Tab filter
    if (activeTab === 'Open') result = result.filter(d => d.status === 'Open');
    else if (activeTab === 'In Progress') result = result.filter(d => d.status === 'In Progress');
    else if (activeTab === 'Closed') result = result.filter(d => ['Won', 'Lost', 'Accepted'].includes(d.status));

    // Urgent filter
    if (urgentOnly) result = result.filter(d => getDeadlineUrgency(d.deadline) === 'urgent');

    // Gateway filter
    if (!gatewayFilter.includes('All')) {
      result = result.filter(d => gatewayFilter.includes(d.transaction.gateway));
    }

    // Reason filter
    if (!reasonFilter.includes('All')) {
      result = result.filter(d => reasonFilter.includes(d.reasonCategory));
    }

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(d =>
        d.id.toLowerCase().includes(q) ||
        d.transaction.txnId.toLowerCase().includes(q) ||
        d.transaction.client.toLowerCase().includes(q)
      );
    }

    return result;
  }, [disputes, activeTab, urgentOnly, gatewayFilter, reasonFilter, searchQuery]);

  const stats = useMemo(() => {
    const open = disputes.filter(d => d.status === 'Open' || d.status === 'In Progress').length;
    const exposure = disputes
      .filter(d => d.status === 'Open' || d.status === 'In Progress')
      .reduce((sum, d) => sum + d.disputeAmount, 0);
    const urgent = disputes.filter(d =>
      (d.status === 'Open' || d.status === 'In Progress') &&
      getDeadlineUrgency(d.deadline) === 'urgent'
    ).length;
    const chargebackRate = allTransactionsCount > 0
      ? (disputes.length / allTransactionsCount * 100)
      : 0;

    return { open, exposure, urgent, chargebackRate };
  }, [disputes, allTransactionsCount]);

  const tabs: { key: DisputeTab; label: string; count: number }[] = [
    { key: 'All', label: 'All', count: disputes.length },
    { key: 'Open', label: 'Open', count: disputes.filter(d => d.status === 'Open').length },
    { key: 'In Progress', label: 'In Progress', count: disputes.filter(d => d.status === 'In Progress').length },
    { key: 'Closed', label: 'Closed', count: disputes.filter(d => ['Won', 'Lost', 'Accepted'].includes(d.status)).length },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-[24px] font-bold text-text-primary tracking-tight">Disputes</h1>
        <p className="text-[13px] text-text-tertiary">Track chargebacks, manage deadlines, and build counter-chargeback documents.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard
          label="Open Disputes"
          title="Open"
          value={stats.open.toString()}
          icon={ShieldAlert}
        />
        <SummaryCard
          label="Total Exposure"
          title="Exposure"
          value={`€${stats.exposure.toLocaleString()}`}
          icon={DollarSign}
          accentColor="red-600"
        />
        <div
          onClick={() => { setUrgentOnly(!urgentOnly); setActiveTab('All'); }}
          className="cursor-pointer"
        >
          <SummaryCard
            label="Urgent (< 48h)"
            title="Urgent"
            value={stats.urgent.toString()}
            icon={AlertTriangle}
            accentColor="red-600"
            subline={urgentOnly ? 'Filtered' : 'Click to filter'}
          />
        </div>
        <SummaryCard
          label="Chargeback Rate"
          title="CB Rate"
          value={`${stats.chargebackRate.toFixed(2)}%`}
          icon={TrendingDown}
          accentColor="amber-600"
        />
      </div>

      {/* Tabs + Filters + Table */}
      <div className="bg-white border border-border-subtle rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {/* Filter Bar */}
        <div className="px-6 py-4 border-b border-border-subtle bg-bg-page/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Tabs */}
            <div className="flex items-center gap-1 bg-white border border-border-subtle rounded-lg p-1">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => { setActiveTab(tab.key); setUrgentOnly(false); }}
                  className={cn(
                    "px-3 py-1 text-[11px] font-bold rounded-md transition-all flex items-center gap-1.5",
                    activeTab === tab.key ? "bg-accent-interactive text-white shadow-sm" : "text-text-tertiary hover:text-text-primary"
                  )}
                >
                  {tab.label}
                  <span className={cn(
                    "text-[9px] px-1.5 py-0.5 rounded-full font-bold",
                    activeTab === tab.key ? "bg-white/20 text-white" : "bg-bg-page text-text-tertiary"
                  )}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-56">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
              <input
                type="text"
                placeholder="Search ID, Client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-border-subtle rounded-lg text-[12px] focus:outline-none focus:ring-1 focus:ring-accent-interactive transition-all"
              />
            </div>

            <MultiSelect
              label="Gateways"
              options={gateways}
              selected={gatewayFilter}
              onChange={setGatewayFilter}
            />
            <MultiSelect
              label="Reason"
              options={reasons}
              selected={reasonFilter}
              onChange={setReasonFilter}
            />
          </div>

          <div className="flex items-center gap-3">
            {/* Column toggle */}
            <div className="relative">
              <button
                onClick={() => setShowColumnManager(!showColumnManager)}
                className="flex items-center gap-2 px-4 py-2 border border-border-subtle rounded-lg text-[13px] font-medium text-text-secondary hover:bg-white transition-all"
              >
                <Filter size={16} /> Columns
              </button>

              <AnimatePresence>
                {showColumnManager && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 top-full mt-2 w-64 bg-white border border-border-subtle rounded-xl shadow-xl z-50 p-4"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-[14px] font-bold text-text-primary">Visible Columns</h3>
                      <button onClick={() => setShowColumnManager(false)} className="text-text-tertiary hover:text-text-primary">
                        <X size={16} />
                      </button>
                    </div>
                    <div className="flex flex-col gap-2 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                      {allPossibleColumns.map(col => (
                        <label key={col.id} className="flex items-center gap-3 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={visibleColumns.includes(col.id)}
                            onChange={() => toggleColumn(col.id)}
                            className="w-4 h-4 rounded border-border-subtle text-accent-interactive focus:ring-accent-interactive"
                          />
                          <span className="text-[13px] text-text-secondary group-hover:text-text-primary transition-colors">{col.label}</span>
                        </label>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {(urgentOnly || !gatewayFilter.includes('All') || !reasonFilter.includes('All') || searchQuery) && (
              <button
                onClick={() => { setSearchQuery(''); setGatewayFilter(['All']); setReasonFilter(['All']); setUrgentOnly(false); }}
                className="text-[12px] font-semibold text-text-tertiary hover:text-accent-interactive transition-colors"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bg-page/30 border-b border-border-subtle">
                {/* Expand arrow column */}
                <th className="px-3 py-3 w-8"></th>
                {visibleColumns.includes('Dispute ID') && <Th>Dispute ID</Th>}
                {visibleColumns.includes('Transaction ID') && <Th>Transaction ID</Th>}
                {visibleColumns.includes('Client') && <Th>Client</Th>}
                {visibleColumns.includes('Gateway') && <Th>Gateway</Th>}
                {visibleColumns.includes('Amount') && <Th>Amount</Th>}
                {visibleColumns.includes('Reason') && <Th>Reason</Th>}
                {visibleColumns.includes('Status') && <Th>Status</Th>}
                {visibleColumns.includes('Deadline') && <Th>Deadline</Th>}
                {visibleColumns.includes('Worth Fighting') && <Th>Worth Fighting</Th>}
                {visibleColumns.includes('PSP Fee') && <Th>PSP Fee</Th>}
                {visibleColumns.includes('Raw Code') && <Th>Raw Code</Th>}
                {visibleColumns.includes('Txn Date') && <Th>Txn Date</Th>}
                {visibleColumns.includes('Currency') && <Th>Currency</Th>}
                {visibleColumns.includes('Brand') && <Th>Brand</Th>}
                {visibleColumns.includes('Resolved Date') && <Th>Resolved Date</Th>}
                {visibleColumns.includes('Outcome Amount') && <Th>Outcome</Th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filteredDisputes.map((dispute) => {
                const isExpanded = expandedId === dispute.id;
                const urgency = getDeadlineUrgency(dispute.deadline);
                const deadlineLabel = getDeadlineLabel(dispute.deadline);
                const isResolved = ['Won', 'Lost', 'Accepted'].includes(dispute.status);

                const urgencyBg: Record<string, string> = {
                  safe: '',
                  warning: '',
                  urgent: 'bg-red-50/30',
                  expired: 'bg-red-50/50',
                };

                return (
                  <React.Fragment key={dispute.id}>
                    <tr
                      onClick={() => setExpandedId(isExpanded ? null : dispute.id)}
                      className={cn(
                        "hover:bg-accent-hover/10 transition-colors cursor-pointer",
                        urgencyBg[urgency],
                        isExpanded && "bg-accent-hover/5"
                      )}
                    >
                      <td className="px-3 py-4">
                        {isExpanded ? <ChevronUp size={14} className="text-text-tertiary" /> : <ChevronDown size={14} className="text-text-tertiary" />}
                      </td>
                      {visibleColumns.includes('Dispute ID') && (
                        <td className="px-4 py-4">
                          <span className="font-mono text-[12px] font-medium text-text-primary">{dispute.id}</span>
                        </td>
                      )}
                      {visibleColumns.includes('Transaction ID') && (
                        <td className="px-4 py-4">
                          <span className="font-mono text-[12px] font-medium text-text-secondary">{dispute.transaction.txnId}</span>
                        </td>
                      )}
                      {visibleColumns.includes('Client') && (
                        <td className="px-4 py-4">
                          <span className="text-[12px] font-bold text-text-primary">{dispute.transaction.client}</span>
                        </td>
                      )}
                      {visibleColumns.includes('Gateway') && (
                        <td className="px-4 py-4">
                          <span className="text-[12px] font-medium text-text-secondary">{dispute.transaction.gateway}</span>
                        </td>
                      )}
                      {visibleColumns.includes('Amount') && (
                        <td className="px-4 py-4">
                          <span className="text-[13px] font-bold text-text-primary">{dispute.disputeAmount.toLocaleString()} {dispute.currency}</span>
                        </td>
                      )}
                      {visibleColumns.includes('Reason') && (
                        <td className="px-4 py-4">
                          <span className="text-[12px] text-text-secondary">{dispute.reasonCategory}</span>
                        </td>
                      )}
                      {visibleColumns.includes('Status') && (
                        <td className="px-4 py-4">
                          <Badge variant={dispute.status}>{dispute.status}</Badge>
                        </td>
                      )}
                      {visibleColumns.includes('Deadline') && (
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[12px] font-medium text-text-primary">{format(dispute.deadline, 'dd MMM')}</span>
                            {!isResolved && (
                              <span className={cn(
                                "px-1.5 py-0.5 rounded-full text-[9px] font-bold",
                                urgency === 'safe' ? "text-green-600 bg-green-50" :
                                urgency === 'warning' ? "text-amber-600 bg-amber-50" :
                                urgency === 'urgent' ? "text-red-600 bg-red-50" :
                                "text-red-800 bg-red-100"
                              )}>
                                {deadlineLabel}
                              </span>
                            )}
                          </div>
                        </td>
                      )}
                      {visibleColumns.includes('Worth Fighting') && (
                        <td className="px-4 py-4">
                          <Badge variant={dispute.worthFighting.recommendation}>
                            {dispute.worthFighting.recommendation}
                          </Badge>
                        </td>
                      )}
                      {visibleColumns.includes('PSP Fee') && (
                        <td className="px-4 py-4">
                          <span className="text-[12px] font-medium text-text-secondary">{dispute.pspFee.toFixed(2)}</span>
                        </td>
                      )}
                      {visibleColumns.includes('Raw Code') && (
                        <td className="px-4 py-4">
                          <span className="text-[11px] font-mono text-text-tertiary">{dispute.rawReasonCode || '—'}</span>
                        </td>
                      )}
                      {visibleColumns.includes('Txn Date') && (
                        <td className="px-4 py-4">
                          <span className="text-[12px] text-text-secondary">{format(dispute.transaction.timestamp, 'dd MMM yyyy')}</span>
                        </td>
                      )}
                      {visibleColumns.includes('Currency') && (
                        <td className="px-4 py-4">
                          <span className="text-[12px] text-text-secondary">{dispute.currency}</span>
                        </td>
                      )}
                      {visibleColumns.includes('Brand') && (
                        <td className="px-4 py-4">
                          <span className="text-[12px] text-text-secondary">{dispute.transaction.brand}</span>
                        </td>
                      )}
                      {visibleColumns.includes('Resolved Date') && (
                        <td className="px-4 py-4">
                          <span className="text-[12px] text-text-secondary">
                            {dispute.resolvedDate ? format(dispute.resolvedDate, 'dd MMM yyyy') : '—'}
                          </span>
                        </td>
                      )}
                      {visibleColumns.includes('Outcome Amount') && (
                        <td className="px-4 py-4">
                          <span className="text-[12px] text-text-secondary">
                            {dispute.outcomeAmount !== undefined ? `${dispute.outcomeAmount.toLocaleString()} ${dispute.currency}` : '—'}
                          </span>
                        </td>
                      )}
                    </tr>

                    {/* Expandable detail panel */}
                    <AnimatePresence>
                      {isExpanded && (
                        <tr>
                          <td colSpan={visibleColumns.length + 1}>
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <DisputeDetailPanel
                                dispute={dispute}
                                onStatusChange={onStatusChange}
                                onNotesChange={onNotesChange}
                                onBuildTemplate={onBuildTemplate}
                                onExportCase={onExportCase}
                              />
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                );
              })}

              {filteredDisputes.length === 0 && (
                <tr>
                  <td colSpan={visibleColumns.length + 1} className="px-6 py-16 text-center">
                    <ShieldAlert size={32} className="mx-auto text-text-tertiary mb-3" />
                    <p className="text-[13px] text-text-tertiary">No disputes match the current filters.</p>
                    <button
                      onClick={() => { setActiveTab('All'); setSearchQuery(''); setGatewayFilter(['All']); setReasonFilter(['All']); setUrgentOnly(false); }}
                      className="text-[12px] text-accent-interactive hover:underline font-medium mt-1"
                    >
                      Clear all filters
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer count */}
        <div className="px-6 py-3 border-t border-border-subtle bg-bg-page/30">
          <span className="text-[12px] text-text-tertiary">
            Showing <span className="font-bold text-text-secondary">{filteredDisputes.length}</span> of <span className="font-bold text-text-secondary">{disputes.length}</span> disputes
          </span>
        </div>
      </div>
    </div>
  );
};

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-[10px] font-bold text-text-tertiary uppercase tracking-wider">
      {children}
    </th>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `cd /home/arknion/CursorProjects/ganda-crm-frontend && npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
cd /home/arknion/CursorProjects/ganda-crm-frontend
git add src/components/pages/DisputesPage.tsx
git commit -m "feat(disputes): add main Disputes page with summary cards, tabs, filters, and expandable rows"
```

---

## Task 12: Wire Up in App.tsx

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add imports**

Add these imports at the top of `src/App.tsx`:

```typescript
import { Dispute, DisputeStatus } from './types';
import { generateDisputeMockData } from './mockData';
import { DisputesPage } from './components/pages/DisputesPage';
import { DisputeTemplateWizard } from './components/disputes/DisputeTemplateWizard';
```

- [ ] **Step 2: Update the activePage type**

Change the `activePage` state type to include 'Disputes':

```typescript
const [activePage, setActivePage] = useState<'Transactions' | 'Reconciliation' | 'Disputes' | 'Reports' | 'PSP Config' | 'Settlement Calendar'>('Transactions');
```

- [ ] **Step 3: Add disputes state and modal state**

After the existing modal states section (after `const [historyPsp, setHistoryPsp] = useState<PSPConfig | null>(null);`), add:

```typescript
  // --- Dispute States ---
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [wizardDispute, setWizardDispute] = useState<Dispute | null>(null);
```

- [ ] **Step 4: Initialize dispute data**

In the existing `useEffect` that initializes data, add dispute generation after settlements and PSP configs are set. Replace the useEffect:

```typescript
  useEffect(() => {
    const txns = generateMockData(200);
    const psps = generatePSPMockData();
    setAllTransactions(txns);
    setSettlements(generateSettlementMockData());
    setPspConfigs(psps);
    setDisputes(generateDisputeMockData(txns, psps));
  }, []);
```

- [ ] **Step 5: Add dispute handlers**

After the existing handlers section (e.g., after `handleExport`), add:

```typescript
  // --- Dispute Handlers ---
  const handleDisputeStatusChange = (disputeId: string, newStatus: DisputeStatus) => {
    setDisputes(prev => prev.map(d => {
      if (d.id !== disputeId) return d;
      const now = new Date();
      const isResolving = ['Won', 'Lost', 'Accepted'].includes(newStatus) && !['Won', 'Lost', 'Accepted'].includes(d.status);
      return {
        ...d,
        status: newStatus,
        resolvedDate: isResolving ? now : d.resolvedDate,
        timeline: [
          ...d.timeline,
          {
            id: `tl-update-${Date.now()}`,
            timestamp: now,
            phase: newStatus === 'Won' ? 'Won' as const :
                   newStatus === 'Lost' ? 'Lost' as const :
                   newStatus === 'Accepted' ? 'Accepted' as const :
                   newStatus === 'In Progress' ? 'Counter-chargeback submitted' as const :
                   'Chargeback issued' as const,
            description: `Status changed to ${newStatus}`,
          }
        ],
      };
    }));
    addToast(`Dispute status updated to ${newStatus}`, 'success');
  };

  const handleDisputeNotesChange = (disputeId: string, notes: string) => {
    setDisputes(prev => prev.map(d => d.id === disputeId ? { ...d, notes } : d));
  };

  const handleMarkSubmitted = (disputeId: string) => {
    setDisputes(prev => prev.map(d => {
      if (d.id !== disputeId) return d;
      return {
        ...d,
        status: d.status === 'Open' ? 'In Progress' as const : d.status,
        timeline: [
          ...d.timeline,
          {
            id: `tl-submit-${Date.now()}`,
            timestamp: new Date(),
            phase: 'Counter-chargeback submitted' as const,
            description: 'Counter-chargeback document submitted',
          }
        ],
      };
    }));
    addToast('Counter-chargeback marked as submitted', 'success');
  };

  const handleExportCase = (dispute: Dispute) => {
    addToast(`Exporting case ${dispute.id}...`, 'success');
    window.print();
  };
```

- [ ] **Step 6: Add the Disputes page render block**

In the `AnimatePresence` section where pages are rendered, add this block between Reconciliation and Reports:

```tsx
            {activePage === 'Disputes' && (
              <motion.div
                key="disputes"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <DisputesPage
                  disputes={disputes}
                  allTransactionsCount={allTransactions.length}
                  pspConfigs={pspConfigs}
                  onStatusChange={handleDisputeStatusChange}
                  onNotesChange={handleDisputeNotesChange}
                  onBuildTemplate={(dispute) => setWizardDispute(dispute)}
                  onExportCase={handleExportCase}
                />
              </motion.div>
            )}
```

- [ ] **Step 7: Add the template wizard modal**

In the modals `AnimatePresence` section (at the end, alongside the other modals), add:

```tsx
        {wizardDispute && (
          <DisputeTemplateWizard
            isOpen={!!wizardDispute}
            dispute={wizardDispute}
            pspChargebackRules={pspConfigs.find(p => p.name === wizardDispute.transaction.gateway)?.chargebackRules}
            onClose={() => setWizardDispute(null)}
            onMarkSubmitted={handleMarkSubmitted}
          />
        )}
```

- [ ] **Step 8: Verify the full app compiles and runs**

Run: `cd /home/arknion/CursorProjects/ganda-crm-frontend && npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 9: Commit**

```bash
cd /home/arknion/CursorProjects/ganda-crm-frontend
git add src/App.tsx
git commit -m "feat(disputes): wire up Disputes page and template wizard in App.tsx"
```

---

## Task 13: PSP Config — Chargeback Rules Tab

**Files:**
- Modify: `src/components/modals/PSPConfigModal.tsx`

- [ ] **Step 1: Update the Tab type and add imports**

In `src/components/modals/PSPConfigModal.tsx`, update the `Tab` type:

```typescript
type Tab = 'General' | 'Fees' | 'Settlement' | 'API' | 'Chargeback Rules';
```

Add these to the imports from `../../types`:

```typescript
import { PSPConfig, PSPCategory, SettlementFrequency, Currency, PSPChargebackRules, DisputeReasonCategory } from '../../types';
```

Also add `Plus` and `Trash2` to the lucide-react imports:

```typescript
import { X, Save, AlertCircle, Info, Eye, EyeOff, Globe, CreditCard, Wallet, Building2, Smartphone, Bitcoin, Ticket, Plus, Trash2 } from 'lucide-react';
```

- [ ] **Step 2: Add default chargebackRules to the draft initial state**

In both the `if (psp)` branch and the `else` branch of the `useEffect`, make sure the draft includes `chargebackRules`. In the `else` branch (new PSP), add after `connectionStatus: 'Never Tested'`:

```typescript
        chargebackRules: {
          defaultResponseWindowDays: 30,
          templates: [],
        },
```

- [ ] **Step 3: Update the tabs render**

Update the tabs list to include 'Chargeback Rules':

```tsx
          {(['General', 'Fees', 'Settlement', 'API', 'Chargeback Rules'] as Tab[]).map((tab) => (
```

- [ ] **Step 4: Add the Chargeback Rules tab body**

After the `{activeTab === 'API' && (...)}` block, add:

```tsx
          {activeTab === 'Chargeback Rules' && (
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">Default Response Window (days)</label>
                  <input
                    type="number"
                    value={draft.chargebackRules?.defaultResponseWindowDays ?? 30}
                    onChange={(e) => setDraft({
                      ...draft,
                      chargebackRules: {
                        ...draft.chargebackRules!,
                        defaultResponseWindowDays: parseInt(e.target.value) || 30,
                      }
                    })}
                    className="w-full px-4 py-2 bg-bg-page border border-border-subtle rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-accent-interactive/20 focus:border-accent-interactive transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <label className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">Per-Reason Overrides (days)</label>
                {(['Fraud', 'Product not received', 'Not as described', 'Duplicate charge', 'Subscription cancelled', 'Other'] as DisputeReasonCategory[]).map(reason => (
                  <div key={reason} className="flex items-center gap-3">
                    <span className="text-[12px] text-text-secondary w-48 flex-shrink-0">{reason}</span>
                    <input
                      type="number"
                      placeholder={`${draft.chargebackRules?.defaultResponseWindowDays ?? 30} (default)`}
                      value={draft.chargebackRules?.reasonOverrides?.[reason] ?? ''}
                      onChange={(e) => {
                        const val = e.target.value ? parseInt(e.target.value) : undefined;
                        setDraft(prev => ({
                          ...prev,
                          chargebackRules: {
                            ...prev.chargebackRules!,
                            reasonOverrides: {
                              ...prev.chargebackRules?.reasonOverrides,
                              [reason]: val,
                            },
                          }
                        }));
                      }}
                      className="w-24 px-3 py-1.5 bg-bg-page border border-border-subtle rounded-lg text-[12px] focus:outline-none focus:ring-1 focus:ring-accent-interactive transition-all"
                    />
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-border-subtle">
                <div className="flex items-center gap-2 mb-3">
                  <Info size={14} className="text-text-tertiary" />
                  <span className="text-[11px] text-text-tertiary">
                    PSP-specific templates can be configured here. If no template is set for a reason category, the system default will be used.
                  </span>
                </div>
                <p className="text-[11px] text-text-tertiary italic">
                  Template editing for individual reason categories will be available in a future update. Current counter-chargeback documents use system defaults.
                </p>
              </div>
            </div>
          )}
```

- [ ] **Step 5: Verify build**

Run: `cd /home/arknion/CursorProjects/ganda-crm-frontend && npm run build`
Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
cd /home/arknion/CursorProjects/ganda-crm-frontend
git add src/components/modals/PSPConfigModal.tsx
git commit -m "feat(disputes): add Chargeback Rules tab to PSP Config modal"
```

---

## Task 14: Visual QA & Polish

**Files:**
- Various (minor tweaks based on visual inspection)

- [ ] **Step 1: Start the dev server and verify all pages**

Run: `cd /home/arknion/CursorProjects/ganda-crm-frontend && npm run dev`

Open `http://localhost:3000` and verify:

1. Sidebar shows "Disputes" between Reconciliation and Reports
2. Clicking "Disputes" shows the page with 4 summary cards
3. Status tabs filter correctly (All, Open, In Progress, Closed)
4. Search, gateway, and reason filters work
5. Column toggle shows/hides columns
6. Clicking a row expands the detail panel with timeline
7. Timeline hover tooltips show phase names
8. "Build Counter-Chargeback" opens the wizard
9. Wizard steps 1 → 2 → 3 navigate correctly
10. Download, Copy, and Mark as Submitted buttons work
11. PSP Config → Chargeback Rules tab shows and saves
12. "Urgent" summary card click filters the table

- [ ] **Step 2: Fix any visual issues found during QA**

Address any layout, spacing, or styling inconsistencies found in step 1.

- [ ] **Step 3: Commit any polish fixes**

```bash
cd /home/arknion/CursorProjects/ganda-crm-frontend
git add -A
git commit -m "fix(disputes): visual polish and QA fixes"
```

---

## Summary

| Task | Description | New Files | Modified Files |
|---|---|---|---|
| 1 | Types & Data Model | — | types.ts |
| 2 | Advisory Logic | advisory.ts | — |
| 3 | Deadline Calculation | deadlines.ts | — |
| 4 | Default Templates | templates.ts | — |
| 5 | Mock Data | — | mockData.ts |
| 6 | Badge Variants | — | Badge.tsx |
| 7 | Sidebar Wiring | — | Sidebar.tsx |
| 8 | Timeline Component | DisputeTimeline.tsx | — |
| 9 | Detail Panel | DisputeDetailPanel.tsx | — |
| 10 | Template Wizard | DisputeTemplateWizard.tsx | — |
| 11 | Disputes Page | DisputesPage.tsx | — |
| 12 | App.tsx Wiring | — | App.tsx |
| 13 | PSP Chargeback Rules Tab | — | PSPConfigModal.tsx |
| 14 | Visual QA & Polish | — | Various |
