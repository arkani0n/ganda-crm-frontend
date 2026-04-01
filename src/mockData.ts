import { Transaction, Gateway, Status, ReconStatus, Currency, Brand, PSPConfig, PSPHistoryEntry, Settlement, SettlementStatus } from './types';
import { subDays, startOfMinute, subHours, addDays, startOfDay } from 'date-fns';

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
      type: 'Gateway',
      status: 'Active',
      lastSync: subHours(now, 2),
      config: {
        endpoint: 'https://api.stripe.com/v1',
        apiKey: 'sk_live_••••••••',
        webhookUrl: 'https://api.settlex.com/webhooks/stripe'
      }
    },
    {
      id: 'psp-2',
      name: 'PayPal',
      type: 'E-Wallet',
      status: 'Active',
      lastSync: subDays(now, 1),
      config: {
        endpoint: 'https://api.paypal.com/v2',
        apiKey: 'access_token_••••••••',
        webhookUrl: 'https://api.settlex.com/webhooks/paypal'
      }
    },
    {
      id: 'psp-3',
      name: 'Skrill',
      type: 'E-Wallet',
      status: 'Active',
      lastSync: subDays(now, 3),
      config: {
        endpoint: 'https://www.skrill.com/app',
        apiKey: 'skrill_api_••••••••',
        webhookUrl: 'https://api.settlex.com/webhooks/skrill'
      }
    },
    {
      id: 'psp-4',
      name: 'Neteller',
      type: 'E-Wallet',
      status: 'Active',
      lastSync: subDays(now, 5),
      config: {
        endpoint: 'https://api.neteller.com/v1',
        apiKey: 'neteller_••••••••',
        webhookUrl: 'https://api.settlex.com/webhooks/neteller'
      }
    },
    {
      id: 'psp-5',
      name: 'Trustly',
      type: 'Bank',
      status: 'Active',
      lastSync: subHours(now, 5),
      config: {
        endpoint: 'https://api.trustly.com/1',
        apiKey: 'trustly_••••••••',
        webhookUrl: 'https://api.settlex.com/webhooks/trustly'
      }
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

export const generateMockData = (count: number = 50): Transaction[] => {
  const data: Transaction[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
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

export const generateSettlementMockData = (): Settlement[] => {
  const now = startOfDay(new Date());
  const settlements: Settlement[] = [];
  
  // 12 entries last month: all status Settled, 3 with small variances
  for (let i = 0; i < 12; i++) {
    const gateway = getRandom(GATEWAYS);
    const expectedAmount = getAmountRange(gateway);
    const variance = i < 3 ? (Math.random() > 0.5 ? 50 + Math.random() * 150 : -50 - Math.random() * 150) : 0;
    const expectedDate = subDays(now, 15 + i * 2);
    
    settlements.push({
      id: `stl-prev-${i}`,
      settlementNo: `STL-${1000 + i}`,
      psp: gateway,
      brand: getRandom(BRANDS),
      expectedDate,
      expectedAmount,
      currency: 'EUR',
      netExpected: expectedAmount * (gateway === 'Stripe' ? 0.95 : gateway === 'PayPal' ? 0.97 : 1),
      rollingReserve: gateway === 'Stripe' ? expectedAmount * 0.05 : gateway === 'PayPal' ? expectedAmount * 0.03 : 0,
      status: 'Settled',
      actualReceivedDate: subDays(expectedDate, Math.floor(Math.random() * 2)),
      actualAmountReceived: expectedAmount + variance,
      variance,
      timeline: [
        { status: 'Scheduled', timestamp: subDays(expectedDate, 7) },
        { status: 'Pending', timestamp: expectedDate },
        { status: 'Settled', timestamp: subDays(expectedDate, Math.floor(Math.random() * 2)) }
      ]
    });
  }

  // 16 entries current month
  // 6 Settled (first half)
  for (let i = 0; i < 6; i++) {
    const gateway = getRandom(GATEWAYS);
    const expectedAmount = getAmountRange(gateway);
    const expectedDate = subDays(now, 5 + i * 2);
    settlements.push({
      id: `stl-curr-settled-${i}`,
      settlementNo: `STL-${1012 + i}`,
      psp: gateway,
      brand: getRandom(BRANDS),
      expectedDate,
      expectedAmount,
      currency: 'EUR',
      netExpected: expectedAmount * (gateway === 'Stripe' ? 0.95 : gateway === 'PayPal' ? 0.97 : 1),
      rollingReserve: gateway === 'Stripe' ? expectedAmount * 0.05 : gateway === 'PayPal' ? expectedAmount * 0.03 : 0,
      status: 'Settled',
      actualReceivedDate: expectedDate,
      actualAmountReceived: expectedAmount,
      variance: 0,
      timeline: [
        { status: 'Scheduled', timestamp: subDays(expectedDate, 7) },
        { status: 'Settled', timestamp: expectedDate }
      ]
    });
  }

  // 3 Pending (due today +- 2 days)
  const pendingOffsets = [-1, 0, 1];
  for (let i = 0; i < 3; i++) {
    const gateway = getRandom(GATEWAYS);
    const expectedAmount = getAmountRange(gateway);
    const expectedDate = addDays(now, pendingOffsets[i]);
    settlements.push({
      id: `stl-curr-pending-${i}`,
      settlementNo: `STL-${1018 + i}`,
      psp: gateway,
      brand: getRandom(BRANDS),
      expectedDate,
      expectedAmount,
      currency: 'EUR',
      netExpected: expectedAmount * (gateway === 'Stripe' ? 0.95 : gateway === 'PayPal' ? 0.97 : 1),
      rollingReserve: gateway === 'Stripe' ? expectedAmount * 0.05 : gateway === 'PayPal' ? expectedAmount * 0.03 : 0,
      status: 'Pending',
      timeline: [
        { status: 'Scheduled', timestamp: subDays(expectedDate, 7) },
        { status: 'Pending', timestamp: subDays(now, 1) }
      ]
    });
  }

  // 2 Overdue (3-7 days late, Stripe and Neteller)
  const overdueGateways: Gateway[] = ['Stripe', 'Neteller'];
  for (let i = 0; i < 2; i++) {
    const gateway = overdueGateways[i];
    const expectedAmount = getAmountRange(gateway);
    const expectedDate = subDays(now, 4 + i * 2);
    settlements.push({
      id: `stl-curr-overdue-${i}`,
      settlementNo: `STL-${1021 + i}`,
      psp: gateway,
      brand: getRandom(BRANDS),
      expectedDate,
      expectedAmount,
      currency: 'EUR',
      netExpected: expectedAmount * (gateway === 'Stripe' ? 0.95 : 1),
      rollingReserve: gateway === 'Stripe' ? expectedAmount * 0.05 : 0,
      status: 'Overdue',
      timeline: [
        { status: 'Scheduled', timestamp: subDays(expectedDate, 7) },
        { status: 'Pending', timestamp: expectedDate }
      ]
    });
  }

  // 5 Scheduled (second half of month)
  for (let i = 0; i < 5; i++) {
    const gateway = getRandom(GATEWAYS);
    const expectedAmount = getAmountRange(gateway);
    const expectedDate = addDays(now, 5 + i * 3);
    settlements.push({
      id: `stl-curr-sched-${i}`,
      settlementNo: `STL-${1023 + i}`,
      psp: gateway,
      brand: getRandom(BRANDS),
      expectedDate,
      expectedAmount,
      currency: 'EUR',
      netExpected: expectedAmount * (gateway === 'Stripe' ? 0.95 : gateway === 'PayPal' ? 0.97 : 1),
      rollingReserve: gateway === 'Stripe' ? expectedAmount * 0.05 : gateway === 'PayPal' ? expectedAmount * 0.03 : 0,
      status: 'Scheduled',
      timeline: [
        { status: 'Scheduled', timestamp: subDays(now, 2) }
      ]
    });
  }

  // 7 entries next month: all Scheduled
  for (let i = 0; i < 7; i++) {
    const gateway = getRandom(GATEWAYS);
    const expectedAmount = getAmountRange(gateway);
    const expectedDate = addDays(now, 25 + i * 2);
    settlements.push({
      id: `stl-next-sched-${i}`,
      settlementNo: `STL-${1028 + i}`,
      psp: gateway,
      brand: getRandom(BRANDS),
      expectedDate,
      expectedAmount,
      currency: 'EUR',
      netExpected: expectedAmount * (gateway === 'Stripe' ? 0.95 : gateway === 'PayPal' ? 0.97 : 1),
      rollingReserve: gateway === 'Stripe' ? expectedAmount * 0.05 : gateway === 'PayPal' ? expectedAmount * 0.03 : 0,
      status: 'Scheduled',
      timeline: [
        { status: 'Scheduled', timestamp: now }
      ]
    });
  }

  return settlements;
};

function getAmountRange(gateway: Gateway): number {
  switch (gateway) {
    case 'Stripe': return 8000 + Math.random() * 17000;
    case 'PayPal': return 5000 + Math.random() * 13000;
    case 'Skrill': return 3000 + Math.random() * 9000;
    case 'Neteller': return 4000 + Math.random() * 11000;
    case 'Trustly': return 6000 + Math.random() * 14000;
    case 'Paysafecard': return 2000 + Math.random() * 6000;
    case 'MuchBetter': return 1500 + Math.random() * 4500;
    case 'Rapid Transfer': return 3000 + Math.random() * 7000;
    default: return 5000;
  }
}
