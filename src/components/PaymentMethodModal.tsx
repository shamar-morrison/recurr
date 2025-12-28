import { CheckIcon, XIcon } from 'phosphor-react-native';
import React, { useCallback, useMemo } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors } from '@/constants/colors';
import {
  AppleLogoIcon,
  BankIcon,
  CreditCardIcon,
  DotsThreeCircleIcon,
  GoogleLogoIcon,
  MoneyIcon,
  PaypalLogoIcon,
  WalletIcon,
} from 'phosphor-react-native';

export type PaymentMethod =
  | 'Credit Card'
  | 'Debit Card'
  | 'PayPal'
  | 'Apple Pay'
  | 'Google Pay'
  | 'Bank Transfer'
  | 'Cash'
  | 'Other';

export const PAYMENT_METHODS: PaymentMethod[] = [
  'Credit Card',
  'Debit Card',
  'PayPal',
  'Apple Pay',
  'Google Pay',
  'Bank Transfer',
  'Cash',
  'Other',
];

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
  { label: 'Other', icon: DotsThreeCircleIcon },
];

type Props = {
  visible: boolean;
  selectedMethod?: PaymentMethod;
  onSelect: (method: PaymentMethod) => void;
  onClose: () => void;
};

export function PaymentMethodModal({ visible, selectedMethod, onSelect, onClose }: Props) {
  const theme = { colors: AppColors };
  const styles = useMemo(() => createStyles(), []);

  const handleSelect = useCallback(
    (method: PaymentMethod) => {
      onSelect(method);
      onClose();
    },
    [onSelect, onClose]
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <Text style={styles.title}>Payment Method</Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <XIcon color={theme.colors.text} size={22} />
          </Pressable>
        </View>

        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {PAYMENT_METHOD_CONFIG.map((config) => {
            const isSelected = config.label === selectedMethod;
            const IconComponent = config.icon;
            return (
              <Pressable
                key={config.label}
                onPress={() => handleSelect(config.label)}
                style={[styles.item, isSelected && styles.itemSelected]}
              >
                <View style={styles.methodInfo}>
                  <IconComponent
                    color={isSelected ? theme.colors.tint : theme.colors.text}
                    size={24}
                    weight={isSelected ? 'fill' : 'regular'}
                  />
                  <Text style={[styles.methodName, isSelected && styles.methodNameSelected]}>
                    {config.label}
                  </Text>
                </View>
                {isSelected && <CheckIcon color={theme.colors.tint} size={20} weight="bold" />}
              </Pressable>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function createStyles() {
  const theme = { colors: AppColors };

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.card,
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
      color: theme.colors.text,
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
    list: {
      flex: 1,
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 16,
      paddingHorizontal: 16,
      borderRadius: 16,
      marginBottom: 8,
      backgroundColor: '#fff',
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: '#000',
      shadowOpacity: 0.04,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
    },
    itemSelected: {
      backgroundColor: 'rgba(79,140,255,0.08)',
      borderColor: theme.colors.tint,
    },
    methodInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    methodName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
    },
    methodNameSelected: {
      color: theme.colors.tint,
    },
  });
}
