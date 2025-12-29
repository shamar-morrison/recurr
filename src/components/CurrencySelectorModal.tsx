import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text } from 'react-native';

import { AppColors } from '@/constants/colors';
import { BaseModal } from '@/src/components/ui/BaseModal';
import { BaseModalListItem } from '@/src/components/ui/BaseModalListItem';
import { CURRENCIES, Currency } from '@/src/constants/currencies';

type Props = {
  visible: boolean;
  selectedCurrency?: string;
  onSelect: (currencyCode: string) => void;
  onClose: () => void;
};

export function CurrencySelectorModal({
  visible,
  selectedCurrency = '',
  onSelect,
  onClose,
}: Props) {
  const [search, setSearch] = useState('');

  // Reset search when modal opens
  useEffect(() => {
    if (visible) {
      setSearch('');
    }
  }, [visible]);

  const filteredCurrencies = useMemo(() => {
    if (!search.trim()) return CURRENCIES;
    const term = search.toLowerCase().trim();
    return CURRENCIES.filter(
      (c) =>
        c.code.toLowerCase().includes(term) ||
        c.name.toLowerCase().includes(term) ||
        c.symbol.toLowerCase().includes(term)
    );
  }, [search]);

  const handleSelect = useCallback(
    (currency: Currency) => {
      onSelect(currency.code);
    },
    [onSelect]
  );

  const renderItem = useCallback(
    ({ item }: { item: Currency }) => {
      const isSelected = item.code === selectedCurrency;
      return (
        <BaseModalListItem
          label={item.code}
          sublabel={item.name}
          isSelected={isSelected}
          onPress={() => handleSelect(item)}
          leftElement={<Text style={styles.currencySymbol}>{item.symbol}</Text>}
        />
      );
    },
    [handleSelect, selectedCurrency]
  );

  const keyExtractor = useCallback((item: Currency) => item.code, []);

  return (
    <BaseModal
      visible={visible}
      title="Select Currency"
      onClose={onClose}
      showSearch
      searchPlaceholder="Search currencies..."
      searchValue={search}
      onSearchChange={setSearch}
    >
      <FlatList
        data={filteredCurrencies}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        style={styles.list}
        showsVerticalScrollIndicator={false}
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        windowSize={10}
      />
    </BaseModal>
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.tint,
    width: 28,
    textAlign: 'center',
  },
});
