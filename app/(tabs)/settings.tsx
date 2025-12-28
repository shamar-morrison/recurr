import { router } from 'expo-router';
import { Crown, LogOut, Sliders } from 'lucide-react-native';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors } from '@/constants/colors';
import { useAuth } from '@/src/features/auth/AuthProvider';

const REMINDER_OPTIONS: number[] = [0, 1, 2, 3, 5, 7, 10, 14];

export default function SettingsScreen() {
  const { isPremium, settings, setReminderDays, signOutUser, isFirebaseReady, user } = useAuth();

  const reminderValue = settings.remindDaysBeforeBilling;

  return (
    <SafeAreaView style={styles.container} edges={['top']} testID="settingsScreen">
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <Text style={styles.title}>Preferences</Text>
            <Text style={styles.subtitle}>
              Control reminders, premium status, and your session.
            </Text>
          </View>

          <View style={styles.statusRow}>
            <View style={styles.statusPill} testID="settingsAuthPill">
              <Text style={styles.statusPillText}>{user ? 'Signed in' : 'Signed out'}</Text>
            </View>
            {isPremium ? (
              <View
                style={[styles.statusPill, { backgroundColor: AppColors.tint }]}
                testID="settingsPremiumPill"
              >
                <Crown color="#fff" size={16} />
                <Text style={[styles.statusPillText, { color: '#fff' }]}>Premium Active</Text>
              </View>
            ) : (
              <Pressable
                onPress={() => router.push('/paywall')}
                style={[styles.statusPill, styles.premiumCta]}
                testID="settingsGoPremium"
              >
                <Crown color={'#fff'} size={16} />
                <Text style={[styles.statusPillText, { color: '#fff' }]}>Go Premium</Text>
              </Pressable>
            )}
          </View>

          {!isFirebaseReady ? (
            <Text style={styles.firebaseNote} testID="settingsFirebaseNote">
              Firebase isn’t configured. Auth + cloud sync will run in limited mode.
            </Text>
          ) : null}
        </View>

        <View style={styles.card} testID="settingsRemindersCard">
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Sliders color={AppColors.text} size={18} />
              <Text style={styles.cardTitle}>Reminders</Text>
            </View>
            <Text style={styles.cardHeaderRight} testID="settingsRemindersValue">
              {reminderValue}d
            </Text>
          </View>

          <Text style={styles.cardSubtitle}>
            Store your preference now. Push notifications can be added later.
          </Text>

          <View style={styles.chipsRow} testID="settingsReminderOptions">
            {REMINDER_OPTIONS.map((days) => {
              const active = days === reminderValue;
              return (
                <Pressable
                  key={days}
                  onPress={() => setReminderDays(days)}
                  style={[
                    styles.chip,
                    active
                      ? { backgroundColor: AppColors.primary, borderColor: AppColors.primary }
                      : null,
                  ]}
                  testID={`settingsReminder_${days}`}
                >
                  <Text
                    style={[
                      styles.chipText,
                      active ? { color: '#fff' } : { color: AppColors.text },
                    ]}
                  >
                    {days}d
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.card} testID="settingsAccountCard">
          <Text style={styles.cardTitle}>Account</Text>

          {user ? (
            <Pressable
              onPress={async () => {
                try {
                  await signOutUser();
                } finally {
                  router.replace('/auth');
                }
              }}
              style={styles.actionRow}
              testID="settingsLogout"
            >
              <View style={styles.actionLeft}>
                <LogOut color={AppColors.negative} size={18} />
                <Text style={[styles.actionText, { color: AppColors.negative }]}>Log out</Text>
              </View>
              <Text style={styles.actionHint}>Sign out</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => router.replace('/auth')}
              style={styles.actionRow}
              testID="settingsLogin"
            >
              <View style={styles.actionLeft}>
                <Text style={styles.actionText}>Sign in</Text>
              </View>
              <Text style={styles.actionHint}>Auth</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const shadowColor = 'rgba(15,23,42,0.12)';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 28,
    gap: 16,
  },
  hero: {
    borderRadius: 32,
    padding: 24,
    backgroundColor: AppColors.card,
    borderWidth: 1,
    borderColor: AppColors.border,
    shadowColor,
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
    gap: 20,
  },
  heroTop: {
    gap: 8,
  },
  title: {
    color: AppColors.text,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: AppColors.secondaryText,
    fontSize: 16,
    lineHeight: 22,
    maxWidth: 300,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: AppColors.tertiaryBackground,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  premiumCta: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  statusPillText: {
    color: AppColors.text,
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: -0.1,
  },
  firebaseNote: {
    color: AppColors.negative,
    fontSize: 13,
    lineHeight: 18,
    backgroundColor: AppColors.negativeBackground,
    padding: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  card: {
    borderRadius: 28,
    padding: 24,
    backgroundColor: AppColors.card,
    borderWidth: 1,
    borderColor: AppColors.border,
    gap: 16,
    shadowColor,
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardHeaderRight: {
    color: AppColors.primary,
    fontSize: 16,
    fontWeight: '800',
  },
  cardTitle: {
    color: AppColors.text,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  cardSubtitle: {
    color: AppColors.secondaryText,
    fontSize: 14,
    lineHeight: 20,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: AppColors.background,
    borderWidth: 1,
    borderColor: AppColors.border,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionRow: {
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: AppColors.background,
    borderWidth: 1,
    borderColor: AppColors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionText: {
    color: AppColors.text,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  actionHint: {
    color: AppColors.secondaryText,
    fontSize: 13,
    fontWeight: '600',
  },
});
