import React, { ReactNode } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

import { BORDER_RADIUS, FONT_SIZE, SPACING } from '@/src/constants/theme';
import { useTheme } from '@/src/context/ThemeContext';

export type EmptyStateSize = 'sm' | 'md' | 'lg';

interface EmptyStateProps {
  /** Icon to display - pass a Phosphor icon component */
  icon: ReactNode;
  /** Main title text */
  title: string;
  /** Optional description text below the title */
  description?: string;
  /** Optional action element (button, pressable, etc.) */
  action?: ReactNode;
  /** Size variant - affects icon, title, and description sizing */
  size?: EmptyStateSize;
  /** Additional container styles */
  style?: ViewStyle;
  /** Test ID for testing */
  testID?: string;
}

const SIZE_CONFIG = {
  sm: {
    iconContainerSize: 56,
    iconContainerRadius: BORDER_RADIUS.xl,
    titleSize: FONT_SIZE.lg,
    descriptionSize: FONT_SIZE.sm,
    gap: SPACING.md,
  },
  md: {
    iconContainerSize: 64,
    iconContainerRadius: BORDER_RADIUS.xl,
    titleSize: FONT_SIZE.xl,
    descriptionSize: FONT_SIZE.md,
    gap: SPACING.md,
  },
  lg: {
    iconContainerSize: 100,
    iconContainerRadius: BORDER_RADIUS.full,
    titleSize: FONT_SIZE.xxxl,
    descriptionSize: FONT_SIZE.lg,
    gap: SPACING.lg,
  },
} as const;

/**
 * Displays an empty state with icon, title, optional description, and optional action.
 * Use consistent sizing across the app.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  size = 'md',
  style,
  testID,
}: EmptyStateProps) {
  const { colors } = useTheme();
  const config = SIZE_CONFIG[size];

  return (
    <View style={[styles.container, { gap: config.gap }, style]} testID={testID}>
      <View
        style={[
          styles.iconContainer,
          {
            width: config.iconContainerSize,
            height: config.iconContainerSize,
            borderRadius: config.iconContainerRadius,
            backgroundColor: colors.cardAlt,
          },
        ]}
      >
        {icon}
      </View>

      <Text
        style={[
          styles.title,
          {
            fontSize: config.titleSize,
            color: colors.text,
          },
        ]}
      >
        {title}
      </Text>

      {description ? (
        <Text
          style={[
            styles.description,
            {
              fontSize: config.descriptionSize,
              color: colors.secondaryText,
            },
          ]}
        >
          {description}
        </Text>
      ) : null}

      {action ? <View style={styles.actionContainer}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontWeight: '800',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  description: {
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
  actionContainer: {
    marginTop: SPACING.sm,
  },
});
