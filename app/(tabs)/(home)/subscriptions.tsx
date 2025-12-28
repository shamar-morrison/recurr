import { router, Stack } from 'expo-router';
import { CirclePlus, Crown, Filter, Plus } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppColors, CATEGORY_COLORS } from '@/constants/colors';
import { Button } from '@/src/components/ui/Button';
import { useAuth } from '@/src/features/auth/AuthProvider';
import {
  useSubscriptionListItems,
  useSubscriptionsQuery,
} from '@/src/features/subscriptions/subscriptionsHooks';
import { SubscriptionCategory } from '@/src/features/subscriptions/types';

const FREE_TIER_LIMIT = 5;

type FilterChip = SubscriptionCategory | 'All';

export default function SubscriptionsHomeScreen() {
  const theme = { colors: AppColors };
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(insets.bottom), [insets.bottom]);
  const { isPremium, settings } = useAuth();

  const subscriptionsQuery = useSubscriptionsQuery();
  const items = useSubscriptionListItems(subscriptionsQuery.data);

  const [filter, setFilter] = useState<FilterChip>('All');

  const filteredItems = useMemo(() => {
    if (filter === 'All') return items;
    return items.filter((i) => i.category === filter);
  }, [filter, items]);

  const atFreeLimit = useMemo(() => {
    if (isPremium) return false;
    return items.length >= FREE_TIER_LIMIT;
  }, [isPremium, items.length]);

  // Calculate subscriptions due this month and total spend
  const { subscriptionsDueThisMonth, totalMonthlySpend } = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const dueThisMonth = items.filter((item) => {
      const billingDate = new Date(item.nextBillingDateISO);
      return billingDate.getMonth() === currentMonth && billingDate.getFullYear() === currentYear;
    });

    const total = dueThisMonth.reduce((sum, item) => sum + item.amount, 0);

    return {
      subscriptionsDueThisMonth: dueThisMonth,
      totalMonthlySpend: total,
    };
  }, [items]);

  const handleAdd = useCallback(() => {
    if (atFreeLimit) {
      router.push('/paywall');
      return;
    }
    router.push('/(tabs)/(home)/subscription-editor');
  }, [atFreeLimit]);

  const headerRight = useCallback(() => {
    return (
      <Pressable onPress={handleAdd} style={styles.headerButton} testID="subscriptionsHeaderAdd">
        <Plus color={theme.colors.tint} size={20} />
      </Pressable>
    );
  }, [handleAdd, styles.headerButton, theme.colors.tint]);

  const renderItem = useCallback(
    ({ item }: { item: (typeof filteredItems)[number] }) => {
      const categoryColors = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.Other;
      const daysUntilBilling = Math.max(0, item.nextBillingInDays);
      const billingText =
        daysUntilBilling === 0
          ? 'Today'
          : daysUntilBilling === 1
            ? 'Tomorrow'
            : `in ${daysUntilBilling} days`;

      return (
        <Pressable
          onPress={() =>
            router.push({
              pathname: '/(tabs)/(home)/subscription-editor',
              params: { id: item.id },
            })
          }
          style={styles.row}
          testID={`subscriptionRow_${item.id}`}
        >
          <View style={styles.logo}>
            <Text style={styles.logoText}>{(item.serviceName[0] ?? '?').toUpperCase()}</Text>
          </View>

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
            <Text style={styles.rowBillingDate}>{billingText}</Text>
          </View>
        </Pressable>
      );
    },
    [styles]
  );

  const keyExtractor = useCallback((i: (typeof filteredItems)[number]) => i.id, []);

  const listHeader = useMemo(() => {
    return (
      <View style={styles.top} testID="subscriptionsHeader">
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            {/* Top row: Label + Currency Badge */}
            <View style={styles.heroLabelRow}>
              <Text style={styles.heroLabel}>Total Monthly Spend</Text>
              <View style={styles.currencyBadge}>
                <Text style={styles.currencyBadgeText}>{settings.currency}</Text>
              </View>
            </View>

            {/* Amount display */}
            <View style={styles.heroAmountRow}>
              <Text style={styles.heroAmount}>
                {formatMoney(totalMonthlySpend, settings.currency)}
              </Text>
              <Text style={styles.heroAmountSuffix}>/ month</Text>
            </View>
          </View>

          {/* Active subscriptions pill */}
          <View style={styles.activeSubsPill}>
            <View style={styles.countCircle}>
              <Text style={styles.countCircleText}>{subscriptionsDueThisMonth.length}</Text>
            </View>
            <Text style={styles.activeSubsLabel}>Active subscriptions this month</Text>
          </View>

          {!isPremium ? (
            <View style={styles.limitRow}>
              <Text style={styles.limitText} testID="freeTierLimitText">
                Free tier: {Math.min(items.length, FREE_TIER_LIMIT)}/{FREE_TIER_LIMIT} subscriptions
              </Text>
              {atFreeLimit ? (
                <Pressable
                  onPress={() => router.push('/paywall')}
                  style={[styles.limitCta, { borderColor: theme.colors.tint }]}
                  testID="unlockPremiumCta"
                >
                  <Text style={[styles.limitCtaText, { color: theme.colors.tint }]}>Unlock</Text>
                  <Crown color={theme.colors.tint} size={16} />
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </View>

        <View style={styles.filters}>
          <View style={styles.filtersLeft}>
            <Filter color={theme.colors.secondaryText} size={16} />
            <Text style={styles.filtersLabel}>Filter</Text>
          </View>
          <View style={styles.chipsRow}>
            {(['All', 'Streaming', 'Music', 'Software', 'Utilities', 'Other'] as const).map(
              (chip) => {
                const active = chip === filter;
                return (
                  <Pressable
                    key={chip}
                    onPress={() => setFilter(chip)}
                    style={[
                      styles.chip,
                      active
                        ? { backgroundColor: theme.colors.tint, borderColor: theme.colors.tint }
                        : null,
                    ]}
                    testID={`filterChip_${chip}`}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        active ? { color: '#fff' } : { color: theme.colors.text },
                      ]}
                    >
                      {chip}
                    </Text>
                  </Pressable>
                );
              }
            )}
          </View>
        </View>

        {subscriptionsQuery.isLoading ? (
          <View style={styles.loadingBox} testID="subscriptionsLoading">
            <ActivityIndicator color={theme.colors.tint} />
            <Text style={styles.loadingText}>Loading subscriptions…</Text>
          </View>
        ) : null}

        {subscriptionsQuery.isError ? (
          <View style={styles.errorBox} testID="subscriptionsError">
            <Text style={styles.errorTitle}>{`Couldn't`} load subscriptions</Text>
            <Text style={styles.errorText}>
              Pull to refresh. If it keeps happening, try signing out and back in.
            </Text>
          </View>
        ) : null}

        {!subscriptionsQuery.isLoading && filteredItems.length === 0 ? (
          <View style={styles.empty} testID="subscriptionsEmpty">
            <View style={styles.emptyIcon}>
              <CirclePlus color={theme.colors.tint} size={22} />
            </View>
            <Text style={styles.emptyTitle}>
              {filter === 'All' ? 'Add your first subscription' : 'No matches'}
            </Text>
            <Text style={styles.emptyText}>
              {filter === 'All'
                ? `Start with your top 3. We'll estimate your monthly spend automatically.`
                : 'Try another category filter.'}
            </Text>

            {filter === 'All' ? (
              <Button
                title="Add Subscription"
                onPress={handleAdd}
                testID="subscriptionsAddFirst"
                style={{ marginTop: 6 }}
              />
            ) : null}
          </View>
        ) : null}
      </View>
    );
  }, [
    atFreeLimit,
    filter,
    handleAdd,
    isPremium,
    items.length,
    settings,
    styles,
    subscriptionsDueThisMonth,
    subscriptionsQuery.isError,
    subscriptionsQuery.isLoading,
    filteredItems.length,
    theme.colors.secondaryText,
    theme.colors.text,
    theme.colors.tint,
    totalMonthlySpend,
  ]);

  return (
    <>
      <Stack.Screen options={{ title: 'Subscriptions', headerRight }} />

      <View style={styles.container} testID="subscriptionsHomeScreen">
        <FlatList
          data={filteredItems}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ListHeaderComponent={listHeader}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={Boolean(subscriptionsQuery.isFetching)}
              onRefresh={() => subscriptionsQuery.refetch()}
              tintColor={theme.colors.tint}
            />
          }
          testID="subscriptionsList"
        />

        <Pressable
          onPress={handleAdd}
          style={[styles.fab, { backgroundColor: theme.colors.tint }]}
          testID="subscriptionsFab"
        >
          <Plus color="#fff" size={22} />
        </Pressable>
      </View>
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
  } catch (e) {
    console.log('[subscriptions] formatMoney failed', e);
    const safe = Number.isFinite(amount) ? amount : 0;
    return `${safe.toFixed(2)} ${currency || 'USD'}`;
  }
}

function formatShortDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch (e) {
    console.log('[subscriptions] formatShortDate failed', e);
    return '—';
  }
}

function createStyles(bottomInset: number) {
  const theme = { colors: AppColors };
  const shadowColor = 'rgba(15,23,42,0.12)';

  return StyleSheet.create({
    headerButton: {
      width: 40,
      height: 40,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(79,140,255,0.10)',
    },
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    listContent: {
      padding: 16,
      paddingBottom: 120,
    },
    top: {
      gap: 16,
      paddingBottom: 8,
    },
    hero: {
      borderRadius: 32,
      padding: 24,
      backgroundColor: theme.colors.primary, // Use primary brand color
      shadowColor: theme.colors.primary,
      shadowOpacity: 0.3,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 10 },
      elevation: 4,
      gap: 16,
    },
    heroTop: {
      gap: 12,
    },
    heroLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    heroLabel: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
      letterSpacing: -0.1,
      opacity: 0.9,
    },
    currencyBadge: {
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 6,
    },
    currencyBadgeText: {
      color: '#fff',
      fontWeight: '700',
      fontSize: 13,
      letterSpacing: 0.3,
    },
    heroAmountRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 8,
    },
    heroAmount: {
      color: '#fff',
      fontSize: 42,
      fontWeight: '800',
      letterSpacing: -1.5,
    },
    heroAmountSuffix: {
      color: 'rgba(255,255,255,0.7)',
      fontSize: 18,
      fontWeight: '600',
    },
    activeSubsPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: 'rgba(0,0,0,0.15)',
      borderRadius: 999,
      paddingVertical: 12,
      paddingHorizontal: 16,
    },
    countCircle: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: '#fff',
      alignItems: 'center',
      justifyContent: 'center',
    },
    countCircleText: {
      color: theme.colors.primary,
      fontSize: 14,
      fontWeight: '800',
    },
    activeSubsLabel: {
      color: '#fff',
      fontSize: 15,
      fontWeight: '600',
    },
    // Keep premium pill for potential future use
    premiumPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    premiumPillText: {
      color: '#fff',
      fontWeight: '700',
      fontSize: 12,
      letterSpacing: 0.4,
    },
    limitRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
      marginTop: 8,
      backgroundColor: 'rgba(255,255,255,0.1)',
      padding: 10,
      borderRadius: 16,
    },
    limitText: {
      color: '#fff',
      fontSize: 13,
      fontWeight: '600',
    },
    limitCta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 6,
      backgroundColor: '#fff',
    },
    limitCtaText: {
      fontWeight: '800',
      fontSize: 12,
      color: theme.colors.primary,
    },
    filters: {
      gap: 12,
      marginTop: 8,
    },
    filtersLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      display: 'none', // Hide "Filter" label for cleaner look
    },
    filtersLabel: {
      color: theme.colors.secondaryText,
      fontSize: 12,
      fontWeight: '900',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
    chipsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    chip: {
      width: '31%', // Exactly 3 per row: (100% - 2*gap) / 3
      minWidth: 0, // Prevent content from expanding
      borderRadius: 999,
      paddingVertical: 10,
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor,
      shadowOpacity: 0.05,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
      alignItems: 'center',
      justifyContent: 'center',
    },
    chipText: {
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: -0.1,
    },
    loadingBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 10,
    },
    loadingText: {
      color: theme.colors.secondaryText,
      fontSize: 13,
      fontWeight: '600',
    },
    errorBox: {
      borderRadius: 20,
      padding: 14,
      backgroundColor: 'rgba(255,107,107,0.10)',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(255,107,107,0.25)',
      gap: 6,
    },
    errorTitle: {
      color: theme.colors.text,
      fontWeight: '900',
      fontSize: 13,
    },
    errorText: {
      color: theme.colors.secondaryText,
      fontSize: 12,
      lineHeight: 16,
    },
    empty: {
      borderRadius: 26,
      padding: 24,
      backgroundColor: theme.colors.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      gap: 12,
      marginTop: 4,
      alignItems: 'center',
    },
    emptyIcon: {
      width: 48,
      height: 48,
      borderRadius: 16,
      backgroundColor: 'rgba(79,140,255,0.12)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyTitle: {
      color: theme.colors.text,
      fontSize: 18,
      fontWeight: '800',
      letterSpacing: -0.3,
      textAlign: 'center',
    },
    emptyText: {
      color: theme.colors.secondaryText,
      fontSize: 14,
      lineHeight: 20,
      maxWidth: 280,
      textAlign: 'center',
    },
    primary: {
      // Kept for legacy if needed, but unused mainly
      marginTop: 6,
      borderRadius: 18,
      paddingVertical: 14,
      alignItems: 'center',
    },
    primaryText: {
      color: '#fff',
      fontWeight: '900',
      fontSize: 15,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      paddingVertical: 16,
      paddingHorizontal: 16,
      borderRadius: 24,
      backgroundColor: theme.colors.card,
      shadowColor,
      shadowOpacity: 0.08,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      marginBottom: 12,
      borderWidth: 1,
      borderColor: 'transparent', // Cleaner look without border, or subtle
    },
    logo: {
      width: 52,
      height: 52,
      borderRadius: 16,
      backgroundColor: '#F2F4F7',
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoText: {
      color: theme.colors.text,
      fontWeight: '800',
      fontSize: 18,
    },
    rowMain: {
      flex: 1,
      gap: 6,
    },
    rowTitle: {
      color: theme.colors.text,
      fontSize: 17,
      fontWeight: '700',
      letterSpacing: -0.3,
    },
    categoryBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 6,
    },
    categoryBadgeText: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    rowRight: {
      alignItems: 'flex-end',
      gap: 2,
    },
    rowAmount: {
      color: theme.colors.text,
      fontSize: 20,
      fontWeight: '800',
      letterSpacing: -0.5,
    },
    rowBillingDate: {
      color: theme.colors.secondaryText,
      fontSize: 13,
      fontWeight: '500',
    },
    fab: {
      position: 'absolute',
      right: 20,
      bottom: Math.max(24, bottomInset + 8),
      width: 60,
      height: 60,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: theme.colors.primary,
      shadowOpacity: 0.4,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 6,
    },
  });
}
