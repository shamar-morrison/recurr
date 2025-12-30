import React, { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BaseModal } from '@/src/components/ui/BaseModal';
import { BaseModalListItem } from '@/src/components/ui/BaseModalListItem';
import { BORDER_RADIUS, FONT_SIZE, SPACING } from '@/src/constants/theme';
import { ThemeMode, useTheme } from '@/src/context/ThemeContext';

type ThemeOption = {
  id: ThemeMode;
  label: string;
  description: string;
};

const THEME_OPTIONS: ThemeOption[] = [
  { id: 'light', label: 'Light', description: 'Always use light theme' },
  { id: 'dark', label: 'Dark', description: 'Always use dark theme' },
  { id: 'system', label: 'System', description: 'Match device settings' },
];

type Props = {
  visible: boolean;
  selectedTheme: ThemeMode;
  onSelect: (theme: ThemeMode) => void;
  onClose: () => void;
};

export function ThemeSelectorModal({ visible, selectedTheme, onSelect, onClose }: Props) {
  const { colors } = useTheme();

  const handleSelect = useCallback(
    (theme: ThemeMode) => {
      onSelect(theme);
      onClose();
    },
    [onSelect, onClose]
  );

  const footerContent = (
    <Pressable onPress={onClose} style={styles.cancelButton}>
      <Text style={[styles.cancelText, { color: colors.tint }]}>Cancel</Text>
    </Pressable>
  );

  return (
    <BaseModal visible={visible} title="Theme" onClose={onClose} footer={footerContent}>
      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {THEME_OPTIONS.map((option) => {
          const isSelected = option.id === selectedTheme;

          const radioButton = (
            <View
              style={[
                styles.radio,
                { borderColor: colors.border },
                isSelected && { borderColor: colors.tint },
              ]}
            >
              {isSelected && <View style={[styles.radioInner, { backgroundColor: colors.tint }]} />}
            </View>
          );

          return (
            <BaseModalListItem
              key={option.id}
              label={option.label}
              sublabel={option.description}
              isSelected={isSelected}
              onPress={() => handleSelect(option.id)}
              leftElement={radioButton}
            />
          );
        })}
      </ScrollView>
    </BaseModal>
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: BORDER_RADIUS.full,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  cancelText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
  },
});
