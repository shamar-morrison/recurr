import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FONT_SIZE, SPACING } from '@/src/constants/theme';
import { useTheme } from '@/src/context/ThemeContext';

interface FormSectionProps {
  label: string;
  helperText?: string;
  children: React.ReactNode;
}

/**
 * A wrapper component for form field groups with consistent styling.
 * Provides a label, optional helper text, and consistent spacing.
 */
export function FormSection({ label, helperText, children }: FormSectionProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.section}>
      <Text style={[styles.label, { color: colors.secondaryText }]}>{label}</Text>
      {helperText && (
        <Text style={[styles.helper, { color: colors.secondaryText }]}>{helperText}</Text>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: SPACING.md,
  },
  label: {
    textTransform: 'uppercase',
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    letterSpacing: 0.4,
    marginLeft: SPACING.xs,
  },
  helper: {
    fontSize: FONT_SIZE.md,
    lineHeight: 18,
    marginLeft: SPACING.xs,
    marginBottom: SPACING.xs,
    marginTop: -SPACING.xs,
  },
});
