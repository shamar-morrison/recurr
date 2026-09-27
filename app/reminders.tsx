import { router, Stack } from 'expo-router';
import { FilterIcon, FlaskConicalIcon, Notification01Icon, NotificationOff01Icon } from '@hugeicons/core-free-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getCategoryColors } from '@/constants/colors';
import { ServiceLogo } from '@/src/components/ServiceLogo';
import { BaseModal } from '@/src/components/ui/BaseModal';
import { BaseModalListItem } from '@/src/components/ui/BaseModalListItem';
import { Button } from '@/src/components/ui/Button';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { AppIcon } from '@/src/components/ui/AppIcon';
import { StackHeader } from '@/src/components/ui/StackHeader';
import { getServiceDomain } from '@/src/constants/services';
import { BORDER_RADIUS, FONT_FAMILY, FONT_SIZE, SPACING } from '@/src/constants/theme';
import { useTheme } from '@/src/context/ThemeContext';
import {
  cancelNotification,
  isSnoozedActive,
  openAppNotificationSettings,
  scheduleSubscriptionReminder,
  snoozeSubscriptionReminder,
  snoozeSubscriptionReminderUntil,
  withSnoozeLock,
} from '@/src/features/notifications/notificationService';
import { useNotificationStatus } from '@/src/features/notifications/useNotificationStatus';
import { useCategories } from '@/src/features/subscriptions/hooks';
import { getSubscription } from '@/src/features/subscriptions/subscriptionsRepo';
import {
  useSubscriptionsQuery,
  useUpsertSubscriptionMutation,
} from '@/src/features/subscriptions/subscriptionsHooks';
import {
  REMINDER_OPTIONS,
  Subscription,
  SubscriptionCategory,
} from '@/src/features/subscriptions/types';
import { scheduleTestNotification } from '@/src/utils/devUtils';

type FilterCategory = SubscriptionCategory | 'All';

export default function RemindersScreen() {
  const insets = useSafeAreaInsets();
  const subscriptionsQuery = useSubscriptionsQuery();
  const upsertMutation = useUpsertSubscriptionMutation();
  const { colors } = useTheme();
  const { allCategories, customCategories } = useCategories();

  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('All');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);
  const [snoozeTarget, setSnoozeTarget] = useState<Subscription | null>(null);
  const [isSnoozing, setIsSnoozing] = useState(false);
  const [unsnoozeId, setUnsnoozeId] = useState<string | null>(null);
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [customDate, setCustomDate] = useState(() => new Date(Date.now() + 24 * 60 * 60 * 1000));
  // null = still checking; the disabled banner stays hidden until we know
  // the OS status. Refreshes on focus + app foreground (see hook).
  const notificationsEnabled = useNotificationStatus();

  // Filter to only subscriptions with reminders set
  const subscriptionsWithReminders = useMemo(() => {
    const subs = subscriptionsQuery.data ?? [];
    let filtered = subs.filter((s) => s.reminderDays && s.reminderDays > 0 && !s.isArchived);

    // Apply category filter
    if (selectedCategory !== 'All') {
      filtered = filtered.filter((s) => s.category === selectedCategory);
    }

    return filtered;
  }, [subscriptionsQuery.data, selectedCategory]);

  // Get unique categories that have reminders set
  const categoriesWithReminders = useMemo(() => {
    const subs = subscriptionsQuery.data ?? [];
    const reminderedSubs = subs.filter(
      (s) => s.reminderDays && s.reminderDays > 0 && !s.isArchived
    );
    const categories = new Set(reminderedSubs.map((s) => s.category));
    return Array.from(categories);
  }, [subscriptionsQuery.data]);

  const getReminderLabel = useCallback((days: number | null | undefined) => {
    if (!days) return 'None';
    const option = REMINDER_OPTIONS.find((o) => o.value === days);
    return option?.label ?? `${days} day${days > 1 ? 's' : ''} before`;
  }, []);

  const handleRemoveReminder = useCallback(
    async (subscription: Subscription) => {
      Alert.alert(
        'Remove Reminder',
        `Remove the billing reminder for ${subscription.serviceName}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: async () => {
              try {
                // Cancel the notification
                if (subscription.notificationId) {
                  await cancelNotification(subscription.notificationId);
                }
                // Update the subscription
                await upsertMutation.mutateAsync({
                  ...subscription,
                  reminderDays: null,
                  notificationId: null,
                  snoozedUntil: null,
                });
              } catch (e) {
                console.error('[reminders] Failed to remove reminder:', e);
                Alert.alert('Error', 'Failed to remove reminder. Please try again.');
              }
            },
          },
        ]
      );
    },
    [upsertMutation]
  );

  const handleEditSubscription = useCallback((subscriptionId: string) => {
    router.push({
      pathname: '/(tabs)/(home)/subscription-editor',
      params: { id: subscriptionId },
    });
  }, []);

  const handleClearAll = useCallback(() => {
    if (subscriptionsWithReminders.length === 0) return;

    Alert.alert(
      'Clear All Reminders',
      `Remove all ${subscriptionsWithReminders.length} billing reminders?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            setIsClearingAll(true);
            try {
              const results = await Promise.allSettled(
                subscriptionsWithReminders.map(async (sub) => {
                  try {
                    if (sub.notificationId) {
                      await cancelNotification(sub.notificationId);
                    }
                    await upsertMutation.mutateAsync({
                      ...sub,
                      reminderDays: null,
                      notificationId: null,
                      snoozedUntil: null,
                    });
                    return sub.id;
                  } catch (err) {
                    console.error(
                      `[reminders] Failed to clear reminder for ${sub.serviceName}:`,
                      err
                    );
                    throw new Error(sub.serviceName); // Throw service name to identify failure
                  }
                })
              );

              const failures = results
                .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
                .map((r) => r.reason.message);

              if (failures.length > 0) {
                Alert.alert(
                  'Partial Success',
                  `Failed to clear reminders for: ${failures.join(', ')}. Please try again.`
                );
              } else {
                Alert.alert('Success', 'All reminders cleared successfully.');
              }
            } catch (e) {
              console.error('[reminders] Unexpected error during bulk clear:', e);
              Alert.alert('Error', 'An unexpected error occurred. Please try again.');
            } finally {
              setIsClearingAll(false);
            }
          },
        },
      ]
    );
  }, [subscriptionsWithReminders, upsertMutation]);

  // Refetch on foreground so the expired-snooze cleanup below runs promptly
  // instead of waiting for an unrelated mutation or manual refresh.
  const refetchSubscriptions = subscriptionsQuery.refetch;
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void refetchSubscriptions();
      }
    });
    return () => sub.remove();
  }, [refetchSubscriptions]);

  // Clear expired snoozes back to null once their snoozedUntil timestamp passes.
  // Also re-schedules the regular ongoing reminder — without this the
  // subscription would be left with no future notification (the snooze
  // replaced the original when it was set). Guarded by the shared snooze
  // lock so a concurrent tray/picker snooze can't interleave; duplicate
  // clears are idempotent no-ops (same payload) if the effect re-runs.
  // Note: depends on the stable mutateAsync (not the whole mutation object,
  // whose identity changes after each mutation and would re-trigger this).
  const upsertAsync = upsertMutation.mutateAsync;
  useEffect(() => {
    const subs = subscriptionsQuery.data ?? [];
    const expired = subs.filter(
      (s) => typeof s.snoozedUntil === 'number' && s.snoozedUntil <= Date.now()
    );
    if (expired.length === 0) return;
    (async () => {
      await Promise.allSettled(
        expired.map((s) =>
          withSnoozeLock(s.id, async () => {
            // Re-read: the row may have changed since this effect snapshot
            // (editor save, tray snooze) — or have been deleted. Only proceed
            // on the fresh row; never recreate from a stale snapshot.
            const fresh = await getSubscription(s.userId, s.id);
            if (
              !fresh ||
              typeof fresh.snoozedUntil !== 'number' ||
              fresh.snoozedUntil > Date.now()
            ) {
              return;
            }
            const target = fresh;
            if (target.reminderDays && target.reminderDays > 0) {
              if (target.notificationId) {
                await cancelNotification(target.notificationId);
              }
              const notificationId = await scheduleSubscriptionReminder(
                target,
                target.reminderDays,
                target.reminderHour ?? 12
              );
              if (!notificationId) {
                // Reschedule failed (e.g. permissions revoked): keep the row
                // untouched so a later run retries instead of dropping the
                // reminder permanently.
                console.log(
                  '[reminders] Expiry reschedule failed; keeping snooze for retry:',
                  s.id
                );
                return;
              }
              await upsertAsync({ ...target, notificationId, snoozedUntil: null });
            } else {
              await upsertAsync({ ...target, notificationId: null, snoozedUntil: null });
            }
          })
        )
      );
    })();
  }, [subscriptionsQuery.data, upsertAsync]);

  const persistSnoozeResult = useCallback(
    async (
      subscription: Subscription,
      result: { notificationId: string | null; snoozedUntil: number | null }
    ) => {
      if (!result.notificationId || !result.snoozedUntil) {
        Alert.alert('Error', 'Failed to snooze reminder. Please try again.');
        return;
      }
      try {
        const saved = await upsertMutation.mutateAsync({
          ...subscription,
          notificationId: result.notificationId,
          snoozedUntil: result.snoozedUntil,
        });
        if (saved.pendingSync === true) {
          console.log('[reminders] Snooze saved locally; Firestore sync pending');
        }
        setSnoozeTarget(null);
        setShowCustomDatePicker(false);
      } catch (e) {
        console.error('[reminders] Failed to persist snooze:', e);
        Alert.alert('Error', 'Failed to snooze reminder. Please try again.');
      }
    },
    [upsertMutation]
  );

  const handleSnoozeDays = useCallback(
    async (subscription: Subscription, days: number) => {
      setIsSnoozing(true);
      try {
        // Guarded: shares the in-flight lock with the tray action handler,
        // so a double-tap (or tray+picker race) can't schedule twice.
        const result = await withSnoozeLock(subscription.id, () =>
          snoozeSubscriptionReminder(subscription, days)
        );
        if (!result) return; // duplicate in-flight — first call handles it
        await persistSnoozeResult(subscription, result);
      } finally {
        setIsSnoozing(false);
      }
    },
    [persistSnoozeResult]
  );

  const handleSnoozeCustomDate = useCallback(
    async (date: Date) => {
      if (!snoozeTarget) return;
      const hour = snoozeTarget.reminderHour ?? 12;
      const snoozeDate = new Date(date);
      snoozeDate.setHours(hour, 0, 0, 0);
      if (snoozeDate.getTime() <= Date.now()) {
        Alert.alert('Invalid date', 'Please pick a future date to snooze until.');
        return;
      }
      setIsSnoozing(true);
      try {
        const result = await withSnoozeLock(snoozeTarget.id, () =>
          snoozeSubscriptionReminderUntil(snoozeTarget, snoozeDate)
        );
        if (!result) return; // duplicate in-flight — first call handles it
        await persistSnoozeResult(snoozeTarget, result);
      } finally {
        setIsSnoozing(false);
      }
    },
    [snoozeTarget, persistSnoozeResult]
  );

  const handleUnsnooze = useCallback(
    async (subscription: Subscription) => {
      setUnsnoozeId(subscription.id);
      try {
        // Same lock as the snooze paths so a tray snooze can't interleave.
        await withSnoozeLock(subscription.id, async () => {
          // Fresh-read protection (same hazard as the editor clobber fixes):
          // operate on the latest persisted row, never the possibly-stale
          // snapshot the list rendered from.
          const fresh = await getSubscription(subscription.userId, subscription.id);
          if (!fresh) {
            Alert.alert('Error', 'Subscription not found. Please try again.');
            return;
          }
          if (!isSnoozedActive(fresh)) return; // already cleared elsewhere — no-op

          if (fresh.notificationId) {
            await cancelNotification(fresh.notificationId);
          }

          // Re-schedule the original reminder from its stored settings.
          // If scheduling fails (e.g. permissions revoked), return BEFORE
          // persisting so the snooze stays intact for a later retry —
          // clearing it here would leave no reminder at all.
          if (fresh.reminderDays && fresh.reminderDays > 0) {
            const notificationId = await scheduleSubscriptionReminder(
              fresh,
              fresh.reminderDays,
              fresh.reminderHour ?? 12
            );
            if (!notificationId) {
              Alert.alert(
                'Could not reschedule',
                'The reminder could not be re-scheduled (check notification permissions). Your snooze was left untouched — please try again.'
              );
              return;
            }
            const saved = await upsertMutation.mutateAsync({
              ...fresh,
              notificationId,
              snoozedUntil: null,
            });
            if (saved.pendingSync === true) {
              console.log('[reminders] Un-snooze saved locally; Firestore sync pending');
            }
          } else {
            const saved = await upsertMutation.mutateAsync({
              ...fresh,
              notificationId: null,
              snoozedUntil: null,
            });
            if (saved.pendingSync === true) {
              console.log('[reminders] Un-snooze saved locally; Firestore sync pending');
            }
          }
        });
      } catch (e) {
        console.error('[reminders] Failed to un-snooze:', e);
        Alert.alert('Error', 'Failed to un-snooze. Please try again.');
      } finally {
        setUnsnoozeId(null);
      }
    },
    [upsertMutation]
  );

  const renderItem = useCallback(
    ({ item }: { item: Subscription }) => {
      const snoozed = isSnoozedActive(item);
      const busy = unsnoozeId === item.id;
      const dotColor = getCategoryColors(
        item.category,
        customCategories.find((c) => c.name === item.category)?.color
      ).text;
      return (
        <Pressable
          onPress={() => handleEditSubscription(item.id)}
          style={[styles.row, { backgroundColor: colors.card }]}
          testID={`reminderRow_${item.id}`}
        >
          <ServiceLogo
            serviceName={item.serviceName}
            domain={getServiceDomain(item.serviceName)}
            size={52}
            borderRadius={16}
          />

          <View style={styles.rowMain}>
            <View style={styles.titleRow}>
              <View style={[styles.categoryDot, { backgroundColor: dotColor }]} />
              <Text style={[styles.rowTitle, { color: colors.text, flex: 1 }]}>
                {item.serviceName}
              </Text>
            </View>

            {snoozed && item.snoozedUntil ? (
              <View
                style={[
                  styles.snoozedPill,
                  { backgroundColor: 'rgba(247,144,9,0.12)', borderColor: colors.warning },
                ]}
              >
                <Text style={[styles.snoozedPillText, { color: colors.warning }]}>
                  Snoozed to {formatSnoozedUntil(item.snoozedUntil)}
                </Text>
              </View>
            ) : (
              <View style={styles.reminderRow}>
                <AppIcon icon={Notification01Icon} color={colors.tint} size={14} />
                <Text style={[styles.reminderText, { color: colors.tint }]}>
                  {getReminderLabel(item.reminderDays)}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.rowRight}>
            <Text style={[styles.rowAmount, { color: colors.text }]}>
              {formatMoney(item.amount, item.currency)}
            </Text>
            {snoozed ? (
              <Pressable
                onPress={() => void handleUnsnooze(item)}
                disabled={busy}
                style={[
                  styles.snoozeButton,
                  styles.unsnoozeButton,
                  { borderColor: colors.warning, opacity: busy ? 0.6 : 1 },
                ]}
                testID={`unsnoozeButton_${item.id}`}
              >
                <Text style={[styles.snoozeButtonText, { color: colors.warning }]}>
                  {busy ? 'Working…' : 'Un-snooze'}
                </Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={() => setSnoozeTarget(item)}
                style={styles.snoozeButton}
                testID={`snoozeButton_${item.id}`}
              >
                <Text style={[styles.snoozeButtonText, { color: colors.tint }]}>Snooze</Text>
              </Pressable>
            )}
          </View>
        </Pressable>
      );
    },
    [getReminderLabel, handleEditSubscription, handleUnsnooze, unsnoozeId, customCategories, colors]
  );

  const keyExtractor = useCallback((item: Subscription) => item.id, []);

  const ListEmptyComponent = useMemo(
    () => (
      <EmptyState
        icon={<AppIcon icon={NotificationOff01Icon} color={colors.secondaryText} size={48} />}
        title={selectedCategory === 'All' ? 'No Reminders Set' : 'No Reminders Found'}
        description={
          selectedCategory === 'All'
            ? 'Add reminders to your subscriptions to get notified before they renew. You can set reminders when creating or editing a subscription.'
            : `No reminders found for ${selectedCategory} subscriptions. Try selecting a different category.`
        }
        size="lg"
        action={
          selectedCategory === 'All' ? (
            <Button
              title="View Subscriptions"
              onPress={() => router.push('/(tabs)/(home)/subscriptions')}
            />
          ) : (
            <Button title="Clear Filter" onPress={() => setSelectedCategory('All')} />
          )
        }
      />
    ),
    [selectedCategory, colors]
  );

  const ListHeaderComponent = useMemo(() => {
    if (subscriptionsWithReminders.length === 0) return null;

    return (
      <View style={styles.header}>
        <Text style={[styles.headerCount, { color: colors.secondaryText }]}>
          {subscriptionsWithReminders.length} reminder
          {subscriptionsWithReminders.length !== 1 ? 's' : ''} set
          {selectedCategory !== 'All' ? ` (${selectedCategory})` : ''}
        </Text>
        <Pressable
          onPress={handleClearAll}
          style={[styles.clearAllButton, isClearingAll && { opacity: 0.7 }]}
          disabled={isClearingAll}
        >
          {isClearingAll ? (
            <ActivityIndicator size="small" color={colors.negative} />
          ) : (
            <Text style={[styles.clearAllText, { color: colors.negative }]}>Clear All</Text>
          )}
        </Pressable>
      </View>
    );
  }, [subscriptionsWithReminders.length, selectedCategory, handleClearAll, isClearingAll, colors]);

  const headerRight = useMemo(
    () => (
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {__DEV__ && (
          <Pressable
            onPress={scheduleTestNotification}
            style={[styles.filterButton, { backgroundColor: colors.tertiaryBackground }]}
          >
            <AppIcon icon={FlaskConicalIcon} color={colors.text} size={20} />
          </Pressable>
        )}
        <Pressable
          onPress={() => setShowFilterModal(true)}
          style={[
            styles.filterButton,
            { backgroundColor: colors.tertiaryBackground },
            selectedCategory !== 'All' && { backgroundColor: colors.tint },
          ]}
        >
          <AppIcon
            icon={FilterIcon}
            color={selectedCategory !== 'All' ? '#fff' : colors.text}
            size={20}
            fill={selectedCategory !== 'All' ? '#fff' : 'transparent'}
          />
        </Pressable>
      </View>
    ),
    [selectedCategory, colors]
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          header: () => (
            <StackHeader title="Billing Reminders" showBack headerRight={headerRight} />
          ),
        }}
      />

      <View
        style={[
          styles.container,
          { backgroundColor: colors.background, paddingBottom: insets.bottom },
        ]}
      >
        <FlatList
          data={subscriptionsWithReminders}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ListHeaderComponent={ListHeaderComponent}
          ListEmptyComponent={ListEmptyComponent}
          contentContainerStyle={[
            styles.listContent,
            subscriptionsWithReminders.length === 0 && styles.listContentEmpty,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={Boolean(subscriptionsQuery.isFetching)}
              onRefresh={() => subscriptionsQuery.refetch()}
              tintColor={colors.tint}
            />
          }
          testID="remindersList"
        />

        {notificationsEnabled === false && (
          <View style={styles.disabledBanner} testID="notificationsDisabledBanner">
            <View style={styles.disabledBannerRow}>
              <AppIcon icon={NotificationOff01Icon} color={colors.negative} size={24} />
              <View style={styles.disabledBannerText}>
                <Text style={[styles.disabledBannerTitle, { color: colors.text }]}>
                  Notifications are disabled
                </Text>
                <Text style={[styles.disabledBannerDesc, { color: colors.secondaryText }]}>
                  You won&apos;t receive billing reminders until you turn them back on.
                </Text>
              </View>
            </View>
            <Button
              title="Tap here to enable notifications"
              onPress={openAppNotificationSettings}
              variant="primary"
              size="md"
              style={styles.disabledBannerButton}
              icon={<AppIcon icon={Notification01Icon} color="#fff" size={20} />}
              testID="remindersEnableNotifications"
            />
          </View>
        )}
      </View>

      {/* Category Filter Modal */}
      <BaseModal
        visible={showFilterModal}
        title="Filter by Category"
        onClose={() => setShowFilterModal(false)}
      >
        <FlatList<FilterCategory>
          data={['All', ...allCategories] as FilterCategory[]}
          keyExtractor={(item) => item}
          renderItem={({ item }) => {
            const isSelected = item === selectedCategory;
            const customCat = customCategories.find((c) => c.name === item);
            const categoryColors =
              item === 'All' ? null : getCategoryColors(item, customCat?.color);
            const hasReminders =
              item === 'All' || categoriesWithReminders.includes(item as SubscriptionCategory);

            const colorDot = categoryColors ? (
              <View style={[styles.filterCategoryDot, { backgroundColor: categoryColors.text }]} />
            ) : null;

            return (
              <BaseModalListItem
                label={item}
                isSelected={isSelected}
                disabled={!hasReminders && (item as string) !== 'All'}
                onPress={() => {
                  setSelectedCategory(item);
                  setShowFilterModal(false);
                }}
                leftElement={colorDot}
              />
            );
          }}
          showsVerticalScrollIndicator={false}
        />
      </BaseModal>

      {/* Snooze Picker Modal */}
      <BaseModal
        visible={snoozeTarget !== null}
        title={snoozeTarget ? `Snooze ${snoozeTarget.serviceName}` : 'Snooze reminder'}
        onClose={() => {
          if (!isSnoozing) {
            setSnoozeTarget(null);
            setShowCustomDatePicker(false);
          }
        }}
      >
        {SNOOZE_PRESETS.map((preset) => (
          <BaseModalListItem
            key={preset.label}
            label={isSnoozing ? `${preset.label}…` : preset.label}
            disabled={isSnoozing}
            onPress={() => {
              if (snoozeTarget) void handleSnoozeDays(snoozeTarget, preset.days);
            }}
          />
        ))}
        <BaseModalListItem
          label="Custom date…"
          disabled={isSnoozing}
          onPress={() => {
            setCustomDate(new Date(Date.now() + 24 * 60 * 60 * 1000));
            setShowCustomDatePicker(true);
          }}
        />
        {showCustomDatePicker && (
          <View style={styles.customDatePicker}>
            <DateTimePicker
              value={customDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              minimumDate={new Date(Date.now() + 24 * 60 * 60 * 1000)}
              onChange={(event: { type: string }, selectedDate?: Date) => {
                if (Platform.OS !== 'ios') {
                  setShowCustomDatePicker(false);
                }
                if (event.type === 'dismissed') {
                  return;
                }
                if (selectedDate) {
                  if (Platform.OS === 'ios') {
                    setCustomDate(selectedDate);
                  } else {
                    void handleSnoozeCustomDate(selectedDate);
                  }
                }
              }}
            />
            {Platform.OS === 'ios' && (
              <Button
                title={isSnoozing ? 'Snoozing…' : 'Snooze until this date'}
                onPress={() => void handleSnoozeCustomDate(customDate)}
              />
            )}
          </View>
        )}
      </BaseModal>
    </>
  );
}

const SNOOZE_PRESETS = [
  { label: 'Snooze 1 day', days: 1 },
  { label: 'Snooze 3 days', days: 3 },
  { label: 'Snooze 1 week', days: 7 },
] as const;

function formatSnoozedUntil(snoozedUntil: number): string {
  try {
    return new Date(snoozedUntil).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 2,
    }).format(Number.isFinite(amount) ? amount : 0);
  } catch {
    const safe = Number.isFinite(amount) ? amount : 0;
    return `${safe.toFixed(2)} ${currency || 'USD'}`;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  listContentEmpty: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  headerCount: {
    fontSize: FONT_SIZE.md,
    fontFamily: FONT_FAMILY.semiBold,
  },
  clearAllButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: 'rgba(255,107,107,0.1)',
  },
  clearAllText: {
    fontSize: FONT_SIZE.md,
    fontFamily: FONT_FAMILY.semiBold,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.xxl,
    marginBottom: SPACING.md,
  },
  rowMain: {
    flex: 1,
    gap: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  categoryDot: {
    width: 7,
    height: 7,
    borderRadius: BORDER_RADIUS.full,
    flexShrink: 0,
  },
  rowTitle: {
    fontSize: FONT_SIZE.lg,
    fontFamily: FONT_FAMILY.bold,
    letterSpacing: -0.2,
  },
  rowDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  billingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  billingText: {
    fontSize: FONT_SIZE.sm,
    fontFamily: FONT_FAMILY.medium,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  reminderText: {
    fontSize: FONT_SIZE.md,
    fontFamily: FONT_FAMILY.semiBold,
  },
  rowRight: {
    alignItems: 'flex-end',
    gap: SPACING.sm,
  },
  rowAmount: {
    fontSize: FONT_SIZE.xl,
    fontFamily: FONT_FAMILY.bold,
    letterSpacing: -0.3,
  },
  removeButton: {
    padding: 6,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: 'rgba(255,107,107,0.1)',
  },

  // Disabled-notifications sticky footer
  disabledBanner: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.xxl,
    backgroundColor: 'rgba(255,107,107,0.1)',
    gap: SPACING.md,
  },
  disabledBannerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
  },
  disabledBannerText: {
    flex: 1,
    gap: 2,
  },
  disabledBannerTitle: {
    fontSize: FONT_SIZE.lg,
    fontFamily: FONT_FAMILY.bold,
    letterSpacing: -0.2,
  },
  disabledBannerDesc: {
    fontSize: FONT_SIZE.md,
    fontFamily: FONT_FAMILY.medium,
    lineHeight: 20,
  },
  disabledBannerButton: {
    width: '100%',
  },

  // Filter button styles
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15,23,42,0.06)',
  },
  filterButtonActive: {},
  // Filter category dot (used in BaseModalListItem leftElement)
  filterCategoryDot: {
    width: 12,
    height: 12,
    borderRadius: BORDER_RADIUS.full,
  },
  snoozeButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: 'rgba(79,140,255,0.1)',
  },
  unsnoozeButton: {
    backgroundColor: 'rgba(247,144,9,0.12)',
    borderWidth: 1,
  },
  snoozeButtonText: {
    fontSize: FONT_SIZE.sm,
    fontFamily: FONT_FAMILY.semiBold,
  },
  snoozedPill: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
  },
  snoozedPillText: {
    fontSize: FONT_SIZE.sm,
    fontFamily: FONT_FAMILY.semiBold,
  },
  customDatePicker: {
    gap: SPACING.md,
    paddingTop: SPACING.sm,
  },
});
