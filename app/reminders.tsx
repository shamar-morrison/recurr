import { router, Stack } from 'expo-router';
import { BellIcon, BellSlashIcon, CheckIcon, FunnelSimpleIcon, XIcon } from 'phosphor-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppColors, CATEGORY_COLORS } from '@/constants/colors';
import { ServiceLogo } from '@/src/components/ServiceLogo';
import { StackHeader } from '@/src/components/ui/StackHeader';
import { getServiceDomain } from '@/src/constants/services';
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

type FilterCategory = SubscriptionCategory | 'All';

export default function RemindersScreen() {
  const insets = useSafeAreaInsets();
  const subscriptionsQuery = useSubscriptionsQuery();
  const upsertMutation = useUpsertSubscriptionMutation();

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

      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
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
      <Modal
        visible={showFilterModal}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderSpacer} />
            <Text style={styles.modalTitle}>Filter by Category</Text>
            <Pressable onPress={() => setShowFilterModal(false)} style={styles.modalCloseButton}>
              <XIcon color={AppColors.text} size={22} />
            </Pressable>
          </View>

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

              return (
                <Pressable
                  onPress={() => {
                    setSelectedCategory(item);
                    setShowFilterModal(false);
                  }}
                  style={[styles.filterItem, isSelected && styles.filterItemSelected]}
                  disabled={!hasReminders && (item as string) !== 'All'}
                >
                  <View style={styles.filterItemLeft}>
                    {categoryColors && (
                      <View
                        style={[styles.filterCategoryDot, { backgroundColor: categoryColors.text }]}
                      />
                    )}
                    <Text
                      style={[
                        styles.filterItemText,
                        !hasReminders &&
                          (item as string) !== 'All' &&
                          styles.filterItemTextDisabled,
                      ]}
                    >
                      {item}
                    </Text>
                  </View>
                  {isSelected && <CheckIcon color={AppColors.tint} size={20} weight="bold" />}
                </Pressable>
              );
            }}
            contentContainerStyle={styles.filterList}
          />
        </SafeAreaView>
      </Modal>
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
    padding: 16,
    paddingBottom: 32,
  },
  listContentEmpty: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerCount: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.secondaryText,
  },
  clearAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,107,107,0.1)',
  },
  clearAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.negative,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: AppColors.card,
    marginBottom: 12,
  },
  rowMain: {
    flex: 1,
    gap: 6,
  },
  rowTitle: {
    color: AppColors.text,
    fontSize: 16,
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
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  billingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  billingText: {
    fontSize: 12,
    fontWeight: '500',
    color: AppColors.secondaryText,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  reminderText: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.tint,
  },
  rowRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  rowAmount: {
    color: AppColors.text,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  removeButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,107,107,0.1)',
  },
  empty: {
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(15,23,42,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: AppColors.text,
    letterSpacing: -0.5,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '500',
    color: AppColors.secondaryText,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: AppColors.tint,
    marginTop: 8,
  },
  emptyButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  // Filter button styles
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15,23,42,0.06)',
  },
  filterButtonActive: {
    backgroundColor: AppColors.tint,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AppColors.border,
  },
  modalHeaderSpacer: {
    width: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.text,
    letterSpacing: -0.3,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15,23,42,0.06)',
  },
  filterList: {
    padding: 16,
  },
  filterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 8,
    backgroundColor: AppColors.card,
  },
  filterItemSelected: {
    backgroundColor: 'rgba(79,140,255,0.1)',
    borderWidth: 1,
    borderColor: AppColors.tint,
  },
  filterItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  filterCategoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  filterItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.text,
  },
  filterItemTextDisabled: {
    color: AppColors.secondaryText,
    opacity: 0.5,
  },
});
