import { CheckIcon } from 'phosphor-react-native';
import React, { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BORDER_RADIUS, FONT_SIZE, SPACING } from '@/src/constants/theme';
import { useTheme } from '@/src/context/ThemeContext';

type BaseModalListItemProps = {
  /** Primary text */
  label: string;
  /** Secondary text below label */
  sublabel?: string;
  /** Selected state (shows check icon, highlighted background) */
  isSelected?: boolean;
  /** Press handler */
  onPress?: () => void;
  /** Disabled state with reduced opacity */
  disabled?: boolean;
  /** Custom left slot (icon, color dot, logo, etc.) */
  leftElement?: ReactNode;
  /** Override right element (defaults to check icon when selected) */
  rightElement?: ReactNode;
};

export function BaseModalListItem({
  label,
  sublabel,
  isSelected = false,
  onPress,
  disabled = false,
  leftElement,
  rightElement,
}: BaseModalListItemProps) {
  const { colors } = useTheme();
  const showCheckIcon = isSelected && rightElement === undefined;

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.item,
        {
          backgroundColor: isSelected ? colors.selectedBackground : colors.card,
          borderColor: isSelected ? colors.tint : colors.border,
        },
        disabled && styles.itemDisabled,
      ]}
      disabled={disabled}
    >
      <View style={styles.leftContainer}>
        {leftElement && <View style={styles.leftElement}>{leftElement}</View>}
        <View style={styles.labelContainer}>
          <Text
            style={[
              styles.label,
              { color: isSelected ? colors.tint : colors.text },
              disabled && { color: colors.secondaryText },
            ]}
          >
            {label}
          </Text>
          {sublabel && (
            <Text style={[styles.sublabel, { color: colors.secondaryText }]}>{sublabel}</Text>
          )}
        </View>
      </View>

      {rightElement !== undefined ? (
        rightElement
      ) : showCheckIcon ? (
        <CheckIcon color={colors.tint} size={20} weight="bold" />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  itemDisabled: {
    opacity: 0.5,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: SPACING.md,
  },
  leftElement: {
    // Container for custom left element
  },
  labelContainer: {
    flex: 1,
  },
  label: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
  },
  sublabel: {
    fontSize: FONT_SIZE.md,
    marginTop: 2,
  },
});
