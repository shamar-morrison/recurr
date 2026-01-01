import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

import { getCategoryColors } from '@/constants/colors';
import { BORDER_RADIUS, FONT_SIZE, SPACING } from '@/src/constants/theme';
import { SubscriptionCategory } from '@/src/features/subscriptions/types';

export type CategoryBadgeSize = 'sm' | 'md' | 'lg';

interface CategoryBadgeProps {
  /** The category name to display */
  category: SubscriptionCategory;
  /** Optional custom color override (for custom categories) */
  customColor?: string;
  /** Size variant - affects font size and padding */
  size?: CategoryBadgeSize;
  /** Additional container styles */
  style?: ViewStyle;
}

/**
 * Displays a category name in a colored badge.
 * Text is always uppercase for consistency.
 */
export function CategoryBadge({ category, customColor, size = 'sm', style }: CategoryBadgeProps) {
  const categoryColors = getCategoryColors(category, customColor);
  const sizeStyles = SIZE_VARIANTS[size];

  return (
    <View
      style={[
        styles.container,
        sizeStyles.container,
        { backgroundColor: categoryColors.bg },
        style,
      ]}
    >
      <Text style={[styles.text, sizeStyles.text, { color: categoryColors.text }]}>
        {category.toUpperCase()}
      </Text>
    </View>
  );
}

const SIZE_VARIANTS = {
  sm: {
    container: {
      paddingHorizontal: SPACING.sm,
      paddingVertical: 2,
    },
    text: {
      fontSize: FONT_SIZE.xs,
    },
  },
  md: {
    container: {
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.xs,
    },
    text: {
      fontSize: FONT_SIZE.sm,
    },
  },
  lg: {
    container: {
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.sm,
    },
    text: {
      fontSize: FONT_SIZE.md,
    },
  },
} as const;

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    borderRadius: BORDER_RADIUS.xs,
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});
