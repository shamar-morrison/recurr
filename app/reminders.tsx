import { router, Stack } from 'expo-router';
import { BellIcon, BellSlashIcon, FlaskIcon, FunnelSimpleIcon } from 'phosphor-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppColors, CATEGORY_COLORS } from '@/constants/colors';
import { ServiceLogo } from '@/src/components/ServiceLogo';
import { BaseModal } from '@/src/components/ui/BaseModal';
import { BaseModalListItem } from '@/src/components/ui/BaseModalListItem';
import { StackHeader } from '@/src/components/ui/StackHeader';
import { getServiceDomain } from '@/src/constants/services';
import { BORDER_RADIUS, FONT_SIZE, SPACING } from '@/src/constants/theme';
import { useTheme } from '@/src/context/ThemeContext';
import { cancelNotification } from '@/src/features/notifications/notificationService';
import {
  useSubscriptionsQuery,
  useUpsertSubscriptionMutation,
} from '@/src/features/subscriptions/subscriptionsHooks';
import {
  REMINDER_OPTIONS,
  Subscription,
  SUBSCRIPTION_CATEGORIES,
  SubscriptionCategory,
} from '@/src/features/subscriptions/types';
import { scheduleTestNotification } from '@/src/utils/devUtils';

type FilterCategory = SubscriptionCategory | 'All';

export default function RemindersScreen() {
  const insets = useSafeAreaInsets();
  const subscriptionsQuery = useSubscriptionsQuery();
  const upsertMutation = useUpsertSubscriptionMutation();
  const { colors } = useTheme();

  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('All');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);

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

  const renderItem = useCallback(
    ({ item }: { item: Subscription }) => {
      const categoryColors = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.Other;

      return (
        <Pressable
          onPress={() => handleEditSubscription(item.id)}
          style={styles.row}
          testID={`reminderRow_${item.id}`}
        >
          <ServiceLogo
            serviceName={item.serviceName}
            domain={getServiceDomain(item.serviceName)}
            size={52}
            borderRadius={16}
          />

          <View style={styles.rowMain}>
            <Text style={styles.rowTitle} numberOfLines={1}>
              {item.serviceName}
            </Text>
            <View style={[styles.categoryBadge, { backgroundColor: categoryColors.bg }]}>
              <Text style={[styles.categoryBadgeText, { color: categoryColors.text }]}>
                {item.category.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.rowRight}>
            <Text style={styles.rowAmount}>{formatMoney(item.amount, item.currency)}</Text>
            <View style={styles.reminderRow}>
              <BellIcon color={AppColors.tint} size={14} />
              <Text style={styles.reminderText}>{getReminderLabel(item.reminderDays)}</Text>
            </View>
          </View>
        </Pressable>
      );
    },
    [getReminderLabel, handleEditSubscription]
  );

  const keyExtractor = useCallback((item: Subscription) => item.id, []);

  const ListEmptyComponent = useMemo(
    () => (
      <View style={styles.empty}>
        <View style={styles.emptyIcon}>
          <BellSlashIcon color={AppColors.secondaryText} size={48} />
        </View>
        <Text style={styles.emptyTitle}>
          {selectedCategory === 'All' ? 'No Reminders Set' : 'No Reminders Found'}
        </Text>
        <Text style={styles.emptyText}>
          {selectedCategory === 'All'
            ? 'Add reminders to your subscriptions to get notified before they renew. You can set reminders when creating or editing a subscription.'
            : `No reminders found for ${selectedCategory} subscriptions. Try selecting a different category.`}
        </Text>
        {selectedCategory === 'All' ? (
          <Pressable
            onPress={() => router.push('/(tabs)/(home)/subscriptions')}
            style={styles.emptyButton}
          >
            <Text style={styles.emptyButtonText}>View Subscriptions</Text>
          </Pressable>
        ) : (
          <Pressable onPress={() => setSelectedCategory('All')} style={styles.emptyButton}>
            <Text style={styles.emptyButtonText}>Clear Filter</Text>
          </Pressable>
        )}
      </View>
    ),
    [selectedCategory]
  );

  const ListHeaderComponent = useMemo(() => {
    if (subscriptionsWithReminders.length === 0) return null;

    return (
      <View style={styles.header}>
        <Text style={styles.headerCount}>
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
            <ActivityIndicator size="small" color={AppColors.negative} />
          ) : (
            <Text style={styles.clearAllText}>Clear All</Text>
          )}
        </Pressable>
      </View>
    );
  }, [subscriptionsWithReminders.length, selectedCategory, handleClearAll, isClearingAll]);

  const headerRight = useMemo(
    () => (
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {__DEV__ && (
          <Pressable onPress={scheduleTestNotification} style={styles.filterButton}>
            <FlaskIcon color={AppColors.text} size={20} weight="regular" />
          </Pressable>
        )}
        <Pressable
          onPress={() => setShowFilterModal(true)}
          style={[styles.filterButton, selectedCategory !== 'All' && styles.filterButtonActive]}
        >
          <FunnelSimpleIcon
            color={selectedCategory !== 'All' ? '#fff' : AppColors.text}
            size={20}
            weight={selectedCategory !== 'All' ? 'fill' : 'regular'}
          />
        </Pressable>
      </View>
    ),
    [selectedCategory]
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
              tintColor={AppColors.tint}
            />
          }
          testID="remindersList"
        />
      </View>

      {/* Category Filter Modal */}
      <BaseModal
        visible={showFilterModal}
        title="Filter by Category"
        onClose={() => setShowFilterModal(false)}
      >
        <FlatList<FilterCategory>
          data={['All', ...SUBSCRIPTION_CATEGORIES] as FilterCategory[]}
          keyExtractor={(item) => item}
          renderItem={({ item }) => {
            const isSelected = item === selectedCategory;
            const categoryColors =
              item === 'All'
                ? null
                : CATEGORY_COLORS[item as SubscriptionCategory] || CATEGORY_COLORS.Other;
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
    </>
  );
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
    backgroundColor: AppColors.background,
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
    fontWeight: '600',
    color: AppColors.secondaryText,
  },
  clearAllButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: 'rgba(255,107,107,0.1)',
  },
  clearAllText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: AppColors.negative,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.xxl,
    backgroundColor: AppColors.card,
    marginBottom: SPACING.md,
  },
  rowMain: {
    flex: 1,
    gap: 6,
  },
  rowTitle: {
    color: AppColors.text,
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  rowDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.xs,
  },
  categoryBadgeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  billingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  billingText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
    color: AppColors.secondaryText,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  reminderText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: AppColors.tint,
  },
  rowRight: {
    alignItems: 'flex-end',
    gap: SPACING.sm,
  },
  rowAmount: {
    color: AppColors.text,
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  removeButton: {
    padding: 6,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: 'rgba(255,107,107,0.1)',
  },
  empty: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xxxl,
    gap: SPACING.lg,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'rgba(15,23,42,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.xxxl,
    fontWeight: '800',
    color: AppColors.text,
    letterSpacing: -0.5,
  },
  emptyText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '500',
    color: AppColors.secondaryText,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyButton: {
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: AppColors.tint,
    marginTop: SPACING.sm,
  },
  emptyButtonText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: '#fff',
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
  filterButtonActive: {
    backgroundColor: AppColors.tint,
  },
  // Filter category dot (used in BaseModalListItem leftElement)
  filterCategoryDot: {
    width: 12,
    height: 12,
    borderRadius: BORDER_RADIUS.full,
  },
});
