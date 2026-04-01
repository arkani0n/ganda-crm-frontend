import { Transaction, TransactionFilters } from '../../types';

export const filterTransactions = (
  data: Transaction[],
  filters: TransactionFilters,
  searchQuery: string = ''
) => {
  const { dateRange, gateways, brands, status } = filters;
  const q = searchQuery.toLowerCase();
  
  return data.filter(t => {
    const start = dateRange.start || new Date(0);
    const end = dateRange.end || new Date();
    const dateMatch = t.timestamp >= start && t.timestamp <= end;
    const gatewayMatch = gateways.length === 0 || gateways.includes('All') || gateways.includes(t.gateway);
    const brandMatch = brands.length === 0 || brands.includes('All') || brands.includes(t.brand);
    const statusMatch = status === 'All' || t.status === status || t.recon === status;
    
    const searchMatch = !q || 
      t.txnId.toLowerCase().includes(q) || 
      t.client.toLowerCase().includes(q) || 
      t.gateway.toLowerCase().includes(q) ||
      t.brand.toLowerCase().includes(q);

    return dateMatch && gatewayMatch && brandMatch && statusMatch && searchMatch;
  });
};

export const filterByStatus = (data: Transaction[], status: string) => {
  if (status === 'All') return data;
  return data.filter(t => t.status === status || t.recon === status);
};

export const searchTransactions = (data: Transaction[], query: string) => {
  if (!query) return data;
  const q = query.toLowerCase();
  return data.filter(t => 
    t.txnId.toLowerCase().includes(q) || 
    t.client.toLowerCase().includes(q) || 
    t.gateway.toLowerCase().includes(q) ||
    t.brand.toLowerCase().includes(q)
  );
};
