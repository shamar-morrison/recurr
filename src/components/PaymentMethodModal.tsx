import {
  AppleLogoIcon,
  BankIcon,
  CoinsIcon,
  CreditCardIcon,
  GoogleLogoIcon,
  MoneyIcon,
  PaypalLogoIcon,
  WalletIcon,
} from 'phosphor-react-native';
import React, { useCallback } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { AppColors } from '@/constants/colors';
import { BaseModal } from '@/src/components/ui/BaseModal';
import { BaseModalListItem } from '@/src/components/ui/BaseModalListItem';
import { PaymentMethod } from '@/src/features/subscriptions/types';

type PaymentMethodConfig = {
  label: PaymentMethod;
  icon: React.ComponentType<{ color: string; size: number; weight?: 'regular' | 'fill' }>;
};

export const PAYMENT_METHOD_CONFIG: PaymentMethodConfig[] = [
  { label: 'Credit Card', icon: CreditCardIcon },
  { label: 'Debit Card', icon: WalletIcon },
  { label: 'PayPal', icon: PaypalLogoIcon },
  { label: 'Apple Pay', icon: AppleLogoIcon },
  { label: 'Google Pay', icon: GoogleLogoIcon },
  { label: 'Bank Transfer', icon: BankIcon },
  { label: 'Cash', icon: MoneyIcon },
  { label: 'Other', icon: CoinsIcon },
];

type Props = {
  visible: boolean;
  selectedMethod?: PaymentMethod;
  onSelect: (method: PaymentMethod) => void;
  onClose: () => void;
};

export function PaymentMethodModal({ visible, selectedMethod, onSelect, onClose }: Props) {
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
          const IconComponent = config.icon;
          return (
            <BaseModalListItem
              key={config.label}
              label={config.label}
              isSelected={isSelected}
              onPress={() => handleSelect(config.label)}
              leftElement={
                <IconComponent
                  color={isSelected ? AppColors.tint : AppColors.text}
                  size={24}
                  weight={isSelected ? 'fill' : 'regular'}
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
