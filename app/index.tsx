import { Redirect } from 'expo-router';
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useTheme } from '@/src/context/ThemeContext';
import { useAuth } from '@/src/features/auth/AuthProvider';

export default function Index() {
  const { isReady, user, hasCompletedOnboarding } = useAuth();
  const { colors } = useTheme();

  if (!isReady) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  if (!hasCompletedOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  if (!user) {
    return <Redirect href="/auth" />;
  }

  return <Redirect href="/(tabs)/(home)/subscriptions" />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
