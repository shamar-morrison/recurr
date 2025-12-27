import { CheckIcon } from 'phosphor-react-native';
import React, { useCallback, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
  ActionsheetItem,
} from '@/components/ui/actionsheet';
import { BILLING_CYCLES, BillingCycle } from '@/src/features/subscriptions/types';
import { useAppTheme } from '@/src/theme/useAppTheme';

interface FrequencyPickerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFrequency: BillingCycle;
  onSelect: (frequency: BillingCycle) => void;
}

export function FrequencyPickerSheet({
  isOpen,
  onClose,
  selectedFrequency,
  onSelect,
}: FrequencyPickerSheetProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const handleSelect = useCallback(
    (frequency: BillingCycle) => {
      onSelect(frequency);
      onClose();
    },
    [onClose, onSelect]
  );

  return (
    <Actionsheet isOpen={isOpen} onClose={onClose}>
      <ActionsheetBackdrop />
      <ActionsheetContent style={styles.content}>
        <ActionsheetDragIndicatorWrapper>
          <ActionsheetDragIndicator />
        </ActionsheetDragIndicatorWrapper>

        <Text style={styles.title}>Select Frequency</Text>

        <View style={styles.list}>
          {BILLING_CYCLES.map((cycle) => {
            const isSelected = cycle === selectedFrequency;
            return (
              <ActionsheetItem
                key={cycle}
                onPress={() => handleSelect(cycle)}
                style={[styles.item, isSelected && styles.itemSelected]}
                className="active:bg-transparent hover:bg-transparent"
              >
                <View style={styles.frequencyInfo}>
                  <Text style={styles.frequencyName}>{cycle}</Text>
                </View>
                {isSelected && <CheckIcon color={theme.colors.tint} size={20} weight="bold" />}
              </ActionsheetItem>
            );
          })}
        </View>
      </ActionsheetContent>
    </Actionsheet>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>) {
  return StyleSheet.create({
    content: {
      backgroundColor: theme.colors.card,
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.text,
      marginTop: 8,
      marginBottom: 16,
      textAlign: 'center',
    },
    list: {
      width: '100%',
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
      backgroundColor: theme.isDark ? 'rgba(121,167,255,0.12)' : 'rgba(79,140,255,0.08)',
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
