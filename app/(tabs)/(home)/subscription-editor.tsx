import { router, Stack, useLocalSearchParams } from 'expo-router';

import { CurrencyPickerSheet } from '@/src/components/CurrencyPickerSheet';
import { Button } from '@/src/components/ui/Button';
import { useAuth } from '@/src/features/auth/AuthProvider';
import {
  useDeleteSubscriptionMutation,
  useSubscriptionsQuery,
  useUpsertSubscriptionMutation,
} from '@/src/features/subscriptions/subscriptionsHooks';
import { clampBillingDay } from '@/src/features/subscriptions/subscriptionsUtils';
import {
  BILLING_CYCLES,
  Subscription,
  SUBSCRIPTION_CATEGORIES,
  SubscriptionCategory,
} from '@/src/features/subscriptions/types';
import { useAppTheme } from '@/src/theme/useAppTheme';
import {
  AppWindowIcon,
  CaretLeftIcon,
  CheckIcon,
  DotsThreeCircleIcon,
  LightbulbIcon,
  MusicNotesIcon,
  PlayCircleIcon,
  TrashIcon,
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
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

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
  const [billingCycle, setBillingCycle] = useState<(typeof BILLING_CYCLES)[number]>('Monthly');
  const [billingDayText, setBillingDayText] = useState<string>('1');
  const [notes, setNotes] = useState<string>('');
  const [currency, setCurrency] = useState<string>(defaultCurrency);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

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

  const validate = useCallback((): string | null => {
    if (!serviceName.trim()) return 'Service name is required.';
    if (!Number.isFinite(amount) || amount <= 0) return 'Enter a billing amount greater than 0.';
    if (!Number.isFinite(billingDay) || billingDay < 1 || billingDay > 31)
      return 'Billing day must be between 1 and 31.';
    return null;
  }, [amount, billingDay, serviceName]);

  const handleSave = useCallback(async () => {
    const error = validate();
    if (error) {
      Alert.alert('Check your details', error);
      return;
    }

    try {
      const payload = toInput(existing, userId, {
        serviceName: serviceName.trim(),
        category,
        amount,
        currency,
        billingCycle,
        billingDay,
        notes: notes.trim() ? notes.trim() : undefined,
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
    existing,
    notes,
    serviceName,
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
        <CaretLeftIcon color={theme.colors.text} size={22} />
      </Pressable>
    );
  }, [styles.headerLeft, theme.colors.text]);

  const showLoading = Boolean(editingId) && subscriptionsQuery.isLoading;
  const showNotFound = Boolean(editingId) && !subscriptionsQuery.isLoading && !existing;

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
              <ActivityIndicator color={theme.colors.tint} />
              <Text style={styles.loadingText}>Loading…</Text>
            </View>
          ) : null}

          {showNotFound ? (
            <View style={styles.notFound} testID="subscriptionEditorNotFound">
              <Text style={styles.notFoundTitle}>Subscription not found</Text>
              <Text style={styles.notFoundText}>It may have been deleted on another device.</Text>
              <Pressable
                onPress={() => router.back()}
                style={[styles.primary, { backgroundColor: theme.colors.tint }]}
                testID="subscriptionEditorNotFoundBack"
              >
                <Text style={styles.primaryText}>Go back</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <View style={styles.section}>
                <Text style={styles.label}>Service</Text>
                <TextInput
                  value={serviceName}
                  onChangeText={setServiceName}
                  placeholder="Netflix, Spotify, iCloud…"
                  placeholderTextColor={
                    theme.isDark ? 'rgba(236,242,255,0.45)' : 'rgba(15,23,42,0.35)'
                  }
                  style={styles.input}
                  testID="subscriptionEditorServiceName"
                />
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Category</Text>
                <View style={styles.chipsRow} testID="subscriptionEditorCategories">
                  {SUBSCRIPTION_CATEGORIES.map((cat) => {
                    const active = cat === category;
                    const iconColor = active ? '#fff' : theme.colors.text;
                    const iconSize = 26;
                    return (
                      <Pressable
                        key={cat}
                        onPress={() => setCategory(cat)}
                        style={[
                          styles.chip,
                          active
                            ? { backgroundColor: theme.colors.tint, borderColor: theme.colors.tint }
                            : null,
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
                            active ? { color: '#fff' } : { color: theme.colors.text },
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
                <View style={[styles.section, styles.gridItem]}>
                  <Text style={styles.label}>Amount</Text>
                  <View style={styles.amountRow}>
                    <Pressable
                      style={styles.currencyPill}
                      onPress={() => setShowCurrencyPicker(true)}
                      testID="subscriptionEditorCurrency"
                    >
                      <Text style={styles.currencyText}>{currency}</Text>
                    </Pressable>
                    <TextInput
                      value={amountText}
                      onChangeText={setAmountText}
                      keyboardType={Platform.OS === 'web' ? 'default' : 'decimal-pad'}
                      placeholder="9.99"
                      placeholderTextColor={
                        theme.isDark ? 'rgba(236,242,255,0.45)' : 'rgba(15,23,42,0.35)'
                      }
                      style={[styles.input, styles.amountInput]}
                      testID="subscriptionEditorAmount"
                    />
                  </View>
                </View>

                <View style={[styles.section, styles.gridItem]}>
                  <Text style={styles.label}>Cycle</Text>
                  <View style={styles.cycleRow} testID="subscriptionEditorCycles">
                    {BILLING_CYCLES.map((cycle) => {
                      const active = cycle === billingCycle;
                      return (
                        <Pressable
                          key={cycle}
                          onPress={() => setBillingCycle(cycle)}
                          style={[
                            styles.cycle,
                            active
                              ? {
                                  backgroundColor: theme.colors.tint,
                                  borderColor: theme.colors.tint,
                                }
                              : null,
                          ]}
                          testID={`subscriptionEditorCycle_${cycle}`}
                        >
                          <Text
                            style={[
                              styles.cycleText,
                              active ? { color: '#fff' } : { color: theme.colors.text },
                            ]}
                          >
                            {cycle}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
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
                  placeholderTextColor={
                    theme.isDark ? 'rgba(236,242,255,0.45)' : 'rgba(15,23,42,0.35)'
                  }
                  style={styles.input}
                  testID="subscriptionEditorBillingDay"
                />
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Notes (optional)</Text>
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="e.g. Family plan, billed through Google Play"
                  placeholderTextColor={
                    theme.isDark ? 'rgba(236,242,255,0.45)' : 'rgba(15,23,42,0.35)'
                  }
                  multiline
                  style={[styles.input, styles.notesInput]}
                  testID="subscriptionEditorNotes"
                />
              </View>

              {canDelete ? (
                <View style={styles.dangerZone} testID="subscriptionEditorDanger">
                  <Pressable
                    onPress={handleDelete}
                    style={styles.deleteButton}
                    disabled={deleteMutation.isPending || upsertMutation.isPending}
                    testID="subscriptionEditorDelete"
                  >
                    <TrashIcon color={theme.colors.negative} size={18} />
                    <Text style={[styles.deleteText, { color: theme.colors.negative }]}>
                      Delete subscription
                    </Text>
                  </Pressable>
                </View>
              ) : null}

              <View style={styles.footerSpace}>
                <Button
                  title="Save Subscription"
                  onPress={handleSave}
                  loading={upsertMutation.isPending}
                  testID="subscriptionEditorSaveBottom"
                  style={{ width: '100%' }}
                  icon={<CheckIcon color="#fff" size={20} />}
                />
              </View>

              <CurrencyPickerSheet
                isOpen={showCurrencyPicker}
                onClose={() => setShowCurrencyPicker(false)}
                selectedCurrency={currency}
                onSelect={(code) => {
                  setCurrency(code);
                  setShowCurrencyPicker(false);
                }}
              />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

function toInput(
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
    isArchived: false,
  };
}

function createStyles(theme: ReturnType<typeof useAppTheme>) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
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
      backgroundColor: theme.isDark ? 'rgba(236,242,255,0.08)' : 'rgba(15,23,42,0.06)',
    },
    headerRight: {
      // Unused now
      width: 38,
      height: 38,
    },
    section: {
      gap: 10,
    },
    label: {
      color: theme.colors.secondaryText,
      fontSize: 13,
      fontWeight: '700',
      letterSpacing: 0.4,
      marginLeft: 4,
    },
    helper: {
      color: theme.colors.secondaryText,
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
      color: theme.colors.text,
      backgroundColor: theme.isDark ? 'rgba(236,242,255,0.06)' : '#fff',
      borderWidth: 1,
      borderColor: theme.colors.border,
      fontSize: 16,
      fontWeight: '600',
      // Subtle shadow
      shadowColor: '#000',
      shadowOpacity: 0.04,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
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
      backgroundColor: theme.colors.card,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      flexBasis: '30%',
      flexGrow: 1,
      maxWidth: '32%',
      minHeight: 70,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 7,
      // Subtle shadow
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
      backgroundColor: theme.colors.cardAlt,
      borderWidth: 1,
      borderColor: theme.colors.border,
      minHeight: 56,
      justifyContent: 'center',
    },
    currencyText: {
      color: theme.colors.text,
      fontWeight: '700',
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
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    cycleText: {
      fontSize: 13,
      fontWeight: '600',
    },
    dangerZone: {
      marginTop: 10,
      borderRadius: 24,
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
      paddingVertical: 8,
    },
    deleteText: {
      fontSize: 15,
      fontWeight: '700',
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
      color: theme.colors.secondaryText,
      fontSize: 14,
      fontWeight: '600',
    },
    notFound: {
      borderRadius: 26,
      padding: 24,
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
      gap: 12,
      alignItems: 'center',
    },
    notFoundTitle: {
      color: theme.colors.text,
      fontSize: 20,
      fontWeight: '700',
    },
    notFoundText: {
      color: theme.colors.secondaryText,
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
    },
    footerSpace: {
      marginTop: 20,
      paddingTop: 10,
    },
  });
}
