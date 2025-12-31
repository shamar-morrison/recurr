import { router, Stack, useLocalSearchParams } from 'expo-router';
import { CaretDownIcon, CaretLeftIcon } from 'phosphor-react-native';
import React, { useCallback, useState } from 'react';
import {
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

import { CurrencySelectorModal } from '@/src/components/CurrencySelectorModal';
import { FrequencySelectorModal } from '@/src/components/FrequencySelectorModal';
import { ServiceLogo } from '@/src/components/ServiceLogo';
import { ServiceSelection, ServiceSelectorModal } from '@/src/components/ServiceSelectorModal';
import { FormSection } from '@/src/components/ui/FormSection';
import { formatDate as formatDateUtil } from '@/src/constants/dateFormats';
import { BORDER_RADIUS, FONT_SIZE, SPACING } from '@/src/constants/theme';
import { useTheme } from '@/src/context/ThemeContext';
import { useAuth } from '@/src/features/auth/AuthProvider';
import {
  cancelNotification,
  requestNotificationPermissions,
  scheduleSubscriptionReminder,
} from '@/src/features/notifications/notificationService';
import {
  BillingDatesSection,
  CategoryChips,
  EditorActionButtons,
  EditorLoadingState,
  EditorNotFoundState,
  PaymentMethodField,
  ReminderSection,
} from '@/src/features/subscriptions/components';
import { useSubscriptionForm } from '@/src/features/subscriptions/hooks';
import { buildSubscriptionPayload } from '@/src/features/subscriptions/subscriptionsUtils';
import {
  BillingCycle,
  PaymentMethod,
  ReminderDays,
  ReminderHour,
} from '@/src/features/subscriptions/types';

type RouteParams = {
  id?: string;
};

export default function SubscriptionEditorScreen() {
  const params = useLocalSearchParams<RouteParams>();
  const editingId = typeof params.id === 'string' ? params.id : undefined;

  const { settings } = useAuth();
  const { colors } = useTheme();

  // Use the form hook for state management
  const form = useSubscriptionForm({ editingId });

  // Modal visibility states
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showFrequencyModal, setShowFrequencyModal] = useState(false);
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showReminderTimeModal, setShowReminderTimeModal] = useState(false);

  // Processing action state
  const [processingAction, setProcessingAction] = useState<'save' | 'pause' | 'delete' | null>(
    null
  );

  const formatDate = useCallback(
    (date: Date) => formatDateUtil(date, settings.dateFormat),
    [settings.dateFormat]
  );

  // Handlers
  const handleServiceSelect = useCallback(
    (service: ServiceSelection) => {
      form.handleServiceSelect(service);
      setShowServiceModal(false);
    },
    [form]
  );

  const handleCurrencySelect = useCallback(
    (currencyCode: string) => {
      form.handleCurrencySelect(currencyCode);
      setShowCurrencyModal(false);
    },
    [form]
  );

  const handleFrequencySelect = useCallback(
    (frequency: BillingCycle) => {
      form.setBillingCycle(frequency);
      setShowFrequencyModal(false);
    },
    [form]
  );

  const handlePaymentMethodChange = useCallback(
    (method: PaymentMethod) => {
      form.setPaymentMethod(method);
      setShowPaymentMethodModal(false);
    },
    [form]
  );

  const handleReminderDaysChange = useCallback(
    (days: ReminderDays) => {
      form.setReminderDays(days);
      setShowReminderModal(false);
    },
    [form]
  );

  const handleReminderHourChange = useCallback(
    (hour: ReminderHour) => {
      form.setReminderHour(hour);
      setShowReminderTimeModal(false);
    },
    [form]
  );

  const handleSave = useCallback(async () => {
    const error = form.validate();
    if (error) {
      Alert.alert('Check your details', error);
      return;
    }

    setProcessingAction('save');
    try {
      const isOneTime = form.billingCycle === 'One-Time';
      const effectiveBillingDay = isOneTime ? form.startDate.getDate() : form.billingDay;
      const effectiveEndDate = isOneTime
        ? undefined
        : form.endDate
          ? form.endDate.getTime()
          : undefined;

      // Cancel existing notification if any
      if (form.existing?.notificationId) {
        await cancelNotification(form.existing.notificationId);
      }

      let notificationIdToSave: string | null = null;

      // Schedule notification if reminder is enabled
      if (form.reminderDays !== null && form.reminderDays > 0) {
        const hasPermission = await requestNotificationPermissions();
        if (hasPermission && form.existing) {
          const tempSubscription = {
            ...form.existing,
            serviceName: form.serviceName.trim(),
            billingDay: effectiveBillingDay,
            billingCycle: form.billingCycle,
            startDate: form.startDate.getTime(),
          };
          notificationIdToSave = await scheduleSubscriptionReminder(
            tempSubscription,
            form.reminderDays,
            form.reminderHour ?? 12
          );
        }
      }

      const payload = buildSubscriptionPayload(form.existing, form.userId, {
        serviceName: form.serviceName.trim(),
        category: form.category,
        amount: form.amount,
        currency: form.currency,
        billingCycle: form.billingCycle,
        billingDay: effectiveBillingDay,
        notes: form.notes.trim() ? form.notes.trim() : undefined,
        startDate: form.startDate.getTime(),
        endDate: effectiveEndDate,
        paymentMethod: form.paymentMethod,
        reminderDays: form.reminderDays,
        reminderHour: form.reminderHour,
        status: form.existing?.status ?? (form.existing?.isArchived ? 'Archived' : 'Active'),
      });

      const payloadWithNotification = {
        ...payload,
        notificationId: notificationIdToSave,
      };

      const savedSubscription = await form.upsertMutation.mutateAsync(payloadWithNotification);

      // For NEW subscriptions with reminders, schedule after save
      if (!form.existing && form.reminderDays !== null && form.reminderDays > 0) {
        const hasPermission = await requestNotificationPermissions();
        if (hasPermission) {
          const notificationId = await scheduleSubscriptionReminder(
            savedSubscription,
            form.reminderDays,
            form.reminderHour ?? 12
          );

          if (notificationId) {
            try {
              await form.upsertMutation.mutateAsync({
                ...savedSubscription,
                notificationId,
              });
            } catch (notificationError) {
              console.log(
                '[subscription-editor] failed to persist notification ID',
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
    } finally {
      setProcessingAction(null);
    }
  }, [form]);

  const handleDelete = useCallback(() => {
    if (!form.existing) return;

    Alert.alert(
      'Delete subscription?',
      `This will remove ${form.existing.serviceName} from your list.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setProcessingAction('delete');
            try {
              await form.deleteMutation.mutateAsync(form.existing!.id);
              router.back();
            } catch (e) {
              console.log('[subscription-editor] delete failed', e);
              const msg = e instanceof Error ? e.message : 'Unknown error';
              Alert.alert(`Couldn't Delete`, msg);
              setProcessingAction(null);
            }
          },
        },
      ]
    );
  }, [form.deleteMutation, form.existing]);

  const handlePauseResume = useCallback(() => {
    if (!form.existing) return;

    const performPauseResume = async (shouldMerge: boolean) => {
      setProcessingAction('pause');
      try {
        const newStatus = form.existing!.status === 'Paused' ? 'Active' : 'Paused';
        const payloadBase = shouldMerge
          ? {
              serviceName: form.serviceName.trim() || form.existing!.serviceName,
              category: form.category,
              amount: form.amount || form.existing!.amount,
              currency: form.currency,
              billingCycle: form.billingCycle,
              billingDay: form.billingDay,
              notes: form.notes.trim() || form.existing!.notes,
              startDate: form.startDate.getTime(),
              endDate: form.endDate ? form.endDate.getTime() : undefined,
              paymentMethod: form.paymentMethod,
              reminderDays: form.reminderDays,
              reminderHour: form.reminderHour,
              status: newStatus as any,
            }
          : {
              serviceName: form.existing!.serviceName,
              category: form.existing!.category,
              amount: form.existing!.amount,
              currency: form.existing!.currency,
              billingCycle: form.existing!.billingCycle,
              billingDay: form.existing!.billingDay,
              notes: form.existing!.notes,
              startDate: form.existing!.startDate,
              endDate: form.existing!.endDate,
              paymentMethod: form.existing!.paymentMethod,
              reminderDays: form.existing!.reminderDays,
              reminderHour: form.existing!.reminderHour,
              status: newStatus as any,
            };

        await form.upsertMutation.mutateAsync(
          buildSubscriptionPayload(form.existing, form.userId, payloadBase)
        );
        router.back();
      } catch (e) {
        console.log('[subscription-editor] pause/resume failed', e);
        Alert.alert('Error', 'Failed to update subscription status');
        setProcessingAction(null);
      }
    };

    if (form.hasChanges) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Do you want to save them before updating the status?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: `Save & ${form.existing.status === 'Paused' ? 'Resume' : 'Pause'}`,
            onPress: () => {
              const error = form.validate();
              if (error) {
                Alert.alert('Check your details', error);
                return;
              }
              performPauseResume(true);
            },
          },
        ]
      );
    } else {
      performPauseResume(false);
    }
  }, [form]);

  const headerLeft = useCallback(
    () => (
      <Pressable
        onPress={() => router.back()}
        style={[styles.headerLeft, { backgroundColor: colors.tertiaryBackground }]}
        testID="subscriptionEditorBack"
      >
        <CaretLeftIcon color={colors.text} size={22} />
      </Pressable>
    ),
    [colors]
  );

  const isProcessing = processingAction !== null;

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: form.title,
          title: form.title,
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
          {form.showLoading && <EditorLoadingState />}

          {form.showNotFound && <EditorNotFoundState />}

          {!form.showLoading && !form.showNotFound && (
            <>
              {/* Service */}
              <FormSection label="Service">
                <Pressable
                  onPress={() => setShowServiceModal(true)}
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                    isProcessing && styles.disabledInput,
                  ]}
                  disabled={isProcessing}
                  testID="subscriptionEditorServiceName"
                >
                  <View style={styles.serviceRow}>
                    {form.serviceName ? (
                      <ServiceLogo
                        serviceName={form.serviceName}
                        domain={form.serviceDomain}
                        size={32}
                        borderRadius={8}
                      />
                    ) : null}
                    <Text
                      style={[
                        styles.inputText,
                        !form.serviceName
                          ? { color: colors.secondaryText }
                          : { color: colors.text },
                      ]}
                    >
                      {form.serviceName || 'Netflix, Spotify, iCloud…'}
                    </Text>
                  </View>
                </Pressable>
              </FormSection>

              {/* Category */}
              <FormSection label="Category">
                <CategoryChips
                  selectedCategory={form.category}
                  onSelectCategory={form.setCategory}
                  disabled={isProcessing}
                />
              </FormSection>

              {/* Cost, Currency, Frequency Grid */}
              <View style={styles.grid}>
                <View style={[styles.section, styles.gridItem]}>
                  <Text style={[styles.label, { color: colors.secondaryText }]}>Cost</Text>
                  <TextInput
                    value={form.amountText}
                    onChangeText={form.handleAmountChange}
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
                      isProcessing && styles.disabledInput,
                    ]}
                    editable={!isProcessing}
                    testID="subscriptionEditorAmount"
                  />
                </View>

                <View style={[styles.section, styles.gridItem]}>
                  <Text style={[styles.label, { color: colors.secondaryText }]}>Currency</Text>
                  <Pressable
                    style={[
                      styles.dropdownButton,
                      { backgroundColor: colors.card, borderColor: colors.border },
                      isProcessing && styles.disabledInput,
                    ]}
                    onPress={() => setShowCurrencyModal(true)}
                    disabled={isProcessing}
                    testID="subscriptionEditorCurrency"
                  >
                    <Text style={[styles.dropdownText, { color: colors.text }]}>
                      {form.currency} ({form.currencySymbol})
                    </Text>
                    <CaretDownIcon color={colors.secondaryText} size={16} />
                  </Pressable>
                </View>

                <View style={[styles.section, styles.gridItem]}>
                  <Text style={[styles.label, { color: colors.secondaryText }]}>Frequency</Text>
                  <Pressable
                    style={[
                      styles.dropdownButton,
                      { backgroundColor: colors.card, borderColor: colors.border },
                      isProcessing && styles.disabledInput,
                    ]}
                    onPress={() => setShowFrequencyModal(true)}
                    disabled={isProcessing}
                    testID="subscriptionEditorFrequency"
                  >
                    <Text style={[styles.dropdownText, { color: colors.text }]}>
                      {form.billingCycle}
                    </Text>
                    <CaretDownIcon color={colors.secondaryText} size={16} />
                  </Pressable>
                </View>
              </View>

              {/* Billing Dates */}
              <BillingDatesSection
                billingCycle={form.billingCycle}
                billingDayText={form.billingDayText}
                onBillingDayChange={form.setBillingDayText}
                startDate={form.startDate}
                onStartDateChange={form.setStartDate}
                endDate={form.endDate}
                onEndDateChange={form.setEndDate}
                formatDate={formatDate}
                normalizeToMidnight={form.normalizeToMidnight}
                disabled={isProcessing}
              />

              {/* Reminders */}
              <FormSection label="Reminders">
                <ReminderSection
                  reminderDays={form.reminderDays}
                  reminderHour={form.reminderHour}
                  onReminderDaysChange={handleReminderDaysChange}
                  onReminderHourChange={handleReminderHourChange}
                  showDaysModal={showReminderModal}
                  setShowDaysModal={setShowReminderModal}
                  showTimeModal={showReminderTimeModal}
                  setShowTimeModal={setShowReminderTimeModal}
                  disabled={isProcessing}
                />
              </FormSection>

              {/* Payment Method */}
              <View style={styles.section}>
                <PaymentMethodField
                  value={form.paymentMethod}
                  onChange={handlePaymentMethodChange}
                  onClear={() => form.setPaymentMethod(undefined)}
                  showModal={showPaymentMethodModal}
                  setShowModal={setShowPaymentMethodModal}
                  disabled={isProcessing}
                />
              </View>

              {/* Notes */}
              <FormSection label="Notes">
                <TextInput
                  value={form.notes}
                  onChangeText={form.setNotes}
                  multiline
                  placeholder="Additional details..."
                  placeholderTextColor={colors.secondaryText}
                  style={[
                    styles.input,
                    styles.textArea,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                    isProcessing && styles.disabledInput,
                  ]}
                  editable={!isProcessing}
                  testID="subscriptionEditorNotes"
                />
              </FormSection>

              {/* Action Buttons */}
              <EditorActionButtons
                isEditing={Boolean(form.existing)}
                isPaused={form.existing?.status === 'Paused'}
                processingAction={processingAction}
                onSave={handleSave}
                onPauseResume={handlePauseResume}
                onDelete={handleDelete}
              />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modals */}
      <ServiceSelectorModal
        visible={showServiceModal}
        selectedService={form.serviceName}
        onSelect={handleServiceSelect}
        onClose={() => setShowServiceModal(false)}
      />
      <CurrencySelectorModal
        visible={showCurrencyModal}
        selectedCurrency={form.currency}
        onSelect={handleCurrencySelect}
        onClose={() => setShowCurrencyModal(false)}
      />
      <FrequencySelectorModal
        visible={showFrequencyModal}
        selectedFrequency={form.billingCycle}
        onSelect={handleFrequencySelect}
        onClose={() => setShowFrequencyModal(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  },
  section: {
    gap: SPACING.md,
  },
  label: {
    textTransform: 'uppercase',
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    letterSpacing: 0.4,
    marginLeft: SPACING.xs,
  },
  input: {
    minHeight: 56,
    borderRadius: BORDER_RADIUS.xxl,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    justifyContent: 'center',
  },
  inputText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: SPACING.lg,
  },
  grid: {
    flexDirection: 'row',
    gap: 5,
  },
  gridItem: {
    flex: 1,
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
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  dropdownText: {
    fontWeight: '600',
    fontSize: FONT_SIZE.md,
  },
  disabledInput: {
    opacity: 0.5,
  },
});
