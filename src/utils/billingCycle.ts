import type { BillingCycle } from '@/src/features/subscriptions/types';

/**
 * Human-readable labels for each billing cycle.
 * Provides natural phrasing (e.g., "Weekly" instead of "Every 1 week").
 */
const BILLING_CYCLE_LABELS: Record<BillingCycle, string> = {
  'One-Time': 'One-Time',
  Weekly: 'Weekly',
  'Bi-weekly': 'Every 2 weeks',
  Monthly: 'Monthly',
  Quarterly: 'Every 3 months',
  Semiannual: 'Every 6 months',
  Yearly: 'Yearly',
};

/**
 * Returns a human-readable label for the given billing cycle.
 *
 * @param cycle - The billing cycle enum value
 * @returns Human-readable billing cycle label
 */
export function getBillingCycleLabel(cycle: BillingCycle): string {
  return BILLING_CYCLE_LABELS[cycle] ?? cycle;
}
