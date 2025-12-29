import { BellIcon } from 'phosphor-react-native';
import React, { useCallback } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@/constants/colors';
import { BaseModal } from '@/src/components/ui/BaseModal';
import { BaseModalListItem } from '@/src/components/ui/BaseModalListItem';
import { BORDER_RADIUS, FONT_SIZE, SPACING } from '@/src/constants/theme';
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
    <BaseModal visible={visible} title="Set Reminder" onClose={onClose}>
      <View style={styles.infoBox}>
        <BellIcon color={AppColors.tint} size={20} />
        <Text style={styles.infoText}>
          Get notified before your subscription renews so you never miss a payment.
        </Text>
      </View>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {REMINDER_OPTIONS.map((option) => {
          const isSelected = option.value === selectedReminder;
          return (
            <BaseModalListItem
              key={option.label}
              label={option.label}
              isSelected={isSelected}
              onPress={() => handleSelect(option.value)}
            />
          );
        })}
      </ScrollView>
    </BaseModal>
  );
}

const styles = StyleSheet.create({
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.selectedBackground,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    gap: SPACING.md,
  },
  infoText: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    color: AppColors.secondaryText,
    lineHeight: 20,
  },
  list: {
    flex: 1,
    paddingBottom: SPACING.xl,
  },
});
