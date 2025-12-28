import { router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@/constants/colors';
import { useAuth } from '@/src/features/auth/AuthProvider';

type Props = {
  variant?: 'screen' | 'inline';
};

export function PaywallSheet({ variant = 'screen' }: Props) {
  const { isPremium, setPremiumMock, user } = useAuth();
  const [isWorking, setIsWorking] = useState<boolean>(false);

  const isInline = variant === 'inline';

  const canPurchase = Boolean(user);

  const handlePurchase = async () => {
    console.log('[paywall] purchase pressed');
    if (!canPurchase) return;

    setIsWorking(true);
    try {
      await new Promise<void>((r) => setTimeout(() => r(), 900));
      await setPremiumMock(true);
      router.back();
    } finally {
      setIsWorking(false);
    }
  };

  const handleRestore = async () => {
    console.log('[paywall] restore pressed');
    if (!canPurchase) return;

    setIsWorking(true);
    try {
      await new Promise<void>((r) => setTimeout(() => r(), 700));
      await setPremiumMock(true);
      router.back();
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <View style={styles.container} testID="paywall">
      <View style={styles.row}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>FREE</Text>
        </View>
        <Text style={styles.tierTitle}>Up to 5 subscriptions</Text>
      </View>

      <View style={styles.row}>
        <View style={[styles.badge, { backgroundColor: AppColors.tint }]} testID="premiumBadge">
          <Text style={styles.badgeText}>PREMIUM</Text>
        </View>
        <Text style={styles.tierTitle}>Unlimited + Advanced insights</Text>
      </View>

      <View style={styles.divider} />

      <Text style={styles.note} testID="paywallNote">
        Google Play billing is mocked for MVP. Replace this with the real Play Billing integration
        later.
      </Text>

      {isPremium ? (
        <View style={styles.premiumBox} testID="paywallPremiumState">
          <Text style={styles.premiumTitle}>Premium Active</Text>
          <Pressable
            onPress={() => router.back()}
            style={[styles.primaryButton, { backgroundColor: AppColors.tint }]}
            testID="paywallDone"
          >
            <Text style={styles.primaryButtonText}>Done</Text>
          </Pressable>
        </View>
      ) : (
        <View style={[styles.actions, { paddingTop: isInline ? 4 : 10 }]}>
          <Pressable
            disabled={!canPurchase || isWorking}
            onPress={handlePurchase}
            style={[
              styles.primaryButton,
              {
                backgroundColor: canPurchase ? AppColors.tint : AppColors.disabledTint,
              },
            ]}
            testID="paywallPurchase"
          >
            {isWorking ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Start Premium</Text>
            )}
          </Pressable>

          <Pressable
            disabled={!canPurchase || isWorking}
            onPress={handleRestore}
            style={styles.secondaryButton}
            testID="paywallRestore"
          >
            <Text style={styles.secondaryButtonText}>Restore purchase</Text>
          </Pressable>

          {!canPurchase ? (
            <Text style={styles.helperText}>Sign in first to activate Premium.</Text>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
    paddingTop: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: AppColors.badge,
  },
  badgeText: {
    color: AppColors.badgeText,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  tierTitle: {
    color: AppColors.text,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.15,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: AppColors.border,
    marginTop: 6,
    marginBottom: 2,
  },
  note: {
    color: AppColors.secondaryText,
    fontSize: 12,
    lineHeight: 16,
  },
  actions: {
    gap: 10,
  },
  primaryButton: {
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: -0.1,
  },
  secondaryButton: {
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: AppColors.border,
  },
  secondaryButtonText: {
    color: AppColors.text,
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: -0.1,
  },
  helperText: {
    color: AppColors.secondaryText,
    fontSize: 12,
  },
  premiumBox: {
    gap: 10,
    paddingTop: 8,
  },
  premiumTitle: {
    color: AppColors.positive,
    fontSize: 14,
    fontWeight: '900',
  },
});
