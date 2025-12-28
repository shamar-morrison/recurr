import {
  BillingCycle,
  Subscription,
  SubscriptionListItem,
} from '@/src/features/subscriptions/types';

export function clampBillingDay(day: number): number {
  const safe = Math.round(day);
  return Math.max(1, Math.min(31, safe));
}

export function monthlyEquivalent(amount: number, cycle: BillingCycle): number {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  if (cycle === 'Yearly') return safeAmount / 12;
  if (cycle === 'One-Time') return 0;
  return safeAmount;
}

export function nextBillingDate(from: Date, billingDay: number): Date {
  const day = clampBillingDay(billingDay);
  const y = from.getFullYear();
  const m = from.getMonth();

  const candidate = new Date(y, m, 1);
  candidate.setDate(day);
  candidate.setHours(0, 0, 0, 0);

  const today = new Date(from);
  today.setHours(0, 0, 0, 0);

  if (candidate.getTime() >= today.getTime()) return candidate;

  const next = new Date(y, m + 1, 1);
  next.setDate(day);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function diffDays(from: Date, to: Date): number {
  const a = new Date(from);
  const b = new Date(to);
  a.setHours(0, 0, 0, 0);
  b.setHours(0, 0, 0, 0);
  const ms = b.getTime() - a.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

export function toListItem(sub: Subscription, now: Date = new Date()): SubscriptionListItem {
  let next: Date;
  if (sub.billingCycle === 'One-Time') {
    // For one-time payments, use the startDate (payment date) as the "next billing date"
    next = sub.startDate ? new Date(sub.startDate) : now;
  } else {
    next = nextBillingDate(now, sub.billingDay);
  }
  return {
    id: sub.id,
    serviceName: sub.serviceName,
    category: sub.category,
    amount: sub.amount,
    currency: sub.currency,
    billingCycle: sub.billingCycle,
    billingDay: sub.billingDay,
    notes: sub.notes,
    monthlyEquivalent: monthlyEquivalent(sub.amount, sub.billingCycle),
    nextBillingDateISO: next.toISOString(),
    nextBillingInDays: diffDays(now, next),
  };
}
