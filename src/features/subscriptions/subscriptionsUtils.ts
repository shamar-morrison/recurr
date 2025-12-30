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
    } else {
      // Weekly / Bi-weekly
      const weeks = Math.floor(diffTime / (7 * DAY_MS));
      if (weeks > 1) {
        candidate.setDate(candidate.getDate() + (weeks - 1) * 7);
      }
    }
  }

  // Iterate forward until we find a date >= today
  while (candidate.getTime() < today.getTime()) {
    switch (cycle) {
      case 'Weekly':
        candidate.setDate(candidate.getDate() + 7);
        break;
      case 'Bi-weekly':
        candidate.setDate(candidate.getDate() + 14);
        break;
      case 'Monthly':
        candidate.setMonth(candidate.getMonth() + 1);
        break;
      case 'Quarterly':
        candidate.setMonth(candidate.getMonth() + 3);
        break;
      case 'Semiannual':
        candidate.setMonth(candidate.getMonth() + 6);
        break;
      case 'Yearly':
        candidate.setFullYear(candidate.getFullYear() + 1);
        break;
      default:
        // Should not happen for valid recurring cycles
        return candidate;
    }
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
