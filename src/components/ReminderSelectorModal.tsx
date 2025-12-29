import { BellIcon, CheckIcon, XIcon } from 'phosphor-react-native';
import React, { useCallback } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors } from '@/constants/colors';
import { REMINDER_OPTIONS, ReminderDays } from '@/src/features/subscriptions/types';

type Props = {
  visible: boolean;
  selectedReminder?: ReminderDays;
  onSelect: (reminder: ReminderDays) => void;
  onClose: () => void;
};

export function ReminderSelectorModal({
  visible,
  selectedReminder = null,
  onSelect,
  onClose,
}: Props) {
  const handleSelect = useCallback(
    (reminder: ReminderDays) => {
      onSelect(reminder);
    },
    [onSelect]
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <Text style={styles.title}>Set Reminder</Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <XIcon color={AppColors.text} size={22} />
          </Pressable>
        </View>

        <View style={styles.infoBox}>
          <BellIcon color={AppColors.tint} size={20} />
          <Text style={styles.infoText}>
            Get notified before your subscription renews so you never miss a payment.
          </Text>
        </View>

        <View style={styles.list}>
          {REMINDER_OPTIONS.map((option) => {
            const isSelected = option.value === selectedReminder;
            return (
              <Pressable
                key={option.label}
                onPress={() => handleSelect(option.value)}
                style={[styles.item, isSelected && styles.itemSelected]}
              >
                <View style={styles.reminderInfo}>
                  <Text style={styles.reminderLabel}>{option.label}</Text>
                </View>
                {isSelected && <CheckIcon color={AppColors.tint} size={20} weight="bold" />}
              </Pressable>
            );
          })}
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
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(79,140,255,0.08)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: AppColors.secondaryText,
    lineHeight: 20,
  },
  list: {
    paddingBottom: 20,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  itemSelected: {
    backgroundColor: 'rgba(79,140,255,0.08)',
  },
  reminderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reminderLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.text,
  },
});
