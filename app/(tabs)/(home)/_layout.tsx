import { Stack } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/src/theme/useAppTheme';

function SubscriptionsHeaderTitle() {
  const theme = useAppTheme();

  return (
    <View style={styles.headerTitleContainer}>
      <Text style={[styles.headerTitle, { color: theme.colors.text }]}>My Subscriptions</Text>
      <Text style={[styles.headerSubtitle, { color: theme.colors.secondaryText }]}>
        Manage your recurring payments
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headerTitleContainer: {
    gap: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '500',
  },
});

export default function HomeStackLayout() {
  const theme = useAppTheme();

  return (
    <Stack
      initialRouteName="subscriptions"
      screenOptions={{
        headerTitle: () => <SubscriptionsHeaderTitle />,
        headerBackTitle: 'Back',
        headerStyle: {
          backgroundColor: theme.colors.background,
        },
        headerTintColor: theme.colors.text,
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: theme.colors.background,
        },
      }}
    />
  );
}
