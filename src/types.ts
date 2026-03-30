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

export interface PSPConfig {
  id: string;
  name: string;
  category: PSPCategory;
  status: PSPStatus;
  logoColor: string;
  
  // Fees
  processingFeePercent: number;
  processingFeeFixed: number;
  processingFeeCurrency: string;
  refundFeePercent: number;
  chargebackFee: number;
  chargebackFeeCurrency: string;
  fxMarkupPercent: number;
  minTxn: number;
  maxTxn: number;
  
  // Settlement
  frequency: SettlementFrequency;
  settlementDay?: string;
  currencies: string[];
  rollingReservePercent: number;
  rollingReserveDays: number;
  settlementDelayDays: number;
  settlementNotes?: string;
  
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
  connectionStatus?: 'Online' | 'Offline' | 'Never';
  
  // General
  countries: string;
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
}
