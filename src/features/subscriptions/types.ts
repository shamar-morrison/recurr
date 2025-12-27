export type SubscriptionCategory = 'Streaming' | 'Music' | 'Software' | 'Utilities' | 'Other';

export type BillingCycle = 'Monthly' | 'Yearly';

export type CurrencyCode = string;

export type Subscription = {
  id: string;
  userId: string;
  serviceName: string;
  category: SubscriptionCategory;
  amount: number;
  currency: CurrencyCode;
  billingCycle: BillingCycle;
  billingDay: number;
  notes?: string;
  isArchived?: boolean;
  createdAt: number;
  updatedAt: number;
};

export type SubscriptionInput = Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'> & {
  id?: string;
};

export type SubscriptionListItem = {
  id: string;
  serviceName: string;
  category: SubscriptionCategory;
  amount: number;
  currency: CurrencyCode;
  billingCycle: BillingCycle;
  billingDay: number;
  notes?: string;
  monthlyEquivalent: number;
  nextBillingDateISO: string;
  nextBillingInDays: number;
};

export const SUBSCRIPTION_CATEGORIES: SubscriptionCategory[] = [
  'Streaming',
  'Music',
  'Software',
  'Utilities',
  'Other',
];

export const BILLING_CYCLES: BillingCycle[] = ['Monthly', 'Yearly'];
