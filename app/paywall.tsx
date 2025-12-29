import { Stack } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors } from '@/constants/colors';
import { BORDER_RADIUS, FONT_SIZE, SPACING } from '@/src/constants/theme';
import { PaywallSheet } from '@/src/features/monetization/PaywallSheet';

export default function PaywallScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Premium', headerShown: false }} />
      <View style={styles.bg}>
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <View style={styles.header}>
            <Text style={styles.title} testID="paywallTitle">
              Go Premium
            </Text>
            <Text style={styles.subtitle}>
              Keep everything organized, and see where your money goes.
            </Text>
          </View>
          <View style={styles.card}>
            <PaywallSheet variant="screen" />
          </View>
        </SafeAreaView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: AppColors.background },
  safe: { flex: 1, padding: SPACING.lg, gap: SPACING.lg },
  header: { paddingTop: SPACING.sm, gap: 6 },
  title: {
    color: AppColors.text,
    fontSize: FONT_SIZE.display,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  subtitle: {
    color: AppColors.secondaryText,
    fontSize: FONT_SIZE.md,
    lineHeight: 18,
    maxWidth: 340,
  },
  card: {
    marginTop: SPACING.sm,
    borderRadius: BORDER_RADIUS.xxxl,
    backgroundColor: AppColors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: AppColors.border,
    padding: SPACING.lg,
  },
});
