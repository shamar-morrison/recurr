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
import { Service, SERVICES } from '@/src/constants/services';
import { SubscriptionCategory } from '@/src/features/subscriptions/types';
import { useAppTheme } from '@/src/theme/useAppTheme';

interface ServicePickerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedService: string;
  onSelect: (serviceName: string, category: SubscriptionCategory) => void;
}

export function ServicePickerSheet({
  isOpen,
  onClose,
  selectedService,
  onSelect,
}: ServicePickerSheetProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [search, setSearch] = useState('');

  const filteredServices = useMemo(() => {
    if (!search.trim()) return SERVICES;
    const term = search.toLowerCase().trim();
    return SERVICES.filter(
      (s) => s.name.toLowerCase().includes(term) || s.category.toLowerCase().includes(term)
    );
  }, [search]);

  const handleSelect = useCallback(
    (service: Service) => {
      onSelect(service.name, service.category);
      setSearch('');
      onClose();
    },
    [onClose, onSelect]
  );

  const handleClose = useCallback(() => {
    setSearch('');
    onClose();
  }, [onClose]);

  const getItem = useCallback((data: unknown, index: number) => (data as Service[])[index], []);

  const getItemCount = useCallback((data: unknown) => (data as Service[]).length, []);

  const keyExtractor = useCallback(
    (item: unknown, index: number) => `${(item as Service).name}-${index}`,
    []
  );

  const renderItem = useCallback(
    ({ item }: { item: unknown }) => {
      const service = item as Service;
      const isSelected = service.name === selectedService;
      return (
        <ActionsheetItem
          onPress={() => handleSelect(service)}
          style={[styles.item, isSelected && styles.itemSelected]}
          className="active:bg-transparent hover:bg-transparent"
        >
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceName}>{service.name}</Text>
            <Text style={styles.serviceCategory}>{service.category}</Text>
          </View>
          {isSelected && <CheckIcon color={theme.colors.tint} size={20} weight="bold" />}
        </ActionsheetItem>
      );
    },
    [handleSelect, selectedService, styles, theme.colors.tint]
  );

  return (
    <Actionsheet isOpen={isOpen} onClose={handleClose}>
      <ActionsheetBackdrop />
      <ActionsheetContent style={styles.content}>
        <ActionsheetDragIndicatorWrapper>
          <ActionsheetDragIndicator />
        </ActionsheetDragIndicatorWrapper>

        <Text style={styles.title}>Select Service</Text>

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

        <ActionsheetVirtualizedList
          data={filteredServices}
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
    serviceInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
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
  });
}
