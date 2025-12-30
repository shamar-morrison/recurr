import { Link, Stack } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BORDER_RADIUS, FONT_SIZE, SPACING } from '@/src/constants/theme';
import { useTheme } from '@/src/context/ThemeContext';

export default function NotFoundScreen() {
  const { colors } = useTheme();

  return (
    <>
      <Stack.Screen options={{ title: 'Not Found' }} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.text }]} testID="notFoundTitle">
          We couldn't find that screen.
        </Text>
        <Text style={[styles.subtitle, { color: colors.secondaryText }]}>
          If you got here from a deep link, it may be outdated.
        </Text>

        <Link
          href="/subscriptions"
          style={[styles.link, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Text style={[styles.linkText, { color: colors.tint }]}>Back to subscriptions</Text>
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
    padding: SPACING.xl,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FONT_SIZE.md,
    textAlign: 'center',
    maxWidth: 320,
  },
  link: {
    marginTop: SPACING.xl,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  linkText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
});
