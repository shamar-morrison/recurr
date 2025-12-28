import { Link, Stack } from 'expo-router';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@/constants/colors';

export default function NotFoundScreen() {
  const theme = { colors: AppColors };
  const styles = useMemo(() => createStyles(), []);

  return (
    <>
      <Stack.Screen options={{ title: 'Not Found' }} />
      <View style={styles.container}>
        <Text style={styles.title} testID="notFoundTitle">
          We couldn’t find that screen.
        </Text>
        <Text style={styles.subtitle}>If you got here from a deep link, it may be outdated.</Text>

        <Link href="/subscriptions" style={styles.link}>
          <Text style={styles.linkText}>Back to subscriptions</Text>
        </Link>
      </View>
    </>
  );
}

function createStyles() {
  const theme = { colors: AppColors };
  return StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      backgroundColor: theme.colors.background,
    },
    title: {
      fontSize: 18,
      fontWeight: '800',
      letterSpacing: -0.2,
      color: theme.colors.text,
      marginBottom: 6,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 14,
      color: theme.colors.secondaryText,
      textAlign: 'center',
      maxWidth: 320,
    },
    link: {
      marginTop: 18,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 14,
      backgroundColor: theme.colors.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
    },
    linkText: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.tint,
    },
  });
}
