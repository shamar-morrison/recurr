import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getCategoryColors } from '@/constants/colors';
import { CategoryBadge } from '@/src/components/ui/CategoryBadge';
import { BORDER_RADIUS, FONT_FAMILY, FONT_SIZE, SPACING } from '@/src/constants/theme';
import { useTheme } from '@/src/context/ThemeContext';
import { useAuth } from '@/src/features/auth/AuthProvider';
import { useCategories } from '@/src/features/subscriptions/hooks';
import {
  useSubscriptionListItems,
  useSubscriptionsQuery,
} from '@/src/features/subscriptions/subscriptionsHooks';
import { SubscriptionCategory } from '@/src/features/subscriptions/types';
import {
  calculateSpendingByCategory,
  calculateTotalSpending,
} from '@/src/utils/spendingCalculations';
import {
  ArrowDown01Icon,
  ArrowRight01Icon,
  ArrowUp01Icon,
  Calendar03Icon,
  CalendarCheckIn01Icon,
  ChartBarLineIcon,
  ChartLineIcon,
  CrownIcon,
} from '@hugeicons/core-free-icons';

import { PremiumBadge } from '@/src/components/ui/PremiumBadge';
import { AppIcon } from '@/src/components/ui/AppIcon';

const INITIAL_CATEGORIES_SHOWN = 5;

interface CategoryRow {
  category: SubscriptionCategory;
  monthlyTotal: number;
  customColor?: string;
}

interface CategoryBreakdownCardProps {
  categoryRows: CategoryRow[];
  monthlyTotal: number;
  currency: string;
  colors: ReturnType<typeof useTheme>['colors'];
  formatMoney: (amount: number, currency: string) => string;
}

function CategoryBreakdownCard({
  categoryRows,
  monthlyTotal,
  currency,
  colors,
  formatMoney,
}: CategoryBreakdownCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const totalCount = categoryRows.length;
  const hasMore = totalCount > INITIAL_CATEGORIES_SHOWN;
  const visibleRows = isExpanded ? categoryRows : categoryRows.slice(0, INITIAL_CATEGORIES_SHOWN);

  if (categoryRows.length === 0) {
    return (
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>By category</Text>
        <Text style={[styles.subtitle, { color: colors.secondaryText }]}>—</Text>
      </View>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <Text style={[styles.cardTitle, { color: colors.text }]}>By category</Text>
      <View style={styles.bars} testID="insightsCategoryBreakdown">
        {visibleRows.map((row) => {
          const pct = monthlyTotal <= 0 ? 0 : row.monthlyTotal / monthlyTotal;
          const categoryColors = getCategoryColors(row.category, row.customColor);
          return (
            <View
              key={row.category}
              style={styles.barRow}
              testID={`insightsCategory_${row.category}`}
            >
              <View style={styles.barTop}>
                <CategoryBadge category={row.category} customColor={row.customColor} size="md" />
                <Text style={[styles.barValue, { color: colors.text }]}>
                  {formatMoney(row.monthlyTotal, currency)}
                </Text>
              </View>
              <View style={[styles.track, { backgroundColor: colors.cardAlt }]}>
                <View
                  style={[
                    styles.fill,
                    {
                      width: `${Math.max(0, Math.min(1, pct)) * 100}%`,
                      backgroundColor: categoryColors.text,
                    },
                  ]}
                />
              </View>
            </View>
          );
        })}
      </View>

      {hasMore && (
        <Pressable
          onPress={() => setIsExpanded(!isExpanded)}
          style={styles.expandButton}
          testID="insightsCategoryExpand"
        >
          <Text style={[styles.expandButtonText, { color: colors.primary }]}>
            {isExpanded ? 'Show less' : `Show all ${totalCount} categories`}
          </Text>
          {isExpanded ? (
            <AppIcon icon={ArrowUp01Icon} color={colors.primary} size={16} />
          ) : (
            <AppIcon icon={ArrowDown01Icon} color={colors.primary} size={16} />
          )}
        </Pressable>
      )}
    </View>
  );
}

export default function InsightsScreen() {
  const { isPremium, settings } = useAuth();
  const { colors } = useTheme();

  const subscriptionsQuery = useSubscriptionsQuery();
  const items = useSubscriptionListItems(subscriptionsQuery.data);
  const subs = useMemo(() => subscriptionsQuery.data ?? [], [subscriptionsQuery.data]);
  const { customCategories } = useCategories();
  const currency = settings.currency ?? 'USD';

  // Trailing 12-month window (inclusive of today, exclusive of the same
  // date last year — exactly 12 months, not 12 months + 1 day). Every figure
  // on this screen derives from the payment schedule regenerated from each
  // subscription's *current* amount/cycle inside it (converted to the user's
  // currency) — not from billing-cycle estimates — so hero totals and the
  // breakdown always agree. Note: there is no immutable payment ledger, so
  // editing a subscription's amount also restates its past months.
  const [dayKey, setDayKey] = useState(() => startOfToday());
  // Tabs stay mounted, so recompute the window when the screen regains focus
  // (midnight rollover / background-across-days would otherwise show stale).
  useFocusEffect(
    useCallback(() => {
      setDayKey(startOfToday());
    }, [])
  );
  const range = useMemo(() => {
    const endDate = new Date(dayKey);
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date(endDate);
    startDate.setFullYear(startDate.getFullYear() - 1);
    startDate.setDate(startDate.getDate() + 1);
    startDate.setHours(0, 0, 0, 0);
    return { startDate, endDate };
  }, [dayKey]);

  const insights = useMemo(() => {
    const yearlyTotal = calculateTotalSpending(subs, range.startDate, range.endDate, {
      primaryCurrency: currency,
    });
    const monthlyTotal = yearlyTotal / 12;

    const spendingByCategory = calculateSpendingByCategory(
      subs,
      range.startDate,
      range.endDate,
      { customCategories, primaryCurrency: currency }
    );

    const categoryRows: CategoryRow[] = spendingByCategory.map((c) => ({
      category: c.category,
      // Displayed as monthly averages so rows sum to the Monthly hero;
      // ratios (and hence percentages) are identical to the yearly figures.
      monthlyTotal: c.amount / 12,
      customColor: c.customColor,
    }));

    // Include custom categories even if they have no subscriptions
    for (const customCat of customCategories) {
      if (!categoryRows.some((r) => r.category === customCat.name)) {
        categoryRows.push({
          category: customCat.name as SubscriptionCategory,
          monthlyTotal: 0,
          customColor: customCat.color,
        });
      }
    }
    categoryRows.sort((a, b) => b.monthlyTotal - a.monthlyTotal);

    const mostExpensive = items
      .slice()
      .sort((a, b) => b.monthlyEquivalent - a.monthlyEquivalent)[0];

    const upcoming = items
      .slice()
      .filter((i) => i.nextBillingInDays >= 0)
      .sort((a, b) => a.nextBillingInDays - b.nextBillingInDays)[0];

    const next7Days = items
      .filter((i) => i.nextBillingInDays >= 0 && i.nextBillingInDays <= 7)
      .sort((a, b) => a.nextBillingInDays - b.nextBillingInDays);

    return {
      monthlyTotal,
      yearlyTotal,
      categoryRows,
      mostExpensive,
      upcoming,
      next7Days,
    };
  }, [items, subs, range, customCategories, currency]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
      testID="insightsScreen"
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>My Insights</Text>
        <Text style={[styles.headerSubtitle, { color: colors.secondaryText }]}>
          Track your spending patterns
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} testID="insightsScroll">
        <View
          style={[styles.hero, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
        >
          <View style={styles.heroTop}>
            <View style={styles.heroTitleRow}>
              <Text style={styles.heroTitle}>Spending</Text>
              {isPremium ? (
                <View style={styles.premiumPill} testID="insightsPremiumPill">
                  <AppIcon icon={CrownIcon} color="#fff" size={14} />
                  <Text style={styles.premiumPillText}>Premium</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.heroSubtitle}>Know your baseline before the bills hit.</Text>
          </View>

          {subscriptionsQuery.isLoading ? (
            <View style={styles.loadingRow} testID="insightsLoading">
              <ActivityIndicator color={colors.tint} />
              <Text style={styles.loadingText}>Calculating…</Text>
            </View>
          ) : (
            <View style={styles.totals}>
              <View style={styles.totalCard} testID="insightsMonthlyTotal">
                <Text style={styles.totalLabel}>Monthly</Text>
                <Text style={styles.totalValue}>
                  {formatMoney(insights.monthlyTotal, currency)}
                </Text>
              </View>
              <View style={styles.totalCard} testID="insightsYearlyTotal">
                <Text style={styles.totalLabel}>Yearly</Text>
                <Text style={styles.totalValue}>
                  {formatMoney(insights.yearlyTotal, currency)}
                </Text>
              </View>
            </View>
          )}
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <AppIcon icon={ChartLineIcon} color={colors.text} size={18} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Highlights</Text>
            </View>
          </View>

          {items.length === 0 ? (
            <Text style={[styles.subtitle, { color: colors.secondaryText }]} testID="insightsEmpty">
              Add a few subscriptions to see totals, breakdowns, and upcoming charges.
            </Text>
          ) : (
            <View style={styles.highlights}>
              {/* Most Expensive */}
              <View
                style={[styles.highlightCard, { backgroundColor: colors.cardAlt }]}
                testID="insightsMostExpensive"
              >
                <View style={[styles.highlightIconContainer, { backgroundColor: '#FEF3C7' }]}>
                  <AppIcon icon={CrownIcon} size={18} color="#D97706" fill="#D97706" />
                </View>
                <View style={styles.highlightContent}>
                  <Text style={[styles.highlightLabel, { color: colors.secondaryText }]}>
                    Most expensive
                  </Text>
                  <Text style={[styles.highlightValue, { color: colors.text }]} numberOfLines={1}>
                    {insights.mostExpensive?.serviceName ?? '—'} ·{' '}
                    {formatMoney(
                      insights.mostExpensive?.monthlyEquivalent ?? 0,
                      insights.mostExpensive?.currency ?? 'USD'
                    )}
                    /mo
                  </Text>
                </View>
              </View>

              {/* Upcoming Charge */}
              <View
                style={[styles.highlightCard, { backgroundColor: colors.cardAlt }]}
                testID="insightsUpcoming"
              >
                <View style={[styles.highlightIconContainer, { backgroundColor: '#DBEAFE' }]}>
                    <AppIcon icon={Calendar03Icon} size={18} color="#3B82F6" />
                </View>
                <View style={styles.highlightContent}>
                  <Text style={[styles.highlightLabel, { color: colors.secondaryText }]}>
                    Upcoming charge
                  </Text>
                  <Text style={[styles.highlightValue, { color: colors.text }]} numberOfLines={1}>
                    {insights.upcoming?.serviceName ?? '—'}
                    {insights.upcoming
                      ? ` · ${formatShortDate(insights.upcoming.nextBillingDateISO)} (${Math.max(
                          0,
                          insights.upcoming.nextBillingInDays
                        )}d)`
                      : ''}
                  </Text>
                </View>
              </View>

              {/* Next 7 Days */}
              {insights.next7Days.length ? (
                <View
                  style={[styles.highlightCard, { backgroundColor: colors.cardAlt }]}
                  testID="insightsNext7Days"
                >
                  <View style={[styles.highlightIconContainer, { backgroundColor: '#EDE9FE' }]}>
                    <AppIcon icon={CalendarCheckIn01Icon} size={18} color="#8B5CF6" />
                  </View>
                  <View style={styles.highlightContent}>
                    <Text style={[styles.highlightLabel, { color: colors.secondaryText }]}>
                      Next 7 days
                    </Text>
                    <Text style={[styles.highlightValue, { color: colors.text }]}>
                      {insights.next7Days.length} charge
                      {insights.next7Days.length === 1 ? '' : 's'}
                    </Text>
                  </View>
                </View>
              ) : null}
            </View>
          )}
        </View>

        <CategoryBreakdownCard
          categoryRows={insights.categoryRows}
          monthlyTotal={insights.monthlyTotal}
          currency={currency}
          colors={colors}
          formatMoney={formatMoney}
        />

        {/* View Detailed Report Button - Premium Feature */}
        <Pressable
          style={[
            styles.detailedReportButton,
            { backgroundColor: colors.card },
            !isPremium && styles.detailedReportLocked,
          ]}
          onPress={() => {
            if (isPremium) {
              router.push('/(tabs)/(home)/spending-history');
            } else {
              router.push('/paywall');
            }
          }}
          testID="viewDetailedReportButton"
        >
          <View style={styles.detailedReportLeft}>
            <View style={[styles.detailedReportIcon, { backgroundColor: colors.badgeBackground }]}>
              <AppIcon icon={ChartBarLineIcon} color={colors.primary} size={24} fill={colors.primary} />
            </View>
            <View>
              <View style={styles.detailedReportTitleRow}>
                <Text style={[styles.detailedReportTitle, { color: colors.text }]}>
                  View Detailed Report
                </Text>
                {!isPremium && <PremiumBadge size="sm" />}
              </View>
              <Text style={[styles.detailedReportSubtitle, { color: colors.secondaryText }]}>
                Charts, trends & analytics
              </Text>
            </View>
          </View>
          {isPremium && <AppIcon icon={ArrowRight01Icon} color={colors.secondaryText} size={20} />}
        </Pressable>

        <View style={styles.footerSpace} />
      </ScrollView>
    </SafeAreaView>
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
    console.log('[insights] formatMoney failed', e);
    const safe = Number.isFinite(amount) ? amount : 0;
    return `${safe.toFixed(2)} ${currency || 'USD'}`;
  }
}

function startOfToday(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function formatShortDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch (e) {
    console.log('[insights] formatShortDate failed', e);
    return '—';
  }
}

const shadowColor = 'rgba(15,23,42,0.12)';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  headerTitle: {
    fontSize: FONT_SIZE.xxl,
    fontFamily: FONT_FAMILY.bold,
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: FONT_SIZE.md,
    fontFamily: FONT_FAMILY.medium,
    marginTop: 2,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: 28,
    gap: SPACING.lg,
  },
  hero: {
    borderRadius: BORDER_RADIUS.xxxl,
    padding: SPACING.xxl,
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
    gap: SPACING.lg,
  },
  heroTop: {
    gap: SPACING.sm,
  },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  heroTitle: {
    color: '#fff',
    fontSize: FONT_SIZE.xl,
    fontFamily: FONT_FAMILY.semiBold,
    letterSpacing: -0.1,
    opacity: 0.9,
  },
  heroSubtitle: {
    color: '#fff',
    fontSize: FONT_SIZE.md,
    lineHeight: 20,
    opacity: 0.8,
    maxWidth: 320,
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
    fontFamily: FONT_FAMILY.bold,
    fontSize: FONT_SIZE.sm,
    letterSpacing: 0.4,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  loadingText: {
    color: '#fff',
    fontSize: FONT_SIZE.md,
    fontFamily: FONT_FAMILY.semiBold,
  },
  totals: {
    gap: SPACING.md,
  },
  totalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: BORDER_RADIUS.xxl,
    padding: SPACING.lg,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  totalLabel: {
    color: '#fff',
    fontSize: FONT_SIZE.md,
    fontFamily: FONT_FAMILY.semiBold,
    opacity: 0.9,
  },
  totalValue: {
    color: '#fff',
    fontSize: FONT_SIZE.xl,
    fontFamily: FONT_FAMILY.bold,
    letterSpacing: -0.3,
  },
  card: {
    borderRadius: BORDER_RADIUS.xxxl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: 'transparent',
    shadowColor,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    gap: SPACING.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  cardTitle: {
    fontSize: FONT_SIZE.xl,
    fontFamily: FONT_FAMILY.bold,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: FONT_SIZE.md,
    lineHeight: 20,
  },
  highlights: {
    gap: SPACING.md,
  },
  highlightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    gap: SPACING.md,
  },
  highlightIconContainer: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightContent: {
    flex: 1,
    gap: 2,
  },
  highlightLabel: {
    fontSize: FONT_SIZE.sm,
    fontFamily: FONT_FAMILY.semiBold,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  highlightValue: {
    fontSize: FONT_SIZE.lg,
    fontFamily: FONT_FAMILY.bold,
    letterSpacing: -0.2,
  },
  bars: {
    gap: SPACING.lg,
  },
  barRow: {
    gap: SPACING.sm,
  },
  barTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },

  barValue: {
    fontSize: FONT_SIZE.md,
    fontFamily: FONT_FAMILY.bold,
    letterSpacing: -0.1,
  },
  track: {
    height: 12,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  fill: {
    height: 12,
    borderRadius: BORDER_RADIUS.full,
  },
  locked: {
    borderRadius: BORDER_RADIUS.xxxl,
    padding: SPACING.xl,
    backgroundColor: 'rgba(79,140,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(79,140,255,0.15)',
    gap: SPACING.sm,
  },
  lockedTitle: {
    fontSize: FONT_SIZE.lg,
    fontFamily: FONT_FAMILY.bold,
    letterSpacing: -0.2,
  },
  lockedText: {
    fontSize: FONT_SIZE.md,
    lineHeight: 20,
  },
  footerSpace: {
    height: 20,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
    marginTop: SPACING.sm,
  },
  expandButtonText: {
    fontSize: FONT_SIZE.md,
    fontFamily: FONT_FAMILY.semiBold,
  },
  detailedReportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.xxxl,
    gap: SPACING.md,
  },
  detailedReportLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
    minWidth: 0,
  },
  detailedReportIcon: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailedReportTitle: {
    fontSize: FONT_SIZE.lg,
    fontFamily: FONT_FAMILY.bold,
  },
  detailedReportSubtitle: {
    fontSize: FONT_SIZE.md,
    fontFamily: FONT_FAMILY.medium,
    marginTop: 2,
  },
  detailedReportTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  detailedReportLocked: {
    opacity: 0.6,
  },
});
