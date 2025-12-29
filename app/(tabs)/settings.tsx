import { router } from 'expo-router';
import { Bell, ChevronRight, DollarSign, Lock, Mail, Zap } from 'lucide-react-native';
import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors } from '@/constants/colors';
import { useAuth } from '@/src/features/auth/AuthProvider';

function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    CNY: '¥',
    KRW: '₩',
    INR: '₹',
    RUB: '₽',
    BRL: 'R$',
    CAD: '$',
    AUD: '$',
  };
  return symbols[currency] || currency;
}

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
          trackColor={{ false: '#E2E8F0', true: AppColors.primary }}
          thumbColor="#FFFFFF"
        />
      ) : (
        <View style={styles.rowRight}>
          {value && (
            <Text style={styles.rowValue} numberOfLines={1}>
              {value}
            </Text>
          )}
          {showChevron && <ChevronRight size={20} color="#94A3B8" />}
        </View>
      )}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const { user, isPremium, signOutUser, settings, setReminderDays } = useAuth();

  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);

  const billingRemindersEnabled = settings.remindDaysBeforeBilling > 0;
  const toggleBillingReminders = (val: boolean) => {
    setReminderDays(val ? 1 : 0);
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
    } finally {
      router.replace('/auth');
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
            <Pressable style={styles.profileRow}>
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
              <ChevronRight size={20} color="#94A3B8" />
            </Pressable>

            <View style={styles.divider} />

            <SettingRow
              icon={<Mail />}
              iconColor="#7C3AED"
              iconBg="#F3E8FF"
              label="Email Address"
              value={user?.email || 'Not set'}
            />

            <View style={styles.divider} />

            <SettingRow
              icon={<Lock />}
              iconColor="#7C3AED"
              iconBg="#F3E8FF"
              label="Security & Password"
            />
          </View>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>NOTIFICATIONS</Text>
          <View style={styles.card}>
            <SettingRow
              icon={<Bell />}
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
              icon={<Mail />}
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
              icon={<Zap />}
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
              icon={<DollarSign />}
              iconColor="#10B981"
              iconBg="#D1FAE5"
              label="Default Currency"
              value={`${settings.currency} (${getCurrencySymbol(settings.currency)})`}
            />
          </View>
        </View>

        {/* Sign Out */}
        <View style={styles.logoutContainer}>
          <Pressable onPress={handleSignOut} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Log Out</Text>
          </Pressable>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
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
    color: '#64748B',
    marginLeft: 4,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
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
    color: '#0F172A',
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  rowValue: {
    fontSize: 15,
    color: '#64748B',
    marginRight: 6,
    maxWidth: 160,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E2E8F0',
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
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: '#64748B',
  },
  profileName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0F172A',
  },
  profilePlan: {
    fontSize: 14,
    color: '#64748B',
  },
  logoutContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  logoutButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.negative,
  },
  versionText: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 12,
  },
});
