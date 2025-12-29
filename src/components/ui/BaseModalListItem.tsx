import { CheckIcon } from 'phosphor-react-native';
import React, { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@/constants/colors';

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
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 8,
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
    gap: 12,
  },
  leftElement: {
    // Container for custom left element
  },
  labelContainer: {
    flex: 1,
  },
  label: {
    fontSize: 16,
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
    fontSize: 14,
    color: AppColors.secondaryText,
    marginTop: 2,
  },
});
