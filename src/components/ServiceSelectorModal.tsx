import { LegendList } from '@legendapp/list';
import { CheckIcon, MagnifyingGlassIcon, PlusIcon, XIcon } from 'phosphor-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SERVICE_COLORS } from '@/src/constants/customServices';
import { Service, SERVICES } from '@/src/constants/services';
import { useCustomServices } from '@/src/features/services/useCustomServices';
import { SUBSCRIPTION_CATEGORIES, SubscriptionCategory } from '@/src/features/subscriptions/types';
import { getFirestoreErrorMessage } from '@/src/lib/firestore';
import { lightTheme } from '@/src/theme/useAppTheme';

// Union type for both predefined and custom services
type UnifiedService = Service & { isCustom?: boolean; color?: string; id?: string };

export type ServiceSelection = {
  name: string;
  category: SubscriptionCategory;
};

type Props = {
  visible: boolean;
  selectedService?: string;
  onSelect: (service: ServiceSelection) => void;
  onClose: () => void;
};

export function ServiceSelectorModal({ visible, selectedService = '', onSelect, onClose }: Props) {
  const theme = lightTheme;
  const styles = useMemo(() => createStyles(), []);

  const {
    customServices,
    isLoading: isLoadingCustomServices,
    addService: addCustomService,
  } = useCustomServices();

  const [search, setSearch] = useState('');

  // State for switching between list view and add service view
  const [showAddMode, setShowAddMode] = useState(false);
  const [editableName, setEditableName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SubscriptionCategory>('Other');
  const [selectedColor, setSelectedColor] = useState<string>(SERVICE_COLORS[1]);
  const [isSaving, setIsSaving] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setSearch('');
      setShowAddMode(false);
      setEditableName('');
      setSelectedCategory('Other');
      setSelectedColor(SERVICE_COLORS[1]);
    }
  }, [visible]);

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

  const handleSelect = useCallback(
    (service: UnifiedService) => {
      onSelect({ name: service.name, category: service.category });
    },
    [onSelect]
  );

  const handleOpenAddMode = useCallback(() => {
    setEditableName(search.trim());
    setSelectedCategory('Other');
    setSelectedColor(SERVICE_COLORS[1]);
    setShowAddMode(true);
  }, [search]);

  const handleCancelAddMode = useCallback(() => {
    setShowAddMode(false);
    setEditableName('');
    setSelectedCategory('Other');
    setSelectedColor(SERVICE_COLORS[1]);
  }, []);

  const handleSaveCustomService = useCallback(async () => {
    const trimmedName = editableName.trim();
    if (!trimmedName) return;

    // Check for duplicate names (case-insensitive)
    const lowerName = trimmedName.toLowerCase();
    const existingService = allServices.find((s) => s.name.toLowerCase() === lowerName);

    if (existingService) {
      const serviceType = existingService.isCustom ? 'custom' : 'predefined';
      Alert.alert(
        'Service Already Exists',
        `A ${serviceType} service named "${existingService.name}" already exists. Please choose a different name.`,
        [{ text: 'OK' }]
      );
      return;
    }

    setIsSaving(true);
    try {
      const newService = await addCustomService({
        name: trimmedName,
        category: selectedCategory,
        color: selectedColor,
      });

      if (!newService) return;

      onSelect({ name: newService.name, category: newService.category });
    } catch (error) {
      console.error(error);
      Alert.alert('Failed to Create Service', getFirestoreErrorMessage(error), [{ text: 'OK' }]);
    } finally {
      setIsSaving(false);
    }
  }, [editableName, selectedCategory, selectedColor, addCustomService, allServices, onSelect]);

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
    if (item.isCustom && item.id) {
      return `${item.name}-${item.id}-custom`;
    }
    return `${item.name}-predefined`;
  }, []);

  const isValidName = editableName.trim().length > 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {showAddMode ? (
          // ========== ADD SERVICE VIEW ==========
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollViewContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <TouchableOpacity activeOpacity={1}>
              <View style={styles.header}>
                <View style={styles.headerSpacer} />
                <Text style={styles.title}>Add Custom Service</Text>
                <Pressable onPress={handleCancelAddMode} style={styles.closeButton}>
                  <XIcon color={theme.colors.text} size={22} />
                </Pressable>
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Service Name</Text>
                <TextInput
                  value={editableName}
                  onChangeText={setEditableName}
                  placeholder="Enter service name"
                  placeholderTextColor={theme.colors.secondaryText}
                  style={styles.nameInput}
                  autoCapitalize="words"
                  autoCorrect={false}
                  autoFocus
                />
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Category</Text>
                <View style={styles.categoryGrid}>
                  {SUBSCRIPTION_CATEGORIES.map((category) => {
                    const isSelected = category === selectedCategory;
                    return (
                      <Pressable
                        key={category}
                        style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}
                        onPress={() => setSelectedCategory(category)}
                      >
                        <Text
                          style={[styles.categoryText, isSelected && styles.categoryTextSelected]}
                        >
                          {category}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Color</Text>
                <View style={styles.colorGrid}>
                  {SERVICE_COLORS.map((color) => {
                    const isColorSelected = color === selectedColor;
                    return (
                      <Pressable
                        key={color}
                        style={[styles.colorSwatch, { backgroundColor: color }]}
                        onPress={() => setSelectedColor(color)}
                      >
                        {isColorSelected && <CheckIcon color="#FFFFFF" size={20} weight="bold" />}
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.buttonRow}>
                <Pressable
                  style={styles.cancelButton}
                  onPress={handleCancelAddMode}
                  disabled={isSaving}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.saveButton,
                    (!isValidName || isSaving) && styles.saveButtonDisabled,
                  ]}
                  onPress={handleSaveCustomService}
                  disabled={!isValidName || isSaving}
                >
                  <Text style={styles.saveButtonText}>{isSaving ? 'Saving...' : 'Create'}</Text>
                </Pressable>
              </View>
            </TouchableOpacity>
          </ScrollView>
        ) : (
          // ========== SERVICE LIST VIEW ==========
          <>
            <View style={styles.header}>
              <View style={styles.headerSpacer} />
              <Text style={styles.title}>Select Service</Text>
              <Pressable onPress={onClose} style={styles.closeButton}>
                <XIcon color={theme.colors.text} size={22} />
              </Pressable>
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
                <Pressable style={styles.addButton} onPress={handleOpenAddMode}>
                  <PlusIcon color="#FFFFFF" size={18} weight="bold" />
                  <Text style={styles.addButtonText}>Add "{search.trim()}"</Text>
                </Pressable>
              </View>
            ) : (
              <>
                {isLoadingCustomServices && (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator size="small" color={theme.colors.tint} />
                    <Text style={styles.loadingText}>Loading custom services…</Text>
                  </View>
                )}
                <LegendList
                  data={filteredServices}
                  keyExtractor={keyExtractor}
                  renderItem={renderItem}
                  style={styles.list}
                  showsVerticalScrollIndicator={false}
                  recycleItems
                  extraData={customServices}
                />
              </>
            )}
          </>
        )}
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
    scrollView: {
      flex: 1,
    },
    scrollViewContent: {
      flexGrow: 1,
      paddingBottom: 40,
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
      backgroundColor: 'rgba(79,140,255,0.1)',
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
    section: {
      marginBottom: 20,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.secondaryText,
      marginBottom: 10,
    },
    nameInput: {
      backgroundColor: 'rgba(15,23,42,0.04)',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderRadius: 12,
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
    },
    categoryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    categoryChip: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
      backgroundColor: 'rgba(15,23,42,0.04)',
    },
    categoryChipSelected: {
      backgroundColor: theme.colors.tint,
    },
    categoryText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.secondaryText,
    },
    categoryTextSelected: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
    colorGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    colorSwatch: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonRow: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 8,
    },
    cancelButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: 'rgba(15,23,42,0.04)',
      alignItems: 'center',
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.secondaryText,
    },
    saveButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: theme.colors.tint,
      alignItems: 'center',
    },
    saveButtonDisabled: {
      opacity: 0.5,
    },
    saveButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    loadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 12,
      paddingHorizontal: 12,
    },
    loadingText: {
      fontSize: 14,
      color: theme.colors.secondaryText,
    },
  });
}
