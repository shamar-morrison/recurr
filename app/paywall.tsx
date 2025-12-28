import { Stack } from 'expo-router';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors } from '@/constants/colors';
import { PaywallSheet } from '@/src/features/monetization/PaywallSheet';

export default function PaywallScreen() {
  const theme = { colors: AppColors };
  const styles = useMemo(() => createStyles(), []);

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

function createStyles() {
  const theme = { colors: AppColors };
  return StyleSheet.create({
    bg: { flex: 1, backgroundColor: theme.colors.background },
    safe: { flex: 1, padding: 16, gap: 14 },
    header: { paddingTop: 8, gap: 6 },
    title: {
      color: theme.colors.text,
      fontSize: 28,
      fontWeight: '900',
      letterSpacing: -0.6,
    },
    subtitle: {
      color: theme.colors.secondaryText,
      fontSize: 14,
      lineHeight: 18,
      maxWidth: 340,
    },
    card: {
      marginTop: 8,
      borderRadius: 24,
      backgroundColor: theme.colors.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      padding: 16,
    },
  });
}
