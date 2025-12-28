import DateTimePicker from '@react-native-community/datetimepicker';
import { router, Stack, useLocalSearchParams } from 'expo-router';

import { AppColors } from '@/constants/colors';
import { CurrencySelectorModal } from '@/src/components/CurrencySelectorModal';
import { FrequencySelectorModal } from '@/src/components/FrequencySelectorModal';
import { PAYMENT_METHOD_CONFIG, PaymentMethodModal } from '@/src/components/PaymentMethodModal';
import { ServiceLogo } from '@/src/components/ServiceLogo';
import { ServiceSelection, ServiceSelectorModal } from '@/src/components/ServiceSelectorModal';
import { Button } from '@/src/components/ui/Button';
import { CURRENCIES } from '@/src/constants/currencies';
import { getServiceByName, getServiceDomain } from '@/src/constants/services';
import { useAuth } from '@/src/features/auth/AuthProvider';
import {
  useDeleteSubscriptionMutation,
  useSubscriptionsQuery,
  useUpsertSubscriptionMutation,
} from '@/src/features/subscriptions/subscriptionsHooks';
import { clampBillingDay } from '@/src/features/subscriptions/subscriptionsUtils';
import {
  BillingCycle,
  PaymentMethod,
  Subscription,
  SUBSCRIPTION_CATEGORIES,
  SubscriptionCategory,
} from '@/src/features/subscriptions/types';
import { getDefaultPriceInCurrency } from '@/src/lib/currencyConversion';
import {
  AppWindowIcon,
  CaretDownIcon,
  CaretLeftIcon,
  CheckIcon,
  DotsThreeCircleIcon,
  LightbulbIcon,
  MusicNotesIcon,
  PlayCircleIcon,
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

  const formatDate = useCallback((date: Date) => {
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, []);

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
    return <IconComponent color={AppColors.text} size={20} />;
  }, [paymentMethod]);

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
    // Reset manual edit flag for clean state when loading existing data
    setHasManuallyEditedAmount(false);
  }, [defaultCurrency, editingId, existing]);

  const amount = useMemo(() => {
    const n = Number(amountText.replace(/[^0-9.]/g, ''));
    return Number.isFinite(n) ? n : 0;
  }, [amountText]);

  const billingDay = useMemo(() => {
    const n = Number(billingDayText.replace(/[^0-9]/g, ''));
    return clampBillingDay(Number.isFinite(n) ? n : 1);
  }, [billingDayText]);

  const canDelete = Boolean(existing);

  const title = existing ? 'Edit Subscription' : 'New Subscription';

  const dateError = useMemo(() => {
    if (startDate && endDate && endDate < startDate) {
      return 'End date cannot be before start date.';
    }
    return null;
  }, [startDate, endDate]);

  const validate = useCallback((): string | null => {
    if (!serviceName.trim()) return 'Service name is required.';
    if (!Number.isFinite(amount) || amount <= 0) return 'Enter a billing amount greater than 0.';
    if (!Number.isFinite(billingDay) || billingDay < 1 || billingDay > 31)
      return 'Billing day must be between 1 and 31.';
    if (dateError) return dateError;
    return null;
  }, [amount, billingDay, dateError, serviceName]);

  const handleSave = useCallback(async () => {
    const error = validate();
    if (error) {
      Alert.alert('Check your details', error);
      return;
    }

    try {
      const payload = buildSubscriptionPayload(existing, userId, {
        serviceName: serviceName.trim(),
        category,
        amount,
        currency,
        billingCycle,
        billingDay,
        notes: notes.trim() ? notes.trim() : undefined,
        startDate: startDate.getTime(),
        endDate: endDate ? endDate.getTime() : undefined,
        paymentMethod: paymentMethod,
      });

      await upsertMutation.mutateAsync(payload);
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
        style={styles.headerLeft}
        testID="subscriptionEditorBack"
      >
        <CaretLeftIcon color={AppColors.text} size={22} />
      </Pressable>
    );
  }, []);

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
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        testID="subscriptionEditorScreen"
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {showLoading ? (
            <View style={styles.loading} testID="subscriptionEditorLoading">
              <ActivityIndicator color={AppColors.tint} />
              <Text style={styles.loadingText}>Loading…</Text>
            </View>
          ) : null}

          {showNotFound ? (
            <View style={styles.notFound} testID="subscriptionEditorNotFound">
              <Text style={styles.notFoundTitle}>Subscription not found</Text>
              <Text style={styles.notFoundText}>It may have been deleted on another device.</Text>
              <Pressable
                onPress={() => router.back()}
                style={[styles.primary, { backgroundColor: AppColors.tint }]}
                testID="subscriptionEditorNotFoundBack"
              >
                <Text style={styles.primaryText}>Go back</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <View style={styles.section}>
                <Text style={styles.label}>Service</Text>
                <Pressable
                  onPress={() => setShowServiceModal(true)}
                  style={[styles.input, isSaving && styles.disabledInput]}
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
                    <Text style={[styles.inputText, !serviceName && styles.placeholderText]}>
                      {serviceName || 'Netflix, Spotify, iCloud…'}
                    </Text>
                  </View>
                </Pressable>
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Category</Text>
                <View style={styles.chipsRow} testID="subscriptionEditorCategories">
                  {SUBSCRIPTION_CATEGORIES.map((cat) => {
                    const active = cat === category;
                    const iconColor = active ? '#fff' : AppColors.text;
                    const iconSize = 26;
                    return (
                      <Pressable
                        key={cat}
                        onPress={() => setCategory(cat)}
                        disabled={isSaving}
                        style={[
                          styles.chip,
                          active
                            ? { backgroundColor: AppColors.tint, borderColor: AppColors.tint }
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
                        {cat === 'Other' && (
                          <DotsThreeCircleIcon color={iconColor} size={iconSize} />
                        )}
                        <Text
                          style={[
                            styles.chipText,
                            active ? { color: '#fff' } : { color: AppColors.text },
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
                  <Text style={styles.label}>Cost</Text>
                  <TextInput
                    value={amountText}
                    onChangeText={(text) => {
                      setAmountText(text);
                      setHasManuallyEditedAmount(true);
                    }}
                    keyboardType={Platform.OS === 'web' ? 'default' : 'decimal-pad'}
                    placeholder="9.99"
                    placeholderTextColor="rgba(15,23,42,0.35)"
                    style={[styles.input, isSaving && styles.disabledInput]}
                    editable={!isSaving}
                    testID="subscriptionEditorAmount"
                  />
                </View>

                {/* Currency Column */}
                <View style={[styles.section, styles.gridItem]}>
                  <Text style={styles.label}>Currency</Text>
                  <Pressable
                    style={[styles.dropdownButton, isSaving && styles.disabledInput]}
                    onPress={() => setShowCurrencyModal(true)}
                    disabled={isSaving}
                    testID="subscriptionEditorCurrency"
                  >
                    <Text style={styles.dropdownText}>
                      {currency} ({currencySymbol})
                    </Text>
                    <CaretDownIcon color={AppColors.secondaryText} size={16} />
                  </Pressable>
                </View>

                {/* Frequency Column */}
                <View style={[styles.section, styles.gridItem]}>
                  <Text style={styles.label}>Frequency</Text>
                  <Pressable
                    style={[styles.dropdownButton, isSaving && styles.disabledInput]}
                    onPress={() => setShowFrequencyModal(true)}
                    disabled={isSaving}
                    testID="subscriptionEditorFrequency"
                  >
                    <Text style={styles.dropdownText}>{billingCycle}</Text>
                    <CaretDownIcon color={AppColors.secondaryText} size={16} />
                  </Pressable>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Billing day</Text>
                <Text style={styles.helper}>
                  Day of month (1–31). We’ll calculate the next renewal date.
                </Text>
                <TextInput
                  value={billingDayText}
                  onChangeText={setBillingDayText}
                  keyboardType={Platform.OS === 'web' ? 'default' : 'number-pad'}
                  placeholder="1"
                  placeholderTextColor="rgba(15,23,42,0.35)"
                  style={[styles.input, isSaving && styles.disabledInput]}
                  editable={!isSaving}
                  testID="subscriptionEditorBillingDay"
                />
              </View>

              {/* Start Date */}
              <View style={styles.section}>
                <Text style={styles.label}>Start date</Text>
                <Pressable
                  style={[styles.dateInput, isSaving && styles.disabledInput]}
                  onPress={() => setShowStartDatePicker(true)}
                  disabled={isSaving}
                  testID="subscriptionEditorStartDate"
                >
                  <Text style={styles.dateText}>{formatDate(startDate)}</Text>
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
                <Text style={styles.label}>End date</Text>
                {endDate ? (
                  <View style={styles.dateRow}>
                    <Pressable
                      style={[styles.dateInput, { flex: 1 }, isSaving && styles.disabledInput]}
                      onPress={() => setShowEndDatePicker(true)}
                      disabled={isSaving}
                      testID="subscriptionEditorEndDate"
                    >
                      <Text style={styles.dateText}>{formatDate(endDate)}</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.clearButton, isSaving && styles.disabledInput]}
                      onPress={() => setEndDate(null)}
                      disabled={isSaving}
                      testID="subscriptionEditorClearEndDate"
                    >
                      <XIcon color={AppColors.secondaryText} size={18} />
                    </Pressable>
                  </View>
                ) : (
                  <Pressable
                    style={[styles.dateInput, isSaving && styles.disabledInput]}
                    onPress={() => setShowEndDatePicker(true)}
                    disabled={isSaving}
                    testID="subscriptionEditorAddEndDate"
                  >
                    <Text style={styles.placeholderText}>Add end date (optional)</Text>
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

              {/* Payment Method */}
              <View style={styles.section}>
                <Text style={styles.label}>Payment method</Text>
                <Pressable
                  style={[styles.dropdownButton, isSaving && styles.disabledInput]}
                  onPress={() => setShowPaymentMethodModal(true)}
                  disabled={isSaving}
                  testID="subscriptionEditorPaymentMethod"
                >
                  {paymentMethod ? (
                    <View style={styles.paymentMethodRow}>
                      {PaymentMethodIcon}
                      <Text style={styles.dropdownText}>{paymentMethod}</Text>
                    </View>
                  ) : (
                    <Text style={[styles.dropdownText, styles.placeholderText]}>
                      Select payment method
                    </Text>
                  )}
                  <CaretDownIcon color={AppColors.secondaryText} size={16} />
                </Pressable>
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Notes (optional)</Text>
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="e.g. Family plan, billed through Google Play"
                  placeholderTextColor="rgba(15,23,42,0.35)"
                  multiline
                  style={[styles.input, styles.notesInput, isSaving && styles.disabledInput]}
                  editable={!isSaving}
                  testID="subscriptionEditorNotes"
                />
              </View>

              {canDelete ? (
                <View style={styles.dangerZone} testID="subscriptionEditorDanger">
                  <Pressable
                    onPress={handleDelete}
                    style={styles.deleteButton}
                    disabled={deleteMutation.isPending || isSaving}
                    testID="subscriptionEditorDelete"
                  >
                    <TrashIcon color={AppColors.negative} size={18} />
                    <Text style={[styles.deleteText, { color: AppColors.negative }]}>
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
    isArchived: false,
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
    gap: 20,
  },
  headerLeft: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15,23,42,0.06)',
  },
  headerRight: {
    width: 38,
    height: 38,
  },
  section: {
    gap: 10,
  },
  label: {
    color: AppColors.secondaryText,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
    marginLeft: 4,
  },
  helper: {
    color: AppColors.secondaryText,
    fontSize: 13,
    lineHeight: 18,
    marginLeft: 4,
    marginBottom: 4,
  },
  input: {
    minHeight: 56,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: AppColors.text,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: AppColors.border,
    fontSize: 16,
    fontWeight: '600',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    justifyContent: 'center',
  },
  inputText: {
    color: AppColors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  placeholderText: {
    color: 'rgba(15,23,42,0.35)',
  },
  errorText: {
    color: AppColors.negative,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 6,
    marginLeft: 4,
  },
  dateInput: {
    minHeight: 56,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
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
    fontSize: 16,
    fontWeight: '600',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  paymentMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  clearButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(15,23,42,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notesInput: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 16,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'flex-start',
  },
  chip: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 20,
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
    fontSize: 13,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    gap: 16,
  },
  gridItem: {
    flex: 1,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  currencyPill: {
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: AppColors.cardAlt,
    borderWidth: 1,
    borderColor: AppColors.border,
    minHeight: 56,
    justifyContent: 'center',
  },
  currencyText: {
    color: AppColors.text,
    fontWeight: '700',
    fontSize: 14,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 56,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
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
    fontSize: 14,
  },
  amountInput: {
    flex: 1,
  },
  cycleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  cycle: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.card,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  cycleText: {
    fontSize: 13,
    fontWeight: '600',
  },
  dangerZone: {
    marginTop: 10,
    borderRadius: 9999,
    padding: 16,
    backgroundColor: 'rgba(255,68,56,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,68,56,0.15)',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  deleteText: {
    fontSize: 17,
    fontWeight: '600',
  },
  primary: {
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  primaryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  loading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 20,
    justifyContent: 'center',
  },
  loadingText: {
    color: AppColors.secondaryText,
    fontSize: 14,
    fontWeight: '600',
  },
  notFound: {
    borderRadius: 26,
    padding: 24,
    backgroundColor: AppColors.card,
    borderWidth: 1,
    borderColor: AppColors.border,
    gap: 12,
    alignItems: 'center',
  },
  notFoundTitle: {
    color: AppColors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  notFoundText: {
    color: AppColors.secondaryText,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  disabledInput: {
    opacity: 0.5,
  },
});
