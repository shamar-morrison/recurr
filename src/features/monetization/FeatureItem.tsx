import { Motion } from '@legendapp/motion';
import { Check } from 'phosphor-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@/constants/colors';
import { BORDER_RADIUS, FONT_SIZE, SPACING } from '@/src/constants/theme';

export interface FeatureItemProps {
  title: string;
  description: string;
  index?: number;
}

/**
 * Reusable feature item component for premium feature lists.
 * Displays a check icon with animated entrance, title, and description.
 */
export function FeatureItem({ title, description, index = 0 }: FeatureItemProps) {
  const delay = index * 100;

  return (
    <Motion.View
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'timing', duration: 400, delay }}
      style={styles.container}
    >
      <View style={styles.iconContainer}>
        <Check size={18} color="#FFFFFF" weight="bold" />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </Motion.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: AppColors.tint,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: AppColors.text,
    letterSpacing: -0.2,
  },
  description: {
    fontSize: FONT_SIZE.sm,
    color: AppColors.secondaryText,
    lineHeight: 18,
  },
});
