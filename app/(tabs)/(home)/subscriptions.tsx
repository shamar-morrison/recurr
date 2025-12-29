import { router, Stack } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppColors, CATEGORY_COLORS } from '@/constants/colors';
import { ServiceLogo } from '@/src/components/ServiceLogo';
import { Button } from '@/src/components/ui/Button';
import { getServiceDomain } from '@/src/constants/services';
import { useAuth } from '@/src/features/auth/AuthProvider';
import {
  useSubscriptionListItems,
  useSubscriptionsQuery,
} from '@/src/features/subscriptions/subscriptionsHooks';
import { SUBSCRIPTION_CATEGORIES, SubscriptionCategory } from '@/src/features/subscriptions/types';

import { useRemoteConfig } from '@/src/features/config/useRemoteConfig';
import {
  CirclesThreePlusIcon,
  CrownIcon,
  PlusCircleIcon,
  PlusIcon,
  SlidersIcon,
  XCircleIcon,
} from 'phosphor-react-native';

type FilterChip = SubscriptionCategory | 'All';

export default function SubscriptionsHomeScreen() {
  const insets = useSafeAreaInsets();
  const { isPremium, settings } = useAuth();
  const { freeTierLimit, loading: configLoading } = useRemoteConfig();

  const subscriptionsQuery = useSubscriptionsQuery();
  const items = useSubscriptionListItems(subscriptionsQuery.data);

  const [filter, setFilter] = useState<FilterChip>('All');

  const filteredItems = useMemo(() => {
    if (filter === 'All') return items;
    return items.filter((i) => i.category === filter);
  }, [filter, items]);

  const atFreeLimit = useMemo(() => {
    if (isPremium || configLoading) return false;
    return items.length >= freeTierLimit;
  }, [isPremium, items.length, freeTierLimit, configLoading]);

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
        <CirclesThreePlusIcon color={AppColors.tint} size={20} />
      </Pressable>
    );
  }, [handleAdd]);

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
                {configLoading
                  ? 'Checking limit…'
                  : `Free tier: ${Math.min(items.length, freeTierLimit)}/${freeTierLimit} subscriptions`}
              </Text>
              {atFreeLimit ? (
                <Pressable
                  onPress={() => router.push('/paywall')}
                  style={[styles.limitCta, { borderColor: AppColors.tint }]}
                  testID="unlockPremiumCta"
                >
                  <Text style={[styles.limitCtaText, { color: AppColors.tint }]}>Unlock</Text>
                  <CrownIcon color={AppColors.tint} size={16} />
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </View>

        <View style={styles.filters}>
          <View style={styles.filtersLeft}>
            <SlidersIcon color={AppColors.secondaryText} size={16} />
            <Text style={styles.filtersLabel}>Filter</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsScrollContent}
          >
            {(['All', ...SUBSCRIPTION_CATEGORIES] as const).map((chip) => {
              const active = chip === filter;
              return (
                <Pressable
                  key={chip}
                  onPress={() => setFilter(chip)}
                  style={[
                    styles.chip,
                    active
                      ? { backgroundColor: AppColors.tint, borderColor: AppColors.tint }
                      : null,
                  ]}
                  testID={`filterChip_${chip}`}
                >
                  <Text
                    style={[
                      styles.chipText,
                      active ? { color: '#fff' } : { color: AppColors.text },
                    ]}
                  >
                    {chip}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {subscriptionsQuery.isLoading ? (
          <View style={styles.loadingBox} testID="subscriptionsLoading">
            <ActivityIndicator color={AppColors.tint} />
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
              {filter === 'All' ? (
                <PlusCircleIcon color={AppColors.tint} size={22} />
              ) : (
                <XCircleIcon color={AppColors.tint} size={22} />
              )}
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
              tintColor={AppColors.tint}
            />
          }
          testID="subscriptionsList"
        />

        <Pressable
          onPress={handleAdd}
          style={[
            styles.fab,
            { backgroundColor: AppColors.tint, bottom: Math.max(24, insets.bottom + 8) },
          ]}
          testID="subscriptionsFab"
        >
          <PlusIcon color="#fff" size={22} />
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

const shadowColor = 'rgba(15,23,42,0.12)';

const styles = StyleSheet.create({
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
    backgroundColor: AppColors.background,
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
    backgroundColor: AppColors.primary,
    shadowColor: AppColors.primary,
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
    color: AppColors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  activeSubsLabel: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
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
    color: AppColors.primary,
  },
  filters: {
    gap: 12,
    marginTop: 8,
  },
  filtersLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    display: 'none',
  },
  filtersLabel: {
    color: AppColors.secondaryText,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  chipsScrollContent: {
    gap: 10,
    paddingRight: 16,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: AppColors.card,
    borderWidth: 1,
    borderColor: AppColors.border,
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
    color: AppColors.secondaryText,
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
    color: AppColors.text,
    fontWeight: '900',
    fontSize: 13,
  },
  errorText: {
    color: AppColors.secondaryText,
    fontSize: 12,
    lineHeight: 16,
  },
  empty: {
    borderRadius: 26,
    padding: 24,
    backgroundColor: AppColors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: AppColors.border,
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
    color: AppColors.text,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  emptyText: {
    color: AppColors.secondaryText,
    fontSize: 14,
    lineHeight: 20,
    maxWidth: 280,
    textAlign: 'center',
  },
  primary: {
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
    backgroundColor: AppColors.card,
    shadowColor,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'transparent',
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
    color: AppColors.text,
    fontWeight: '800',
    fontSize: 18,
  },
  rowMain: {
    flex: 1,
    gap: 6,
  },
  rowTitle: {
    color: AppColors.text,
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
    color: AppColors.text,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  rowBillingDate: {
    color: AppColors.secondaryText,
    fontSize: 13,
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: AppColors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
});
