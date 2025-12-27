import { CheckIcon, MagnifyingGlassIcon } from 'phosphor-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
  ActionsheetItem,
  ActionsheetVirtualizedList,
} from '@/components/ui/actionsheet';
import { CURRENCIES, Currency } from '@/src/constants/currencies';
import { useAppTheme } from '@/src/theme/useAppTheme';

interface CurrencyPickerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCurrency: string;
  onSelect: (currencyCode: string) => void;
}

export function CurrencyPickerSheet({
  isOpen,
  onClose,
  selectedCurrency,
  onSelect,
}: CurrencyPickerSheetProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [search, setSearch] = useState('');

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
      setSearch('');
      onClose();
    },
    [onClose, onSelect]
  );

  const handleClose = useCallback(() => {
    setSearch('');
    onClose();
  }, [onClose]);

  const getItem = useCallback((data: unknown, index: number) => (data as Currency[])[index], []);

  const getItemCount = useCallback((data: unknown) => (data as Currency[]).length, []);

  const keyExtractor = useCallback((item: unknown) => (item as Currency).code, []);

  const renderItem = useCallback(
    ({ item }: { item: unknown }) => {
      const currency = item as Currency;
      const isSelected = currency.code === selectedCurrency;
      return (
        <ActionsheetItem
          onPress={() => handleSelect(currency)}
          style={[styles.item, isSelected && styles.itemSelected]}
        >
          <View style={styles.currencyInfo}>
            <Text style={styles.currencyCode}>{currency.code}</Text>
            <Text style={styles.currencyName}>{currency.name}</Text>
          </View>
          {isSelected && <CheckIcon color={theme.colors.tint} size={20} weight="bold" />}
        </ActionsheetItem>
      );
    },
    [handleSelect, selectedCurrency, styles, theme.colors.tint]
  );

  return (
    <Actionsheet isOpen={isOpen} onClose={handleClose}>
      <ActionsheetBackdrop />
      <ActionsheetContent style={styles.content}>
        <ActionsheetDragIndicatorWrapper>
          <ActionsheetDragIndicator />
        </ActionsheetDragIndicatorWrapper>

        <Text style={styles.title}>Select Currency</Text>

        <View style={styles.searchContainer}>
          <MagnifyingGlassIcon color={theme.colors.secondaryText} size={18} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search currencies..."
            placeholderTextColor={theme.colors.secondaryText}
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
        </View>

        <ActionsheetVirtualizedList
          data={filteredCurrencies}
          getItem={getItem}
          getItemCount={getItemCount}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          style={styles.list}
          showsVerticalScrollIndicator={false}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={10}
        />
      </ActionsheetContent>
    </Actionsheet>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>) {
  return StyleSheet.create({
    content: {
      maxHeight: '70%',
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
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: 14,
      backgroundColor: theme.isDark ? 'rgba(236,242,255,0.06)' : 'rgba(15,23,42,0.04)',
      marginBottom: 12,
      width: '100%',
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: theme.colors.text,
      padding: 0,
    },
    list: {
      width: '100%',
      maxHeight: 400,
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
    currencyInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    currencyCode: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.text,
    },
    currencyName: {
      fontSize: 13,
      color: theme.colors.secondaryText,
    },
  });
}
