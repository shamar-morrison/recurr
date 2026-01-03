import { useCallback, useEffect, useMemo, useState } from 'react';

import { ServiceSelection } from '@/src/components/ServiceSelectorModal';
import { CURRENCIES } from '@/src/constants/currencies';
import { getServiceByName, getServiceDomain } from '@/src/constants/services';
import { useAuth } from '@/src/features/auth/AuthProvider';
import {
  useDeleteSubscriptionMutation,
  useSubscriptionQuery,
  useUpsertSubscriptionMutation,
} from '@/src/features/subscriptions/subscriptionsHooks';
import { clampBillingDay } from '@/src/features/subscriptions/subscriptionsUtils';
import {
  BillingCycle,
  PaymentMethod,
  REMINDER_OPTIONS,
  ReminderDays,
  ReminderHour,
  SubscriptionCategory,
} from '@/src/features/subscriptions/types';
import { getDefaultPriceInCurrency } from '@/src/lib/currencyConversion';

interface UseSubscriptionFormOptions {
  editingId?: string;
}

/**
 * Custom hook for managing subscription form state.
 * Handles form fields, validation, and data loading.
 */
export function useSubscriptionForm({ editingId }: UseSubscriptionFormOptions = {}) {
  const { settings, user } = useAuth();
  const userId = user?.uid ?? '';
  const upsertMutation = useUpsertSubscriptionMutation();
  const deleteMutation = useDeleteSubscriptionMutation();

  // Load specific subscription (decoupled from list)
  const subscriptionQuery = useSubscriptionQuery(editingId);
  const existing = subscriptionQuery.data ?? null;

  // Default currency
  const defaultCurrency = useMemo(() => {
    try {
      const resolved = new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'USD',
      }).resolvedOptions().currency;
      return settings.currency || resolved || 'USD';
    } catch (e) {
      console.log('[useSubscriptionForm] defaultCurrency failed', e);
      return settings.currency || 'USD';
    }
  }, [settings.currency]);

  // Normalize date to midnight
  const normalizeToMidnight = useCallback((date: Date): Date => {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  }, []);

  // Form state
  const [serviceName, setServiceName] = useState<string>('');
  const [category, setCategory] = useState<SubscriptionCategory>('Streaming');
  const [amountText, setAmountText] = useState<string>('');
  const [hasManuallyEditedAmount, setHasManuallyEditedAmount] = useState(false);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('Monthly');
  const [billingDayText, setBillingDayText] = useState<string>('1');
  const [notes, setNotes] = useState<string>('');
  const [currency, setCurrency] = useState<string>(defaultCurrency);
  const [startDate, setStartDate] = useState<Date>(() => normalizeToMidnight(new Date()));
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | undefined>(undefined);
  const [reminderDays, setReminderDays] = useState<ReminderDays>(null);
  const [reminderHour, setReminderHour] = useState<ReminderHour>(12);

  // Currency symbol
  const currencySymbol = useMemo(() => {
    return CURRENCIES.find((c) => c.code === currency)?.symbol ?? '$';
  }, [currency]);

  // Service domain for logo
  const serviceDomain = useMemo(() => {
    return serviceName ? getServiceDomain(serviceName) : undefined;
  }, [serviceName]);

  // Load existing subscription data
  useEffect(() => {
    if (!editingId) return;
    if (!existing) return;

    setServiceName(existing.serviceName ?? '');
    setCategory(existing.category ?? 'Other');
    setAmountText(existing.amount != null ? String(existing.amount) : '');
    setBillingCycle(existing.billingCycle ?? 'Monthly');
    setBillingDayText(existing.billingDay != null ? String(existing.billingDay) : '1');
    setNotes(existing.notes ?? '');
    setCurrency(existing.currency ?? defaultCurrency);
    setStartDate(
      existing.startDate
        ? normalizeToMidnight(new Date(existing.startDate))
        : normalizeToMidnight(new Date())
    );
    setEndDate(existing.endDate ? normalizeToMidnight(new Date(existing.endDate)) : null);
    setPaymentMethod(existing.paymentMethod);

    // Validate reminderDays against allowed options
    const validReminderDays = REMINDER_OPTIONS.find((o) => o.value === existing.reminderDays);
    setReminderDays(validReminderDays ? validReminderDays.value : null);
    setReminderHour(existing.reminderHour ?? 12);
    setHasManuallyEditedAmount(false);
  }, [defaultCurrency, editingId, existing, normalizeToMidnight]);

  // Computed values
  const amount = useMemo(() => {
    const n = Number(amountText.replace(/[^0-9.]/g, ''));
    return Number.isFinite(n) ? n : 0;
  }, [amountText]);

  const billingDay = useMemo(() => {
    const n = Number(billingDayText.replace(/[^0-9]/g, ''));
    return clampBillingDay(Number.isFinite(n) ? n : 1);
  }, [billingDayText]);

  // Date validation error
  const dateError = useMemo(() => {
    if (!startDate || !endDate) return null;

    if (endDate < startDate) {
      return 'End date cannot be before start date.';
    }

    // Check that end date is at least one billing cycle after start date
    const minEndDate = new Date(startDate);
    let cycleName = '';

    switch (billingCycle) {
      case 'Weekly':
        minEndDate.setDate(minEndDate.getDate() + 7);
        cycleName = 'one week';
        break;
      case 'Bi-weekly':
        minEndDate.setDate(minEndDate.getDate() + 14);
        cycleName = 'two weeks';
        break;
      case 'Monthly':
        minEndDate.setMonth(minEndDate.getMonth() + 1);
        cycleName = 'one month';
        break;
      case 'Quarterly':
        minEndDate.setMonth(minEndDate.getMonth() + 3);
        cycleName = 'three months';
        break;
      case 'Semiannual':
        minEndDate.setMonth(minEndDate.getMonth() + 6);
        cycleName = 'six months';
        break;
      case 'Yearly':
        minEndDate.setFullYear(minEndDate.getFullYear() + 1);
        cycleName = 'one year';
        break;
      case 'One-Time':
        // No minimum duration for one-time payments
        return null;
    }

    if (endDate < minEndDate) {
      return `End date must be at least ${cycleName} after start date.`;
    }

    return null;
  }, [startDate, endDate, billingCycle]);

  // Form validation
  const validate = useCallback((): string | null => {
    if (!serviceName.trim()) return 'Service name is required.';
    if (!Number.isFinite(amount) || amount <= 0) return 'Enter a billing amount greater than 0.';
    if (billingCycle !== 'One-Time') {
      if (!Number.isFinite(billingDay) || billingDay < 1 || billingDay > 31)
        return 'Billing day must be between 1 and 31.';
      if (dateError) return dateError;
    }
    return null;
  }, [amount, billingCycle, billingDay, dateError, serviceName]);

  // Check for unsaved changes
  const hasChanges = useMemo(() => {
    if (!existing) return false;
    return (
      serviceName.trim() !== existing.serviceName ||
      category !== existing.category ||
      Math.abs(amount - existing.amount) > 0.001 ||
      currency !== existing.currency ||
      billingCycle !== existing.billingCycle ||
      (billingCycle !== 'One-Time' && billingDay !== existing.billingDay) ||
      (notes || '') !== (existing.notes || '') ||
      startDate.getTime() !== (existing.startDate ?? normalizeToMidnight(new Date()).getTime()) ||
      (endDate ? endDate.getTime() : undefined) !== existing.endDate ||
      paymentMethod !== existing.paymentMethod ||
      reminderDays !== existing.reminderDays ||
      reminderHour !== existing.reminderHour
    );
  }, [
    amount,
    billingCycle,
    billingDay,
    category,
    currency,
    endDate,
    existing,
    normalizeToMidnight,
    notes,
    paymentMethod,
    reminderDays,
    reminderHour,
    serviceName,
    startDate,
  ]);

  // Handlers
  const handleServiceSelect = useCallback(
    (service: ServiceSelection) => {
      setServiceName(service.name);
      setCategory(service.category);

      // Pre-fill cost from default price (only if user hasn't manually edited)
      if (!editingId && !hasManuallyEditedAmount) {
        const serviceData = getServiceByName(service.name);
        if (serviceData?.defaultPriceUSD) {
          const convertedPrice = getDefaultPriceInCurrency(serviceData.defaultPriceUSD, currency);
          if (convertedPrice !== undefined) {
            setAmountText(String(convertedPrice));
          }
        } else {
          setAmountText('');
        }
      }
    },
    [editingId, hasManuallyEditedAmount, currency]
  );

  const handleCurrencySelect = useCallback(
    (currencyCode: string) => {
      setCurrency(currencyCode);

      // Recalculate price for new currency (only if user hasn't manually edited)
      if (!editingId && !hasManuallyEditedAmount && serviceName) {
        const serviceData = getServiceByName(serviceName);
        if (serviceData?.defaultPriceUSD) {
          const convertedPrice = getDefaultPriceInCurrency(
            serviceData.defaultPriceUSD,
            currencyCode
          );
          if (convertedPrice !== undefined) {
            setAmountText(String(convertedPrice));
          }
        }
      }
    },
    [editingId, hasManuallyEditedAmount, serviceName]
  );

  const handleAmountChange = useCallback((text: string) => {
    setAmountText(text);
    setHasManuallyEditedAmount(true);
  }, []);

  // Title based on billing cycle and editing state
  const title = useMemo(() => {
    if (billingCycle === 'One-Time') {
      return existing ? 'Edit One-Time Payment' : 'New One-Time Payment';
    }
    return existing ? 'Edit Subscription' : 'New Subscription';
  }, [billingCycle, existing]);

  // Loading/not found states
  const showLoading = Boolean(editingId) && subscriptionQuery.isLoading;
  const showNotFound = Boolean(editingId) && !subscriptionQuery.isLoading && !existing;

  return {
    // Data
    userId,
    existing,
    subscriptionQuery,
    upsertMutation,
    deleteMutation,
    defaultCurrency,
    normalizeToMidnight,

    // Form fields
    serviceName,
    setServiceName,
    category,
    setCategory,
    amountText,
    handleAmountChange,
    billingCycle,
    setBillingCycle,
    billingDayText,
    setBillingDayText,
    notes,
    setNotes,
    currency,
    setCurrency,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    paymentMethod,
    setPaymentMethod,
    reminderDays,
    setReminderDays,
    reminderHour,
    setReminderHour,

    // Computed values
    amount,
    billingDay,
    currencySymbol,
    serviceDomain,
    dateError,
    title,
    hasChanges,

    // Handlers
    handleServiceSelect,
    handleCurrencySelect,
    validate,

    // States
    showLoading,
    showNotFound,
    canDelete: Boolean(existing),
  };
}
