import {
  BillingCycle,
  PaymentMethod,
  Subscription,
  SubscriptionCategory,
  SubscriptionListItem,
} from '@/src/features/subscriptions/types';

/**
 * Build a subscription payload for create/update operations.
 */
export function buildSubscriptionPayload(
  existing: Subscription | null,
  userId: string,
  base: {
    serviceName: string;
    category: SubscriptionCategory;
    amount: number;
    currency: string;
    billingCycle: Subscription['billingCycle'];
    billingDay: number;
    notes?: string;
    startDate?: number;
    endDate?: number;
    paymentMethod?: PaymentMethod;
    reminderDays?: number | null;
    reminderHour?: number | null;
    status?: Subscription['status'];
  }
) {
  return {
    id: existing?.id,
    userId: existing?.userId ?? userId,
    serviceName: base.serviceName,
    category: base.category,
    amount: base.amount,
    currency: base.currency,
    billingCycle: base.billingCycle,
    billingDay: base.billingDay,
    notes: base.notes,
    startDate: base.startDate,
    endDate: base.endDate,
    paymentMethod: base.paymentMethod,
    reminderDays: base.reminderDays ?? null,
    reminderHour: base.reminderHour ?? 12,
    isArchived: false,
    status: base.status ?? (existing?.isArchived ? 'Archived' : 'Active'),
  };
}

export function clampBillingDay(day: number): number {
  const safe = Math.round(day);
  return Math.max(1, Math.min(31, safe));
}

export function monthlyEquivalent(amount: number, cycle: BillingCycle): number {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  switch (cycle) {
    case 'Weekly':
      return safeAmount * 4.33;
    case 'Bi-weekly':
      return safeAmount * 2.16;
    case 'Monthly':
      return safeAmount;
    case 'Quarterly':
      return safeAmount / 3;
    case 'Semiannual':
      return safeAmount / 6;
    case 'Yearly':
      return safeAmount / 12;
    case 'One-Time':
      return 0;
    default:
      return safeAmount;
  }
}

/**
 * Advance a date by one billing cycle period.
 * Shared helper used by both nextBillingDate and advanceByBillingCycle.
 *
 * @param date - The date to advance. **Note:** This date is mutated in place.
 * @param cycle - The billing cycle period to advance by.
 */
function applyBillingCycleStep(date: Date, cycle: BillingCycle): void {
  switch (cycle) {
    case 'Weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'Bi-weekly':
      date.setDate(date.getDate() + 14);
      break;
    case 'Monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'Quarterly':
      date.setMonth(date.getMonth() + 3);
      break;
    case 'Semiannual':
      date.setMonth(date.getMonth() + 6);
      break;
    case 'Yearly':
      date.setFullYear(date.getFullYear() + 1);
      break;
    case 'One-Time':
      // No advancement for one-time
      break;
  }
}

export function nextBillingDate(from: Date, cycle: BillingCycle, anchor: Date): Date {
  // One-Time subscriptions don't recur
  if (cycle === 'One-Time') {
    return anchor;
  }

  const today = new Date(from);
  today.setHours(0, 0, 0, 0);

  // Start checking from the anchor date (e.g. startDate or createdAt)
  const candidate = new Date(anchor);
  candidate.setHours(0, 0, 0, 0);

  // Optimize: Jump ahead if anchor is far in the past to avoid thousands of loop iterations
  // This is a rough estimation to get us close to "today"
  if (candidate.getTime() < today.getTime()) {
    // How many ms in a day
    const DAY_MS = 24 * 60 * 60 * 1000;
    const diffTime = today.getTime() - candidate.getTime();

    // Jump forward based on cycle length roughly
    if (cycle === 'Yearly') {
      const yearDiff = today.getFullYear() - candidate.getFullYear();
      if (yearDiff > 1) {
        candidate.setFullYear(candidate.getFullYear() + yearDiff - 1);
      }
    } else if (cycle === 'Monthly' || cycle === 'Quarterly' || cycle === 'Semiannual') {
      const monthDiff =
        (today.getFullYear() - candidate.getFullYear()) * 12 +
        (today.getMonth() - candidate.getMonth());
      if (monthDiff > 1) {
        if (cycle === 'Monthly') candidate.setMonth(candidate.getMonth() + monthDiff - 1);
        if (cycle === 'Quarterly')
          candidate.setMonth(candidate.getMonth() + Math.floor((monthDiff - 1) / 3) * 3);
        if (cycle === 'Semiannual')
          candidate.setMonth(candidate.getMonth() + Math.floor((monthDiff - 1) / 6) * 6);
      }
    } else if (cycle === 'Bi-weekly') {
      const weeks = Math.floor(diffTime / (14 * DAY_MS));
      if (weeks > 1) {
        candidate.setDate(candidate.getDate() + (weeks - 1) * 14);
      }
    } else {
      // Weekly
      const weeks = Math.floor(diffTime / (7 * DAY_MS));
      if (weeks > 1) {
        candidate.setDate(candidate.getDate() + (weeks - 1) * 7);
      }
    }
  }

  // Iterate forward until we find a date >= today
  while (candidate.getTime() < today.getTime()) {
    applyBillingCycleStep(candidate, cycle);
  }

  return candidate;
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

  // Use startDate as anchor, fallback to createdAt (timestamp -> Date)
  const anchor = sub.startDate ? new Date(sub.startDate) : new Date(sub.createdAt);

  // Also respect specific billingDay override if provided for Monthly cycles,
  // but for the new flexible logic we primarily rely on the anchor alignment.
  // Legacy support: if it's Monthly and we have a specific billingDay not matching startDate,
  // we might want to respect it, but generally startDate is the source of truth.
  // For simplicity and consistency, we'll try to sync the anchor to billingDay
  // if it's a Monthly/Yearly cycle and the user explicitly set a billing day separate from start date.
  if ((sub.billingCycle === 'Monthly' || sub.billingCycle === 'Yearly') && sub.billingDay) {
    // Adjust anchor's day of month to match billingDay
    // Careful: billingDay might be 31, but current month only has 30.
    // The Date object auto-rolls over (e.g. Feb 31 -> Mar 3), which might be what we want
    // or we might want to clamp. Existing logic had clampBillingDay.
    // Let's stick to the simpler anchor projection for now as it's more robust for Weekly.
    // If the user wants a specific day, they should set startDate to that day.

    // However, to avoid breaking existing users who only have `billingDay` set and weird `createdAt`:
    // We can force the anchor date's day to be `billingDay` if `startDate` was missing.
    if (!sub.startDate) {
      anchor.setDate(clampBillingDay(sub.billingDay));
    }
  }

  next = nextBillingDate(now, sub.billingCycle, anchor);

  const status = sub.status ?? (sub.isArchived ? 'Archived' : 'Active');

  return {
    id: sub.id,
    serviceName: sub.serviceName,
    category: sub.category,
    amount: sub.amount,
    currency: sub.currency,
    billingCycle: sub.billingCycle,
    billingDay: sub.billingDay,
    notes: sub.notes,
    monthlyEquivalent:
      status === 'Paused' || status === 'Archived'
        ? 0
        : monthlyEquivalent(sub.amount, sub.billingCycle),
    nextBillingDateISO: next.toISOString(),
    nextBillingInDays: diffDays(now, next),
    status,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Payment History Utilities
// ─────────────────────────────────────────────────────────────────────────────

export interface PaymentHistoryEntry {
  date: Date;
  amount: number;
  currency: string;
  isPast: boolean;
}

/**
 * Advance a date by one billing cycle.
 */
function advanceByBillingCycle(date: Date, cycle: BillingCycle): Date {
  const next = new Date(date);
  applyBillingCycleStep(next, cycle);
  return next;
}

/**
 * Generate payment history entries for a subscription.
 * Returns past payments (from startDate to now) and optionally future payments.
 *
 * @param sub - The subscription to generate history for
 * @param options - Configuration options
 * @param options.now - Reference date for "today" (defaults to current date)
 * @param options.futureCount - Number of future payments to include (default: 6)
 * @param options.maxPastCount - Maximum past payments to include (default: 100)
 */
export function generatePaymentHistory(
  sub: Subscription,
  options: {
    now?: Date;
    futureCount?: number;
    maxPastCount?: number;
  } = {}
): PaymentHistoryEntry[] {
  const { now = new Date(), futureCount = 6, maxPastCount = 100 } = options;

  const anchor = sub.startDate ? new Date(sub.startDate) : new Date(sub.createdAt);
  anchor.setHours(0, 0, 0, 0);

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const entries: PaymentHistoryEntry[] = [];

  // One-Time subscriptions have only one payment
  if (sub.billingCycle === 'One-Time') {
    entries.push({
      date: new Date(anchor),
      amount: sub.amount,
      currency: sub.currency,
      isPast: anchor.getTime() <= today.getTime(),
    });
    return entries;
  }

  // Generate past payments
  let current = new Date(anchor);
  while (current.getTime() <= today.getTime() && entries.length < maxPastCount) {
    entries.push({
      date: new Date(current),
      amount: sub.amount,
      currency: sub.currency,
      isPast: true,
    });
    current = advanceByBillingCycle(current, sub.billingCycle);
  }

  // Generate future payments
  let futureAdded = 0;
  while (futureAdded < futureCount) {
    entries.push({
      date: new Date(current),
      amount: sub.amount,
      currency: sub.currency,
      isPast: false,
    });
    current = advanceByBillingCycle(current, sub.billingCycle);
    futureAdded++;
  }

  return entries;
}

/**
 * Calculate the total amount spent on a subscription since start date.
 */
export function calculateTotalSpent(sub: Subscription, now: Date = new Date()): number {
  const payments = countPaymentsMade(sub, now);
  return payments * sub.amount;
}

/**
 * Helper for counting payments in multi-month billing cycles (Quarterly, Semiannual).
 * Computes the last anniversary date with month-end day clamping to handle edge cases
 * like Jan 31 + 3 months → April 30 (not May 1).
 */
function countMultiMonthPayments(anchor: Date, today: Date, periodMonths: number): number {
  const months =
    (today.getFullYear() - anchor.getFullYear()) * 12 + (today.getMonth() - anchor.getMonth());
  const fullPeriods = Math.floor(months / periodMonths);

  // Compute the last anniversary date with clamping to avoid month-end overflow
  const targetYear =
    anchor.getFullYear() + Math.floor((anchor.getMonth() + fullPeriods * periodMonths) / 12);
  const targetMonth = (anchor.getMonth() + fullPeriods * periodMonths) % 12;
  const daysInTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
  const clampedDay = Math.min(anchor.getDate(), daysInTargetMonth);
  const lastAnniversary = new Date(targetYear, targetMonth, clampedDay);

  // Check if today >= last anniversary
  return today >= lastAnniversary ? fullPeriods + 1 : fullPeriods;
}

/**
 * Count the number of payments made since the subscription started.
 */
export function countPaymentsMade(sub: Subscription, now: Date = new Date()): number {
  const anchor = sub.startDate ? new Date(sub.startDate) : new Date(sub.createdAt);
  anchor.setHours(0, 0, 0, 0);

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  // If start date is in the future, no payments made yet
  if (anchor.getTime() > today.getTime()) {
    return 0;
  }

  // One-Time has exactly one payment if the date has passed
  if (sub.billingCycle === 'One-Time') {
    return 1;
  }

  // Count payments by iterating
  let count = 0;

  // Optimization: calculate roughly for efficiency
  const diffMs = today.getTime() - anchor.getTime();
  const DAY_MS = 24 * 60 * 60 * 1000;

  switch (sub.billingCycle) {
    case 'Weekly':
      count = Math.floor(diffMs / (7 * DAY_MS)) + 1;
      break;
    case 'Bi-weekly':
      count = Math.floor(diffMs / (14 * DAY_MS)) + 1;
      break;
    case 'Monthly': {
      const months =
        (today.getFullYear() - anchor.getFullYear()) * 12 + (today.getMonth() - anchor.getMonth());
      // Clamp anchor day to valid day in current month (e.g., Jan 31 -> Feb 28)
      const daysInCurrentMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      const clampedAnchorDay = Math.min(anchor.getDate(), daysInCurrentMonth);
      // Check if we've passed this month's (clamped) billing day
      count = today.getDate() >= clampedAnchorDay ? months + 1 : months;
      break;
    }
    case 'Quarterly':
    case 'Semiannual': {
      count = countMultiMonthPayments(anchor, today, sub.billingCycle === 'Quarterly' ? 3 : 6);
      break;
    }
    case 'Yearly': {
      const years = today.getFullYear() - anchor.getFullYear();
      // Compute the anniversary date for this year with day clamping (e.g., Feb 29 -> Feb 28 in non-leap years)
      const anniversaryMonth = anchor.getMonth();
      const daysInAnniversaryMonth = new Date(
        today.getFullYear(),
        anniversaryMonth + 1,
        0
      ).getDate();
      const clampedAnniversaryDay = Math.min(anchor.getDate(), daysInAnniversaryMonth);
      const anniversaryThisYear = new Date(
        today.getFullYear(),
        anniversaryMonth,
        clampedAnniversaryDay
      );
      // Check if we've passed the (clamped) anniversary this year
      count = today >= anniversaryThisYear ? years + 1 : years;
      break;
    }
    default:
      count = 1;
  }

  return Math.max(1, count); // At least 1 payment if started
}

/**
 * Calculate how long the user has been subscribed.
 * Returns an object with years, months, and days.
 */
export function calculateSubscriptionDuration(
  sub: Subscription,
  now: Date = new Date()
): { years: number; months: number; days: number; formatted: string } {
  const anchor = sub.startDate ? new Date(sub.startDate) : new Date(sub.createdAt);
  anchor.setHours(0, 0, 0, 0);

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  // If start date is in the future
  if (anchor.getTime() > today.getTime()) {
    return { years: 0, months: 0, days: 0, formatted: 'Not started' };
  }

  let years = today.getFullYear() - anchor.getFullYear();
  let months = today.getMonth() - anchor.getMonth();
  let days = today.getDate() - anchor.getDate();

  if (days < 0) {
    months--;
    // Get days in previous month
    const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += prevMonth.getDate();
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  // Format the duration string
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} ${years === 1 ? 'year' : 'years'}`);
  if (months > 0) parts.push(`${months} ${months === 1 ? 'month' : 'months'}`);
  if (days > 0 || parts.length === 0) parts.push(`${days} ${days === 1 ? 'day' : 'days'}`);

  return { years, months, days, formatted: parts.join(', ') };
}

/**
 * Get the most recent payment date for a subscription.
 * Returns null if no payments have been made yet.
 */
export function getLastPaymentDate(sub: Subscription, now: Date = new Date()): Date | null {
  const anchor = sub.startDate ? new Date(sub.startDate) : new Date(sub.createdAt);
  anchor.setHours(0, 0, 0, 0);

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  // If start date is in the future, no payment yet
  if (anchor.getTime() > today.getTime()) {
    return null;
  }

  // One-Time: the start date is the only payment
  if (sub.billingCycle === 'One-Time') {
    return new Date(anchor);
  }

  // Optimization: use countPaymentsMade to jump close to the last payment
  // instead of iterating from anchor (could be hundreds of iterations for old subscriptions)
  const paymentCount = countPaymentsMade(sub, now);
  if (paymentCount <= 0) {
    return null;
  }

  // Jump forward (paymentCount - 1) cycles from anchor to get near the last payment
  let lastPayment = new Date(anchor);
  for (let i = 1; i < paymentCount; i++) {
    applyBillingCycleStep(lastPayment, sub.billingCycle);
  }

  // Fine-tune: iterate forward in case of any edge cases with date boundaries
  let next = advanceByBillingCycle(lastPayment, sub.billingCycle);
  while (next.getTime() <= today.getTime()) {
    lastPayment = new Date(next);
    next = advanceByBillingCycle(next, sub.billingCycle);
  }

  return lastPayment;
}
