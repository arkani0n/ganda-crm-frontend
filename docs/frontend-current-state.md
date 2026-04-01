# Frontend Current State (React)

This document describes the current behavior and data contracts of the React frontend so you can build the backend it will need.

## 1. What this frontend is

The app is a single-page React + Vite UI (no `react-router` routes). Navigation between major sections is done via internal component state (`activePage`):

1. `Transactions` (Transaction Database)
2. `Reconciliation` (Reconciliation Center)
3. `Reports` (Reporting & Analytics)
4. `PSP Config` (PSP Configuration)

At the moment, all data is generated locally from mock functions; the frontend does not call a backend API.

## 2. Key files

- `src/main.tsx`: mounts the app into the DOM.
- `src/App.tsx`: contains the entire UI (pages, modals, reconciliation/report logic, export/import code).
- `src/types.ts`: shared TypeScript types used by the UI.
- `src/mockData.ts`: generates:
  - mock `Transaction[]`
  - mock `PSPConfig[]`
  - mock `PSPHistoryEntry[]`
- `src/lib/utils.ts`: `cn()` Tailwind class merge helper.
- `index.html`: loads external browser libraries:
  - SheetJS (`XLSX`) for CSV/XLSX import/export
  - Chart.js for charts in the Reports view

## 3. Tech stack / dependencies used by the UI

- React (v19)
- Vite (dev/build)
- Tailwind CSS v4 (`@tailwindcss/vite`)
- `motion/react` for modal animations
- `lucide-react` for icons
- `date-fns` for date math and formatting
- `SheetJS` (SheetJS `XLSX`) via CDN
- `Chart.js` via CDN

`package.json` also includes `express`, `dotenv`, and `@google/genai`, but **the current frontend code does not use them**.

## 4. Environment variables (currently not used by runtime logic)

`vite.config.ts` injects `process.env.GEMINI_API_KEY`, and `.env.example` documents:

- `GEMINI_API_KEY`
- `APP_URL`

However, the current UI logic does not make Gemini calls and does not reference `APP_URL`.

## 5. Data model (UI-level “contract”)

### 5.1 Enums / literal unions (`src/types.ts`)

- `Gateway`: `Stripe | PayPal | Skrill | Neteller | Trustly | Paysafecard | MuchBetter | Rapid Transfer`
- `Status`: `Completed | Pending | Failed | Disputed`
- `ReconStatus`: `Matched | Unmatched | Pending`
- `ReconMatchStatus`: `Matched | Unmatched | Difference | Pending | Amount diff | Missing in PSP | Not in system`
- `Currency`: `EUR | USD | GBP`
- `Brand`: `BetNova | SpinOrbit | GalaxyBet | StarPlay | NebulaCasino`

### 5.2 Interfaces

#### `Transaction`

- `id: string`
- `txnId: string`
- `timestamp: Date` (UI expects a `Date` object)
- `client: string`
- `brand: Brand`
- `gateway: Gateway`
- `amount: number`
- `currency: Currency`
- `status: Status`
- `recon: ReconStatus`

#### `PSPConfig`

- `id: string`
- `name: string`
- `category: PSPCategory` (`Card Payments | E-Wallet | Bank Transfer | Open Banking | Crypto | Voucher`)
- `status: PSPStatus` (`Active | Inactive | Testing`)
- `logoColor: string` (Tailwind color class)

Fees:
- `processingFeePercent: number`
- `processingFeeFixed: number`
- `processingFeeCurrency: string`
- `refundFeePercent: number`
- `chargebackFee: number`
- `chargebackFeeCurrency: string`
- `fxMarkupPercent: number`
- `minTxn: number`
- `maxTxn: number`

Settlement:
- `frequency: SettlementFrequency` (`Daily | Weekly | Bi-weekly | Monthly`)
- `settlementDay?: string`
- `currencies: string[]`
- `rollingReservePercent: number`
- `rollingReserveDays: number`
- `settlementDelayDays: number`
- `settlementNotes?: string`

API + webhooks:
- `environment: 'Live' | 'Sandbox'`
- `endpoint: string`
- `apiKey: string`
- `apiSecret: string`
- `webhookUrl: string`
- `webhookSecret: string`
- `ipWhitelist: string`

Status metadata:
- `lastTested?: Date`
- `connectionStatus?: 'Online' | 'Offline' | 'Never'`

General:
- `countries: string`
- `notes?: string`

#### `ReconResult`

- `id: string`
- `status: ReconMatchStatus`
- `txnId?: string` (ours)
- `pspRefId?: string`
- `timestamp: Date`
- `client?: string`
- `gateway: Gateway`
- `ourAmount?: number`
- `pspAmount?: number`
- `difference: number`

#### `PSPHistoryEntry`

- `id: string`
- `timestamp: Date`
- `changedBy: string`
- `field: string`
- `oldValue: string`
- `newValue: string`

## 6. UI flows and what the backend should support

### 6.1 Transactions page (`Transactions`)

Purpose: show an operator-facing ledger table and allow client-side filtering + export.

Stateful behavior in the UI:

- Data source: `allTransactions` is loaded from `generateMockData()`.
- Filtering controls:
  - `fromDate`, `toDate` (date inputs)
  - `gatewayFilter` (`All` or a `Gateway`)
  - `statusFilter` (`All` or a `Status`)
  - `searchQuery` searches by `client` or `txnId`
  - Tabs (`activeTab`):
    - `Matched` => `t.recon === 'Matched'`
    - `Unmatched` => `t.recon === 'Unmatched'`
    - `Disputed` => `t.status === 'Disputed'` (note: this tab filters by PSP settlement status, not reconciliation status)
    - `All` => no recon/status tab filter
- Pagination:
  - `rowsPerPage = 25`
  - shared `currentPage` state

Row interactions:
- Clicking a row sets `selectedTxn` and opens a “Transaction Detail” modal.
- TXN ID has a copy-to-clipboard icon button.

Exports:
- `Export CSV` downloads a CSV of the currently filtered transactions (includes columns: `Transaction ID`, `Date`, `Client`, `Brand`, `Gateway`, `Amount`, `Currency`, `Status`, `Recon`).
- `Export Excel` uses `window.XLSX` to build an XLSX file from the filtered list.

Backend implications:
- Backend must provide a `Transaction` list with:
  - server-side filtering/pagination (recommended for real data volumes)
  - reconciliation field `recon` populated according to backend reconciliation status
- The UI expects `timestamp` as a `Date` in memory; backend responses should be converted on the frontend (or you can change frontend to parse ISO strings).

### 6.2 Reconciliation page (`Reconciliation`)

Purpose: upload a PSP settlement report (CSV/XLSX), match it to internal transactions, and manage discrepancies.

Inputs:
- PSP settlement report file upload:
  - `<input type="file" accept=".csv,.xlsx" />`
  - parsed in the browser with SheetJS (`window.XLSX`)
- Matching parameters:
  - `reconGateway`: a `Gateway` selector
  - `reconMatchBy`:
    - `Transaction ID`
    - `PSP Reference ID`
    - `Amount + Date`

Expected PSP statement columns (based on the matching code and demo loader):
- `Transaction ID`
- `PSP Reference ID`
- `Date`
- `Amount`
- `Currency` (used by demo; matching code doesn’t strictly require it)

Matching algorithm implemented in the UI (server should replicate for consistent results):

1. Consider only internal transactions where `t.gateway === reconGateway`.
2. For each internal transaction, find the first PSP row that hasn’t already been used, based on `reconMatchBy`:
   - `Transaction ID`
     - match when `p['Transaction ID'] === t.txnId`
   - `PSP Reference ID`
     - match when `p['PSP Reference ID'] === 'PSP-' + t.txnId.split('-')[1]`
   - `Amount + Date`
     - match when:
       - `new Date(p['Date']).toDateString() === new Date(t.timestamp).toDateString()`
       - `abs(p['Amount'] - t.amount) < 0.01`
3. If matched:
   - `diff = abs(pspAmount - ourAmount)`
   - status is:
     - `Matched` if `diff <= 0.01`
     - `Amount diff` if `diff > 0.01`
4. If no PSP match is found for an internal transaction:
   - `Missing in PSP`
   - `difference = ourAmount`
5. After internal matching, add PSP rows that were not matched to any internal transaction:
   - `Not in system`
   - `difference = p['Amount']`

Outputs:
- `reconResults: ReconResult[]` rendered as a table with columns:
  - `Status`
  - `TXN ID (ours)`
  - `PSP Ref ID`
  - `Date`
  - `Client`
  - `Gateway`
  - `Our Amount`
  - `PSP Amount`
  - `Difference`
  - `Action`

Manual match:
- For non-`Matched` rows:
  - “Link manually” opens a Manual Match modal.
  - The modal suggests PSP rows from the uploaded file based on:
    - search query matching `PSP Reference ID` or `Amount`
    - default suggestion prefers exact amount matches to the internal amount (within code’s tolerance)
- “Confirm Match” updates the matching row inside the in-memory `reconResults`:
  - compares `abs(selectedPSPMatch.Amount - internal.ourAmount)` to 0.01
  - sets status to `Matched` or `Amount diff`
  - stores `pspRefId`, `pspAmount`, and recalculates `difference`
- “Mark as Exception” currently just closes the modal (no persisted exception data in the mock UI).

Exports:
- “Export Discrepancy Report” exports only `reconResults` where `status !== 'Matched'` to XLSX.
- Exported columns include `Status`, `TXN ID (ours)`, `PSP Ref ID`, `Date`, `Client`, `Gateway`, `Our Amount`, `PSP Amount`, `Difference`, `Exception Notes` (always empty in current UI).

Backend implications:
- Backend should support:
  - storing uploaded PSP reports (optional but recommended for auditability)
  - parsing them into rows (either backend parses CSV/XLSX, or frontend parses and backend receives structured rows)
  - persisting reconciliation runs + results:
    - `Missing in PSP`
    - `Not in system`
    - `Matched` / `Amount diff`
  - manual match actions:
    - update persisted reconciliation row status + amount references
    - optional exception notes

### 6.3 Reports page (`Reports`)

Purpose: compute analytics charts and KPIs over a date range, and export the report.

Inputs:
- `reportFromDate`, `reportToDate`
- MultiSelect:
  - `reportGateways` (starts as `['All']`)
  - `reportBrands` (starts as `['All']`)

Report generation logic implemented in UI:
- `generateReport()` computes:
  - `current` period: `reportFromDate`..`reportToDate` inclusive
  - `previous` period: same number of days immediately preceding `from`
- Filters `allTransactions` by:
  - timestamp in range
  - gateway matches selected gateways
  - brand matches selected brands

Charts (Chart.js via CDN):
- Volume Over Time (line) grouped by day
- Volume by Gateway (doughnut)
- Success Rate by Day (stacked bar by status)
- Top 10 clients by volume (horizontal bar)

Table:
- “Top Transactions” lists the top 20 by amount, and clicking a row opens the Transaction Detail modal.

Exports:
- Excel export:
  - workbook includes sheets:
    - `KPI Summary`
    - `Gateway Breakdown`
    - `Top Transactions`
- “Export PDF” just calls `window.print()` (browser print dialog).

Backend implications:
- Backend should provide enough data to compute these aggregates, ideally via:
  - report endpoint returning already-aggregated KPI/chart datasets, or
  - transactions endpoint that supports efficient filtering over large datasets.

### 6.4 PSP Configuration page (`PSP Config`)

Purpose: manage gateway configurations (fees, settlement params, API/webhook settings) and show connectivity status.

List view:
- UI uses `psps: PSPConfig[]` state initialized from `generatePSPMockData()`.
- It supports two layouts:
  - `viewMode = 'card'` or `viewMode = 'table'`
- For each PSP entry, the UI shows:
  - name, category, status (Active/Inactive)
  - fee summary: processing fee %, fixed fee
  - settlement frequency and some settlement-related metadata
  - connection status indicator:
    - `lastTested` and `connectionStatus` show `Online`/`Offline` (or `Never`)

Actions per PSP:
- `Ping`:
  - Currently simulated in the frontend (random success/failure after a delay).
  - It calls the parent handler `onPing(id, success)` which updates:
    - `lastTested = new Date()`
    - `connectionStatus = Online|Offline`
- `Edit`:
  - opens Add/Edit modal
- `History`:
  - opens change history modal
- `Power / Toggle`:
  - if Active => setConfirmDisable(psp.id) path exists (confirmation UI incomplete in the mock)
  - otherwise toggles Active/Inactive by calling `onToggleStatus(id)`

Add/Edit PSP modal:
- Tabs: `General`, `Fees`, `Settlement`, `API`
- The modal edits a form object matching the `PSPConfig` shape.
- `Save PSP` passes the form data up to the parent handler `handleSavePSP`.
  - if editing existing PSP: replace by matching `id`
  - if adding: creates a new `id` with prefix `psp-<timestamp>`

History modal:
- History is generated in frontend (`generatePSPHistory(psp.id)`).
- The UI displays a table of:
  - Date & Time
  - Changed By
  - Field
  - New Value

Backend implications (important for real security):
- Because `PSPConfig` includes `apiKey`, `apiSecret`, and `webhookSecret`, the backend should:
  - store these securely (encrypted-at-rest or secrets manager)
  - avoid returning secrets to the frontend except in restricted circumstances
- Connectivity `Ping` should be implemented server-side and audited.
- PSP change history should be persisted with enough detail to populate `PSPHistoryEntry`.

## 7. Missing/placeholder behaviors to be aware of

Several UI elements are present but do not currently trigger meaningful logic in the mock:
- In the reconciliation results table:
  - “Review” button for `Amount diff` has no handler.
  - Matched “Eye” icon has no handler.
- History modal includes an “Export History” button with no implemented persistence/export logic.
- The “Mark as Exception” action closes the modal but does not store exception data.

When implementing the backend, decide whether these should become:
- persisted audit events,
- additional workflow states,
- or simply UI-only enhancements.

## 8. Recommended backend “API surface” (high level)

Even though the frontend has no API calls right now, the backend you build should logically support:

1. PSP Config CRUD
   - list, create, update, toggle active/inactive, retrieve history, ping connectivity
2. Transactions ledger
   - list with filters (date/gateway/status/search/tab), pagination, and transaction details
3. Reconciliation runs
   - reconcile against uploaded PSP statement rows using the same matching rules
   - store reconciliation results and allow manual rematching
   - support export generation (or return structured data for export)
4. Reporting
   - either:
     - transactions filtered endpoints (frontend computes aggregates), or
     - report endpoints returning pre-aggregated datasets (recommended for large data)

## 9. Security & data handling notes (backend requirements)

- `PSPConfig.apiKey`, `apiSecret`, `webhookSecret` are sensitive.
  - backend should not expose them broadly
  - backend must ensure correct authorization (the current frontend has no auth)
- `timestamp` values:
  - UI expects `Date` objects
  - backend should send ISO strings or epoch millis, and frontend should convert before using date-fns comparisons.

