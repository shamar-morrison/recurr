import { CheckIcon, XIcon } from 'phosphor-react-native';
import React, { useCallback, useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BILLING_CYCLES, BillingCycle } from '@/src/features/subscriptions/types';
import { lightTheme } from '@/src/theme/useAppTheme';

type Props = {
  visible: boolean;
  selectedFrequency?: BillingCycle;
  onSelect: (frequency: BillingCycle) => void;
  onClose: () => void;
};

export function FrequencySelectorModal({
  visible,
  selectedFrequency = 'Monthly',
  onSelect,
  onClose,
}: Props) {
  const theme = lightTheme;
  const styles = useMemo(() => createStyles(), []);

  const handleSelect = useCallback(
    (frequency: BillingCycle) => {
      onSelect(frequency);
    },
    [onSelect]
  );

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
          <Text style={styles.title}>Select Frequency</Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <XIcon color={theme.colors.text} size={22} />
          </Pressable>
        </View>

        <View style={styles.list}>
          {BILLING_CYCLES.map((cycle) => {
            const isSelected = cycle === selectedFrequency;
            return (
              <Pressable
                key={cycle}
                onPress={() => handleSelect(cycle)}
                style={[styles.item, isSelected && styles.itemSelected]}
              >
                <View style={styles.frequencyInfo}>
                  <Text style={styles.frequencyName}>{cycle}</Text>
                </View>
                {isSelected && <CheckIcon color={theme.colors.tint} size={20} weight="bold" />}
              </Pressable>
            );
          })}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function createStyles() {
  const theme = lightTheme;

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
    frequencyInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    frequencyName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
    },
  });
}
