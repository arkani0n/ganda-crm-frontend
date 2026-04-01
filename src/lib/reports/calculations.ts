import { format } from 'date-fns';
import { Transaction } from '../../types';

export const calculateKPIs = (data: Transaction[]) => {
  const totalVolume = data.reduce((acc, t) => acc + t.amount, 0);
  const totalCount = data.length;
  const avgTicket = totalCount > 0 ? totalVolume / totalCount : 0;
  const completed = data.filter(t => t.status === 'Completed').length;
  const successRate = totalCount > 0 ? (completed / totalCount) * 100 : 0;
  const failedDisputed = data.filter(t => t.status === 'Failed' || t.status === 'Disputed').length;
  const failedDisputedRate = totalCount > 0 ? (failedDisputed / totalCount) * 100 : 0;
  const matched = data.filter(t => t.recon === 'Matched').length;
  const reconRate = totalCount > 0 ? (matched / totalCount) * 100 : 0;
  return { totalVolume, totalCount, avgTicket, successRate, failedDisputed, failedDisputedRate, reconRate };
};

export const getTrendValue = (curr: number, prev: number) => {
  if (prev === 0) return curr > 0 ? 100 : 0;
  return ((curr - prev) / prev) * 100;
};

export const groupByDay = (data: Transaction[]) => {
  const groups: Record<string, { date: string, volume: number, count: number }> = {};
  data.forEach(t => {
    const d = format(t.timestamp, 'yyyy-MM-dd');
    if (!groups[d]) groups[d] = { date: d, volume: 0, count: 0 };
    groups[d].volume += t.amount;
    groups[d].count += 1;
  });
  return Object.values(groups).sort((a, b) => a.date.localeCompare(b.date));
};

export const getGatewayBreakdown = (data: Transaction[]) => {
  const gwMap: Record<string, { name: string, volume: number, count: number }> = {};
  const totalVol = data.reduce((acc, t) => acc + t.amount, 0);
  
  data.forEach((t) => {
    if (!gwMap[t.gateway]) gwMap[t.gateway] = { name: t.gateway, volume: 0, count: 0 };
    gwMap[t.gateway].volume += t.amount;
    gwMap[t.gateway].count += 1;
  });
  
  return Object.values(gwMap).map(g => ({
    ...g,
    percentage: totalVol > 0 ? (g.volume / totalVol) * 100 : 0
  })).sort((a, b) => b.volume - a.volume);
};

export const getTopClients = (data: Transaction[], limit = 10) => {
  const clientMap: Record<string, { name: string, volume: number, count: number, completed: number }> = {};
  data.forEach((t) => {
    if (!clientMap[t.client]) clientMap[t.client] = { name: t.client, volume: 0, count: 0, completed: 0 };
    clientMap[t.client].volume += t.amount;
    clientMap[t.client].count += 1;
    if (t.status === 'Completed') clientMap[t.client].completed += 1;
  });
  
  return Object.values(clientMap)
    .map(c => ({
      ...c,
      successRate: c.count > 0 ? (c.completed / c.count) * 100 : 0,
      avgTicket: c.count > 0 ? c.volume / c.count : 0
    }))
    .sort((a, b) => b.volume - a.volume)
    .slice(0, limit);
};
