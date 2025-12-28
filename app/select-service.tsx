import { CheckIcon, MagnifyingGlassIcon, PlusIcon } from 'phosphor-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { router, Stack, useLocalSearchParams } from 'expo-router';

import { Service, SERVICES } from '@/src/constants/services';
import { useCustomServices } from '@/src/features/services/useCustomServices';
import { useAppTheme } from '@/src/theme/useAppTheme';

// Union type for both predefined and custom services
type UnifiedService = Service & { isCustom?: boolean; color?: string; id?: string };

type RouteParams = {
  selectedService?: string;
  // Returned from add-service screen
  _newServiceName?: string;
  _newServiceCategory?: string;
};

export default function SelectServiceScreen() {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const params = useLocalSearchParams<RouteParams>();
  const selectedService = params.selectedService ?? '';

  const { customServices } = useCustomServices();

  const [search, setSearch] = useState('');

  // Combine predefined services with custom services (custom first for better discoverability)
  const allServices = useMemo((): UnifiedService[] => {
    const customAsUnified: UnifiedService[] = customServices.map((cs) => ({
      id: cs.id,
      name: cs.name,
      category: cs.category,
      isCustom: true,
      color: cs.color,
    }));
    return [...customAsUnified, ...SERVICES];
  }, [customServices]);

  const filteredServices = useMemo(() => {
    if (!search.trim()) return allServices;
    const term = search.toLowerCase().trim();
    return allServices.filter(
      (s) => s.name.toLowerCase().includes(term) || s.category.toLowerCase().includes(term)
    );
  }, [search, allServices]);

  const hasNoResults = filteredServices.length === 0 && search.trim().length > 0;

  const handleSelect = useCallback((service: UnifiedService) => {
    // Navigate back with selected service data using setParams on the previous screen
    router.navigate({
      pathname: '/(tabs)/(home)/subscription-editor',
      params: {
        _selectedServiceName: service.name,
        _selectedCategory: service.category,
      },
    });
  }, []);

  const handleOpenAddService = useCallback(() => {
    router.push({
      pathname: '/add-service',
      params: { serviceName: search.trim() },
    });
  }, [search]);

  // Handle newly created service returned from add-service screen
  React.useEffect(() => {
    if (params._newServiceName && params._newServiceCategory) {
      // Auto-select the newly created service and navigate to subscription editor
      setSearch('');
      router.navigate({
        pathname: '/(tabs)/(home)/subscription-editor',
        params: {
          _selectedServiceName: params._newServiceName,
          _selectedCategory: params._newServiceCategory,
        },
      });
    }
  }, [params._newServiceName, params._newServiceCategory]);

  const renderItem = useCallback(
    ({ item }: { item: UnifiedService }) => {
      const isSelected = item.name === selectedService;
      return (
        <Pressable
          onPress={() => handleSelect(item)}
          style={[styles.item, isSelected && styles.itemSelected]}
        >
          <View style={styles.serviceInfo}>
            {item.isCustom && item.color && (
              <View style={[styles.colorDot, { backgroundColor: item.color }]} />
            )}
            <Text style={styles.serviceName}>{item.name}</Text>
            <Text style={styles.serviceCategory}>{item.category}</Text>
            {item.isCustom && <Text style={styles.customBadge}>Custom</Text>}
          </View>
          {isSelected && <CheckIcon color={theme.colors.tint} size={20} weight="bold" />}
        </Pressable>
      );
    },
    [handleSelect, selectedService, styles, theme.colors.tint]
  );

  const keyExtractor = useCallback((item: UnifiedService) => {
    // Use id for custom services (guaranteed unique), name for predefined
    if (item.isCustom && item.id) {
      return `${item.name}-${item.id}-custom`;
    }
    return `${item.name}-predefined`;
  }, []);

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
          <Text style={styles.title}>Select Service</Text>
        </View>

        <View style={styles.searchContainer}>
          <MagnifyingGlassIcon color={theme.colors.secondaryText} size={18} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search services..."
            placeholderTextColor={theme.colors.secondaryText}
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
        </View>

        {hasNoResults ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No services found</Text>
            <Pressable style={styles.addButton} onPress={handleOpenAddService}>
              <PlusIcon color="#FFFFFF" size={18} weight="bold" />
              <Text style={styles.addButtonText}>Add "{search.trim()}"</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={filteredServices}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            style={styles.list}
            showsVerticalScrollIndicator={false}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={10}
          />
        )}
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
    serviceInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    colorDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
    },
    serviceName: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.text,
    },
    serviceCategory: {
      fontSize: 13,
      color: theme.colors.secondaryText,
    },
    customBadge: {
      fontSize: 10,
      fontWeight: '600',
      color: theme.colors.tint,
      backgroundColor: theme.isDark ? 'rgba(121,167,255,0.15)' : 'rgba(79,140,255,0.1)',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 32,
      gap: 16,
    },
    emptyText: {
      fontSize: 15,
      color: theme.colors.secondaryText,
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: theme.colors.tint,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 24,
    },
    addButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: '#FFFFFF',
    },
  });
}
