export type SubscriptionCategory =
  | 'Streaming'
  | 'Music'
  | 'Software'
  | 'Utilities'
  | 'Health'
  | 'Food'
  | 'Education'
  | 'Shopping'
  | 'AI'
  | 'Other';

export type BillingCycle = 'Monthly' | 'Yearly' | 'One-Time';

export type CurrencyCode = string;

export type PaymentMethod =
  | 'Credit Card'
  | 'Debit Card'
  | 'PayPal'
  | 'Apple Pay'
  | 'Google Pay'
  | 'Bank Transfer'
  | 'Cash'
  | 'Other';

export type Subscription = {
  id: string;
  userId: string;
  serviceName: string;
  category: SubscriptionCategory;
  amount: number;
  currency: CurrencyCode;
  billingCycle: BillingCycle;
  billingDay: number;
  startDate?: number;
  endDate?: number;
  paymentMethod?: PaymentMethod;
  notes?: string;
  isArchived?: boolean;
  reminderDays?: number | null; // Days before billing to remind (null = no reminder)
  notificationId?: string | null; // Scheduled notification identifier
  createdAt: number;
  updatedAt: number;
};

export const REMINDER_OPTIONS = [
  { label: 'None', value: null },
  { label: '1 day before', value: 1 },
  { label: '2 days before', value: 2 },
  { label: '3 days before', value: 3 },
  { label: '1 week before', value: 7 },
  { label: '2 weeks before', value: 14 },
  { label: '1 month before', value: 30 },
] as const;

export type ReminderDays = (typeof REMINDER_OPTIONS)[number]['value'];

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
  'Health',
  'Food',
  'Education',
  'Shopping',
  'AI',
  'Other',
];

export const BILLING_CYCLES: BillingCycle[] = ['Monthly', 'Yearly', 'One-Time'];

export const PAYMENT_METHODS: PaymentMethod[] = [
  'Credit Card',
  'Debit Card',
  'PayPal',
  'Apple Pay',
  'Google Pay',
  'Bank Transfer',
  'Cash',
  'Other',
];
