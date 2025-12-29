import * as Localization from 'expo-localization';
import { CheckIcon, ClockIcon, XIcon } from 'phosphor-react-native';
import React, { useCallback, useMemo } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors } from '@/constants/colors';
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
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <Text style={styles.title}>Reminder Time</Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <XIcon color={AppColors.text} size={22} />
          </Pressable>
        </View>

        <View style={styles.infoBox}>
          <ClockIcon color={AppColors.tint} size={20} />
          <Text style={styles.infoText}>
            Choose what time of day you'd like to receive your reminder notification.
          </Text>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.list}>
            {timeOptions.map((option) => {
              const isSelected = option.value === selectedHour;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => handleSelect(option.value)}
                  style={[styles.item, isSelected && styles.itemSelected]}
                >
                  <View style={styles.timeInfo}>
                    <Text style={styles.timeLabel}>{option.label}</Text>
                  </View>
                  {isSelected && <CheckIcon color={AppColors.tint} size={20} weight="bold" />}
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
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
  scrollView: {
    flex: 1,
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
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  timeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.text,
  },
});
