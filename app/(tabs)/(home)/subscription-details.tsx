import { router, Stack, useLocalSearchParams } from 'expo-router';
import {
  ArrowSquareOutIcon,
  CalendarIcon,
  CaretLeftIcon,
  ClockIcon,
  CurrencyCircleDollarIcon,
  HourglassHighIcon,
  ListBulletsIcon,
  PauseCircleIcon,
  PlayCircleIcon,
  RepeatIcon,
} from 'phosphor-react-native';
import React, { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ServiceLogo } from '@/src/components/ServiceLogo';
import { Button } from '@/src/components/ui/Button';
import { formatDate as formatDateUtil } from '@/src/constants/dateFormats';
import { getServiceDomain } from '@/src/constants/services';
import { BORDER_RADIUS, FONT_SIZE, SPACING } from '@/src/constants/theme';
import { useTheme } from '@/src/context/ThemeContext';
import { useAuth } from '@/src/features/auth/AuthProvider';
import { cancelNotification } from '@/src/features/notifications/notificationService';
import { useCustomServices } from '@/src/features/services/useCustomServices';
import {
  useDeleteSubscriptionMutation,
  useSubscriptionQuery,
} from '@/src/features/subscriptions/subscriptionsHooks';
import {
  calculateSubscriptionDuration,
  calculateTotalSpent,
  countPaymentsMade,
  diffDays,
  getLastPaymentDate,
  nextBillingDate,
} from '@/src/features/subscriptions/subscriptionsUtils';

type RouteParams = {
  id: string;
};

export default function SubscriptionDetailsScreen() {
  const params = useLocalSearchParams<RouteParams>();
  const subscriptionId = params.id;

  const { settings } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const { data: subscription, isLoading, isError } = useSubscriptionQuery(subscriptionId);
  const deleteMutation = useDeleteSubscriptionMutation();
  const { customServices } = useCustomServices();

  const formatDate = useCallback(
    (date: Date) => formatDateUtil(date, settings.dateFormat),
    [settings.dateFormat]
  );

  const formatMoney = useCallback((amount: number, currency: string): string => {
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
  }, []);

  // Get website URL from service domain or custom service
  const websiteUrl = useMemo(() => {
    if (!subscription) return null;

    // Check built-in services first
    const domain = getServiceDomain(subscription.serviceName);
    if (domain) return `https://${domain}`;

    // Check custom services
    const customService = customServices.find(
      (s) => s.name.toLowerCase() === subscription.serviceName.toLowerCase()
    );
    if (customService?.websiteUrl) return customService.websiteUrl;

    return null;
  }, [subscription, customServices]);

  // Calculate derived data
  const derivedData = useMemo(() => {
    if (!subscription) return null;

    const now = new Date();
    const anchor = subscription.startDate
      ? new Date(subscription.startDate)
      : new Date(subscription.createdAt);

    const nextPayment = nextBillingDate(now, subscription.billingCycle, anchor);
    const daysUntil = diffDays(now, nextPayment);
    const totalSpent = calculateTotalSpent(subscription, now);
    const paymentCount = countPaymentsMade(subscription, now);
    const duration = calculateSubscriptionDuration(subscription, now);
    const lastPayment = getLastPaymentDate(subscription, now);
    const startDate = subscription.startDate
      ? new Date(subscription.startDate)
      : new Date(subscription.createdAt);

    return {
      nextPayment,
      daysUntil,
      totalSpent,
      paymentCount,
      duration,
      lastPayment,
      startDate,
    };
  }, [subscription]);

  const handleEdit = useCallback(() => {
    router.push({
      pathname: '/(tabs)/(home)/subscription-editor',
      params: { id: subscriptionId },
    });
  }, [subscriptionId]);

  const handleDelete = useCallback(() => {
    if (!subscription) return;

    Alert.alert(
      'Delete subscription?',
      `This will permanently remove ${subscription.serviceName} and all its data.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Cancel any scheduled notification first
              if (subscription.notificationId) {
                try {
                  await cancelNotification(subscription.notificationId);
                } catch (cancelError) {
                  console.log(
                    '[subscription-details] failed to cancel notification on delete',
                    cancelError
                  );
                }
              }
              await deleteMutation.mutateAsync(subscription.id);
              router.back();
            } catch (e) {
              console.log('[subscription-details] delete failed', e);
              const msg = e instanceof Error ? e.message : 'Unknown error';
              Alert.alert(`Couldn't Delete`, msg);
            }
          },
        },
      ]
    );
  }, [subscription, deleteMutation]);

  const handleSeeAllPayments = useCallback(() => {
    router.push({
      pathname: '/(tabs)/(home)/payment-history',
      params: { id: subscriptionId },
    });
  }, [subscriptionId]);

  const handleOpenWebsite = useCallback(() => {
    if (websiteUrl) {
      Linking.openURL(websiteUrl).catch((err) => {
        console.log('[subscription-details] failed to open URL', err);
        Alert.alert('Error', 'Could not open website');
      });
    }
  }, [websiteUrl]);

  const headerLeft = useCallback(
    () => (
      <Pressable
        onPress={() => router.back()}
        style={[styles.headerButton, { backgroundColor: colors.tertiaryBackground }]}
        testID="subscriptionDetailsBack"
      >
        <CaretLeftIcon color={colors.text} size={22} />
      </Pressable>
    ),
    [colors]
  );

  // Loading state
  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Details', headerLeft }} />
        <View style={[styles.centered, { backgroundColor: colors.background }]}>
          <ActivityIndicator color={colors.tint} size="large" />
        </View>
      </>
    );
  }

  // Error or not found state
  if (isError || !subscription || !derivedData) {
    return (
      <>
        <Stack.Screen options={{ title: 'Details', headerLeft }} />
        <View style={[styles.centered, { backgroundColor: colors.background }]}>
          <Text style={[styles.errorText, { color: colors.text }]}>Subscription not found</Text>
          <Button title="Go Back" onPress={() => router.back()} size="sm" />
        </View>
      </>
    );
  }

  const isPaused = subscription.status === 'Paused';
  const statusColor = isPaused ? colors.warning : colors.positive;

  const billingCycleLabel =
    subscription.billingCycle === 'One-Time'
      ? 'One-Time'
      : `Every 1 ${subscription.billingCycle.replace('ly', '').toLowerCase()}`;

  return (
    <>
      <Stack.Screen options={{ title: subscription.serviceName, headerLeft }} />

      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        testID="subscriptionDetailsScreen"
      >
        {/* Hero Section */}
        <View style={styles.hero}>
          <ServiceLogo
            serviceName={subscription.serviceName}
            domain={getServiceDomain(subscription.serviceName)}
            size={80}
            borderRadius={20}
          />
          <Text style={[styles.serviceName, { color: colors.text }]}>
            {subscription.serviceName}
          </Text>

          {/* Status Badge */}
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
            {isPaused ? (
              <PauseCircleIcon color={statusColor} size={16} weight="fill" />
            ) : (
              <PlayCircleIcon color={statusColor} size={16} weight="fill" />
            )}
            <Text style={[styles.statusText, { color: statusColor }]}>{subscription.status}</Text>
          </View>
        </View>

        {/* Information Section */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Price */}
          <InfoRow
            icon={<CurrencyCircleDollarIcon color={colors.tint} size={22} />}
            label="Price"
            value={formatMoney(subscription.amount, subscription.currency)}
            colors={colors}
          />

          <Divider colors={colors} />

          {/* Billing Cycle */}
          <InfoRow
            icon={<RepeatIcon color={colors.tint} size={22} />}
            label="Billing cycle"
            value={billingCycleLabel}
            colors={colors}
          />

          <Divider colors={colors} />

          {/* Due In */}
          <InfoRow
            icon={<HourglassHighIcon color={colors.tint} size={22} />}
            label="Due in"
            value={
              subscription.billingCycle === 'One-Time'
                ? '—'
                : derivedData.daysUntil === 0
                  ? 'Today'
                  : `${derivedData.daysUntil} days`
            }
            colors={colors}
          />

          <Divider colors={colors} />

          {/* Next Payment */}
          <InfoRow
            icon={<CalendarIcon color={colors.tint} size={22} />}
            label="Next payment"
            value={
              subscription.billingCycle === 'One-Time' ? '—' : formatDate(derivedData.nextPayment)
            }
            colors={colors}
          />
        </View>

        {/* Statistics Section */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Total Spent */}
          <InfoRow
            icon={<CurrencyCircleDollarIcon color={colors.positive} size={22} />}
            label="Total spent"
            value={formatMoney(derivedData.totalSpent, subscription.currency)}
            colors={colors}
          />

          <Divider colors={colors} />

          {/* Number of Payments */}
          <InfoRow
            icon={<ListBulletsIcon color={colors.tint} size={22} />}
            label="Number of payments"
            value={String(derivedData.paymentCount)}
            colors={colors}
          />

          <Divider colors={colors} />

          {/* Subscribed For */}
          <InfoRow
            icon={<ClockIcon color={colors.tint} size={22} />}
            label="Subscribed for"
            value={derivedData.duration.formatted}
            colors={colors}
          />

          <Divider colors={colors} />

          {/* Start Date */}
          <InfoRow
            icon={<CalendarIcon color={colors.tint} size={22} />}
            label="Start date"
            value={formatDate(derivedData.startDate)}
            colors={colors}
          />

          <Divider colors={colors} />

          {/* Last Payment */}
          <InfoRow
            icon={<CalendarIcon color={colors.tint} size={22} />}
            label="Last payment"
            value={derivedData.lastPayment ? formatDate(derivedData.lastPayment) : '—'}
            colors={colors}
          />

          {/* Website (if available) */}
          {websiteUrl && (
            <>
              <Divider colors={colors} />
              <Pressable onPress={handleOpenWebsite} style={styles.infoRow}>
                <View style={styles.infoRowLeft}>
                  <ArrowSquareOutIcon color={colors.tint} size={22} />
                  <Text style={[styles.infoLabel, { color: colors.secondaryText }]}>Website</Text>
                </View>
                <Text style={[styles.infoValueLink, { color: colors.tint }]} numberOfLines={1}>
                  {websiteUrl.replace('https://', '')}
                </Text>
              </Pressable>
            </>
          )}
        </View>

        {/* See All Payments Button */}
        <Pressable
          onPress={handleSeeAllPayments}
          style={[
            styles.seePaymentsButton,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
          testID="seeAllPaymentsButton"
        >
          <ListBulletsIcon color={colors.tint} size={20} />
          <Text style={[styles.seePaymentsText, { color: colors.text }]}>See all payments</Text>
        </Pressable>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button
            title="Edit Subscription"
            onPress={handleEdit}
            size="lg"
            testID="subscriptionDetailsEdit"
          />
          <Button
            title="Delete Subscription"
            onPress={handleDelete}
            variant="danger"
            size="lg"
            loading={deleteMutation.isPending}
            testID="subscriptionDetailsDelete"
          />
        </View>
      </ScrollView>
    </>
  );
}

// Helper Components
function InfoRow({
  icon,
  label,
  value,
  colors,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoRowLeft}>
        {icon}
        <Text style={[styles.infoLabel, { color: colors.secondaryText }]}>{label}</Text>
      </View>
      <Text style={[styles.infoValue, { color: colors.text }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function Divider({ colors }: { colors: ReturnType<typeof useTheme>['colors'] }) {
  return <View style={[styles.divider, { backgroundColor: colors.border }]} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: SPACING.xl,
    gap: SPACING.lg,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.lg,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
  },
  hero: {
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.lg,
  },
  serviceName: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
  },
  statusText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    borderRadius: BORDER_RADIUS.xxl,
    borderWidth: 1,
    padding: SPACING.lg,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
  },
  infoRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  infoLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    textAlign: 'right',
    maxWidth: '50%',
  },
  infoValueLink: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    textAlign: 'right',
    maxWidth: '50%',
  },
  divider: {
    height: 1,
    marginVertical: SPACING.xs,
  },
  seePaymentsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.xxl,
    borderWidth: 1,
  },
  seePaymentsText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  actions: {
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
});
