import { XIcon } from 'phosphor-react-native';
import React, { useCallback, useMemo } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors } from '@/constants/colors';
import { DATE_FORMAT_OPTIONS, DateFormatId, formatDate } from '@/src/constants/dateFormats';

type Props = {
  visible: boolean;
  selectedFormat: DateFormatId;
  onSelect: (format: DateFormatId) => void;
  onClose: () => void;
};

export function DateFormatModal({ visible, selectedFormat, onSelect, onClose }: Props) {
  const handleSelect = useCallback(
    (format: DateFormatId) => {
      onSelect(format);
      onClose();
    },
    [onSelect, onClose]
  );

  // Generate fresh example dates for display
  const referenceDate = useMemo(() => new Date(2024, 11, 31), []); // Dec 31, 2024

  return (
    <Modal
      visible={visible}
      animationType="none"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <Text style={styles.title}>Date format</Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <XIcon color={AppColors.text} size={22} />
          </Pressable>
        </View>

        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {DATE_FORMAT_OPTIONS.map((option) => {
            const isSelected = option.id === selectedFormat;
            const exampleText =
              option.id === 'system' ? formatDate(referenceDate, 'system') : option.example;

            return (
              <Pressable
                key={option.id}
                onPress={() => handleSelect(option.id)}
                style={[styles.item, isSelected && styles.itemSelected]}
              >
                <View style={styles.radioContainer}>
                  <View style={[styles.radio, isSelected && styles.radioSelected]}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                </View>
                <View style={styles.labelContainer}>
                  <Text style={[styles.formatLabel, isSelected && styles.formatLabelSelected]}>
                    {option.label}
                  </Text>
                  <Text style={styles.formatExample}>{exampleText}</Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.footer}>
          <Pressable onPress={onClose} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.card,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerSpacer: {
    width: 40,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.text,
    textAlign: 'center',
    flex: 1,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15,23,42,0.04)',
  },
  list: {
    flex: 1,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: AppColors.border,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  itemSelected: {
    backgroundColor: 'rgba(79,140,255,0.08)',
    borderColor: AppColors.tint,
  },
  radioContainer: {
    marginRight: 14,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: AppColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: AppColors.tint,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: AppColors.tint,
  },
  labelContainer: {
    flex: 1,
  },
  formatLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.text,
  },
  formatLabelSelected: {
    color: AppColors.tint,
  },
  formatExample: {
    fontSize: 14,
    color: AppColors.secondaryText,
    marginTop: 2,
  },
  footer: {
    paddingVertical: 16,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.tint,
  },
});
