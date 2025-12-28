import { CheckIcon, MagnifyingGlassIcon } from 'phosphor-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { router, Stack, useLocalSearchParams } from 'expo-router';

import { CURRENCIES, Currency } from '@/src/constants/currencies';
import { useAppTheme } from '@/src/theme/useAppTheme';

type RouteParams = {
  selectedCurrency?: string;
};

export default function SelectCurrencyScreen() {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const params = useLocalSearchParams<RouteParams>();
  const selectedCurrency = params.selectedCurrency ?? '';

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

  const handleSelect = useCallback((currency: Currency) => {
    router.navigate({
      pathname: '/(tabs)/(home)/subscription-editor',
      params: {
        _selectedCurrencyCode: currency.code,
      },
    });
  }, []);

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
    <>
      <Stack.Screen
        options={{
          presentation: 'formSheet',
          headerShown: false,
          sheetAllowedDetents: [0.7, 1],
          sheetGrabberVisible: true,
          sheetCornerRadius: 24,
        }}
      />

      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>Select Currency</Text>
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
    </>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.card,
      paddingHorizontal: 16,
    },
    header: {
      paddingTop: 20,
      paddingBottom: 16,
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.text,
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
