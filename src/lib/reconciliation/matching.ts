import { Transaction, ReconResult, ReconMatchStatus } from '../../types';

export type ReconMatchBy = 'Transaction ID' | 'PSP Reference ID' | 'Amount + Date';

export interface ReconciliationOptions {
  reconGateway: string;
  reconMatchBy: ReconMatchBy;
  pspRows: any[];
}

export const runReconciliationLogic = (
  allTransactions: Transaction[],
  options: ReconciliationOptions
): ReconResult[] => {
  const { reconGateway, reconMatchBy, pspRows } = options;
  const results: ReconResult[] = [];
  const internalTxns = allTransactions.filter(t => t.gateway === reconGateway);
  
  const matchedInternalIds = new Set<string>();
  const matchedPspIndices = new Set<number>();

  // 1. Try to match internal transactions to PSP rows
  internalTxns.forEach(t => {
    let matchIdx = -1;

    if (reconMatchBy === 'Transaction ID') {
      matchIdx = pspRows.findIndex((p, idx) => !matchedPspIndices.has(idx) && p['Transaction ID'] === t.txnId);
    } else if (reconMatchBy === 'PSP Reference ID') {
      matchIdx = pspRows.findIndex((p, idx) => !matchedPspIndices.has(idx) && p['PSP Reference ID'] === `PSP-${t.txnId.split('-')[1]}`);
    } else if (reconMatchBy === 'Amount + Date') {
      matchIdx = pspRows.findIndex((p, idx) => {
        if (matchedPspIndices.has(idx)) return false;
        const pDate = new Date(p['Date']);
        const tDate = new Date(t.timestamp);
        const sameDay = pDate.toDateString() === tDate.toDateString();
        const sameAmount = Math.abs(p['Amount'] - t.amount) < 0.01;
        return sameDay && sameAmount;
      });
    }

    if (matchIdx !== -1) {
      const match = pspRows[matchIdx];
      matchedPspIndices.add(matchIdx);
      matchedInternalIds.add(t.id);

      const diff = Math.abs(match['Amount'] - t.amount);
      results.push({
        id: `recon-${t.id}`,
        status: diff > 0.01 ? 'Amount diff' : 'Matched',
        txnId: t.txnId,
        pspRefId: match['PSP Reference ID'] || `PSP-${t.txnId.split('-')[1]}`,
        timestamp: t.timestamp,
        client: t.client,
        gateway: t.gateway,
        ourAmount: t.amount,
        pspAmount: match['Amount'],
        difference: diff
      });
    } else {
      // Missing in PSP
      results.push({
        id: `recon-missing-${t.id}`,
        status: 'Missing in PSP',
        txnId: t.txnId,
        timestamp: t.timestamp,
        client: t.client,
        gateway: t.gateway,
        ourAmount: t.amount,
        difference: t.amount
      });
    }
  });

  // 2. Find PSP rows not matched to internal
  pspRows.forEach((p, idx) => {
    if (!matchedPspIndices.has(idx)) {
      results.push({
        id: `recon-not-in-sys-${idx}`,
        status: 'Not in system',
        pspRefId: p['PSP Reference ID'] || `PSP-UNKNOWN-${idx}`,
        timestamp: new Date(p['Date'] || new Date()),
        gateway: reconGateway as any,
        pspAmount: p['Amount'],
        difference: p['Amount']
      });
    }
  });

  return results;
};
