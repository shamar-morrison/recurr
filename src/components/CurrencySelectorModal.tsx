import { CheckIcon, MagnifyingGlassIcon, XIcon } from 'phosphor-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CURRENCIES, Currency } from '@/src/constants/currencies';
import { lightTheme } from '@/src/theme/useAppTheme';

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
  const theme = lightTheme;
  const styles = useMemo(() => createStyles(), []);

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
        <Pressable
          onPress={() => handleSelect(item)}
          style={[styles.item, isSelected && styles.itemSelected]}
        >
          <View style={styles.currencyInfo}>
            <Text style={styles.currencyCode}>{item.code}</Text>
            <Text style={styles.currencyName}>{item.name}</Text>
          </View>
          {isSelected && <CheckIcon color={theme.colors.tint} size={20} weight="bold" />}
        </Pressable>
      );
    },
    [handleSelect, selectedCurrency, styles, theme.colors.tint]
  );

  const keyExtractor = useCallback((item: Currency) => item.code, []);

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
          <Text style={styles.title}>Select Currency</Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <XIcon color={theme.colors.text} size={22} />
          </Pressable>
        </View>

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
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: 14,
      backgroundColor: 'rgba(15,23,42,0.04)',
      marginBottom: 12,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: theme.colors.text,
      padding: 0,
    },
    list: {
      flex: 1,
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
