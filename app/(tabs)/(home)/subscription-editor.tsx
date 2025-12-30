import DateTimePicker from '@react-native-community/datetimepicker';
import { router, Stack, useLocalSearchParams } from 'expo-router';

import { AppColors, CATEGORY_COLORS } from '@/constants/colors';
import { CurrencySelectorModal } from '@/src/components/CurrencySelectorModal';
import { FrequencySelectorModal } from '@/src/components/FrequencySelectorModal';
import { PAYMENT_METHOD_CONFIG, PaymentMethodModal } from '@/src/components/PaymentMethodModal';
import { ReminderSelectorModal } from '@/src/components/ReminderSelectorModal';
import { ReminderTimeSelectorModal } from '@/src/components/ReminderTimeSelectorModal';
import { ServiceLogo } from '@/src/components/ServiceLogo';
import { ServiceSelection, ServiceSelectorModal } from '@/src/components/ServiceSelectorModal';
import { Button } from '@/src/components/ui/Button';
import { CURRENCIES } from '@/src/constants/currencies';
import { formatDate as formatDateUtil } from '@/src/constants/dateFormats';
import { getServiceByName, getServiceDomain } from '@/src/constants/services';
import { BORDER_RADIUS, FONT_SIZE, SPACING } from '@/src/constants/theme';
import { useTheme } from '@/src/context/ThemeContext';
import { useAuth } from '@/src/features/auth/AuthProvider';
import {
  cancelNotification,
  requestNotificationPermissions,
  scheduleSubscriptionReminder,
} from '@/src/features/notifications/notificationService';
import {
  useDeleteSubscriptionMutation,
  useSubscriptionsQuery,
  useUpsertSubscriptionMutation,
} from '@/src/features/subscriptions/subscriptionsHooks';
import { clampBillingDay } from '@/src/features/subscriptions/subscriptionsUtils';
import {
  BillingCycle,
  PaymentMethod,
  REMINDER_OPTIONS,
  ReminderDays,
  ReminderHour,
  Subscription,
  SUBSCRIPTION_CATEGORIES,
  SubscriptionCategory,
} from '@/src/features/subscriptions/types';
import { getDefaultPriceInCurrency } from '@/src/lib/currencyConversion';
import {
  AppWindowIcon,
  BellIcon,
  CaretDownIcon,
  CaretLeftIcon,
  CheckIcon,
  ClockIcon,
  DotsThreeCircleIcon,
  ForkKnifeIcon,
  GraduationCapIcon,
  HeartbeatIcon,
  LightbulbIcon,
  MusicNotesIcon,
  PlayCircleIcon,
  RobotIcon,
  ShoppingCartIcon,
  TrashIcon,
  XIcon,
} from 'phosphor-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type RouteParams = {
  id?: string;
};

export default function SubscriptionEditorScreen() {
  const params = useLocalSearchParams<RouteParams>();
  const editingId = typeof params.id === 'string' ? params.id : undefined;

  const { settings, user } = useAuth();
  const { colors } = useTheme();
  const userId = user?.uid ?? '';
  const subscriptionsQuery = useSubscriptionsQuery();
  const upsertMutation = useUpsertSubscriptionMutation();
  const deleteMutation = useDeleteSubscriptionMutation();

  const existing = useMemo(() => {
    if (!editingId) return null;
    const list = subscriptionsQuery.data ?? [];
    return list.find((s) => s.id === editingId) ?? null;
  }, [editingId, subscriptionsQuery.data]);

  const defaultCurrency = useMemo(() => {
    try {
      const resolved = new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'USD',
      }).resolvedOptions().currency;
      return settings.currency || resolved || 'USD';
    } catch (e) {
      console.log('[subscription-editor] defaultCurrency failed', e);
      return settings.currency || 'USD';
    }
  }, [settings.currency]);

  const [serviceName, setServiceName] = useState<string>('');
  const [category, setCategory] = useState<SubscriptionCategory>('Streaming');
  const [amountText, setAmountText] = useState<string>('');
  const [hasManuallyEditedAmount, setHasManuallyEditedAmount] = useState(false);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('Monthly');
  const [billingDayText, setBillingDayText] = useState<string>('1');
  const [notes, setNotes] = useState<string>('');
  const [currency, setCurrency] = useState<string>(defaultCurrency);
  const currencySymbol = useMemo(() => {
    return CURRENCIES.find((c) => c.code === currency)?.symbol ?? '$';
  }, [currency]);

  const serviceDomain = useMemo(() => {
    return serviceName ? getServiceDomain(serviceName) : undefined;
  }, [serviceName]);

  const normalizeToMidnight = useCallback((date: Date): Date => {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  }, []);

  const [startDate, setStartDate] = useState<Date>(() => normalizeToMidnight(new Date()));
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const formatDate = useCallback(
    (date: Date) => {
      return formatDateUtil(date, settings.dateFormat);
    },
    [settings.dateFormat]
  );

  const [showServiceModal, setShowServiceModal] = useState(false);

  const handleServiceSelect = useCallback(
    (service: ServiceSelection) => {
      setServiceName(service.name);
      setCategory(service.category);
      setShowServiceModal(false);

      // Pre-fill cost from default price (only if user hasn't manually edited)
      if (!editingId && !hasManuallyEditedAmount) {
        const serviceData = getServiceByName(service.name);
        if (serviceData?.defaultPriceUSD) {
          const convertedPrice = getDefaultPriceInCurrency(serviceData.defaultPriceUSD, currency);
          if (convertedPrice !== undefined) {
            setAmountText(String(convertedPrice));
          }
        } else {
          // Clear amount if service has no default price
          setAmountText('');
        }
      }
    },
    [editingId, hasManuallyEditedAmount, currency]
  );

  const [showCurrencyModal, setShowCurrencyModal] = useState(false);

  const handleCurrencySelect = useCallback(
    (currencyCode: string) => {
      setCurrency(currencyCode);
      setShowCurrencyModal(false);

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

  const [showFrequencyModal, setShowFrequencyModal] = useState(false);

  const handleFrequencySelect = useCallback((frequency: BillingCycle) => {
    setBillingCycle(frequency);
    setShowFrequencyModal(false);
  }, []);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | undefined>(undefined);
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);

  const handlePaymentMethodSelect = useCallback((method: PaymentMethod) => {
    setPaymentMethod(method);
    setShowPaymentMethodModal(false);
  }, []);

  const PaymentMethodIcon = useMemo(() => {
    if (!paymentMethod) return null;
    const config = PAYMENT_METHOD_CONFIG.find((c) => c.label === paymentMethod);
    if (!config) return null;
    const IconComponent = config.icon;
    return <IconComponent color={colors.text} size={20} />;
  }, [paymentMethod, colors]);

  const [reminderDays, setReminderDays] = useState<ReminderDays>(null);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderHour, setReminderHour] = useState<ReminderHour>(12); // Default to noon
  const [showReminderTimeModal, setShowReminderTimeModal] = useState(false);

  const handleReminderSelect = useCallback((reminder: ReminderDays) => {
    setReminderDays(reminder);
    setShowReminderModal(false);
  }, []);

  const handleReminderTimeSelect = useCallback((hour: ReminderHour) => {
    setReminderHour(hour);
    setShowReminderTimeModal(false);
  }, []);

  const reminderLabel = useMemo(() => {
    const option = REMINDER_OPTIONS.find((o) => o.value === reminderDays);
    return option?.label ?? 'None';
  }, [reminderDays]);

  const reminderTimeLabel = useMemo(() => {
    const date = new Date();
    date.setHours(reminderHour ?? 12, 0, 0, 0);
    return date.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    });
  }, [reminderHour]);

  React.useEffect(() => {
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
    // Load reminderHour, defaulting to noon if not set
    setReminderHour(existing.reminderHour ?? 12);
    // Reset manual edit flag for clean state when loading existing data
    setHasManuallyEditedAmount(false);
  }, [defaultCurrency, editingId, existing, normalizeToMidnight]);

  const amount = useMemo(() => {
    const n = Number(amountText.replace(/[^0-9.]/g, ''));
    return Number.isFinite(n) ? n : 0;
  }, [amountText]);

  const billingDay = useMemo(() => {
    const n = Number(billingDayText.replace(/[^0-9]/g, ''));
    return clampBillingDay(Number.isFinite(n) ? n : 1);
  }, [billingDayText]);

  const canDelete = Boolean(existing);

  const title = useMemo(() => {
    if (billingCycle === 'One-Time') {
      return existing ? 'Edit One-Time Payment' : 'New One-Time Payment';
    }
    return existing ? 'Edit Subscription' : 'New Subscription';
  }, [billingCycle, existing]);

  const dateError = useMemo(() => {
    if (startDate && endDate && endDate < startDate) {
      return 'End date cannot be before start date.';
    }
    return null;
  }, [startDate, endDate]);

  const validate = useCallback((): string | null => {
    if (!serviceName.trim()) return 'Service name is required.';
    if (!Number.isFinite(amount) || amount <= 0) return 'Enter a billing amount greater than 0.';
    // Skip billingDay validation for One-Time payments
    if (billingCycle !== 'One-Time') {
      if (!Number.isFinite(billingDay) || billingDay < 1 || billingDay > 31)
        return 'Billing day must be between 1 and 31.';
      if (dateError) return dateError;
    }
    return null;
  }, [amount, billingCycle, billingDay, dateError, serviceName]);

  const handleSave = useCallback(async () => {
    const error = validate();
    if (error) {
      Alert.alert('Check your details', error);
      return;
    }

    try {
      // For One-Time payments, derive billingDay from startDate and clear endDate
      const isOneTime = billingCycle === 'One-Time';
      const effectiveBillingDay = isOneTime ? startDate.getDate() : billingDay;
      const effectiveEndDate = isOneTime ? undefined : endDate ? endDate.getTime() : undefined;

      // Cancel existing notification if any (before we do anything else)
      if (existing?.notificationId) {
        await cancelNotification(existing.notificationId);
      }

      // Determine what notificationId to save
      let notificationIdToSave: string | null = null;

      // If reminder is enabled, try to schedule notification
      if (reminderDays !== null && reminderDays > 0) {
        const hasPermission = await requestNotificationPermissions();
        if (hasPermission) {
          // For existing subscriptions, we can schedule with the existing data
          // For new subscriptions, we'll schedule after save to get the ID
          if (existing) {
            const tempSubscription = {
              ...existing,
              serviceName: serviceName.trim(),
              billingDay: effectiveBillingDay,
              billingCycle,
              startDate: startDate.getTime(),
            };
            notificationIdToSave = await scheduleSubscriptionReminder(
              tempSubscription,
              reminderDays,
              reminderHour ?? 12
            );
          }
        }
      }

      const payload = buildSubscriptionPayload(existing, userId, {
        serviceName: serviceName.trim(),
        category,
        amount,
        currency,
        billingCycle,
        billingDay: effectiveBillingDay,
        notes: notes.trim() ? notes.trim() : undefined,
        startDate: startDate.getTime(),
        endDate: effectiveEndDate,
        paymentMethod: paymentMethod,
        reminderDays: reminderDays,
        reminderHour: reminderHour,
      });

      // Include notificationId in the payload if we scheduled one (for existing subscriptions)
      // or explicitly clear it if reminder was removed
      const payloadWithNotification = {
        ...payload,
        notificationId: notificationIdToSave,
      };

      // Save the subscription
      const savedSubscription = await upsertMutation.mutateAsync(payloadWithNotification);

      // For NEW subscriptions with reminders, we need to schedule after save to get the ID
      if (!existing && reminderDays !== null && reminderDays > 0) {
        const hasPermission = await requestNotificationPermissions();
        if (hasPermission) {
          const notificationId = await scheduleSubscriptionReminder(
            savedSubscription,
            reminderDays,
            reminderHour ?? 12
          );

          // Only do a second save if we got a notification ID
          if (notificationId) {
            try {
              await upsertMutation.mutateAsync({
                ...savedSubscription,
                notificationId,
              });
            } catch (notificationError) {
              console.log(
                '[subscription-editor] failed to persist notification ID, cleaning up',
                notificationError
              );
              await cancelNotification(notificationId);
            }
          }
        }
      }

      router.back();
    } catch (e) {
      console.log('[subscription-editor] save failed', e);
      const msg = e instanceof Error ? e.message : 'Unknown error';
      Alert.alert(`Couldn't Save`, msg);
    }
  }, [
    amount,
    billingCycle,
    billingDay,
    category,
    currency,
    endDate,
    existing,
    notes,
    paymentMethod,
    reminderDays,
    reminderHour,
    serviceName,
    startDate,
    upsertMutation,
    userId,
    validate,
  ]);

  const handleDelete = useCallback(() => {
    if (!existing) return;

    Alert.alert(
      'Delete subscription?',
      `This will remove ${existing.serviceName} from your list.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync(existing.id);
              router.back();
            } catch (e) {
              console.log('[subscription-editor] delete failed', e);
              const msg = e instanceof Error ? e.message : 'Unknown error';
              Alert.alert(`Couldn't Delete`, msg);
            }
          },
        },
      ]
    );
  }, [deleteMutation, existing]);

  const headerLeft = useCallback(() => {
    return (
      <Pressable
        onPress={() => router.back()}
        style={[styles.headerLeft, { backgroundColor: colors.tertiaryBackground }]}
        testID="subscriptionEditorBack"
      >
        <CaretLeftIcon color={colors.text} size={22} />
      </Pressable>
    );
  }, [colors]);

  const showLoading = Boolean(editingId) && subscriptionsQuery.isLoading;
  const showNotFound = Boolean(editingId) && !subscriptionsQuery.isLoading && !existing;
  const isSaving = upsertMutation.isPending;

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: title,
          title,
          headerBackVisible: false,
          headerLeft,
        }}
      />

      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        testID="subscriptionEditorScreen"
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {showLoading ? (
            <View style={styles.loading} testID="subscriptionEditorLoading">
              <ActivityIndicator color={colors.tint} />
              <Text style={[styles.loadingText, { color: colors.secondaryText }]}>Loading…</Text>
            </View>
          ) : null}

          {showNotFound ? (
            <View
              style={[
                styles.notFound,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              testID="subscriptionEditorNotFound"
            >
              <Text style={[styles.notFoundTitle, { color: colors.text }]}>
                Subscription not found
              </Text>
              <Text style={[styles.notFoundText, { color: colors.secondaryText }]}>
                It may have been deleted on another device.
              </Text>
              <Pressable
                onPress={() => router.back()}
                style={[styles.primary, { backgroundColor: colors.tint }]}
                testID="subscriptionEditorNotFoundBack"
              >
                <Text style={styles.primaryText}>Go back</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <View style={styles.section}>
                <Text style={[styles.label, { color: colors.secondaryText }]}>Service</Text>
                <Pressable
                  onPress={() => setShowServiceModal(true)}
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                    isSaving && styles.disabledInput,
                  ]}
                  disabled={isSaving}
                  testID="subscriptionEditorServiceName"
                >
                  <View style={styles.serviceRow}>
                    {serviceName ? (
                      <ServiceLogo
                        serviceName={serviceName}
                        domain={serviceDomain}
                        size={32}
                        borderRadius={8}
                      />
                    ) : null}
                    <Text
                      style={[
                        styles.inputText,
                        !serviceName ? { color: colors.secondaryText } : { color: colors.text },
                      ]}
                    >
                      {serviceName || 'Netflix, Spotify, iCloud…'}
                    </Text>
                  </View>
                </Pressable>
              </View>

              <View style={styles.section}>
                <Text style={[styles.label, { color: colors.secondaryText }]}>Category</Text>
                <View style={styles.chipsRow} testID="subscriptionEditorCategories">
                  {SUBSCRIPTION_CATEGORIES.map((cat) => {
                    const active = cat === category;
                    const categoryColor = CATEGORY_COLORS[cat];
                    const iconColor = active ? '#fff' : colors.text;
                    const iconSize = 26;
                    return (
                      <Pressable
                        key={cat}
                        onPress={() => setCategory(cat)}
                        disabled={isSaving}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: colors.card,
                            borderColor: colors.border,
                          },
                          active
                            ? {
                                backgroundColor: categoryColor.text,
                                borderColor: categoryColor.text,
                              }
                            : null,
                          isSaving && styles.disabledInput,
                        ]}
                        testID={`subscriptionEditorCategory_${cat}`}
                      >
                        {cat === 'Streaming' && (
                          <PlayCircleIcon
                            color={iconColor}
                            size={iconSize}
                            weight={active ? 'fill' : 'regular'}
                          />
                        )}
                        {cat === 'Music' && <MusicNotesIcon color={iconColor} size={iconSize} />}
                        {cat === 'Software' && <AppWindowIcon color={iconColor} size={iconSize} />}
                        {cat === 'Utilities' && (
                          <LightbulbIcon
                            color={iconColor}
                            size={iconSize}
                            weight={active ? 'fill' : 'regular'}
                          />
                        )}
                        {cat === 'Health' && (
                          <HeartbeatIcon
                            color={iconColor}
                            size={iconSize}
                            weight={active ? 'fill' : 'regular'}
                          />
                        )}
                        {cat === 'Food' && (
                          <ForkKnifeIcon
                            color={iconColor}
                            size={iconSize}
                            weight={active ? 'fill' : 'regular'}
                          />
                        )}
                        {cat === 'Education' && (
                          <GraduationCapIcon
                            color={iconColor}
                            size={iconSize}
                            weight={active ? 'fill' : 'regular'}
                          />
                        )}
                        {cat === 'Shopping' && (
                          <ShoppingCartIcon
                            color={iconColor}
                            size={iconSize}
                            weight={active ? 'fill' : 'regular'}
                          />
                        )}
                        {cat === 'AI' && (
                          <RobotIcon
                            color={iconColor}
                            size={iconSize}
                            weight={active ? 'fill' : 'regular'}
                          />
                        )}
                        {cat === 'Other' && (
                          <DotsThreeCircleIcon color={iconColor} size={iconSize} />
                        )}
                        <Text
                          style={[
                            styles.chipText,
                            active ? { color: '#fff' } : { color: colors.text },
                          ]}
                        >
                          {cat}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.grid}>
                {/* Cost Column */}
                <View style={[styles.section, styles.gridItem]}>
                  <Text style={[styles.label, { color: colors.secondaryText }]}>Cost</Text>
                  <TextInput
                    value={amountText}
                    onChangeText={(text) => {
                      setAmountText(text);
                      setHasManuallyEditedAmount(true);
                    }}
                    keyboardType={Platform.OS === 'web' ? 'default' : 'decimal-pad'}
                    placeholder="9.99"
                    placeholderTextColor={colors.secondaryText}
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                        color: colors.text,
                      },
                      isSaving && styles.disabledInput,
                    ]}
                    editable={!isSaving}
                    testID="subscriptionEditorAmount"
                  />
                </View>

                {/* Currency Column */}
                <View style={[styles.section, styles.gridItem]}>
                  <Text style={[styles.label, { color: colors.secondaryText }]}>Currency</Text>
                  <Pressable
                    style={[
                      styles.dropdownButton,
                      { backgroundColor: colors.card, borderColor: colors.border },
                      isSaving && styles.disabledInput,
                    ]}
                    onPress={() => setShowCurrencyModal(true)}
                    disabled={isSaving}
                    testID="subscriptionEditorCurrency"
                  >
                    <Text style={[styles.dropdownText, { color: colors.text }]}>
                      {currency} ({currencySymbol})
                    </Text>
                    <CaretDownIcon color={colors.secondaryText} size={16} />
                  </Pressable>
                </View>

                {/* Frequency Column */}
                <View style={[styles.section, styles.gridItem]}>
                  <Text style={[styles.label, { color: colors.secondaryText }]}>Frequency</Text>
                  <Pressable
                    style={[
                      styles.dropdownButton,
                      { backgroundColor: colors.card, borderColor: colors.border },
                      isSaving && styles.disabledInput,
                    ]}
                    onPress={() => setShowFrequencyModal(true)}
                    disabled={isSaving}
                    testID="subscriptionEditorFrequency"
                  >
                    <Text style={[styles.dropdownText, { color: colors.text }]}>
                      {billingCycle}
                    </Text>
                    <CaretDownIcon color={colors.secondaryText} size={16} />
                  </Pressable>
                </View>
              </View>

              {billingCycle === 'One-Time' ? (
                /* Payment Date for One-Time payments */
                <View style={styles.section}>
                  <Text style={[styles.label, { color: colors.secondaryText }]}>Payment date</Text>
                  <Pressable
                    style={[
                      styles.dateInput,
                      { backgroundColor: colors.card, borderColor: colors.border },
                      isSaving && styles.disabledInput,
                    ]}
                    onPress={() => setShowStartDatePicker(true)}
                    disabled={isSaving}
                    testID="subscriptionEditorPaymentDate"
                  >
                    <Text style={[styles.dateText, { color: colors.text }]}>
                      {formatDate(startDate)}
                    </Text>
                  </Pressable>
                  {showStartDatePicker && (
                    <DateTimePicker
                      value={startDate}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={(event, selectedDate) => {
                        setShowStartDatePicker(Platform.OS === 'ios');
                        if (event.type === 'dismissed') {
                          return;
                        }
                        if (selectedDate) {
                          setStartDate(normalizeToMidnight(selectedDate));
                        }
                      }}
                    />
                  )}
                </View>
              ) : (
                /* Billing day, Start date, End date for recurring payments */
                <>
                  <View style={styles.section}>
                    <Text style={[styles.label, { color: colors.secondaryText }]}>Billing day</Text>
                    <Text style={[styles.helper, { color: colors.secondaryText }]}>
                      Day of month (1–31). We'll calculate the next renewal date.
                    </Text>
                    <TextInput
                      value={billingDayText}
                      onChangeText={setBillingDayText}
                      keyboardType={Platform.OS === 'web' ? 'default' : 'number-pad'}
                      placeholder="1"
                      placeholderTextColor={colors.secondaryText}
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.card,
                          borderColor: colors.border,
                          color: colors.text,
                        },
                        isSaving && styles.disabledInput,
                      ]}
                      editable={!isSaving}
                      testID="subscriptionEditorBillingDay"
                    />
                  </View>

                  {/* Start Date */}
                  <View style={styles.section}>
                    <Text style={[styles.label, { color: colors.secondaryText }]}>Start date</Text>
                    <Pressable
                      style={[
                        styles.dateInput,
                        { backgroundColor: colors.card, borderColor: colors.border },
                        isSaving && styles.disabledInput,
                      ]}
                      onPress={() => setShowStartDatePicker(true)}
                      disabled={isSaving}
                      testID="subscriptionEditorStartDate"
                    >
                      <Text style={[styles.dateText, { color: colors.text }]}>
                        {formatDate(startDate)}
                      </Text>
                    </Pressable>
                    {showStartDatePicker && (
                      <DateTimePicker
                        value={startDate}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={(event, selectedDate) => {
                          setShowStartDatePicker(Platform.OS === 'ios');
                          if (event.type === 'dismissed') {
                            return;
                          }
                          if (selectedDate) {
                            setStartDate(normalizeToMidnight(selectedDate));
                          }
                        }}
                      />
                    )}
                  </View>

                  {/* End Date (optional) */}
                  <View style={styles.section}>
                    <Text style={[styles.label, { color: colors.secondaryText }]}>End date</Text>
                    {endDate ? (
                      <View style={styles.dateRow}>
                        <Pressable
                          style={[
                            styles.dateInput,
                            { flex: 1, backgroundColor: colors.card, borderColor: colors.border },
                            isSaving && styles.disabledInput,
                          ]}
                          onPress={() => setShowEndDatePicker(true)}
                          disabled={isSaving}
                          testID="subscriptionEditorEndDate"
                        >
                          <Text style={[styles.dateText, { color: colors.text }]}>
                            {formatDate(endDate)}
                          </Text>
                        </Pressable>
                        <Pressable
                          style={[
                            styles.clearButton,
                            { backgroundColor: colors.tertiaryBackground },
                            isSaving && styles.disabledInput,
                          ]}
                          onPress={() => setEndDate(null)}
                          disabled={isSaving}
                          testID="subscriptionEditorClearEndDate"
                        >
                          <XIcon color={colors.secondaryText} size={18} />
                        </Pressable>
                      </View>
                    ) : (
                      <Pressable
                        style={[
                          styles.dateInput,
                          { backgroundColor: colors.card, borderColor: colors.border },
                          isSaving && styles.disabledInput,
                        ]}
                        onPress={() => setShowEndDatePicker(true)}
                        disabled={isSaving}
                        testID="subscriptionEditorAddEndDate"
                      >
                        <Text style={[styles.placeholderText, { color: colors.secondaryText }]}>
                          Add end date (optional)
                        </Text>
                      </Pressable>
                    )}
                    {showEndDatePicker && (
                      <DateTimePicker
                        value={endDate || new Date()}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={(event, selectedDate) => {
                          setShowEndDatePicker(Platform.OS === 'ios');
                          if (event.type === 'dismissed') {
                            return;
                          }
                          if (selectedDate) {
                            setEndDate(normalizeToMidnight(selectedDate));
                          }
                        }}
                      />
                    )}
                    {dateError && <Text style={styles.errorText}>{dateError}</Text>}
                  </View>
                </>
              )}

              {/* Payment Method */}
              <View style={styles.section}>
                <Text style={[styles.label, { color: colors.secondaryText }]}>Payment method</Text>
                <Pressable
                  style={[
                    styles.dropdownButton,
                    { backgroundColor: colors.card, borderColor: colors.border },
                    isSaving && styles.disabledInput,
                  ]}
                  onPress={() => setShowPaymentMethodModal(true)}
                  disabled={isSaving}
                  testID="subscriptionEditorPaymentMethod"
                >
                  {paymentMethod ? (
                    <View style={styles.paymentMethodRow}>
                      {PaymentMethodIcon}
                      <Text style={[styles.dropdownText, { color: colors.text }]}>
                        {paymentMethod}
                      </Text>
                    </View>
                  ) : (
                    <Text
                      style={[
                        styles.dropdownText,
                        styles.placeholderText,
                        { color: colors.secondaryText },
                      ]}
                    >
                      Select payment method
                    </Text>
                  )}
                  <CaretDownIcon color={colors.secondaryText} size={16} />
                </Pressable>
              </View>

              {/* Reminder */}
              <View style={styles.section}>
                <Text style={[styles.label, { color: colors.secondaryText }]}>Reminder</Text>
                <View style={styles.reminderRow}>
                  {/* Reminder Days (left half) */}
                  <Pressable
                    style={[
                      styles.reminderButton,
                      { backgroundColor: colors.card, borderColor: colors.border },
                      isSaving && styles.disabledInput,
                    ]}
                    onPress={() => setShowReminderModal(true)}
                    disabled={isSaving}
                    testID="subscriptionEditorReminder"
                  >
                    <View style={styles.paymentMethodRow}>
                      <BellIcon color={colors.text} size={20} />
                      <Text
                        style={[
                          styles.dropdownText,
                          { color: colors.text },
                          !reminderDays &&
                            styles.placeholderText && { color: colors.secondaryText },
                        ]}
                      >
                        {reminderLabel}
                      </Text>
                    </View>
                    <CaretDownIcon color={colors.secondaryText} size={16} />
                  </Pressable>

                  {/* Reminder Time (right half) */}
                  <Pressable
                    style={[
                      styles.reminderButton,
                      { backgroundColor: colors.card, borderColor: colors.border },
                      isSaving && styles.disabledInput,
                    ]}
                    onPress={() => setShowReminderTimeModal(true)}
                    disabled={isSaving}
                    testID="subscriptionEditorReminderTime"
                  >
                    <View style={styles.paymentMethodRow}>
                      <ClockIcon color={colors.text} size={20} />
                      <Text style={[styles.dropdownText, { color: colors.text }]}>
                        {reminderTimeLabel}
                      </Text>
                    </View>
                    <CaretDownIcon color={colors.secondaryText} size={16} />
                  </Pressable>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={[styles.label, { color: colors.secondaryText }]}>
                  Notes (optional)
                </Text>
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="e.g. Family plan, billed through Google Play"
                  placeholderTextColor={colors.secondaryText}
                  multiline
                  style={[
                    styles.input,
                    styles.notesInput,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                    isSaving && styles.disabledInput,
                  ]}
                  editable={!isSaving}
                  testID="subscriptionEditorNotes"
                />
              </View>

              {canDelete ? (
                <View
                  style={[styles.dangerZone, { backgroundColor: colors.negativeBackground }]}
                  testID="subscriptionEditorDanger"
                >
                  <Pressable
                    onPress={handleDelete}
                    style={styles.deleteButton}
                    disabled={deleteMutation.isPending || isSaving}
                    testID="subscriptionEditorDelete"
                  >
                    <TrashIcon color={colors.negative} size={18} />
                    <Text style={[styles.deleteText, { color: colors.negative }]}>
                      Delete Subscription
                    </Text>
                  </Pressable>
                </View>
              ) : null}

              <Button
                title={existing ? 'Update Subscription' : 'Save Subscription'}
                onPress={handleSave}
                loading={upsertMutation.isPending}
                testID="subscriptionEditorSaveBottom"
                style={{ width: '100%' }}
                icon={<CheckIcon color="#fff" size={20} />}
              />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <ServiceSelectorModal
        visible={showServiceModal}
        selectedService={serviceName}
        onSelect={handleServiceSelect}
        onClose={() => setShowServiceModal(false)}
      />
      <CurrencySelectorModal
        visible={showCurrencyModal}
        selectedCurrency={currency}
        onSelect={handleCurrencySelect}
        onClose={() => setShowCurrencyModal(false)}
      />
      <FrequencySelectorModal
        visible={showFrequencyModal}
        selectedFrequency={billingCycle}
        onSelect={handleFrequencySelect}
        onClose={() => setShowFrequencyModal(false)}
      />
      <PaymentMethodModal
        visible={showPaymentMethodModal}
        selectedMethod={paymentMethod}
        onSelect={handlePaymentMethodSelect}
        onClose={() => setShowPaymentMethodModal(false)}
      />
      <ReminderSelectorModal
        visible={showReminderModal}
        selectedReminder={reminderDays}
        onSelect={handleReminderSelect}
        onClose={() => setShowReminderModal(false)}
      />
      <ReminderTimeSelectorModal
        visible={showReminderTimeModal}
        selectedHour={reminderHour}
        onSelect={handleReminderTimeSelect}
        onClose={() => setShowReminderTimeModal(false)}
      />
    </>
  );
}

function buildSubscriptionPayload(
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
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  content: {
    padding: SPACING.xl,
    paddingBottom: 40,
    gap: SPACING.xl,
  },
  headerLeft: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15,23,42,0.06)',
  },
  headerRight: {
    width: 38,
    height: 38,
  },
  section: {
    gap: SPACING.md,
  },
  label: {
    textTransform: 'uppercase',
    color: AppColors.secondaryText,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    letterSpacing: 0.4,
    marginLeft: SPACING.xs,
  },
  helper: {
    color: AppColors.secondaryText,
    fontSize: FONT_SIZE.md,
    lineHeight: 18,
    marginLeft: SPACING.xs,
    marginBottom: SPACING.xs,
    marginTop: -SPACING.xs,
  },
  input: {
    minHeight: 56,
    borderRadius: BORDER_RADIUS.xxl,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    color: AppColors.text,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: AppColors.border,
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    justifyContent: 'center',
  },
  inputText: {
    color: AppColors.text,
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  placeholderText: {
    color: 'rgba(15,23,42,0.35)',
  },
  errorText: {
    color: AppColors.negative,
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    marginTop: 6,
    marginLeft: SPACING.xs,
  },
  dateInput: {
    minHeight: 56,
    borderRadius: BORDER_RADIUS.xxl,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: AppColors.border,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  dateText: {
    color: AppColors.text,
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  paymentMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  clearButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.xxl,
    backgroundColor: 'rgba(15,23,42,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notesInput: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: SPACING.lg,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'flex-start',
  },
  chip: {
    borderRadius: BORDER_RADIUS.xxl,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
    backgroundColor: AppColors.card,
    borderWidth: 1.5,
    borderColor: AppColors.border,
    flexBasis: '30%',
    flexGrow: 1,
    maxWidth: '32%',
    minHeight: 70,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 7,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  chipText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    gap: 5,
  },
  gridItem: {
    flex: 1,
  },
  reminderRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  reminderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    minHeight: 56,
    borderRadius: BORDER_RADIUS.xxl,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: AppColors.border,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  currencyPill: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: AppColors.cardAlt,
    borderWidth: 1,
    borderColor: AppColors.border,
    minHeight: 56,
    justifyContent: 'center',
  },
  currencyText: {
    color: AppColors.text,
    fontWeight: '700',
    fontSize: FONT_SIZE.md,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    minHeight: 56,
    borderRadius: BORDER_RADIUS.xxl,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: AppColors.border,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  dropdownText: {
    color: AppColors.text,
    fontWeight: '600',
    fontSize: FONT_SIZE.md,
  },
  amountInput: {
    flex: 1,
  },
  cycleRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  cycle: {
    flex: 1,
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.card,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  cycleText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  dangerZone: {
    marginTop: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    padding: SPACING.lg,
    backgroundColor: 'rgba(255,68,56,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,68,56,0.15)',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  deleteText: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '600',
  },
  primary: {
    borderRadius: BORDER_RADIUS.xxl,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  primaryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: FONT_SIZE.lg,
  },
  loading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.xl,
    justifyContent: 'center',
  },
  loadingText: {
    color: AppColors.secondaryText,
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  notFound: {
    borderRadius: BORDER_RADIUS.xxxl,
    padding: SPACING.xxl,
    backgroundColor: AppColors.card,
    borderWidth: 1,
    borderColor: AppColors.border,
    gap: SPACING.md,
    alignItems: 'center',
  },
  notFoundTitle: {
    color: AppColors.text,
    fontSize: FONT_SIZE.xxl,
    fontWeight: '700',
  },
  notFoundText: {
    color: AppColors.secondaryText,
    fontSize: FONT_SIZE.md,
    lineHeight: 20,
    textAlign: 'center',
  },
  disabledInput: {
    opacity: 0.5,
  },
});
