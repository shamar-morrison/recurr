import { router, Stack, useLocalSearchParams } from 'expo-router';
import {
  ArrowSquareOutIcon,
  CalendarIcon,
  CaretLeftIcon,
  CaretRightIcon,
  ClockIcon,
  CurrencyCircleDollarIcon,
  HourglassHighIcon,
  ListBulletsIcon,
  NotePencilIcon,
  PauseCircleIcon,
  PlayCircleIcon,
  RepeatIcon,
  TrashIcon,
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

import { AppColors } from '@/constants/colors';
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
import { getBillingCycleLabel } from '@/src/utils/billingCycle';
import { formatMoney } from '@/src/utils/formatMoney';

type RouteParams = {
  id: string;
};

// Settings-style row component
interface SettingRowProps {
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
  label: string;
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
  valueColor?: string;
  colors: ReturnType<typeof useTheme>['colors'];
}

function SettingRow({
  icon,
  iconColor,
  iconBg,
  label,
  value,
  onPress,
  showChevron = false,
  valueColor,
  colors,
}: SettingRowProps) {
  const content = (
    <>
      <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
        {React.cloneElement(icon as React.ReactElement<{ size?: number; color?: string }>, {
          size: 20,
          color: iconColor,
        })}
      </View>

      <Text style={[styles.rowLabel, { color: colors.text }]} numberOfLines={1}>
        {label}
      </Text>

      <View style={styles.rowRight}>
        {value && (
          <Text
            style={[styles.rowValue, { color: valueColor ?? colors.secondaryText }]}
            numberOfLines={1}
          >
            {value}
          </Text>
        )}
        {showChevron && <CaretRightIcon size={20} color={colors.secondaryText} />}
      </View>
    </>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={styles.row}>
        {content}
      </Pressable>
    );
  }

  return <View style={styles.row}>{content}</View>;
}

function Divider({ colors }: { colors: ReturnType<typeof useTheme>['colors'] }) {
  return <View style={[styles.divider, { backgroundColor: colors.border }]} />;
}

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
    const startDate = subscription.startDate
      ? new Date(subscription.startDate)
      : new Date(subscription.createdAt);

    const nextPayment = nextBillingDate(now, subscription.billingCycle, startDate);
    const daysUntil = diffDays(now, nextPayment);
    const totalSpent = calculateTotalSpent(subscription, now);
    const paymentCount = countPaymentsMade(subscription, now);
    const duration = calculateSubscriptionDuration(subscription, now);
    const lastPayment = getLastPaymentDate(subscription, now);

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

  const billingCycleLabel = getBillingCycleLabel(subscription.billingCycle);

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

        {/* Billing Information Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.secondaryText }]}>
            BILLING INFORMATION
          </Text>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <SettingRow
              colors={colors}
              icon={<CurrencyCircleDollarIcon />}
              iconColor="#10B981"
              iconBg="#D1FAE5"
              label="Price"
              value={formatMoney(subscription.amount, subscription.currency)}
            />

            <Divider colors={colors} />

            <SettingRow
              colors={colors}
              icon={<RepeatIcon />}
              iconColor="#6366F1"
              iconBg="#E0E7FF"
              label="Billing cycle"
              value={billingCycleLabel}
            />

            <Divider colors={colors} />

            <SettingRow
              colors={colors}
              icon={<HourglassHighIcon />}
              iconColor="#F59E0B"
              iconBg="#FEF3C7"
              label="Due in"
              value={
                subscription.billingCycle === 'One-Time'
                  ? '—'
                  : derivedData.daysUntil === 0
                    ? 'Today'
                    : `${derivedData.daysUntil} days`
              }
            />

            <Divider colors={colors} />

            <SettingRow
              colors={colors}
              icon={<CalendarIcon />}
              iconColor="#8B5CF6"
              iconBg="#EDE9FE"
              label="Next payment"
              value={
                subscription.billingCycle === 'One-Time' ? '—' : formatDate(derivedData.nextPayment)
              }
            />
          </View>
        </View>

        {/* Statistics Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.secondaryText }]}>STATISTICS</Text>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <SettingRow
              colors={colors}
              icon={<CurrencyCircleDollarIcon />}
              iconColor="#059669"
              iconBg="#D1FAE5"
              label="Total spent"
              value={formatMoney(derivedData.totalSpent, subscription.currency)}
            />

            <Divider colors={colors} />

            <SettingRow
              colors={colors}
              icon={<ListBulletsIcon />}
              iconColor="#EC4899"
              iconBg="#FCE7F3"
              label="Number of payments"
              value={String(derivedData.paymentCount)}
            />

            <Divider colors={colors} />

            <SettingRow
              colors={colors}
              icon={<ClockIcon />}
              iconColor="#06B6D4"
              iconBg="#CFFAFE"
              label="Subscribed for"
              value={derivedData.duration.formatted}
            />

            <Divider colors={colors} />

            <SettingRow
              colors={colors}
              icon={<CalendarIcon />}
              iconColor="#8B5CF6"
              iconBg="#EDE9FE"
              label="Start date"
              value={formatDate(derivedData.startDate)}
            />

            <Divider colors={colors} />

            <SettingRow
              colors={colors}
              icon={<CalendarIcon />}
              iconColor="#6366F1"
              iconBg="#E0E7FF"
              label="Last payment"
              value={derivedData.lastPayment ? formatDate(derivedData.lastPayment) : '—'}
            />

            {/* Website (if available) */}
            {websiteUrl && (
              <>
                <Divider colors={colors} />
                <SettingRow
                  colors={colors}
                  icon={<ArrowSquareOutIcon />}
                  iconColor="#3B82F6"
                  iconBg="#DBEAFE"
                  label="Website"
                  value={websiteUrl.replace('https://', '')}
                  valueColor={colors.tint}
                  onPress={handleOpenWebsite}
                  showChevron
                />
              </>
            )}

            {/* See All Payments */}
            <Divider colors={colors} />
            <SettingRow
              colors={colors}
              icon={<ListBulletsIcon />}
              iconColor="#A855F7"
              iconBg="#F3E8FF"
              label="See all payments"
              onPress={handleSeeAllPayments}
              showChevron
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.secondaryText }]}>ACTIONS</Text>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <SettingRow
              colors={colors}
              icon={<NotePencilIcon />}
              iconColor="#3B82F6"
              iconBg="#DBEAFE"
              label="Edit Subscription"
              onPress={handleEdit}
              showChevron
            />

            <Divider colors={colors} />

            <Pressable
              onPress={handleDelete}
              style={styles.row}
              disabled={deleteMutation.isPending}
            >
              <View style={[styles.iconContainer, { backgroundColor: 'rgba(255,68,56,0.12)' }]}>
                {deleteMutation.isPending ? (
                  <ActivityIndicator size="small" color={AppColors.negative} />
                ) : (
                  <TrashIcon size={20} color={AppColors.negative} />
                )}
              </View>
              <Text style={[styles.rowLabel, { color: AppColors.negative }]} numberOfLines={1}>
                Delete Subscription
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: SPACING.xl,
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
    marginBottom: SPACING.lg,
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
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    marginLeft: SPACING.xs,
    marginBottom: SPACING.sm,
    letterSpacing: 0.5,
  },
  card: {
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  rowLabel: {
    flex: 1,
    fontSize: FONT_SIZE.lg,
    fontWeight: '500',
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: SPACING.sm,
  },
  rowValue: {
    fontSize: FONT_SIZE.lg,
    marginRight: 6,
    maxWidth: 160,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 64,
  },
});
