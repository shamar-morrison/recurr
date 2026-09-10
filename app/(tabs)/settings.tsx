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
import { ThemeSelectorModal } from '@/src/components/ThemeSelectorModal';
import { getCurrencySymbol } from '@/src/constants/currencies';
import { DateFormatId, getDateFormatLabel } from '@/src/constants/dateFormats';
import { BORDER_RADIUS, FONT_FAMILY, FONT_SIZE, SPACING } from '@/src/constants/theme';
import { ThemeMode, useTheme } from '@/src/context/ThemeContext';
import { useAuth } from '@/src/features/auth/AuthProvider';
import { accountDeletionService } from '@/src/features/auth/accountDeletionService';
import { clearLocalAccountData } from '@/src/features/auth/clearLocalAccountData';
import { exportData, ExportFormat } from '@/src/features/export/exportService';
import { useNotificationStatus } from '@/src/features/notifications/useNotificationStatus';
import { consumePurchaseForTesting } from '@/src/features/monetization/iapService';
import { useSubscriptionsQuery } from '@/src/features/subscriptions/subscriptionsHooks';
import {
  ArrowRight01Icon,
  Calendar03Icon,
  CoinsIcon,
  CrownIcon,
  CubeIcon,
  Delete02Icon,
  Download01Icon,
  GridIcon,
  InformationCircleIcon,
  Invoice01Icon,
  Logout01Icon,
  MessageCircleMoreIcon,
  PaletteIcon,
  RotateCcwIcon,
  Share01Icon,
  StarIcon,
  Tag01Icon,
} from '@hugeicons/core-free-icons';
import { WarningDot } from '@/src/components/ui/WarningDot';
import { AppIcon } from '@/src/components/ui/AppIcon';
import { useQueryClient } from '@tanstack/react-query';

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
  showWarning?: boolean;
  colors: ReturnType<typeof useTheme>['colors'];
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
  showWarning = false,
  colors,
}: SettingRowProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={isSwitch}
      style={[styles.row, { backgroundColor: colors.card }]}
    >
      <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
        {React.cloneElement(icon as React.ReactElement<{ size?: number; color?: string }>, {
          size: 20,
          color: iconColor,
        })}
      </View>

      <Text style={[styles.rowLabel, { color: colors.text }]} numberOfLines={1}>
        {label}
      </Text>

      {isSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={colors.card}
        />
      ) : (
        <View style={styles.rowRight}>
          {showWarning && (
            <View style={styles.warningDot}>
              <WarningDot testID={`${label}Warning`} />
            </View>
          )}
          {value && (
            <Text style={[styles.rowValue, { color: colors.secondaryText }]} numberOfLines={1}>
              {value}
            </Text>
          )}
          {showChevron && <AppIcon icon={ArrowRight01Icon} size={20} color={colors.secondaryText} />}
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
    setPremiumMock,
  } = useAuth();

  const { themeMode, setThemeMode, colors } = useTheme();

  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);
  const [dateFormatModalVisible, setDateFormatModalVisible] = useState(false);
  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const [isResettingPurchase, setIsResettingPurchase] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const queryClient = useQueryClient();

  const { data: subscriptions, isLoading: isLoadingSubscriptions } = useSubscriptionsQuery();
  const notificationsEnabled = useNotificationStatus();
  const showNotificationWarning = notificationsEnabled === false;
  const profileName = user?.displayName?.trim() || user?.email || 'User';
  const profileInitial = profileName[0]?.toUpperCase() || 'U';

  const getThemeLabel = (mode: ThemeMode): string => {
    switch (mode) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      case 'system':
        return 'System';
    }
  };

  const billingRemindersEnabled = settings.remindDaysBeforeBilling > 0;
  const toggleBillingReminders = (val: boolean) => {
    setReminderDays(val ? 1 : 0);
  };

  const handleCurrencySelect = (currencyCode: string) => {
    setCurrencyModalVisible(false);
    // Defer state update to prevent Android crash when modal closes
    setTimeout(() => setCurrency(currencyCode), 500);
  };

  const handleDateFormatSelect = (format: DateFormatId) => {
    setDateFormatModalVisible(false);
    setTimeout(() => setDateFormat(format), 500);
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
    const developerUrl = 'market://dev?id=HorizonHuntxr';
    const webUrl = 'https://play.google.com/store/apps/developer?id=HorizonHuntxr&hl=en';
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

  const executeDeleteAccount = async () => {
    if (!user?.uid || isDeletingAccount) {
      return;
    }

    setIsDeletingAccount(true);

    try {
      // 1. Remote wipe via callable function (Firestore tree + purchase_tokens + Auth user)
      await accountDeletionService.deleteAccount();

      // 2. Local wipe (best-effort: AsyncStorage caches + notifications)
      try {
        await clearLocalAccountData(user.uid);
      } catch (cleanupError) {
        console.warn(
          '[settings] Failed to clear local account data after remote deletion:',
          cleanupError
        );
      }

      // 3. Drop in-memory query caches for the deleted account
      try {
        queryClient.clear();
      } catch (cacheError) {
        console.warn('[settings] Failed to clear query cache after account deletion:', cacheError);
      }

      // 4. Sign out (Auth user is already deleted server-side)
      try {
        await signOutUser();
      } catch (signOutError) {
        console.warn('[settings] Failed to sign out after account deletion:', signOutError);
      }

      router.replace('/auth');
    } catch (error) {
      console.error('[settings] Failed to delete account:', error);
      Alert.alert(
        'Delete Account Failed',
        'Unable to delete your account. Please check your connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleDeleteAccount = () => {
    if (!user?.uid || isDeletingAccount) {
      return;
    }

    const premiumWarning = isPremium
      ? ' You will lose Premium access and it cannot be restored.'
      : '';

    Alert.alert(
      'Delete your account?',
      `This permanently deletes your Recurr account and all associated data (subscriptions, categories and services).${premiumWarning} This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Delete account permanently?',
              'All of your data will be permanently removed from our servers.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete Account',
                  style: 'destructive',
                  onPress: () => {
                    void executeDeleteAccount();
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  // [DEV ONLY] Reset purchase for testing
  const handleResetPurchase = () => {
    if (!__DEV__) return;

    Alert.alert(
      'Reset Purchase (DEV)',
      'This will consume your premium purchase (allowing re-purchase) and reset your premium status. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            setIsResettingPurchase(true);
            try {
              // 1. Consume the purchase so it can be bought again
              await consumePurchaseForTesting();

              // 2. Reset premium status in Firestore
              await setPremiumMock(false);

              Alert.alert('Success', 'Purchase reset. You can now test the purchase flow again.');
            } catch (error) {
              console.error('Failed to reset purchase:', error);
              Alert.alert('Error', (error as Error).message || 'Failed to reset purchase.');
            } finally {
              setIsResettingPurchase(false);
            }
          },
        },
      ]
    );
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
      await exportData(subscriptions, format, includeArchived, settings.dateFormat);
    } catch (error) {
      console.error('Export failed:', error);
      Alert.alert('Export Failed', 'Unable to export your data. Please try again.');
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>My Preferences</Text>
        <Text style={[styles.headerSubtitle, { color: colors.secondaryText }]}>
          Manage your account and settings
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.secondaryText }]}>ACCOUNT</Text>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            {/* Profile Row */}
            <View style={styles.profileRow}>
              <View style={styles.profileLeft}>
                {user?.photoURL ? (
                  <Image source={{ uri: user.photoURL }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarInitial}>{profileInitial}</Text>
                  </View>
                )}
                <View>
                  <Text style={[styles.profileName, { color: colors.text }]}>
                    {profileName}
                  </Text>
                  <Text style={[styles.profilePlan, { color: colors.secondaryText }]}>
                    {isPremium ? 'Premium Account' : 'Personal Account'}
                  </Text>
                </View>
              </View>
            </View>

            {!isPremium && (
              <>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <SettingRow
                  colors={colors}
                  icon={<AppIcon icon={CrownIcon} fill="#D97706" />}
                  iconColor="#D97706"
                  iconBg="#FEF3C7"
                  label="Upgrade to Premium"
                  onPress={() => router.push('/paywall')}
                />
              </>
            )}

            {/* DEV ONLY: Reset purchase for testing */}
            {__DEV__ && isPremium && (
              <>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <SettingRow
                  colors={colors}
                  icon={<AppIcon icon={RotateCcwIcon} />}
                  iconColor="#EF4444"
                  iconBg="#FEE2E2"
                  label={isResettingPurchase ? 'Resetting...' : 'Reset Purchase (DEV)'}
                  onPress={handleResetPurchase}
                />
              </>
            )}
          </View>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.secondaryText }]}>NOTIFICATIONS</Text>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <SettingRow
              colors={colors}
              icon={<AppIcon icon={Invoice01Icon} />}
              iconColor="#A855F7"
              iconBg="#F3E8FF"
              label="Billing Reminders"
              showWarning={showNotificationWarning}
              onPress={() => router.push('/reminders')}
            />
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.secondaryText }]}>PREFERENCES</Text>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <SettingRow
              colors={colors}
              icon={<AppIcon icon={CoinsIcon} />}
              iconColor="#10B981"
              iconBg="#D1FAE5"
              label="Default Currency"
              value={`${settings.currency} (${getCurrencySymbol(settings.currency)})`}
              onPress={() => setCurrencyModalVisible(true)}
            />

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <SettingRow
              colors={colors}
              icon={<AppIcon icon={Calendar03Icon} />}
              iconColor="#6366F1"
              iconBg="#E0E7FF"
              label="Date Format"
              value={getDateFormatLabel(settings.dateFormat)}
              onPress={() => setDateFormatModalVisible(true)}
            />

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <SettingRow
              colors={colors}
              icon={<AppIcon icon={PaletteIcon} />}
              iconColor="#8B5CF6"
              iconBg="#EDE9FE"
              label="Theme"
              value={getThemeLabel(themeMode)}
              onPress={() => setThemeModalVisible(true)}
            />

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <SettingRow
              colors={colors}
              icon={<AppIcon icon={Tag01Icon} />}
              iconColor="#EC4899"
              iconBg="#FCE7F3"
              label="Manage Categories"
              onPress={() => router.push('/categories')}
            />

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <SettingRow
              colors={colors}
              icon={<AppIcon icon={CubeIcon} />}
              iconColor="#14B8A6"
              iconBg="#CCFBF1"
              label="Manage Services"
              onPress={() => router.push('/services')}
            />
          </View>
        </View>

        {/* Data Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.secondaryText }]}>DATA</Text>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <SettingRow
              colors={colors}
              icon={<AppIcon icon={Download01Icon} />}
              iconColor="#059669"
              iconBg="#D1FAE5"
              label="Export data"
              onPress={handleExportData}
            />
          </View>
        </View>

        {/* Information Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.secondaryText }]}>INFORMATION</Text>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <SettingRow
              colors={colors}
              icon={<AppIcon icon={StarIcon} fill="#F59E0B" />}
              iconColor="#F59E0B"
              iconBg="#FEF3C7"
              label="Rate us"
              onPress={handleRateUs}
            />

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <SettingRow
              colors={colors}
              icon={<AppIcon icon={MessageCircleMoreIcon} />}
              iconColor="#06B6D4"
              iconBg="#CFFAFE"
              label="Contact Support"
              onPress={handleContactSupport}
            />

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <SettingRow
              colors={colors}
              icon={<AppIcon icon={GridIcon} />}
              iconColor="#8B5CF6"
              iconBg="#EDE9FE"
              label="Other apps"
              onPress={handleOtherApps}
            />

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <SettingRow
              colors={colors}
              icon={<AppIcon icon={Share01Icon} />}
              iconColor="#EC4899"
              iconBg="#FCE7F3"
              label="Share App"
              onPress={handleShareApp}
            />

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <SettingRow
              colors={colors}
              icon={<AppIcon icon={InformationCircleIcon} />}
              iconColor="#6366F1"
              iconBg="#E0E7FF"
              label="About"
              onPress={() => router.push('/about')}
            />
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.secondaryText }]}>DANGER ZONE</Text>
          <Pressable
            onPress={handleDeleteAccount}
            disabled={isDeletingAccount}
            style={[styles.logoutCard, isDeletingAccount && styles.disabledCard]}
          >
            <View style={styles.logoutIconContainer}>
              <AppIcon icon={Delete02Icon} size={20} color={AppColors.negative} />
            </View>
            <Text style={styles.logoutText}>
              {isDeletingAccount ? 'Deleting Account...' : 'Delete Account'}
            </Text>
          </Pressable>
        </View>

        {/* Sign Out */}
        <View style={styles.section}>
          <Pressable onPress={handleSignOut} style={styles.logoutCard}>
            <View style={styles.logoutIconContainer}>
              <AppIcon icon={Logout01Icon} size={20} color={AppColors.negative} />
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

      <ThemeSelectorModal
        visible={themeModalVisible}
        selectedTheme={themeMode}
        onSelect={setThemeMode}
        onClose={() => setThemeModalVisible(false)}
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
    fontFamily: FONT_FAMILY.bold,
    color: AppColors.text,
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: FONT_SIZE.md,
    fontFamily: FONT_FAMILY.medium,
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
    fontFamily: FONT_FAMILY.semiBold,
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
    fontFamily: FONT_FAMILY.medium,
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
  warningDot: {
    marginRight: 6,
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
    fontFamily: FONT_FAMILY.bold,
    color: AppColors.secondaryText,
  },
  profileName: {
    fontSize: FONT_SIZE.xl,
    fontFamily: FONT_FAMILY.semiBold,
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
    fontFamily: FONT_FAMILY.semiBold,
    color: AppColors.negative,
  },
  disabledCard: {
    opacity: 0.6,
  },
});
