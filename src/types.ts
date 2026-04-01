export type Gateway = 'Stripe' | 'PayPal' | 'Skrill' | 'Neteller' | 'Trustly' | 'Paysafecard' | 'MuchBetter' | 'Rapid Transfer';
export type Status = 'Completed' | 'Pending' | 'Failed' | 'Disputed';
export type ReconStatus = 'Matched' | 'Unmatched' | 'Pending';
export type ReconMatchStatus = 'Matched' | 'Unmatched' | 'Difference' | 'Pending' | 'Amount diff' | 'Missing in PSP' | 'Not in system';
export type Currency = 'EUR' | 'USD' | 'GBP';
export type Brand = 'BetNova' | 'SpinOrbit' | 'GalaxyBet' | 'StarPlay' | 'NebulaCasino';

export type PSPStatus = 'Active' | 'Inactive' | 'Testing';
export type PSPCategory = 'Card Payments' | 'E-Wallet' | 'Bank Transfer' | 'Open Banking' | 'Crypto' | 'Voucher';
export type SettlementFrequency = 'Daily' | 'Weekly' | 'Bi-weekly' | 'Monthly';

export interface PSPHistoryEntry {
  id: string;
  timestamp: Date;
  changedBy: string;
  field: string;
  oldValue: string;
  newValue: string;
}

export interface TransactionFilters {
  dateRange: { start: Date | null, end: Date | null };
  gateways: string[];
  brands: string[];
  status: Status | 'All';
}

export interface PSPConfig {
  id: string;
  name: string;
  category: PSPCategory;
  status: PSPStatus;
  logoColor: string;
  
  // Fees
  processingFeePercent: number;
  processingFeeFixed: number;
  refundFeePercent: number;
  chargebackFeeFixed: number;
  fxMarkupPercent: number;
  minTransaction: number;
  maxTransaction: number;
  
  // Settlement
  settlementFrequency: SettlementFrequency;
  settlementDay?: string;
  rollingReservePercent: number;
  reservePeriodDays: number;
  expectedDelayDays: number;
  settlementNotes?: string;
  currencies: Currency[];
  countries: string[];
  
  // API
  environment: 'Live' | 'Sandbox';
  endpoint: string;
  apiKey: string;
  apiSecret: string;
  webhookUrl: string;
  webhookSecret: string;
  ipWhitelist: string;
  
  // Status
  lastTested?: Date;
  connectionStatus: 'Online' | 'Offline' | 'Never Tested';
  notes?: string;
}

export interface ReconResult {
  id: string;
  status: ReconMatchStatus;
  txnId?: string;
  pspRefId?: string;
  timestamp: Date;
  client?: string;
  gateway: Gateway;
  ourAmount?: number;
  pspAmount?: number;
  difference: number;
}

export type SettlementStatus = 'Scheduled' | 'Pending' | 'Overdue' | 'Settled' | 'Partial' | 'Disputed';

export interface SettlementTimelineEvent {
  status: SettlementStatus;
  timestamp: Date;
  note?: string;
}

export interface Settlement {
  id: string;
  settlementNo: string;
  psp: Gateway;
  brand: Brand;
  expectedDate: Date;
  expectedAmount: number;
  currency: Currency;
  rollingReserve?: number;
  netExpected: number;
  status: SettlementStatus;
  actualReceivedDate?: Date;
  actualAmountReceived?: number;
  variance?: number;
  notes?: string;
  timeline: SettlementTimelineEvent[];
}

export interface Transaction {
  id: string;
  txnId: string;
  timestamp: Date;
  client: string;
  brand: Brand;
  gateway: Gateway;
  amount: number;
  currency: Currency;
  status: Status;
  recon: ReconStatus;
  source?: 'system' | 'manual';
  batchId?: string;
  notes?: string;
  settlementStatus?: SettlementStatus;
  scheduledSettlementDate?: Date;
  actualSettlementDate?: Date;
}

export interface ImportLog {
  id: string;
  filename: string;
  timestamp: Date;
  rowCount: number;
  gateway?: string;
  method?: string;
  batchId: string;
}
