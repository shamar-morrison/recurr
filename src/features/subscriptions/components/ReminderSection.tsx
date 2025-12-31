import { BellIcon, CaretDownIcon, ClockIcon } from 'phosphor-react-native';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ReminderSelectorModal } from '@/src/components/ReminderSelectorModal';
import { ReminderTimeSelectorModal } from '@/src/components/ReminderTimeSelectorModal';
import { BORDER_RADIUS, FONT_SIZE, SPACING } from '@/src/constants/theme';
import { useTheme } from '@/src/context/ThemeContext';
import { REMINDER_OPTIONS, ReminderDays, ReminderHour } from '@/src/features/subscriptions/types';

interface ReminderSectionProps {
  reminderDays: ReminderDays;
  reminderHour: ReminderHour;
  onReminderDaysChange: (days: ReminderDays) => void;
  onReminderHourChange: (hour: ReminderHour) => void;
  showDaysModal: boolean;
  setShowDaysModal: (show: boolean) => void;
  showTimeModal: boolean;
  setShowTimeModal: (show: boolean) => void;
  disabled?: boolean;
}

/**
 * Reminder configuration section with day and time selection.
 */
export function ReminderSection({
  reminderDays,
  reminderHour,
  onReminderDaysChange,
  onReminderHourChange,
  showDaysModal,
  setShowDaysModal,
  showTimeModal,
  setShowTimeModal,
  disabled = false,
}: ReminderSectionProps) {
  const { colors } = useTheme();

  const reminderLabel = useMemo(() => {
    const option = REMINDER_OPTIONS.find((o) => o.value === reminderDays);
    return option?.label ?? 'None';
  }, [reminderDays]);

  const reminderTimeLabel = useMemo(() => {
    const date = new Date();
    date.setHours(reminderHour ?? 12, 0, 0, 0);
    return date.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    });
  }, [reminderHour]);

  return (
    <>
      {/* Reminder Day */}
      <Text
        style={[
          styles.sublabel,
          {
            color: colors.secondaryText,
            marginTop: SPACING.xs,
          },
        ]}
      >
        When to remind me
      </Text>
      <Pressable
        style={[
          styles.dropdownButton,
          { backgroundColor: colors.card, borderColor: colors.border },
          disabled && styles.disabledInput,
        ]}
        onPress={() => setShowDaysModal(true)}
        disabled={disabled}
        testID="subscriptionEditorReminder"
      >
        <View style={styles.iconRow}>
          <BellIcon
            color={reminderDays === null ? colors.secondaryText : colors.tint}
            size={18}
            weight={reminderDays === null ? 'regular' : 'fill'}
          />
          <Text style={[styles.dropdownText, { color: colors.text }]}>{reminderLabel}</Text>
        </View>
        <CaretDownIcon color={colors.secondaryText} size={16} />
      </Pressable>

      {/* Reminder Time (only if reminder is set) */}
      {reminderDays !== null && (
        <>
          <Text
            style={[
              styles.sublabel,
              {
                color: colors.secondaryText,
                marginTop: SPACING.md,
              },
            ]}
          >
            What time
          </Text>
          <Pressable
            style={[
              styles.dropdownButton,
              { backgroundColor: colors.card, borderColor: colors.border },
              disabled && styles.disabledInput,
            ]}
            onPress={() => setShowTimeModal(true)}
            disabled={disabled}
            testID="subscriptionEditorReminderTime"
          >
            <View style={styles.iconRow}>
              <ClockIcon color={colors.secondaryText} size={18} />
              <Text style={[styles.dropdownText, { color: colors.text }]}>{reminderTimeLabel}</Text>
            </View>
            <CaretDownIcon color={colors.secondaryText} size={16} />
          </Pressable>
        </>
      )}

      {/* Modals */}
      <ReminderSelectorModal
        visible={showDaysModal}
        selectedReminder={reminderDays}
        onSelect={onReminderDaysChange}
        onClose={() => setShowDaysModal(false)}
      />
      <ReminderTimeSelectorModal
        visible={showTimeModal}
        selectedHour={reminderHour}
        onSelect={onReminderHourChange}
        onClose={() => setShowTimeModal(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  sublabel: {
    textTransform: 'uppercase',
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    minHeight: 56,
    borderRadius: BORDER_RADIUS.xxl,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dropdownText: {
    fontWeight: '600',
    fontSize: FONT_SIZE.md,
  },
  disabledInput: {
    opacity: 0.5,
  },
});
