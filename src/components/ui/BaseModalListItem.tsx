import { CheckIcon } from 'phosphor-react-native';
import React, { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@/constants/colors';
import { BORDER_RADIUS, FONT_SIZE, SPACING } from '@/src/constants/theme';

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
  const showCheckIcon = isSelected && rightElement === undefined;

  return (
    <Pressable
      onPress={onPress}
      style={[styles.item, isSelected && styles.itemSelected, disabled && styles.itemDisabled]}
      disabled={disabled}
    >
      <View style={styles.leftContainer}>
        {leftElement && <View style={styles.leftElement}>{leftElement}</View>}
        <View style={styles.labelContainer}>
          <Text
            style={[
              styles.label,
              isSelected && styles.labelSelected,
              disabled && styles.labelDisabled,
            ]}
          >
            {label}
          </Text>
          {sublabel && <Text style={styles.sublabel}>{sublabel}</Text>}
        </View>
      </View>

      {rightElement !== undefined ? (
        rightElement
      ) : showCheckIcon ? (
        <CheckIcon color={AppColors.tint} size={20} weight="bold" />
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
    backgroundColor: AppColors.card,
    borderWidth: 1,
    borderColor: AppColors.border,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  itemSelected: {
    backgroundColor: AppColors.selectedBackground,
    borderColor: AppColors.tint,
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
    color: AppColors.text,
  },
  labelSelected: {
    color: AppColors.tint,
  },
  labelDisabled: {
    color: AppColors.secondaryText,
  },
  sublabel: {
    fontSize: FONT_SIZE.md,
    color: AppColors.secondaryText,
    marginTop: 2,
  },
});
