# Disputes Module — Design Spec

## Overview

A new Disputes page for the Ganda CRM that surfaces transactions with chargebacks/refunds, tracks their lifecycle with deadlines, and provides a counter-chargeback template builder to help users fight disputes before the response window closes.

**Primary users:** Payment/finance operations team and customer support agents, both with full access (role-based permissions deferred to a future iteration).

**Data source:** Transactions with status "Disputed" automatically appear in the Disputes module. No separate data entry — transactions are the single source of truth.

---

## 1. Page Layout & Navigation

- New sidebar entry between Reconciliation and Reports (Lucide gavel or shield icon).
- Page structure top to bottom:
  1. Summary strip (4 KPI cards)
  2. Status tabs + filter bar
  3. Disputes table (single scrollable list, no pagination)
  4. Expandable detail panel (inline accordion on row click)

Follows the same layout rhythm as Transactions and Reconciliation pages.

---

## 2. Summary Strip — 4 KPI Cards

Uses the existing `SummaryCard` component.

| Card | Data | Notes |
|---|---|---|
| Open Disputes | Count of disputes in Open + In Progress status | — |
| Total Exposure | Sum of disputed amounts for open cases | Formatted as currency |
| Urgent (< 48h) | Count of disputes with deadline expiring within 48 hours | Red/warning styling. Clickable — filters the table to urgent cases only |
| Chargeback Rate | Chargebacks as % of total transactions | Over a selectable period |

---

## 3. Status Tabs & Filters

### Tabs

Three tabs (horizontal, same style as Transactions/Reconciliation):

- **All** — every dispute
- **Open** — newly created, not yet actioned
- **In Progress** — team is working on it (gathering evidence, building template)
- **Closed** — groups three sub-statuses: Won, Lost, Accepted. Sub-status shown as a badge within each row.

### Filter Bar

- **Date range** — dispute opened date (from/to)
- **PSP/Gateway** — multi-select dropdown
- **Reason category** — multi-select: Fraud, Product not received, Not as described, Duplicate charge, Subscription cancelled, Other
- **Search** — free text on client name, transaction ID, dispute ID
- **Column toggle** — button to show/hide optional columns (same pattern as Transactions page)

### Table Columns

**Default visible:** Dispute ID, Transaction ID, Client, Gateway, Amount, Reason Category, Status, Deadline, Worth Fighting (advisory badge), PSP Fee

**Toggleable (hidden by default):** Raw reason code, Original transaction date, Currency, Brand, Resolution date, Outcome amount

---

## 4. Expandable Detail Panel

Clicking a table row expands an inline accordion panel below it (pushes rows down).

### 4.1 Horizontal Timeline Bar

Spans the full width of the expanded row. A segmented progress bar where each segment represents a lifecycle phase:

| Segment Color | Phase |
|---|---|
| Grey | Transaction created, not yet settled |
| Green | Transaction settled/paid by PSP |
| Yellow | Chargeback issued |
| Orange | 2-7 days before deadline |
| Red | < 48h before deadline |
| Blue | Counter-chargeback submitted |
| Light Grey | Chargeback accepted |
| Dark Green | Won |
| Dark Red | Lost |

- Dots/nodes mark each event on the timeline
- Dates displayed below each node
- Bar fills progressively — future/unresolved segments are unfilled or dashed
- Current stage is visually emphasized (larger node or glow)
- **Hover tooltip** on each segment shows the stage name — no legend needed

### 4.2 Two-Column Detail Layout (Below Timeline)

| Left Column | Right Column |
|---|---|
| Transaction ID | Reason category + raw reason code |
| Client name | Deadline with countdown |
| Amount & currency | Color-coded countdown: green > 7 days, yellow 2-7 days, red < 48h |
| Brand | Worth Fighting advisory badge with brief reasoning |
| Gateway | Notes (editable free text field) |
| Dispute amount vs original transaction amount | |
| PSP fee | |
| Status (dropdown to change) | |

### 4.3 Action Buttons (Bottom of Panel)

- **Build Counter-Chargeback** — opens the template builder wizard
- **Change Status** — quick status transition (useful since counter-chargeback submission to PSP can't be auto-tracked)
- **Export Case** — downloads case summary as PDF (via browser print, same pattern as Reports page)

---

## 5. Counter-Chargeback Template Builder

Full-page modal with a 3-step wizard flow. Download, Copy to clipboard, and Mark as submitted buttons are present at the bottom of every step.

### Step 1: Choose Template

- **Auto-populated fields** from the dispute data: transaction ID, client, gateway, amount, dispute date. User verifies and can correct if needed.
- **Reason category dropdown** — user confirms or changes the category.
- **Template auto-selected** based on PSP + reason category combination. User can override.
- If no PSP-specific template exists, falls back to the default template for that reason category.

### Step 2: Template

- Displays the selected template with pre-filled data.
- User can edit any text block, input additional data in evidence fields.
- **Evidence checklist** — shows required and optional evidence items based on the template (e.g., "Proof of delivery", "Customer communication log"). Each item has a checkbox and free text field.
- **User can add custom rows/sections** to the document beyond what the template provides.

### Step 3: Preview

- Final preview of the assembled counter-chargeback document.
- Read-only view showing exactly what will be exported.

### Persistent Action Buttons (All Steps)

- **Download** — exports document as PDF
- **Copy to clipboard** — for pasting into PSP portals
- **Mark as submitted** — sets dispute status to "In Progress" (if currently Open), adds a blue "Counter-chargeback submitted" event to the timeline

---

## 6. PSP Config Extension — Chargeback Rules Tab

A new tab in the existing PSP Config modal, alongside General, Fees, Settlement, and API.

### Response Windows

- **Default response window** (days) for this PSP
- **Per-reason-category overrides** (optional) — e.g., Fraud = 10 days, Product not received = 30 days

### Templates per Reason Category

A list of reason categories, each expandable to configure:

- **Template text blocks** — editable text sections that form the counter-chargeback document structure
- **Required evidence checklist items** — items the user must address (e.g., "Proof of delivery")
- **Optional evidence items** — recommended but not mandatory
- **PSP-specific submission notes** — e.g., "Stripe requires evidence uploaded via dashboard", "PayPal accepts PDF via email"

### Defaults

- The system ships with sensible default templates per reason category.
- Ops team can customize templates per PSP through the UI.
- If no PSP-specific template exists for a reason category, the system falls back to the default template.

---

## 7. Data Model

### Dispute Entity

Derived from a Transaction where `status === 'Disputed'`. Additional dispute-specific fields:

```typescript
interface Dispute {
  id: string;
  transactionId: string;          // links to Transaction.id
  status: DisputeStatus;          // Open, InProgress, Won, Lost, Accepted
  reasonCategory: DisputeReasonCategory;
  rawReasonCode?: string;         // PSP/network-specific code
  disputeAmount: number;
  pspFee: number;
  currency: Currency;
  openedDate: Date;
  deadline: Date;                 // auto-calculated from PSP chargeback rules
  resolvedDate?: Date;
  outcomeAmount?: number;
  worthFighting: WorthFightingAdvice;
  notes: string;
  timeline: DisputeTimelineEntry[];
}
```

### Supporting Types

```typescript
enum DisputeStatus {
  Open = 'Open',
  InProgress = 'In Progress',
  Won = 'Won',
  Lost = 'Lost',
  Accepted = 'Accepted',
}

enum DisputeReasonCategory {
  Fraud = 'Fraud',
  ProductNotReceived = 'Product not received',
  NotAsDescribed = 'Not as described',
  DuplicateCharge = 'Duplicate charge',
  SubscriptionCancelled = 'Subscription cancelled',
  Other = 'Other',
}

interface DisputeTimelineEntry {
  id: string;
  timestamp: Date;
  phase: DisputePhase;
  description: string;
  addedBy?: string;               // placeholder for future user system
}

enum DisputePhase {
  TransactionCreated = 'Transaction created',
  Settled = 'Settled by PSP',
  ChargebackIssued = 'Chargeback issued',
  DeadlineWarning = 'Deadline approaching',
  DeadlineUrgent = 'Deadline urgent',
  CounterChargebackSubmitted = 'Counter-chargeback submitted',
  Accepted = 'Accepted',
  Won = 'Won',
  Lost = 'Lost',
}

interface WorthFightingAdvice {
  recommendation: 'Recommended' | 'Neutral' | 'Low chance';
  reasoning: string;
}
```

### PSP Config Extension

```typescript
// Added to existing PSPConfig interface
interface PSPChargebackRules {
  defaultResponseWindowDays: number;
  reasonOverrides?: Record<DisputeReasonCategory, number>; // override days per reason
  templates: PSPChargebackTemplate[];
}

interface PSPChargebackTemplate {
  reasonCategory: DisputeReasonCategory;
  textBlocks: TemplateTextBlock[];
  requiredEvidence: string[];
  optionalEvidence: string[];
  submissionNotes?: string;
}

interface TemplateTextBlock {
  id: string;
  title: string;
  content: string;               // template text with placeholders
  order: number;
}
```

---

## 8. Reason Categories & Default Templates

### Simplified Categories (unified across PSPs)

| Category | Typical Evidence | Default Advisory |
|---|---|---|
| Fraud | AVS match, 3DS auth record, IP/device info | Low chance — fraud disputes rarely overturned without strong auth proof |
| Product not received | Proof of delivery, shipping tracking, delivery confirmation | Recommended — strong if delivery proof exists |
| Not as described | Product specs, terms of service, customer communication | Neutral — depends on evidence quality |
| Duplicate charge | Transaction logs showing single charge, refund proof | Recommended — usually straightforward to prove |
| Subscription cancelled | Cancellation policy, terms agreed, cancellation request timeline | Neutral — depends on policy clarity and timing |
| Other | Varies | Neutral — assess on case-by-case basis |

Each PSP can override these defaults via the Chargeback Rules tab in PSP Config.

---

## 9. Worth Fighting Advisory Logic

For the initial implementation, the advisory is driven by a simple rule set based on reason category and available data. The logic will be refined later.

**Initial rules:**
- **Recommended** — reason category has historically high win rates (Duplicate charge, Product not received with delivery proof)
- **Low chance** — reason category is hard to overturn (Fraud without 3DS)
- **Neutral** — everything else, or insufficient data to judge

Displayed as a colored badge on the table row and in the detail panel with a one-line reasoning string.

---

## 10. Component Architecture

### New Files

```
src/
├── components/
│   ├── pages/
│   │   └── DisputesPage.tsx              # Main disputes page
│   ├── disputes/
│   │   ├── DisputeDetailPanel.tsx        # Expandable inline panel
│   │   ├── DisputeTimeline.tsx           # Horizontal color-coded timeline bar
│   │   ├── DisputeTemplateWizard.tsx     # Full-page 3-step modal
│   │   ├── WizardStepChoose.tsx          # Step 1: Choose template
│   │   ├── WizardStepTemplate.tsx        # Step 2: Edit template
│   │   └── WizardStepPreview.tsx         # Step 3: Preview document
│   └── modals/
│       └── (no new modals — wizard is in disputes/)
│
└── lib/
    └── disputes/
        ├── advisory.ts                   # Worth fighting logic
        ├── deadlines.ts                  # Deadline calculation from PSP rules
        └── templates.ts                  # Default templates & template assembly
```

### Modified Files

- `src/types.ts` — add Dispute, DisputeStatus, DisputeReasonCategory, DisputePhase, and PSPChargebackRules types
- `src/mockData.ts` — add mock dispute data generator
- `src/App.tsx` — add Disputes page routing and state
- `src/components/shared/Sidebar.tsx` — add Disputes nav entry
- PSP Config modal — add Chargeback Rules tab

### Reused Components

- `SummaryCard` — for KPI strip
- `MultiSelect` — for gateway/reason filters
- `Badge` — for status and advisory badges
- `Toast` — for action confirmations
- Motion/React — for panel expand/collapse and wizard transitions

---

## Out of Scope (Future)

- Backend API integration
- Role-based access / permission levels
- Automated dispute data ingestion from PSP APIs
- Dispute analytics charts
- Bulk actions
- Activity log with real user identity
- Automated counter-chargeback submission tracking
