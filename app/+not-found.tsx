import { Link, Stack } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@/constants/colors';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not Found' }} />
      <View style={styles.container}>
        <Text style={styles.title} testID="notFoundTitle">
          We couldn't find that screen.
        </Text>
        <Text style={styles.subtitle}>If you got here from a deep link, it may be outdated.</Text>

        <Link href="/subscriptions" style={styles.link}>
          <Text style={styles.linkText}>Back to subscriptions</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: AppColors.background,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
    color: AppColors.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: AppColors.secondaryText,
    textAlign: 'center',
    maxWidth: 320,
  },
  link: {
    marginTop: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: AppColors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: AppColors.border,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.tint,
  },
});
