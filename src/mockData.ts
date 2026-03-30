import { Transaction, Gateway, Status, ReconStatus, Currency, Brand, PSPConfig, PSPHistoryEntry } from './types';
import { subDays, startOfMinute, subHours } from 'date-fns';

const GATEWAYS: Gateway[] = ['Stripe', 'PayPal', 'Skrill', 'Neteller', 'Trustly', 'Paysafecard', 'MuchBetter', 'Rapid Transfer'];
const STATUSES: Status[] = ['Completed', 'Pending', 'Failed', 'Disputed'];
const RECON_STATUSES: ReconStatus[] = ['Matched', 'Unmatched', 'Pending'];
const BRANDS: Brand[] = ['BetNova', 'SpinOrbit', 'GalaxyBet', 'StarPlay', 'NebulaCasino'];
const CURRENCIES: Currency[] = ['EUR', 'USD', 'GBP'];

export const generatePSPMockData = (): PSPConfig[] => {
  const now = new Date();
  return [
    {
      id: 'psp-1',
      name: 'Stripe',
      category: 'Card Payments',
      status: 'Active',
      logoColor: 'bg-blue-600',
      processingFeePercent: 2.5,
      processingFeeFixed: 0.25,
      processingFeeCurrency: 'EUR',
      refundFeePercent: 1.0,
      chargebackFee: 15.00,
      chargebackFeeCurrency: 'EUR',
      fxMarkupPercent: 0.5,
      minTxn: 1.00,
      maxTxn: 10000.00,
      frequency: 'Weekly',
      settlementDay: 'Monday',
      currencies: ['EUR', 'USD', 'GBP'],
      rollingReservePercent: 5,
      rollingReserveDays: 180,
      settlementDelayDays: 7,
      environment: 'Live',
      endpoint: 'https://api.stripe.com/v1',
      apiKey: 'sk_live_51Mz9X2L7vR8kPqW1',
      apiSecret: 'whsec_51Mz9X2L7vR8kPqW1',
      webhookUrl: 'https://api.settlex.com/webhooks/stripe',
      webhookSecret: 'whsec_test_secret',
      ipWhitelist: '34.231.12.1\n34.231.12.2',
      lastTested: subHours(now, 2),
      connectionStatus: 'Online',
      countries: 'Global',
    },
    {
      id: 'psp-2',
      name: 'PayPal',
      category: 'E-Wallet',
      status: 'Active',
      logoColor: 'bg-indigo-600',
      processingFeePercent: 3.4,
      processingFeeFixed: 0.35,
      processingFeeCurrency: 'USD',
      refundFeePercent: 0.0,
      chargebackFee: 20.00,
      chargebackFeeCurrency: 'USD',
      fxMarkupPercent: 1.2,
      minTxn: 0.50,
      maxTxn: 5000.00,
      frequency: 'Daily',
      currencies: ['USD', 'EUR', 'GBP', 'AUD'],
      rollingReservePercent: 3,
      rollingReserveDays: 90,
      settlementDelayDays: 1,
      environment: 'Live',
      endpoint: 'https://api.paypal.com/v2',
      apiKey: 'access_token_live_paypal_123',
      apiSecret: 'client_secret_live_paypal_456',
      webhookUrl: 'https://api.settlex.com/webhooks/paypal',
      webhookSecret: 'paypal_webhook_secret',
      ipWhitelist: '173.0.80.0/20',
      lastTested: subDays(now, 1),
      connectionStatus: 'Online',
      countries: 'Global',
    },
    {
      id: 'psp-3',
      name: 'Skrill',
      category: 'E-Wallet',
      status: 'Active',
      logoColor: 'bg-purple-600',
      processingFeePercent: 1.9,
      processingFeeFixed: 0.00,
      processingFeeCurrency: 'EUR',
      refundFeePercent: 0.5,
      chargebackFee: 25.00,
      chargebackFeeCurrency: 'EUR',
      fxMarkupPercent: 0.8,
      minTxn: 10.00,
      maxTxn: 20000.00,
      frequency: 'Weekly',
      settlementDay: 'Wednesday',
      currencies: ['EUR', 'USD', 'GBP', 'PLN'],
      rollingReservePercent: 0,
      rollingReserveDays: 0,
      settlementDelayDays: 3,
      environment: 'Live',
      endpoint: 'https://www.skrill.com/app',
      apiKey: 'skrill_api_key_789',
      apiSecret: 'skrill_secret_012',
      webhookUrl: 'https://api.settlex.com/webhooks/skrill',
      webhookSecret: 'skrill_webhook_secret',
      ipWhitelist: '195.12.12.0/24',
      lastTested: subDays(now, 3),
      connectionStatus: 'Online',
      countries: 'Europe, UK',
    },
    {
      id: 'psp-4',
      name: 'Neteller',
      category: 'E-Wallet',
      status: 'Active',
      logoColor: 'bg-emerald-600',
      processingFeePercent: 2.5,
      processingFeeFixed: 0.00,
      processingFeeCurrency: 'USD',
      refundFeePercent: 1.0,
      chargebackFee: 30.00,
      chargebackFeeCurrency: 'USD',
      fxMarkupPercent: 1.0,
      minTxn: 5.00,
      maxTxn: 15000.00,
      frequency: 'Weekly',
      settlementDay: 'Friday',
      currencies: ['USD', 'EUR', 'GBP', 'CAD'],
      rollingReservePercent: 0,
      rollingReserveDays: 0,
      settlementDelayDays: 5,
      environment: 'Live',
      endpoint: 'https://api.neteller.com/v1',
      apiKey: 'neteller_key_345',
      apiSecret: 'neteller_secret_678',
      webhookUrl: 'https://api.settlex.com/webhooks/neteller',
      webhookSecret: 'neteller_webhook_secret',
      ipWhitelist: '213.12.12.0/24',
      lastTested: undefined,
      connectionStatus: 'Never',
      countries: 'Global',
    },
    {
      id: 'psp-5',
      name: 'Trustly',
      category: 'Open Banking',
      status: 'Active',
      logoColor: 'bg-teal-600',
      processingFeePercent: 1.0,
      processingFeeFixed: 0.15,
      processingFeeCurrency: 'EUR',
      refundFeePercent: 0.0,
      chargebackFee: 0.00,
      chargebackFeeCurrency: 'EUR',
      fxMarkupPercent: 0.3,
      minTxn: 1.00,
      maxTxn: 50000.00,
      frequency: 'Daily',
      currencies: ['EUR', 'SEK', 'NOK'],
      rollingReservePercent: 0,
      rollingReserveDays: 0,
      settlementDelayDays: 1,
      environment: 'Live',
      endpoint: 'https://api.trustly.com/1',
      apiKey: 'trustly_username_901',
      apiSecret: 'trustly_password_234',
      webhookUrl: 'https://api.settlex.com/webhooks/trustly',
      webhookSecret: 'trustly_webhook_secret',
      ipWhitelist: '91.212.12.0/24',
      lastTested: subHours(now, 5),
      connectionStatus: 'Online',
      countries: 'Europe, Scandinavia',
    },
    {
      id: 'psp-6',
      name: 'Paysafecard',
      category: 'Voucher',
      status: 'Inactive',
      logoColor: 'bg-pink-600',
      processingFeePercent: 3.0,
      processingFeeFixed: 0.00,
      processingFeeCurrency: 'EUR',
      refundFeePercent: 2.0,
      chargebackFee: 0.00,
      chargebackFeeCurrency: 'EUR',
      fxMarkupPercent: 2.0,
      minTxn: 10.00,
      maxTxn: 1000.00,
      frequency: 'Monthly',
      currencies: ['EUR', 'USD', 'GBP', 'CZK'],
      rollingReservePercent: 0,
      rollingReserveDays: 0,
      settlementDelayDays: 30,
      environment: 'Sandbox',
      endpoint: 'https://api.paysafecard.com/v1',
      apiKey: 'psc_test_key_567',
      apiSecret: 'psc_test_secret_890',
      webhookUrl: 'https://api.settlex.com/webhooks/psc',
      webhookSecret: 'psc_webhook_secret',
      ipWhitelist: '185.12.12.0/24',
      lastTested: subDays(now, 14),
      connectionStatus: 'Offline',
      countries: 'Global',
    },
    {
      id: 'psp-7',
      name: 'MuchBetter',
      category: 'E-Wallet',
      status: 'Active',
      logoColor: 'bg-orange-600',
      processingFeePercent: 1.5,
      processingFeeFixed: 0.10,
      processingFeeCurrency: 'GBP',
      refundFeePercent: 0.5,
      chargebackFee: 10.00,
      chargebackFeeCurrency: 'GBP',
      fxMarkupPercent: 0.5,
      minTxn: 1.00,
      maxTxn: 10000.00,
      frequency: 'Bi-weekly',
      currencies: ['GBP', 'EUR'],
      rollingReservePercent: 0,
      rollingReserveDays: 0,
      settlementDelayDays: 14,
      environment: 'Live',
      endpoint: 'https://api.muchbetter.com/merchant',
      apiKey: 'mb_api_key_123',
      apiSecret: 'mb_api_secret_456',
      webhookUrl: 'https://api.settlex.com/webhooks/muchbetter',
      webhookSecret: 'mb_webhook_secret',
      ipWhitelist: '52.12.12.0/24',
      lastTested: subDays(now, 1),
      connectionStatus: 'Online',
      countries: 'Global',
    },
    {
      id: 'psp-8',
      name: 'Rapid Transfer',
      category: 'Bank Transfer',
      status: 'Active',
      logoColor: 'bg-cyan-600',
      processingFeePercent: 0.8,
      processingFeeFixed: 0.20,
      processingFeeCurrency: 'EUR',
      refundFeePercent: 0.0,
      chargebackFee: 5.00,
      chargebackFeeCurrency: 'EUR',
      fxMarkupPercent: 0.2,
      minTxn: 1.00,
      maxTxn: 25000.00,
      frequency: 'Daily',
      currencies: ['EUR', 'USD', 'SEK', 'PLN'],
      rollingReservePercent: 0,
      rollingReserveDays: 0,
      settlementDelayDays: 2,
      environment: 'Live',
      endpoint: 'https://api.rapidtransfer.com/v2',
      apiKey: 'rt_api_key_789',
      apiSecret: 'rt_api_secret_012',
      webhookUrl: 'https://api.settlex.com/webhooks/rapidtransfer',
      webhookSecret: 'rt_webhook_secret',
      ipWhitelist: '195.12.12.0/24',
      lastTested: subHours(now, 4),
      connectionStatus: 'Online',
      countries: 'Europe',
    }
  ];
};

export const generatePSPHistory = (pspId: string): PSPHistoryEntry[] => {
  const now = new Date();
  const fields = ['Fee', 'Status', 'API Key', 'Settlement Frequency', 'Rolling Reserve'];
  const users = ['John Doe', 'Sarah Smith', 'Admin System'];
  
  return Array.from({ length: 10 }).map((_, i) => ({
    id: `hist-${pspId}-${i}`,
    timestamp: subDays(now, i * 2),
    changedBy: getRandom(users),
    field: getRandom(fields),
    oldValue: 'Previous Value',
    newValue: 'New Value',
  }));
};

const CLIENTS = [
  'Alexander Fischer', 'Elena Rodriguez', 'Marco Rossi', 'Sophie Dubois', 'Lars Jensen',
  'Isabella Conti', 'Hans Müller', 'Chloe Lefebvre', 'Mateo Silva', 'Anika Sharma',
  'Dmitry Volkov', 'Yuki Tanaka', 'Sarah O\'Connor', 'Liam Wilson', 'Emma Wright',
  'Oliver Brown', 'Mia Garcia', 'Lucas Martin', 'Amelia Smith', 'Noah Jones',
  'Ava Taylor', 'Ethan Davies', 'Sophia Evans', 'James Thomas', 'Isabella Roberts'
];

function getRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateTxnId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'TXN-';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const generateMockData = (): Transaction[] => {
  const data: Transaction[] = [];
  const now = new Date();

  for (let i = 0; i < 47; i++) {
    const gateway = getRandom(GATEWAYS);
    
    // Status distribution: ~55% Completed, ~20% Pending, ~15% Failed, ~10% Disputed
    let status: Status;
    const statusRand = Math.random();
    if (statusRand < 0.55) status = 'Completed';
    else if (statusRand < 0.75) status = 'Pending';
    else if (statusRand < 0.90) status = 'Failed';
    else status = 'Disputed';

    // Recon distribution: ~50% Matched, ~30% Unmatched, ~20% Pending
    let recon: ReconStatus;
    const reconRand = Math.random();
    if (reconRand < 0.50) recon = 'Matched';
    else if (reconRand < 0.80) recon = 'Unmatched';
    else recon = 'Pending';

    // Currency based on gateway (simplified logic)
    let currency: Currency = 'EUR';
    if (gateway === 'PayPal' || gateway === 'Stripe') {
      currency = Math.random() > 0.5 ? 'USD' : 'EUR';
    } else if (gateway === 'Skrill' || gateway === 'Neteller') {
      currency = Math.random() > 0.7 ? 'GBP' : 'EUR';
    }

    data.push({
      id: (i + 1).toString(),
      txnId: generateTxnId(),
      timestamp: startOfMinute(subDays(now, Math.floor(Math.random() * 90))),
      client: getRandom(CLIENTS),
      brand: getRandom(BRANDS),
      gateway,
      amount: Math.floor(Math.random() * 14990) + 10,
      currency,
      status,
      recon
    });
  }

  return data.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};
