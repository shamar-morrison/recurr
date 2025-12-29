import React, { useCallback } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { BaseModal } from '@/src/components/ui/BaseModal';
import { BaseModalListItem } from '@/src/components/ui/BaseModalListItem';
import { SPACING } from '@/src/constants/theme';
import { BILLING_CYCLES, BillingCycle } from '@/src/features/subscriptions/types';

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
  const handleSelect = useCallback(
    (frequency: BillingCycle) => {
      onSelect(frequency);
    },
    [onSelect]
  );

  return (
    <BaseModal visible={visible} title="Select Frequency" onClose={onClose}>
      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {BILLING_CYCLES.map((cycle) => {
          const isSelected = cycle === selectedFrequency;
          return (
            <BaseModalListItem
              key={cycle}
              label={cycle}
              isSelected={isSelected}
              onPress={() => handleSelect(cycle)}
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
    paddingBottom: SPACING.xl,
  },
});
