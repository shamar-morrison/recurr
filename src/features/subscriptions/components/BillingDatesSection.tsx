import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useCallback, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppColors } from '@/constants/colors';
import { FormSection } from '@/src/components/ui/FormSection';
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

  // Validate billing day range
  const billingDayNumber = parseInt(billingDayText, 10);
  const billingDayError =
    billingDayText.trim() !== '' &&
    (isNaN(billingDayNumber) || billingDayNumber < 1 || billingDayNumber > 31)
      ? 'Must be between 1 and 31'
      : null;

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
      <FormSection label="Payment date">
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
      </FormSection>
    );
  }

  return (
    <>
      {/* Billing Day */}
      <FormSection
        label="Billing day"
        helperText="Day of month (1–31). We'll calculate the next renewal date."
      >
        <TextInput
          value={billingDayText}
          onChangeText={onBillingDayChange}
          keyboardType={Platform.OS === 'web' ? 'default' : 'number-pad'}
          placeholder="1"
          placeholderTextColor={colors.secondaryText}
          maxLength={2}
          style={[
            styles.input,
            {
              backgroundColor: colors.card,
              borderColor: billingDayError ? AppColors.negative : colors.border,
              color: colors.text,
            },
            disabled && styles.disabledInput,
          ]}
          editable={!disabled}
          testID="subscriptionEditorBillingDay"
        />
        {billingDayError && <Text style={styles.errorText}>{billingDayError}</Text>}
      </FormSection>

      {/* Start Date */}
      <FormSection label="Start date">
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
      </FormSection>

      {/* End Date - uses custom header with Clear button */}
      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={[styles.label, { color: colors.secondaryText }]}>End date</Text>
          {endDate && (
            <Pressable
              onPress={() => onEndDateChange(null)}
              disabled={disabled}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            >
              <Text style={{ color: colors.secondaryText, fontSize: FONT_SIZE.sm }}>Clear</Text>
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
  // Only keep styles needed for End Date section (which has custom header) and inputs
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
  errorText: {
    color: AppColors.negative,
    fontSize: FONT_SIZE.sm,
    marginTop: -SPACING.xs,
    marginLeft: SPACING.xs,
  },
});
