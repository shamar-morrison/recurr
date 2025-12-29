import * as Localization from 'expo-localization';
import { ClockIcon } from 'phosphor-react-native';
import React, { useCallback, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@/constants/colors';
import { BaseModal } from '@/src/components/ui/BaseModal';
import { BaseModalListItem } from '@/src/components/ui/BaseModalListItem';
import { REMINDER_TIME_OPTIONS, ReminderHour } from '@/src/features/subscriptions/types';

type Props = {
  visible: boolean;
  selectedHour?: ReminderHour;
  onSelect: (hour: ReminderHour) => void;
  onClose: () => void;
};

/**
 * Format an hour (0-23) based on device locale settings.
 * Uses the device's preferred 12h/24h format.
 */
function formatHourForLocale(hour: number): string {
  const locales = Localization.getLocales();
  const locale = locales[0]?.languageTag ?? 'en-US';

  // Create a date object with the target hour
  const date = new Date();
  date.setHours(hour, 0, 0, 0);

  // Let Intl.DateTimeFormat decide the format based on locale
  return date.toLocaleTimeString(locale, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function ReminderTimeSelectorModal({
  visible,
  selectedHour = 12,
  onSelect,
  onClose,
}: Props) {
  const handleSelect = useCallback(
    (hour: number) => {
      onSelect(hour);
    },
    [onSelect]
  );

  const timeOptions = useMemo(() => {
    return REMINDER_TIME_OPTIONS.map(({ value }) => ({
      value,
      label: formatHourForLocale(value),
    }));
  }, []);

  return (
    <BaseModal visible={visible} title="Reminder Time" onClose={onClose}>
      <View style={styles.infoBox}>
        <ClockIcon color={AppColors.tint} size={20} />
        <Text style={styles.infoText}>
          Choose what time of day you'd like to receive your reminder notification.
        </Text>
      </View>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {timeOptions.map((option) => {
          const isSelected = option.value === selectedHour;
          return (
            <BaseModalListItem
              key={option.value}
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
    flex: 1,
    paddingBottom: 20,
  },
});
