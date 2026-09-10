import {
  AppleIcon,
  BankIcon,
  CoinsIcon,
  CreditCardIcon,
  GoogleIcon,
  Money01Icon,
  PaypalIcon,
  Wallet01Icon,
} from '@hugeicons/core-free-icons';
import type { IconSvgElement } from '@hugeicons/react-native';
import React, { useCallback } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { BaseModal } from '@/src/components/ui/BaseModal';
import { BaseModalListItem } from '@/src/components/ui/BaseModalListItem';
import { AppIcon } from '@/src/components/ui/AppIcon';
import { useTheme } from '@/src/context/ThemeContext';
import { PaymentMethod } from '@/src/features/subscriptions/types';

type PaymentMethodConfig = {
  label: PaymentMethod;
  icon: IconSvgElement;
};

export const PAYMENT_METHOD_CONFIG: PaymentMethodConfig[] = [
  { label: 'Credit Card', icon: CreditCardIcon },
  { label: 'Debit Card', icon: Wallet01Icon },
  { label: 'PayPal', icon: PaypalIcon },
  { label: 'Apple Pay', icon: AppleIcon },
  { label: 'Google Pay', icon: GoogleIcon },
  { label: 'Bank Transfer', icon: BankIcon },
  { label: 'Cash', icon: Money01Icon },
  { label: 'Other', icon: CoinsIcon },
];

type Props = {
  visible: boolean;
  selectedMethod?: PaymentMethod;
  onSelect: (method: PaymentMethod) => void;
  onClose: () => void;
};

export function PaymentMethodModal({ visible, selectedMethod, onSelect, onClose }: Props) {
  const { colors } = useTheme();

  const handleSelect = useCallback(
    (method: PaymentMethod) => {
      onSelect(method);
      onClose();
    },
    [onSelect, onClose]
  );

  return (
    <BaseModal visible={visible} title="Payment Method" onClose={onClose}>
      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {PAYMENT_METHOD_CONFIG.map((config) => {
          const isSelected = config.label === selectedMethod;
          const selectedColor = isSelected ? colors.tint : colors.text;
          return (
            <BaseModalListItem
              key={config.label}
              label={config.label}
              isSelected={isSelected}
              onPress={() => handleSelect(config.label)}
              leftElement={
                <AppIcon
                  icon={config.icon}
                  color={selectedColor}
                  size={24}
                  fill={isSelected ? selectedColor : 'transparent'}
                />
              }
            />
          );
        })}
      </ScrollView>
    </BaseModal>
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
});
