import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useCallback, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text } from 'react-native';

import { BORDER_RADIUS, FONT_SIZE, SPACING } from '@/src/constants/theme';
import { useTheme } from '@/src/context/ThemeContext';

interface BaseDateInputFieldProps {
  pickerValue: Date;
  displayText: string;
  textColor: string;
  onDateChange: (date: Date) => void;
  disabled?: boolean;
  testID?: string;
}

/**
 * Internal base component containing shared date picker logic.
 */
function BaseDateInputField({
  pickerValue,
  displayText,
  textColor,
  onDateChange,
  disabled = false,
  testID,
}: BaseDateInputFieldProps) {
  const { colors } = useTheme();
  const [showPicker, setShowPicker] = useState(false);

  const handleChange = useCallback(
    (event: any, selectedDate?: Date) => {
      setShowPicker(Platform.OS === 'ios');
      if (event.type === 'dismissed') {
        return;
      }
      if (selectedDate) {
        onDateChange(selectedDate);
      }
    },
    [onDateChange]
  );

  return (
    <>
      <Pressable
        style={[
          styles.dateInput,
          { backgroundColor: colors.card, borderColor: colors.border },
          disabled && styles.disabledInput,
        ]}
        onPress={() => setShowPicker(true)}
        disabled={disabled}
        testID={testID}
      >
        <Text style={[styles.dateText, { color: textColor }]}>{displayText}</Text>
      </Pressable>
      {showPicker && (
        <DateTimePicker
          value={pickerValue}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
        />
      )}
    </>
  );
}

interface DateInputFieldProps {
  value: Date;
  onChange: (date: Date) => void;
  placeholder?: string;
  disabled?: boolean;
  formatDate: (date: Date) => string;
  testID?: string;
}

/**
 * A date picker field that shows a pressable button and inline modal.
 * Handles platform-specific date picker display.
 */
export function DateInputField({
  value,
  onChange,
  disabled = false,
  formatDate,
  testID,
}: DateInputFieldProps) {
  const { colors } = useTheme();

  return (
    <BaseDateInputField
      pickerValue={value}
      displayText={formatDate(value)}
      textColor={colors.text}
      onDateChange={onChange}
      disabled={disabled}
      testID={testID}
    />
  );
}

interface OptionalDateInputFieldProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  disabled?: boolean;
  formatDate: (date: Date) => string;
  testID?: string;
}

/**
 * A date picker field for optional dates (shows placeholder when null).
 */
export function OptionalDateInputField({
  value,
  onChange,
  placeholder = 'Optional',
  disabled = false,
  formatDate,
  testID,
}: OptionalDateInputFieldProps) {
  const { colors } = useTheme();

  return (
    <BaseDateInputField
      pickerValue={value || new Date()}
      displayText={value ? formatDate(value) : placeholder}
      textColor={value ? colors.text : colors.secondaryText}
      onDateChange={onChange}
      disabled={disabled}
      testID={testID}
    />
  );
}

const styles = StyleSheet.create({
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
  disabledInput: {
    opacity: 0.5,
  },
});
