import React, { useCallback, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BaseModal } from '@/src/components/ui/BaseModal';
import { BaseModalListItem } from '@/src/components/ui/BaseModalListItem';
import { DATE_FORMAT_OPTIONS, DateFormatId, formatDate } from '@/src/constants/dateFormats';
import { BORDER_RADIUS, FONT_SIZE, SPACING } from '@/src/constants/theme';
import { useTheme } from '@/src/context/ThemeContext';

type Props = {
  visible: boolean;
  selectedFormat: DateFormatId;
  onSelect: (format: DateFormatId) => void;
  onClose: () => void;
};

export function DateFormatModal({ visible, selectedFormat, onSelect, onClose }: Props) {
  const { colors } = useTheme();

  const handleSelect = useCallback(
    (format: DateFormatId) => {
      onSelect(format);
      onClose();
    },
    [onSelect, onClose]
  );

  // Generate fresh example dates for display
  const referenceDate = useMemo(() => new Date(2024, 11, 31), []); // Dec 31, 2024

  const footerContent = (
    <Pressable onPress={onClose} style={styles.cancelButton}>
      <Text style={[styles.cancelText, { color: colors.tint }]}>Cancel</Text>
    </Pressable>
  );

  return (
    <BaseModal visible={visible} title="Date format" onClose={onClose} footer={footerContent}>
      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {DATE_FORMAT_OPTIONS.map((option) => {
          const isSelected = option.id === selectedFormat;
          const exampleText =
            option.id === 'system' ? formatDate(referenceDate, 'system') : option.example;

          const radioButton = (
            <View style={[styles.radio, { borderColor: isSelected ? colors.tint : colors.border }]}>
              {isSelected && <View style={[styles.radioInner, { backgroundColor: colors.tint }]} />}
            </View>
          );

          return (
            <BaseModalListItem
              key={option.id}
              label={option.label}
              sublabel={exampleText}
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
