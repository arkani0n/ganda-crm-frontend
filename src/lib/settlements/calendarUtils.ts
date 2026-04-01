import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  format,
  startOfDay,
  isAfter,
  isBefore,
  differenceInDays
} from 'date-fns';
import { Settlement, SettlementStatus } from '../../types';

export const getCalendarDays = (date: Date) => {
  const start = startOfWeek(startOfMonth(date), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(date), { weekStartsOn: 1 });
  
  return eachDayOfInterval({ start, end });
};

export const getWeekDays = (date: Date) => {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  
  return eachDayOfInterval({ start, end });
};

export const getSettlementsForDay = (settlements: Settlement[], day: Date) => {
  return settlements.filter(s => isSameDay(new Date(s.expectedDate), day));
};

export const getDerivedStatus = (settlement: Settlement): SettlementStatus => {
  if (settlement.status === 'Settled' || settlement.status === 'Partial' || settlement.status === 'Disputed') {
    return settlement.status;
  }
  
  const now = startOfDay(new Date());
  const expected = startOfDay(new Date(settlement.expectedDate));
  const diff = differenceInDays(now, expected);
  
  if (diff > 3) return 'Overdue';
  if (diff > 0 || isSameDay(now, expected)) return 'Pending';
  
  return 'Scheduled';
};

export const formatCurrency = (amount: number, currency: string = 'EUR') => {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  }).format(amount);
};
