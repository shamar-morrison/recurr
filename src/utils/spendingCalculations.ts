import { generatePaymentHistory } from '@/src/features/subscriptions/subscriptionsUtils';
import { Subscription, SubscriptionCategory } from '@/src/features/subscriptions/types';
import { convertCurrency } from '@/src/lib/currencyConversion';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface SpendingDataPoint {
  month: string; // e.g., "Jan", "Feb"
  year: number;
  amount: number;
  fullLabel: string; // e.g., "January 2025"
}

export interface CategorySpending {
  category: SubscriptionCategory;
  amount: number;
  percentage: number;
  customColor?: string;
}

export type DateRangeType = '6months' | 'ytd' | 'year' | 'alltime';

export interface DateRange {
  startDate: Date;
  endDate: Date;
  label: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Date Range Utilities
// ─────────────────────────────────────────────────────────────────────────────

const MAX_YEARS_ALL_TIME = 5;

/**
 * Get date range based on selection type.
 */
export function getDateRange(rangeType: DateRangeType, now: Date = new Date()): DateRange {
  const endDate = new Date(now);
  endDate.setHours(23, 59, 59, 999);

  let startDate: Date;
  let label: string;

  switch (rangeType) {
    case '6months': {
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 5);
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      label = 'Last 6 Months';
      break;
    }
    case 'ytd': {
      startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      label = 'Year to Date';
      break;
    }
    case 'year': {
      startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      endDate.setFullYear(now.getFullYear(), 11, 31);
      label = `${now.getFullYear()}`;
      break;
    }
    case 'alltime': {
      startDate = new Date(now);
      startDate.setFullYear(startDate.getFullYear() - MAX_YEARS_ALL_TIME);
      startDate.setMonth(0, 1);
      startDate.setHours(0, 0, 0, 0);
      label = 'All Time';
      break;
    }
    default:
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 5);
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      label = 'Last 6 Months';
  }

  return { startDate, endDate, label };
}

// ─────────────────────────────────────────────────────────────────────────────
// Spending Calculations
// ─────────────────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
const MONTH_FULL_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/**
 * Calculate spending history for a given date range, grouped by month.
 * When subscriptions use mixed currencies, amounts are converted to the
 * primaryCurrency before being summed.
 */
export function calculateSpendingByMonth(
  subscriptions: Subscription[],
  startDate: Date,
  endDate: Date,
  options: { includePaused?: boolean; primaryCurrency?: string } = {}
): SpendingDataPoint[] {
  const { includePaused = false, primaryCurrency } = options;

  // Filter subscriptions based on status
  const filteredSubs = subscriptions.filter((sub) => {
    if (sub.status === 'Archived') return false;
    if (sub.status === 'Paused' && !includePaused) return false;
    return true;
  });

  // Detect mixed currencies and determine target currency
  const currencyInfo = detectMixedCurrencies(filteredSubs);
  const targetCurrency = primaryCurrency ?? currencyInfo.primaryCurrency;

  // Build month buckets
  const monthBuckets = new Map<
    string,
    { month: string; year: number; amount: number; fullLabel: string }
  >();

  // Initialize all months in range
  const current = new Date(startDate);
  current.setDate(1);
  while (current <= endDate) {
    const key = `${current.getFullYear()}-${current.getMonth()}`;
    monthBuckets.set(key, {
      month: MONTH_NAMES[current.getMonth()],
      year: current.getFullYear(),
      amount: 0,
      fullLabel: `${MONTH_FULL_NAMES[current.getMonth()]} ${current.getFullYear()}`,
    });
    current.setMonth(current.getMonth() + 1);
  }

  // Aggregate payments by month, converting to target currency if needed
  for (const sub of filteredSubs) {
    const payments = generatePaymentHistory(sub, {
      now: endDate,
      futureCount: 0,
      maxPastCount: 500, // Large enough for 5 years
    });

    for (const payment of payments) {
      if (!payment.isPast) continue;
      if (payment.date < startDate || payment.date > endDate) continue;

      const key = `${payment.date.getFullYear()}-${payment.date.getMonth()}`;
      const bucket = monthBuckets.get(key);
      if (bucket) {
        // Convert payment amount to target currency if currencies differ
        const convertedAmount =
          payment.currency.toUpperCase() === targetCurrency.toUpperCase()
            ? payment.amount
            : convertCurrency(payment.amount, payment.currency, targetCurrency);
        bucket.amount += convertedAmount;
      }
    }
  }

  // Convert to array and sort chronologically
  return Array.from(monthBuckets.values()).sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return MONTH_NAMES.indexOf(a.month) - MONTH_NAMES.indexOf(b.month);
  });
}

/**
 * Calculate spending aggregated by category.
 * When subscriptions use mixed currencies, amounts are converted to the
 * primaryCurrency before being summed.
 */
export function calculateSpendingByCategory(
  subscriptions: Subscription[],
  startDate: Date,
  endDate: Date,
  options: {
    includePaused?: boolean;
    customCategories?: Array<{ name: string; color?: string }>;
    primaryCurrency?: string;
  } = {}
): CategorySpending[] {
  const { includePaused = false, customCategories = [], primaryCurrency } = options;

  // Filter subscriptions
  const filteredSubs = subscriptions.filter((sub) => {
    if (sub.status === 'Archived') return false;
    if (sub.status === 'Paused' && !includePaused) return false;
    return true;
  });

  // Detect mixed currencies and determine target currency
  const currencyInfo = detectMixedCurrencies(filteredSubs);
  const targetCurrency = primaryCurrency ?? currencyInfo.primaryCurrency;

  // Aggregate by category
  const categoryTotals = new Map<SubscriptionCategory, number>();

  for (const sub of filteredSubs) {
    const payments = generatePaymentHistory(sub, {
      now: endDate,
      futureCount: 0,
      maxPastCount: 500,
    });

    let subTotal = 0;
    for (const payment of payments) {
      if (!payment.isPast) continue;
      if (payment.date < startDate || payment.date > endDate) continue;
      // Convert payment amount to target currency if currencies differ
      const convertedAmount =
        payment.currency.toUpperCase() === targetCurrency.toUpperCase()
          ? payment.amount
          : convertCurrency(payment.amount, payment.currency, targetCurrency);
      subTotal += convertedAmount;
    }

    const current = categoryTotals.get(sub.category) ?? 0;
    categoryTotals.set(sub.category, current + subTotal);
  }

  // Calculate total for percentages
  let total = 0;
  for (const amount of categoryTotals.values()) {
    total += amount;
  }

  // Convert to array with percentages
  const result: CategorySpending[] = [];
  for (const [category, amount] of categoryTotals) {
    const customCat = customCategories.find((c) => c.name === category);
    result.push({
      category,
      amount,
      percentage: total > 0 ? (amount / total) * 100 : 0,
      customColor: customCat?.color,
    });
  }

  // Sort by amount (highest first)
  return result.sort((a, b) => b.amount - a.amount);
}

/**
 * Calculate total spending for a date range.
 */
export function calculateTotalSpending(
  subscriptions: Subscription[],
  startDate: Date,
  endDate: Date,
  options: { includePaused?: boolean } = {}
): number {
  const monthlyData = calculateSpendingByMonth(subscriptions, startDate, endDate, options);
  return monthlyData.reduce((sum, point) => sum + point.amount, 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// Currency Utilities
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Detect if subscriptions use multiple different currencies.
 */
export function detectMixedCurrencies(subscriptions: Subscription[]): {
  hasMixedCurrencies: boolean;
  currencies: string[];
  primaryCurrency: string;
} {
  const currencies = new Set<string>();

  for (const sub of subscriptions) {
    if (sub.status !== 'Archived' && sub.currency) {
      currencies.add(sub.currency.toUpperCase());
    }
  }

  const currencyList = Array.from(currencies);
  return {
    hasMixedCurrencies: currencyList.length > 1,
    currencies: currencyList,
    primaryCurrency: currencyList[0] ?? 'USD',
  };
}
