import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors } from '@/constants/colors';
import { CurrencySelectorModal } from '@/src/components/CurrencySelectorModal';
import { DateFormatModal } from '@/src/components/DateFormatModal';
import { getCurrencySymbol } from '@/src/constants/currencies';
import { DateFormatId, getDateFormatLabel } from '@/src/constants/dateFormats';
import { BORDER_RADIUS, FONT_SIZE, SPACING } from '@/src/constants/theme';
import { useAuth } from '@/src/features/auth/AuthProvider';
import { exportData, ExportFormat } from '@/src/features/export/exportService';
import { useSubscriptionsQuery } from '@/src/features/subscriptions/subscriptionsHooks';
import {
  BellIcon,
  CalendarIcon,
  CaretRightIcon,
  ChatCircleDotsIcon,
  CoinsIcon,
  CrownIcon,
  DownloadSimpleIcon,
  EnvelopeIcon,
  GridFourIcon,
  InfoIcon,
  InvoiceIcon,
  ShareNetworkIcon,
  SignOutIcon,
  StarIcon,
} from 'phosphor-react-native';

interface SettingRowProps {
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
  label: string;
  value?: string;
  isSwitch?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (val: boolean) => void;
  onPress?: () => void;
  showChevron?: boolean;
}

function SettingRow({
  icon,
  iconColor,
  iconBg,
  label,
  value,
  isSwitch,
  switchValue,
  onSwitchChange,
  onPress,
  showChevron = true,
}: SettingRowProps) {
  return (
    <Pressable onPress={onPress} disabled={isSwitch} style={styles.row}>
      <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
        {React.cloneElement(icon as React.ReactElement<{ size?: number; color?: string }>, {
          size: 20,
          color: iconColor,
        })}
      </View>

      <Text style={styles.rowLabel} numberOfLines={1}>
        {label}
      </Text>

      {isSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: AppColors.border, true: AppColors.primary }}
          thumbColor={AppColors.card}
        />
      ) : (
        <View style={styles.rowRight}>
          {value && (
            <Text style={styles.rowValue} numberOfLines={1}>
              {value}
            </Text>
          )}
          {showChevron && <CaretRightIcon size={20} color={AppColors.secondaryText} />}
        </View>
      )}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const {
    user,
    isPremium,
    signOutUser,
    settings,
    setReminderDays,
    setCurrency,
    setDateFormat,
    setPushNotificationsEnabled,
  } = useAuth();

  const [emailEnabled, setEmailEnabled] = useState(false);
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);
  const [dateFormatModalVisible, setDateFormatModalVisible] = useState(false);

  const { data: subscriptions, isLoading: isLoadingSubscriptions } = useSubscriptionsQuery();

  const billingRemindersEnabled = settings.remindDaysBeforeBilling > 0;
  const toggleBillingReminders = (val: boolean) => {
    setReminderDays(val ? 1 : 0);
  };

  const handleCurrencySelect = (currencyCode: string) => {
    setCurrency(currencyCode);
    setCurrencyModalVisible(false);
  };

  const handleDateFormatSelect = (format: DateFormatId) => {
    setDateFormat(format);
    setDateFormatModalVisible(false);
  };

  const handleRateUs = async () => {
    const playStoreUrl = 'market://details?id=com.horizon.recurr';
    const webUrl = 'https://play.google.com/store/apps/details?id=com.horizon.recurr';
    try {
      const supported = await Linking.canOpenURL(playStoreUrl);
      if (supported) {
        await Linking.openURL(playStoreUrl);
      } else {
        await Linking.openURL(webUrl);
      }
    } catch (error) {
      console.error('Failed to open Play Store:', error);
      Alert.alert('Error', 'Unable to open the Play Store. Please try again later.');
    }
  };

  const handleContactSupport = async () => {
    const emailUrl = 'mailto:shamar.morrison2000@gmail.com?subject=Recurr%20Support';
    try {
      await Linking.openURL(emailUrl);
    } catch (error) {
      console.error('Failed to open email:', error);
      Alert.alert(
        'Error',
        'Unable to open email client. Please contact us at shamar.morrison2000@gmail.com'
      );
    }
  };

  const handleOtherApps = async () => {
    const developerUrl = 'market://dev?id=The+Avg+Coder';
    const webUrl = 'https://play.google.com/store/apps/developer?id=The+Avg+Coder&hl=en';
    try {
      const supported = await Linking.canOpenURL(developerUrl);
      if (supported) {
        await Linking.openURL(developerUrl);
      } else {
        await Linking.openURL(webUrl);
      }
    } catch (error) {
      console.error('Failed to open developer page:', error);
      Alert.alert('Error', 'Unable to open the Play Store. Please try again later.');
    }
  };

  const handleShareApp = async () => {
    try {
      await Share.share({
        message:
          'Check out Recurr - the easiest way to track all your subscriptions! Download it here: https://play.google.com/store/apps/details?id=com.horizon.recurr',
      });
    } catch (error) {
      console.error('Failed to share:', error);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOutUser();
            router.replace('/auth');
          } catch (error) {
            console.error('Sign out failed:', error);
            Alert.alert('Sign Out Failed', 'Unable to sign out. Please try again.', [
              { text: 'OK' },
            ]);
          }
        },
      },
    ]);
  };

  const handleExportData = () => {
    // Check if user is premium
    if (!isPremium) {
      router.push('/paywall');
      return;
    }

    // Check if data is still loading
    if (isLoadingSubscriptions) {
      Alert.alert('Loading', 'Please wait while your subscriptions are being loaded.');
      return;
    }

    // Show format selection alert
    Alert.alert('Export Data', 'Choose export format:', [
      {
        text: 'Export as CSV',
        onPress: () => showArchivedAlert('csv'),
      },
      {
        text: 'Export as Markdown',
        onPress: () => showArchivedAlert('markdown'),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const showArchivedAlert = (format: ExportFormat) => {
    Alert.alert('Include Archived?', 'Which subscriptions do you want to export?', [
      {
        text: 'Active Only',
        onPress: () => performExport(format, false),
      },
      {
        text: 'Include Archived',
        onPress: () => performExport(format, true),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const performExport = async (format: ExportFormat, includeArchived: boolean) => {
    if (!subscriptions || subscriptions.length === 0) {
      Alert.alert('No Data', 'You have no subscriptions to export.');
      return;
    }

    // Check filtered count based on archive preference
    const filteredCount = includeArchived
      ? subscriptions.length
      : subscriptions.filter((sub) => !sub.isArchived).length;

    if (filteredCount === 0) {
      Alert.alert(
        'No Data',
        'No active subscriptions to export. Try including archived subscriptions.'
      );
      return;
    }

    try {
      await exportData(subscriptions, format, includeArchived);
    } catch (error) {
      console.error('Export failed:', error);
      Alert.alert('Export Failed', 'Unable to export your data. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Preferences</Text>
        <Text style={styles.headerSubtitle}>Manage your account and settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT</Text>
          <View style={styles.card}>
            {/* Profile Row */}
            <View style={styles.profileRow}>
              <View style={styles.profileLeft}>
                {user?.photoURL ? (
                  <Image source={{ uri: user.photoURL }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarInitial}>{user?.displayName?.[0] || 'U'}</Text>
                  </View>
                )}
                <View>
                  <Text style={styles.profileName}>{user?.displayName || 'User'}</Text>
                  <Text style={styles.profilePlan}>
                    {isPremium ? 'Premium Account' : 'Personal Account'}
                  </Text>
                </View>
              </View>
            </View>

            {!isPremium && (
              <>
                <View style={styles.divider} />
                <SettingRow
                  icon={<CrownIcon weight="fill" />}
                  iconColor="#D97706"
                  iconBg="#FEF3C7"
                  label="Upgrade to Premium"
                  onPress={() => {
                    // TODO: Navigate to premium upgrade screen
                    console.log('Upgrade to Premium pressed');
                  }}
                />
              </>
            )}
          </View>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>NOTIFICATIONS</Text>
          <View style={styles.card}>
            <SettingRow
              icon={<BellIcon />}
              iconColor="#F97316"
              iconBg="#FFEDD5"
              label="Push Notifications"
              isSwitch
              switchValue={settings.pushNotificationsEnabled}
              onSwitchChange={setPushNotificationsEnabled}
              showChevron={false}
            />

            <View style={styles.divider} />

            <SettingRow
              icon={<EnvelopeIcon />}
              iconColor="#3B82F6"
              iconBg="#DBEAFE"
              label="Email Alerts"
              isSwitch
              switchValue={emailEnabled}
              onSwitchChange={setEmailEnabled}
              showChevron={false}
            />

            <View style={styles.divider} />

            <SettingRow
              icon={<InvoiceIcon />}
              iconColor="#A855F7"
              iconBg="#F3E8FF"
              label="Billing Reminders"
              onPress={() => router.push('/reminders')}
            />
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PREFERENCES</Text>
          <View style={styles.card}>
            <SettingRow
              icon={<CoinsIcon />}
              iconColor="#10B981"
              iconBg="#D1FAE5"
              label="Default Currency"
              value={`${settings.currency} (${getCurrencySymbol(settings.currency)})`}
              onPress={() => setCurrencyModalVisible(true)}
            />

            <View style={styles.divider} />

            <SettingRow
              icon={<CalendarIcon />}
              iconColor="#6366F1"
              iconBg="#E0E7FF"
              label="Date Format"
              value={getDateFormatLabel(settings.dateFormat)}
              onPress={() => setDateFormatModalVisible(true)}
            />
          </View>
        </View>

        {/* Data Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DATA</Text>
          <View style={styles.card}>
            <SettingRow
              icon={<DownloadSimpleIcon />}
              iconColor="#059669"
              iconBg="#D1FAE5"
              label="Export data"
              onPress={handleExportData}
            />
          </View>
        </View>

        {/* Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>INFORMATION</Text>
          <View style={styles.card}>
            <SettingRow
              icon={<StarIcon weight="fill" />}
              iconColor="#F59E0B"
              iconBg="#FEF3C7"
              label="Rate us"
              onPress={handleRateUs}
            />

            <View style={styles.divider} />

            <SettingRow
              icon={<ChatCircleDotsIcon />}
              iconColor="#06B6D4"
              iconBg="#CFFAFE"
              label="Contact Support"
              onPress={handleContactSupport}
            />

            <View style={styles.divider} />

            <SettingRow
              icon={<GridFourIcon />}
              iconColor="#8B5CF6"
              iconBg="#EDE9FE"
              label="Other apps"
              onPress={handleOtherApps}
            />

            <View style={styles.divider} />

            <SettingRow
              icon={<ShareNetworkIcon />}
              iconColor="#EC4899"
              iconBg="#FCE7F3"
              label="Share App"
              onPress={handleShareApp}
            />

            <View style={styles.divider} />

            <SettingRow
              icon={<InfoIcon />}
              iconColor="#6366F1"
              iconBg="#E0E7FF"
              label="About"
              onPress={() => router.push('/about')}
            />
          </View>
        </View>

        {/* Sign Out */}
        <View style={styles.section}>
          <Pressable onPress={handleSignOut} style={styles.logoutCard}>
            <View style={styles.logoutIconContainer}>
              <SignOutIcon size={20} color={AppColors.negative} />
            </View>
            <Text style={styles.logoutText}>Log Out</Text>
          </Pressable>
        </View>
      </ScrollView>

      <CurrencySelectorModal
        visible={currencyModalVisible}
        selectedCurrency={settings.currency}
        onSelect={handleCurrencySelect}
        onClose={() => setCurrencyModalVisible(false)}
      />

      <DateFormatModal
        visible={dateFormatModalVisible}
        selectedFormat={settings.dateFormat}
        onSelect={handleDateFormatSelect}
        onClose={() => setDateFormatModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  header: {
    paddingHorizontal: SPACING.xl,
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
  scrollContent: {
    padding: SPACING.xl,
    paddingBottom: 40,
  },
  section: {
    marginBottom: SPACING.xxl,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: AppColors.secondaryText,
    marginLeft: SPACING.xs,
    marginBottom: SPACING.sm,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: AppColors.card,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    backgroundColor: AppColors.card,
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
    color: AppColors.text,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: SPACING.sm,
  },
  rowValue: {
    fontSize: FONT_SIZE.lg,
    color: AppColors.secondaryText,
    marginRight: 6,
    maxWidth: 160,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: AppColors.border,
    marginLeft: 64,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  profileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.xxxl,
    marginRight: SPACING.md,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.xxxl,
    backgroundColor: AppColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  avatarInitial: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '700',
    color: AppColors.secondaryText,
  },
  profileName: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '600',
    color: AppColors.text,
  },
  profilePlan: {
    fontSize: FONT_SIZE.md,
    color: AppColors.secondaryText,
  },
  logoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    backgroundColor: 'rgba(255,68,56,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,68,56,0.15)',
  },
  logoutIconContainer: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
    backgroundColor: 'rgba(255,68,56,0.12)',
  },
  logoutText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: AppColors.negative,
  },
});
