import { router, Stack } from 'expo-router';
import {
  CheckIcon,
  CirclesThreePlusIcon,
  CrownIcon,
  MagnifyingGlassIcon,
  PlusCircleIcon,
  PlusIcon,
  SlidersIcon,
  SortAscendingIcon,
  SortDescendingIcon,
  XCircleIcon,
} from 'phosphor-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppColors } from '@/constants/colors';
import { ServiceLogo } from '@/src/components/ServiceLogo';
import { Button } from '@/src/components/ui/Button';
import { CategoryBadge } from '@/src/components/ui/CategoryBadge';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { getServiceDomain } from '@/src/constants/services';
import { BORDER_RADIUS, FONT_SIZE, SPACING } from '@/src/constants/theme';
import { useTheme } from '@/src/context/ThemeContext';
import { useAuth } from '@/src/features/auth/AuthProvider';
import { useRemoteConfig } from '@/src/features/config/useRemoteConfig';
import { useCategories } from '@/src/features/subscriptions/hooks';
import {
  useSubscriptionListItems,
  useSubscriptionsQuery,
} from '@/src/features/subscriptions/subscriptionsHooks';
import { SubscriptionCategory } from '@/src/features/subscriptions/types';

type FilterChip = SubscriptionCategory | 'All';
type SortOption = 'Date' | 'CostAsc' | 'CostDesc' | 'Name';

export default function SubscriptionsHomeScreen() {
  const insets = useSafeAreaInsets();
  const { isPremium, settings } = useAuth();
  const { freeTierLimit, loading: configLoading } = useRemoteConfig();
  const { colors } = useTheme();
  const { allCategories } = useCategories();

  const subscriptionsQuery = useSubscriptionsQuery();
  const items = useSubscriptionListItems(subscriptionsQuery.data);

  const [filter, setFilter] = useState<FilterChip>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('Date');
  const [showSortMenu, setShowSortMenu] = useState(false);

  const filteredItems = useMemo(() => {
    let result = items;

    // 1. Filter by Category
    if (filter !== 'All') {
      result = result.filter((i) => i.category === filter);
    }

    // 2. Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((i) => i.serviceName.toLowerCase().includes(q));
    }

    // 3. Sort
    result = result.sort((a, b) => {
      switch (sortBy) {
        case 'Date':
          // Sort by days until billing (active upcoming first)
          return a.nextBillingInDays - b.nextBillingInDays;
        case 'CostAsc':
          return a.monthlyEquivalent - b.monthlyEquivalent;
        case 'CostDesc':
          return b.monthlyEquivalent - a.monthlyEquivalent;
        case 'Name':
          return a.serviceName.localeCompare(b.serviceName);
        default:
          return 0;
      }
    });

    return result;
  }, [filter, items, searchQuery, sortBy]);

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
      // Exclude paused subscriptions from totals
      if (item.status === 'Paused') return false;

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
        <CirclesThreePlusIcon color={colors.tint} size={20} />
      </Pressable>
    );
  }, [handleAdd, colors]);

  const renderItem = useCallback(
    ({ item }: { item: (typeof filteredItems)[number] }) => {
      const daysUntilBilling = Math.max(0, item.nextBillingInDays);

      const isPaused = item.status === 'Paused';

      const billingText = isPaused
        ? 'Paused'
        : daysUntilBilling === 0
          ? 'Today'
          : daysUntilBilling === 1
            ? 'Tomorrow'
            : `in ${daysUntilBilling} days`;

      return (
        <Pressable
          onPress={() =>
            router.push({
              pathname: '/(tabs)/(home)/subscription-details',
              params: { id: item.id },
            })
          }
          style={[styles.row, { backgroundColor: colors.card, opacity: isPaused ? 0.6 : 1 }]}
          testID={`subscriptionRow_${item.id}`}
        >
          <ServiceLogo
            serviceName={item.serviceName}
            domain={getServiceDomain(item.serviceName)}
            size={52}
            borderRadius={16}
          />

          <View style={styles.rowMain}>
            <Text style={[styles.rowTitle, { color: colors.text }]} numberOfLines={1}>
              {item.serviceName}
            </Text>
            <CategoryBadge category={item.category} size="sm" />
          </View>

          <View style={styles.rowRight}>
            <Text style={[styles.rowAmount, { color: colors.text }]}>
              {formatMoney(item.amount, item.currency)}
            </Text>
            <Text
              style={[
                styles.rowBillingDate,
                { color: isPaused ? colors.warning : colors.secondaryText },
              ]}
            >
              {billingText}
            </Text>
          </View>
        </Pressable>
      );
    },
    [styles, colors]
  );

  const keyExtractor = useCallback((i: (typeof filteredItems)[number]) => i.id, []);

  const listHeader = useMemo(() => {
    return (
      <View style={styles.top} testID="subscriptionsHeader">
        <View
          style={[styles.hero, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
        >
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
              <Text style={[styles.countCircleText, { color: colors.primary }]}>
                {subscriptionsDueThisMonth.length}
              </Text>
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
                  style={[styles.limitCta, { borderColor: colors.tint }]}
                  testID="unlockPremiumCta"
                >
                  <Text style={[styles.limitCtaText, { color: colors.tint }]}>Unlock</Text>
                  <CrownIcon color={colors.tint} size={16} />
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </View>

        {/* Search and Sort Row */}
        <View style={styles.searchRow}>
          <View
            style={[
              styles.searchInputContainer,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <MagnifyingGlassIcon color={colors.secondaryText} size={18} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search subscriptions..."
              placeholderTextColor={colors.secondaryText}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={24}>
                <XCircleIcon color={colors.secondaryText} size={18} weight="fill" />
              </Pressable>
            )}
          </View>

          <Pressable
            onPress={() => setShowSortMenu(!showSortMenu)}
            style={[
              styles.sortButton,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            {sortBy === 'CostAsc' || sortBy === 'Name' ? (
              <SortAscendingIcon color={colors.text} size={20} />
            ) : (
              <SortDescendingIcon color={colors.text} size={20} />
            )}
          </Pressable>
        </View>

        <Modal
          visible={showSortMenu}
          transparent
          animationType="fade"
          onRequestClose={() => setShowSortMenu(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setShowSortMenu(false)}>
            <Pressable
              style={[
                styles.sortMenu,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={(e) => e.stopPropagation()}
            >
              <Pressable
                onPress={() => {
                  setSortBy('Date');
                  setShowSortMenu(false);
                }}
                style={styles.sortMenuItem}
              >
                <Text
                  style={[
                    styles.sortMenuText,
                    { color: sortBy === 'Date' ? colors.tint : colors.text },
                  ]}
                >
                  Next Bill Date
                </Text>
                {sortBy === 'Date' && <CheckIcon color={colors.tint} size={16} />}
              </Pressable>
              <Pressable
                onPress={() => {
                  setSortBy('CostDesc');
                  setShowSortMenu(false);
                }}
                style={styles.sortMenuItem}
              >
                <Text
                  style={[
                    styles.sortMenuText,
                    { color: sortBy === 'CostDesc' ? colors.tint : colors.text },
                  ]}
                >
                  Highest Cost
                </Text>
                {sortBy === 'CostDesc' && <CheckIcon color={colors.tint} size={16} />}
              </Pressable>
              <Pressable
                onPress={() => {
                  setSortBy('CostAsc');
                  setShowSortMenu(false);
                }}
                style={styles.sortMenuItem}
              >
                <Text
                  style={[
                    styles.sortMenuText,
                    { color: sortBy === 'CostAsc' ? colors.tint : colors.text },
                  ]}
                >
                  Lowest Cost
                </Text>
                {sortBy === 'CostAsc' && <CheckIcon color={colors.tint} size={16} />}
              </Pressable>
              <Pressable
                onPress={() => {
                  setSortBy('Name');
                  setShowSortMenu(false);
                }}
                style={styles.sortMenuItem}
              >
                <Text
                  style={[
                    styles.sortMenuText,
                    { color: sortBy === 'Name' ? colors.tint : colors.text },
                  ]}
                >
                  Name (A-Z)
                </Text>
                {sortBy === 'Name' && <CheckIcon color={colors.tint} size={16} />}
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>

        <View style={styles.filters}>
          <View style={styles.filtersLeft}>
            <SlidersIcon color={colors.secondaryText} size={16} />
            <Text style={[styles.filtersLabel, { color: colors.secondaryText }]}>Filter</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsScrollContent}
          >
            {(['All', ...allCategories] as FilterChip[]).map((chip) => {
              const active = chip === filter;
              return (
                <Pressable
                  key={chip}
                  onPress={() => setFilter(chip)}
                  style={[
                    styles.chip,
                    { backgroundColor: colors.card, borderColor: colors.border },
                    active ? { backgroundColor: colors.tint, borderColor: colors.tint } : null,
                  ]}
                  testID={`filterChip_${chip}`}
                >
                  <Text
                    style={[styles.chipText, active ? { color: '#fff' } : { color: colors.text }]}
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
            <ActivityIndicator color={colors.tint} />
            <Text style={[styles.loadingText, { color: colors.secondaryText }]}>
              Loading subscriptions…
            </Text>
          </View>
        ) : null}

        {subscriptionsQuery.isError ? (
          <View style={styles.errorBox} testID="subscriptionsError">
            <Text style={[styles.errorTitle, { color: colors.text }]}>
              {`Couldn't`} load subscriptions
            </Text>
            <Text style={[styles.errorText, { color: colors.secondaryText }]}>
              Pull to refresh. If it keeps happening, try signing out and back in.
            </Text>
          </View>
        ) : null}

        {!subscriptionsQuery.isLoading && filteredItems.length === 0 ? (
          <EmptyState
            icon={
              filter === 'All' && !searchQuery ? (
                <PlusCircleIcon color={colors.tint} size={40} />
              ) : (
                <XCircleIcon color={colors.tint} size={40} />
              )
            }
            title={filter === 'All' && !searchQuery ? 'Add your first subscription' : 'No matches'}
            description={
              filter === 'All' && !searchQuery
                ? `Start with your top 3. We'll estimate your monthly spend automatically.`
                : 'Try adjusting your search or filters.'
            }
            size="md"
            action={
              filter === 'All' && !searchQuery ? (
                <Button
                  size="sm"
                  title="Add Subscription"
                  onPress={handleAdd}
                  testID="subscriptionsAddFirst"
                />
              ) : undefined
            }
            testID="subscriptionsEmpty"
          />
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
    colors,
    searchQuery,
    sortBy,
    showSortMenu,
    configLoading,
    freeTierLimit,
  ]);

  return (
    <>
      <Stack.Screen options={{ title: 'Subscriptions', headerRight }} />

      <View
        style={[styles.container, { backgroundColor: colors.background }]}
        testID="subscriptionsHomeScreen"
      >
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
              tintColor={colors.tint}
            />
          }
          testID="subscriptionsList"
        />

        <Pressable
          onPress={handleAdd}
          style={[
            styles.fab,
            { backgroundColor: colors.tint, bottom: Math.max(24, insets.bottom + 8) },
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
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(79,140,255,0.10)',
  },
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  listContent: {
    padding: SPACING.lg,
    paddingBottom: 120,
  },
  top: {
    gap: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  hero: {
    borderRadius: BORDER_RADIUS.xxxl,
    padding: SPACING.xxl,
    backgroundColor: AppColors.primary,
    shadowColor: AppColors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
    gap: SPACING.lg,
  },
  heroTop: {
    gap: SPACING.md,
  },
  heroLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroLabel: {
    color: '#fff',
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    letterSpacing: -0.1,
    opacity: 0.9,
  },
  currencyBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 6,
  },
  currencyBadgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: FONT_SIZE.md,
    letterSpacing: 0.3,
  },
  heroAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: SPACING.sm,
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
    gap: SPACING.md,
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  countCircle: {
    width: 28,
    height: 28,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countCircleText: {
    color: AppColors.primary,
    fontSize: FONT_SIZE.md,
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
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
  },
  premiumPillText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: FONT_SIZE.sm,
    letterSpacing: 0.4,
  },
  limitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: SPACING.sm,
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 10,
    borderRadius: BORDER_RADIUS.xl,
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
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    backgroundColor: '#fff',
  },
  limitCtaText: {
    fontWeight: '800',
    fontSize: FONT_SIZE.sm,
    color: AppColors.primary,
  },
  searchRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: 4,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.card,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: BORDER_RADIUS.xl,
    paddingHorizontal: SPACING.md,
    height: 50,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    color: AppColors.text,
  },
  sortButton: {
    width: 50,
    height: 50,
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: AppColors.card,
    borderWidth: 1,
    borderColor: AppColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  sortMenu: {
    backgroundColor: AppColors.card,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.sm,
    gap: 4,
    shadowColor: 'rgba(0,0,0,0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
    maxWidth: 320,
    width: '100%',
    alignSelf: 'center',
  },
  sortMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
  },
  sortMenuText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  filters: {
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },
  filtersLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    display: 'none',
  },
  filtersLabel: {
    color: AppColors.secondaryText,
    fontSize: FONT_SIZE.sm,
    fontWeight: '900',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  chipsScrollContent: {
    gap: SPACING.md,
    paddingRight: SPACING.lg,
  },
  chip: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.full,
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
    gap: SPACING.md,
    paddingVertical: SPACING.md,
  },
  loadingText: {
    color: AppColors.secondaryText,
    fontSize: 13,
    fontWeight: '600',
  },
  errorBox: {
    borderRadius: BORDER_RADIUS.xxl,
    padding: SPACING.lg,
    backgroundColor: 'rgba(255,107,107,0.10)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,107,107,0.25)',
    gap: 6,
  },
  errorTitle: {
    color: AppColors.text,
    fontWeight: '900',
    fontSize: FONT_SIZE.md,
  },
  errorText: {
    color: AppColors.secondaryText,
    fontSize: FONT_SIZE.sm,
    lineHeight: 16,
  },
  primary: {
    marginTop: 6,
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  primaryText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: FONT_SIZE.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.xxxl,
    backgroundColor: AppColors.card,
    shadowColor,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  logo: {
    width: 52,
    height: 52,
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: '#F2F4F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: AppColors.text,
    fontWeight: '800',
    fontSize: FONT_SIZE.xl,
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

  rowRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  rowAmount: {
    color: AppColors.text,
    fontSize: FONT_SIZE.xxl,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  rowBillingDate: {
    color: AppColors.secondaryText,
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    right: SPACING.xl,
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: AppColors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
});
