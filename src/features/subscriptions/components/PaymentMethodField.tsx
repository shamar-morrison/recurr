import { CaretDownIcon } from 'phosphor-react-native';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PAYMENT_METHOD_CONFIG, PaymentMethodModal } from '@/src/components/PaymentMethodModal';
import { BORDER_RADIUS, FONT_SIZE, SPACING } from '@/src/constants/theme';
import { useTheme } from '@/src/context/ThemeContext';
import { PaymentMethod } from '@/src/features/subscriptions/types';

interface PaymentMethodFieldProps {
  value: PaymentMethod | undefined;
  onChange: (method: PaymentMethod) => void;
  onClear: () => void;
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  disabled?: boolean;
}

/**
 * Payment method selection field with clear button and modal.
 */
export function PaymentMethodField({
  value,
  onChange,
  onClear,
  showModal,
  setShowModal,
  disabled = false,
}: PaymentMethodFieldProps) {
  const { colors } = useTheme();

  const PaymentMethodIcon = useMemo(() => {
    if (!value) return null;
    const config = PAYMENT_METHOD_CONFIG.find((c) => c.label === value);
    if (!config) return null;
    const IconComponent = config.icon;
    return <IconComponent color={colors.text} size={20} />;
  }, [value, colors]);

  return (
    <>
      <View style={styles.row}>
        <Text style={[styles.label, { color: colors.secondaryText }]}>Payment Method</Text>
        {value && (
          <Pressable
            onPress={onClear}
            disabled={disabled}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Text style={{ color: colors.secondaryText, fontSize: 13 }}>Clear</Text>
          </Pressable>
        )}
      </View>
      <Pressable
        style={[
          styles.dropdownButton,
          { backgroundColor: colors.card, borderColor: colors.border },
          disabled && styles.disabledInput,
        ]}
        onPress={() => setShowModal(true)}
        disabled={disabled}
        testID="subscriptionEditorPaymentMethod"
      >
        <View style={styles.iconRow}>
          {PaymentMethodIcon}
          <Text
            style={[styles.dropdownText, { color: value ? colors.text : colors.secondaryText }]}
          >
            {value || 'Select payment method'}
          </Text>
        </View>
        <CaretDownIcon color={colors.secondaryText} size={16} />
      </Pressable>

      <PaymentMethodModal
        visible={showModal}
        selectedMethod={value}
        onSelect={onChange}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  label: {
    textTransform: 'uppercase',
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    letterSpacing: 0.4,
    marginLeft: SPACING.xs,
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
