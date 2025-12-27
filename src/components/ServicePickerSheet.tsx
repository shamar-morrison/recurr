import { CheckIcon, MagnifyingGlassIcon, PlusIcon } from 'phosphor-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
  ActionsheetItem,
  ActionsheetVirtualizedList,
} from '@/components/ui/actionsheet';
import { AddServiceSheet } from '@/src/components/AddServiceSheet';
import { CustomService, CustomServiceInput } from '@/src/constants/customServices';
import { Service, SERVICES } from '@/src/constants/services';
import { SubscriptionCategory } from '@/src/features/subscriptions/types';
import { useAppTheme } from '@/src/theme/useAppTheme';

// Union type for both predefined and custom services
type UnifiedService = Service & { isCustom?: boolean; color?: string };

interface ServicePickerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedService: string;
  onSelect: (serviceName: string, category: SubscriptionCategory) => void;
  customServices?: CustomService[];
  onAddCustomService?: (input: CustomServiceInput) => Promise<CustomService | null>;
}

export function ServicePickerSheet({
  isOpen,
  onClose,
  selectedService,
  onSelect,
  customServices = [],
  onAddCustomService,
}: ServicePickerSheetProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [search, setSearch] = useState('');
  const [showAddSheet, setShowAddSheet] = useState(false);

  // Combine predefined services with custom services
  const allServices = useMemo((): UnifiedService[] => {
    const customAsUnified: UnifiedService[] = customServices.map((cs) => ({
      name: cs.name,
      category: cs.category,
      isCustom: true,
      color: cs.color,
    }));
    return [...SERVICES, ...customAsUnified];
  }, [customServices]);

  const filteredServices = useMemo(() => {
    if (!search.trim()) return allServices;
    const term = search.toLowerCase().trim();
    return allServices.filter(
      (s) => s.name.toLowerCase().includes(term) || s.category.toLowerCase().includes(term)
    );
  }, [search, allServices]);

  const hasNoResults = filteredServices.length === 0 && search.trim().length > 0;

  const handleSelect = useCallback(
    (service: UnifiedService) => {
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

  const handleOpenAddSheet = useCallback(() => {
    setShowAddSheet(true);
  }, []);

  const handleCloseAddSheet = useCallback(() => {
    setShowAddSheet(false);
  }, []);

  const handleSaveCustomService = useCallback(
    async (input: CustomServiceInput) => {
      if (!onAddCustomService) return;

      const newService = await onAddCustomService(input);
      if (newService) {
        // Auto-select the newly created service
        onSelect(newService.name, newService.category);
        setSearch('');
        setShowAddSheet(false);
        onClose();
      }
    },
    [onAddCustomService, onSelect, onClose]
  );

  const getItem = useCallback(
    (data: unknown, index: number) => (data as UnifiedService[])[index],
    []
  );

  const getItemCount = useCallback((data: unknown) => (data as UnifiedService[]).length, []);

  const keyExtractor = useCallback((item: unknown, index: number) => {
    const service = item as UnifiedService;
    return `${service.name}-${service.isCustom ? 'custom' : 'predefined'}-${index}`;
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: unknown }) => {
      const service = item as UnifiedService;
      const isSelected = service.name === selectedService;
      return (
        <ActionsheetItem
          onPress={() => handleSelect(service)}
          style={[styles.item, isSelected && styles.itemSelected]}
          className="active:bg-transparent hover:bg-transparent"
        >
          <View style={styles.serviceInfo}>
            {service.isCustom && service.color && (
              <View style={[styles.colorDot, { backgroundColor: service.color }]} />
            )}
            <Text style={styles.serviceName}>{service.name}</Text>
            <Text style={styles.serviceCategory}>{service.category}</Text>
            {service.isCustom && <Text style={styles.customBadge}>Custom</Text>}
          </View>
          {isSelected && <CheckIcon color={theme.colors.tint} size={20} weight="bold" />}
        </ActionsheetItem>
      );
    },
    [handleSelect, selectedService, styles, theme.colors.tint]
  );

  return (
    <>
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

          {hasNoResults ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No services found</Text>
              {onAddCustomService && (
                <Pressable style={styles.addButton} onPress={handleOpenAddSheet}>
                  <PlusIcon color="#FFFFFF" size={18} weight="bold" />
                  <Text style={styles.addButtonText}>Add "{search.trim()}"</Text>
                </Pressable>
              )}
            </View>
          ) : (
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
          )}
        </ActionsheetContent>
      </Actionsheet>

      <AddServiceSheet
        isOpen={showAddSheet}
        onClose={handleCloseAddSheet}
        serviceName={search.trim()}
        onSave={handleSaveCustomService}
      />
    </>
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
