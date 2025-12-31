import { router } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { BORDER_RADIUS, FONT_SIZE, SPACING } from '@/src/constants/theme';
import { useTheme } from '@/src/context/ThemeContext';

/**
 * Loading state shown when fetching existing subscription data.
 */
export function EditorLoadingState() {
  const { colors } = useTheme();

  return (
    <View style={styles.loading} testID="subscriptionEditorLoading">
      <ActivityIndicator color={colors.tint} />
      <Text style={[styles.loadingText, { color: colors.secondaryText }]}>Loading…</Text>
    </View>
  );
}

interface EditorNotFoundStateProps {
  onGoBack?: () => void;
}

/**
 * Not found state shown when subscription doesn't exist.
 */
export function EditorNotFoundState({ onGoBack }: EditorNotFoundStateProps) {
  const { colors } = useTheme();

  const handleGoBack = () => {
    if (onGoBack) {
      onGoBack();
    } else {
      router.back();
    }
  };

  return (
    <View
      style={[styles.notFound, { backgroundColor: colors.card, borderColor: colors.border }]}
      testID="subscriptionEditorNotFound"
    >
      <Text style={[styles.notFoundTitle, { color: colors.text }]}>Subscription not found</Text>
      <Text style={[styles.notFoundText, { color: colors.secondaryText }]}>
        It may have been deleted on another device.
      </Text>
      <Pressable
        onPress={handleGoBack}
        style={[styles.primary, { backgroundColor: colors.tint }]}
        testID="subscriptionEditorNotFoundBack"
      >
        <Text style={styles.primaryText}>Go back</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.xl,
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  notFound: {
    borderRadius: BORDER_RADIUS.xxxl,
    padding: SPACING.xxl,
    borderWidth: 1,
    gap: SPACING.md,
    alignItems: 'center',
  },
  notFoundTitle: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '700',
  },
  notFoundText: {
    fontSize: FONT_SIZE.md,
    lineHeight: 20,
    textAlign: 'center',
  },
  primary: {
    borderRadius: BORDER_RADIUS.xxl,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xxl,
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  primaryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: FONT_SIZE.lg,
  },
});
