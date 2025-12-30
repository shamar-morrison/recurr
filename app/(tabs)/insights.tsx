import React, { useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors, CATEGORY_COLORS } from '@/constants/colors';
import { BORDER_RADIUS, FONT_SIZE, SPACING } from '@/src/constants/theme';
import { useAuth } from '@/src/features/auth/AuthProvider';
import {
  useSubscriptionListItems,
  useSubscriptionsQuery,
} from '@/src/features/subscriptions/subscriptionsHooks';
import { SubscriptionCategory } from '@/src/features/subscriptions/types';
import { CalendarCheckIcon, CalendarIcon, ChartLineUpIcon, CrownIcon } from 'phosphor-react-native';

export default function InsightsScreen() {
  const { isPremium } = useAuth();

  const subscriptionsQuery = useSubscriptionsQuery();
  const items = useSubscriptionListItems(subscriptionsQuery.data);

  const insights = useMemo(() => {
    const monthlyTotal = sum(items.map((i) => i.monthlyEquivalent));
    const yearlyTotal = monthlyTotal * 12;

    const byCategory = groupByCategory(items);
    const categoryRows = Object.entries(byCategory)
      .map(([category, list]) => {
        const total = sum(list.map((i) => i.monthlyEquivalent));
        return {
          category: category as SubscriptionCategory,
          monthlyTotal: total,
        };
      })
      .sort((a, b) => b.monthlyTotal - a.monthlyTotal);

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
  }, [items]);

  return (
    <SafeAreaView style={styles.container} edges={['top']} testID="insightsScreen">
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Insights</Text>
        <Text style={styles.headerSubtitle}>Track your spending patterns</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} testID="insightsScroll">
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View style={styles.heroTitleRow}>
              <Text style={styles.heroTitle}>Spending</Text>
              {isPremium ? (
                <View style={styles.premiumPill} testID="insightsPremiumPill">
                  <CrownIcon color="#fff" size={14} />
                  <Text style={styles.premiumPillText}>Premium</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.heroSubtitle}>Know your baseline before the bills hit.</Text>
          </View>

          {subscriptionsQuery.isLoading ? (
            <View style={styles.loadingRow} testID="insightsLoading">
              <ActivityIndicator color={AppColors.tint} />
              <Text style={styles.loadingText}>Calculating…</Text>
            </View>
          ) : (
            <View style={styles.totals}>
              <View style={styles.totalCard} testID="insightsMonthlyTotal">
                <Text style={styles.totalLabel}>Monthly</Text>
                <Text style={styles.totalValue}>
                  {formatMoney(insights.monthlyTotal, items[0]?.currency ?? 'USD')}
                </Text>
              </View>
              <View style={styles.totalCard} testID="insightsYearlyTotal">
                <Text style={styles.totalLabel}>Yearly</Text>
                <Text style={styles.totalValue}>
                  {formatMoney(insights.yearlyTotal, items[0]?.currency ?? 'USD')}
                </Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <ChartLineUpIcon color={AppColors.text} size={18} />
              <Text style={styles.cardTitle}>Highlights</Text>
            </View>
          </View>

          {items.length === 0 ? (
            <Text style={styles.subtitle} testID="insightsEmpty">
              Add a few subscriptions to see totals, breakdowns, and upcoming charges.
            </Text>
          ) : (
            <View style={styles.highlights}>
              {/* Most Expensive */}
              <View style={styles.highlightCard} testID="insightsMostExpensive">
                <View style={[styles.highlightIconContainer, { backgroundColor: '#FEF3C7' }]}>
                  <CrownIcon size={18} color="#D97706" weight="fill" />
                </View>
                <View style={styles.highlightContent}>
                  <Text style={styles.highlightLabel}>Most expensive</Text>
                  <Text style={styles.highlightValue} numberOfLines={1}>
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
              <View style={styles.highlightCard} testID="insightsUpcoming">
                <View style={[styles.highlightIconContainer, { backgroundColor: '#DBEAFE' }]}>
                  <CalendarIcon size={18} color="#3B82F6" />
                </View>
                <View style={styles.highlightContent}>
                  <Text style={styles.highlightLabel}>Upcoming charge</Text>
                  <Text style={styles.highlightValue} numberOfLines={1}>
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
                <View style={styles.highlightCard} testID="insightsNext7Days">
                  <View style={[styles.highlightIconContainer, { backgroundColor: '#EDE9FE' }]}>
                    <CalendarCheckIcon size={18} color="#8B5CF6" />
                  </View>
                  <View style={styles.highlightContent}>
                    <Text style={styles.highlightLabel}>Next 7 days</Text>
                    <Text style={styles.highlightValue}>
                      {insights.next7Days.length} charge
                      {insights.next7Days.length === 1 ? '' : 's'}
                    </Text>
                  </View>
                </View>
              ) : null}
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>By category</Text>
          {items.length === 0 ? (
            <Text style={styles.subtitle}>—</Text>
          ) : (
            <View style={styles.bars} testID="insightsCategoryBreakdown">
              {insights.categoryRows.map((row) => {
                const pct =
                  insights.monthlyTotal <= 0 ? 0 : row.monthlyTotal / insights.monthlyTotal;
                const categoryColors = CATEGORY_COLORS[row.category] || CATEGORY_COLORS.Other;
                return (
                  <View
                    key={row.category}
                    style={styles.barRow}
                    testID={`insightsCategory_${row.category}`}
                  >
                    <View style={styles.barTop}>
                      <View style={[styles.categoryBadge, { backgroundColor: categoryColors.bg }]}>
                        <Text style={[styles.categoryBadgeText, { color: categoryColors.text }]}>
                          {row.category.toUpperCase()}
                        </Text>
                      </View>
                      <Text style={styles.barValue}>
                        {formatMoney(row.monthlyTotal, items[0]?.currency ?? 'USD')}
                      </Text>
                    </View>
                    <View style={styles.track}>
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
          )}
        </View>

        {!isPremium ? (
          <View style={styles.locked} testID="insightsLocked">
            <Text style={styles.lockedTitle}>Premium unlocks deeper insights</Text>
            <Text style={styles.lockedText}>
              Next: trends over time, spend alerts, and smarter reminders.
            </Text>
          </View>
        ) : null}

        <View style={styles.footerSpace} />
      </ScrollView>
    </SafeAreaView>
  );
}

function groupByCategory(items: ReturnType<typeof useSubscriptionListItems>) {
  const map: Record<SubscriptionCategory, typeof items> = {
    Streaming: [],
    Music: [],
    Software: [],
    Utilities: [],
    Health: [],
    Food: [],
    Education: [],
    Shopping: [],
    AI: [],
    Other: [],
  };

  for (const item of items) {
    const cat = item.category;
    const list = map[cat] ?? map.Other;
    list.push(item);
  }

  return map;
}

function sum(nums: number[]): number {
  let t = 0;
  for (const n of nums) t += Number.isFinite(n) ? n : 0;
  return t;
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
    backgroundColor: AppColors.background,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  headerTitle: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '800',
    color: AppColors.text,
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
    color: AppColors.secondaryText,
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
    backgroundColor: AppColors.primary,
    shadowColor: AppColors.primary,
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
    fontWeight: '600',
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
    fontWeight: '700',
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
    fontWeight: '600',
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
    fontWeight: '600',
    opacity: 0.9,
  },
  totalValue: {
    color: '#fff',
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  card: {
    borderRadius: BORDER_RADIUS.xxxl,
    padding: SPACING.xl,
    backgroundColor: AppColors.card,
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
    color: AppColors.text,
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    color: AppColors.secondaryText,
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
    backgroundColor: AppColors.cardAlt,
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
    color: AppColors.secondaryText,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  highlightValue: {
    color: AppColors.text,
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
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
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.xs,
  },
  categoryBadgeText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  barValue: {
    color: AppColors.text,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  track: {
    height: 12,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: '#F2F4F7',
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
    color: AppColors.text,
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  lockedText: {
    color: AppColors.secondaryText,
    fontSize: FONT_SIZE.md,
    lineHeight: 20,
  },
  footerSpace: {
    height: 20,
  },
});
