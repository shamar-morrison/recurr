import { CrownIcon } from '@hugeicons/core-free-icons';
import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

import { AppIcon } from '@/src/components/ui/AppIcon';

import { BORDER_RADIUS, FONT_FAMILY, FONT_SIZE, SPACING } from '@/src/constants/theme';

export type PremiumBadgeSize = 'sm' | 'md' | 'lg';

interface PremiumBadgeProps {
  /** Size variant - affects font size and padding */
  size?: PremiumBadgeSize;
  /** Additional container styles */
  style?: ViewStyle;
}

// Premium badge colors (golden/amber theme)
const PREMIUM_COLORS = {
  bg: '#FEF3C7',
  text: '#D97706',
} as const;

/**
 * Displays a premium badge with a crown icon.
 * Used to indicate premium-only features throughout the app.
 */
export function PremiumBadge({ size = 'sm', style }: PremiumBadgeProps) {
  const sizeStyles = SIZE_VARIANTS[size];

  return (
    <View style={[styles.container, sizeStyles.container, style]}>
      <AppIcon
        icon={CrownIcon}
        size={sizeStyles.iconSize}
        color={PREMIUM_COLORS.text}
        fill={PREMIUM_COLORS.text}
      />
      <Text style={[styles.text, sizeStyles.text]}>PREMIUM</Text>
    </View>
  );
}

const SIZE_VARIANTS = {
  sm: {
    container: {
      paddingHorizontal: SPACING.sm,
      paddingVertical: 2,
      gap: 4,
    },
    text: {
      fontSize: FONT_SIZE.xs,
    },
    iconSize: 10,
  },
  md: {
    container: {
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.xs,
      gap: 5,
    },
    text: {
      fontSize: FONT_SIZE.sm,
    },
    iconSize: 12,
  },
  lg: {
    container: {
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.sm,
      gap: 6,
    },
    text: {
      fontSize: FONT_SIZE.md,
    },
    iconSize: 14,
  },
} as const;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: PREMIUM_COLORS.bg,
  },
  text: {
    fontFamily: FONT_FAMILY.bold,
    letterSpacing: 0.4,
    color: PREMIUM_COLORS.text,
  },
});
