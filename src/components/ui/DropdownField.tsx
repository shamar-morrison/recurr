import { CaretDownIcon } from 'phosphor-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BORDER_RADIUS, FONT_SIZE, SPACING } from '@/src/constants/theme';
import { useTheme } from '@/src/context/ThemeContext';

interface DropdownFieldProps {
  value: string;
  placeholder?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  onPress: () => void;
  testID?: string;
}

/**
 * A reusable dropdown button component.
 * Shows an icon, value/placeholder, and a caret down indicator.
 */
export function DropdownField({
  value,
  placeholder,
  icon,
  disabled = false,
  onPress,
  testID,
}: DropdownFieldProps) {
  const { colors } = useTheme();
  const hasValue = Boolean(value);
  const displayText = hasValue ? value : placeholder || 'Select...';

  return (
    <Pressable
      style={[
        styles.dropdownButton,
        { backgroundColor: colors.card, borderColor: colors.border },
        disabled && styles.disabledInput,
      ]}
      onPress={onPress}
      disabled={disabled}
      testID={testID}
    >
      <View style={styles.content}>
        {icon}
        <Text
          style={[styles.dropdownText, { color: hasValue ? colors.text : colors.secondaryText }]}
        >
          {displayText}
        </Text>
      </View>
      <CaretDownIcon color={colors.secondaryText} size={16} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    minHeight: 56,
    borderRadius: BORDER_RADIUS.xxl,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dropdownText: {
    fontWeight: '600',
    fontSize: FONT_SIZE.md,
  },
  disabledInput: {
    opacity: 0.5,
  },
});
