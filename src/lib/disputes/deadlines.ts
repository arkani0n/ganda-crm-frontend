import { addDays, differenceInHours, differenceInDays } from 'date-fns';
import { PSPChargebackRules, DisputeReasonCategory } from '../../types';

export function calculateDeadline(
  openedDate: Date,
  rules: PSPChargebackRules | undefined,
  reasonCategory: DisputeReasonCategory
): Date {
  const defaultWindow = 30; // fallback if no PSP rules
  if (!rules) {
    return addDays(openedDate, defaultWindow);
  }
  const windowDays = rules.reasonOverrides?.[reasonCategory] ?? rules.defaultResponseWindowDays;
  return addDays(openedDate, windowDays);
}

export type DeadlineUrgency = 'safe' | 'warning' | 'urgent' | 'expired';

export function getDeadlineUrgency(deadline: Date, now: Date = new Date()): DeadlineUrgency {
  const hoursLeft = differenceInHours(deadline, now);
  if (hoursLeft <= 0) return 'expired';
  if (hoursLeft <= 48) return 'urgent';
  const daysLeft = differenceInDays(deadline, now);
  if (daysLeft <= 7) return 'warning';
  return 'safe';
}

export function getDeadlineLabel(deadline: Date, now: Date = new Date()): string {
  const hoursLeft = differenceInHours(deadline, now);
  if (hoursLeft <= 0) return 'Expired';
  if (hoursLeft <= 48) return `${hoursLeft}h left`;
  const daysLeft = differenceInDays(deadline, now);
  return `${daysLeft}d left`;
}
