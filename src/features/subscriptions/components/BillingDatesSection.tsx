import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useCallback, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { BORDER_RADIUS, FONT_SIZE, SPACING } from '@/src/constants/theme';
import { useTheme } from '@/src/context/ThemeContext';
import { BillingCycle } from '@/src/features/subscriptions/types';

interface BillingDatesSectionProps {
  billingCycle: BillingCycle;
  billingDayText: string;
  onBillingDayChange: (text: string) => void;
  startDate: Date;
  onStartDateChange: (date: Date) => void;
  endDate: Date | null;
  onEndDateChange: (date: Date | null) => void;
  formatDate: (date: Date) => string;
  normalizeToMidnight: (date: Date) => Date;
  disabled?: boolean;
}

/**
 * Billing dates section that handles:
 * - One-Time payments: Just payment date
 * - Recurring: Billing day, start date, end date
 */
export function BillingDatesSection({
  billingCycle,
  billingDayText,
  onBillingDayChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  formatDate,
  normalizeToMidnight,
  disabled = false,
}: BillingDatesSectionProps) {
  const { colors } = useTheme();
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const handleStartDateChange = useCallback(
    (event: any, selectedDate?: Date) => {
      setShowStartDatePicker(Platform.OS === 'ios');
      if (event.type === 'dismissed') return;
      if (selectedDate) {
        onStartDateChange(normalizeToMidnight(selectedDate));
      }
    },
    [normalizeToMidnight, onStartDateChange]
  );

  const handleEndDateChange = useCallback(
    (event: any, selectedDate?: Date) => {
      setShowEndDatePicker(Platform.OS === 'ios');
      if (event.type === 'dismissed') return;
      if (selectedDate) {
        onEndDateChange(normalizeToMidnight(selectedDate));
      }
    },
    [normalizeToMidnight, onEndDateChange]
  );

  if (billingCycle === 'One-Time') {
    return (
      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.secondaryText }]}>Payment date</Text>
        <Pressable
          style={[
            styles.dateInput,
            { backgroundColor: colors.card, borderColor: colors.border },
            disabled && styles.disabledInput,
          ]}
          onPress={() => setShowStartDatePicker(true)}
          disabled={disabled}
          testID="subscriptionEditorPaymentDate"
        >
          <Text style={[styles.dateText, { color: colors.text }]}>{formatDate(startDate)}</Text>
        </Pressable>
        {showStartDatePicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleStartDateChange}
          />
        )}
      </View>
    );
  }

  return (
    <>
      {/* Billing Day */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.secondaryText }]}>Billing day</Text>
        <Text style={[styles.helper, { color: colors.secondaryText }]}>
          Day of month (1–31). We'll calculate the next renewal date.
        </Text>
        <TextInput
          value={billingDayText}
          onChangeText={onBillingDayChange}
          keyboardType={Platform.OS === 'web' ? 'default' : 'number-pad'}
          placeholder="1"
          placeholderTextColor={colors.secondaryText}
          style={[
            styles.input,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              color: colors.text,
            },
            disabled && styles.disabledInput,
          ]}
          editable={!disabled}
          testID="subscriptionEditorBillingDay"
        />
      </View>

      {/* Start Date */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.secondaryText }]}>Start date</Text>
        <Pressable
          style={[
            styles.dateInput,
            { backgroundColor: colors.card, borderColor: colors.border },
            disabled && styles.disabledInput,
          ]}
          onPress={() => setShowStartDatePicker(true)}
          disabled={disabled}
          testID="subscriptionEditorStartDate"
        >
          <Text style={[styles.dateText, { color: colors.text }]}>{formatDate(startDate)}</Text>
        </Pressable>
        {showStartDatePicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleStartDateChange}
          />
        )}
      </View>

      {/* End Date */}
      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={[styles.label, { color: colors.secondaryText }]}>End date</Text>
          {endDate && (
            <Pressable
              onPress={() => onEndDateChange(null)}
              disabled={disabled}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            >
              <Text style={{ color: colors.secondaryText, fontSize: 13 }}>Clear</Text>
            </Pressable>
          )}
        </View>
        <Pressable
          style={[
            styles.dateInput,
            { backgroundColor: colors.card, borderColor: colors.border },
            disabled && styles.disabledInput,
          ]}
          onPress={() => setShowEndDatePicker(true)}
          disabled={disabled}
          testID="subscriptionEditorEndDate"
        >
          <Text style={[styles.dateText, { color: endDate ? colors.text : colors.secondaryText }]}>
            {endDate ? formatDate(endDate) : 'Optional'}
          </Text>
        </Pressable>
        {showEndDatePicker && (
          <DateTimePicker
            value={endDate || new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleEndDateChange}
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: SPACING.md,
  },
  label: {
    textTransform: 'uppercase',
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    letterSpacing: 0.4,
    marginLeft: SPACING.xs,
  },
  helper: {
    fontSize: FONT_SIZE.md,
    lineHeight: 18,
    marginLeft: SPACING.xs,
    marginBottom: SPACING.xs,
    marginTop: -SPACING.xs,
  },
  input: {
    minHeight: 56,
    borderRadius: BORDER_RADIUS.xxl,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    justifyContent: 'center',
  },
  dateInput: {
    minHeight: 56,
    borderRadius: BORDER_RADIUS.xxl,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    borderWidth: 1,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  dateText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  disabledInput: {
    opacity: 0.5,
  },
});
