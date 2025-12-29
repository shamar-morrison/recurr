import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors } from '@/constants/colors';
import { CurrencySelectorModal } from '@/src/components/CurrencySelectorModal';
import { getCurrencySymbol } from '@/src/constants/currencies';
import { useAuth } from '@/src/features/auth/AuthProvider';
import {
  BellIcon,
  CaretRightIcon,
  CoinsIcon,
  CrownIcon,
  EnvelopeIcon,
  InvoiceIcon,
  SignOutIcon,
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
  const { user, isPremium, signOutUser, settings, setReminderDays, setCurrency } = useAuth();

  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);

  const billingRemindersEnabled = settings.remindDaysBeforeBilling > 0;
  const toggleBillingReminders = (val: boolean) => {
    setReminderDays(val ? 1 : 0);
  };

  const handleCurrencySelect = (currencyCode: string) => {
    setCurrency(currencyCode);
    setCurrencyModalVisible(false);
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
              switchValue={pushEnabled}
              onSwitchChange={setPushEnabled}
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
              isSwitch
              switchValue={billingRemindersEnabled}
              onSwitchChange={toggleBillingReminders}
              showChevron={false}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: AppColors.text,
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: AppColors.secondaryText,
    marginTop: 2,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.secondaryText,
    marginLeft: 4,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: AppColors.card,
    borderRadius: 16,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: AppColors.card,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: AppColors.text,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  rowValue: {
    fontSize: 15,
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
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  profileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: AppColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: AppColors.secondaryText,
  },
  profileName: {
    fontSize: 17,
    fontWeight: '600',
    color: AppColors.text,
  },
  profilePlan: {
    fontSize: 14,
    color: AppColors.secondaryText,
  },
  logoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,68,56,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,68,56,0.15)',
  },
  logoutIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: 'rgba(255,68,56,0.12)',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.negative,
  },
});
