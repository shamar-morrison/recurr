import { LegendList } from '@legendapp/list';
import { CheckIcon, PlusIcon, XIcon } from 'phosphor-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
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

import { AppColors } from '@/constants/colors';
import { ServiceLogo } from '@/src/components/ServiceLogo';
import { BaseModal } from '@/src/components/ui/BaseModal';
import { BaseModalListItem } from '@/src/components/ui/BaseModalListItem';
import { SERVICE_COLORS } from '@/src/constants/customServices';
import { Service, SERVICES } from '@/src/constants/services';
import { BORDER_RADIUS, FONT_SIZE, SPACING } from '@/src/constants/theme';
import { useCustomServices } from '@/src/features/services/useCustomServices';
import { SUBSCRIPTION_CATEGORIES, SubscriptionCategory } from '@/src/features/subscriptions/types';
import { getFirestoreErrorMessage } from '@/src/lib/firestore';

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
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setSearch('');
      setShowAddMode(false);
      setEditableName('');
      setSelectedCategory('Other');
      setSelectedColor(SERVICE_COLORS[1]);
      setWebsiteUrl('');
      setNotes('');
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
    setWebsiteUrl('');
    setNotes('');
    setShowAddMode(true);
  }, [search]);

  const handleCancelAddMode = useCallback(() => {
    setShowAddMode(false);
    setEditableName('');
    setSelectedCategory('Other');
    setSelectedColor(SERVICE_COLORS[1]);
    setWebsiteUrl('');
    setNotes('');
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
        websiteUrl: websiteUrl.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      if (!newService) return;

      onSelect({ name: newService.name, category: newService.category });
    } catch (error) {
      console.error(error);
      Alert.alert('Failed to Create Service', getFirestoreErrorMessage(error), [{ text: 'OK' }]);
    } finally {
      setIsSaving(false);
    }
  }, [
    editableName,
    selectedCategory,
    selectedColor,
    websiteUrl,
    notes,
    addCustomService,
    allServices,
    onSelect,
  ]);

  const renderItem = useCallback(
    ({ item }: { item: UnifiedService }) => {
      const isSelected = item.name === selectedService;

      const leftElement = (
        <View>
          <ServiceLogo serviceName={item.name} domain={item.domain} size={32} borderRadius={8} />
        </View>
      );

      const rightElement = isSelected ? undefined : item.isCustom ? (
        <Text style={styles.customBadge}>Custom</Text>
      ) : null;

      return (
        <BaseModalListItem
          label={item.name}
          sublabel={item.category}
          isSelected={isSelected}
          onPress={() => handleSelect(item)}
          leftElement={leftElement}
          rightElement={rightElement}
        />
      );
    },
    [handleSelect, selectedService]
  );

  const keyExtractor = useCallback((item: UnifiedService) => {
    if (item.isCustom && item.id) {
      return `${item.name}-${item.id}-custom`;
    }
    return `${item.name}-predefined`;
  }, []);

  const isValidName = editableName.trim().length > 0;

  // Render Add Custom Service Mode in a separate modal
  if (showAddMode) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={handleCancelAddMode}
      >
        <SafeAreaView style={styles.addModeContainer} edges={['top', 'bottom']}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollViewContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <TouchableOpacity activeOpacity={1} onPress={Keyboard.dismiss}>
              <View style={styles.header}>
                <View style={styles.headerSpacer} />
                <Text style={styles.title}>Add Custom Service</Text>
                <Pressable onPress={handleCancelAddMode} style={styles.closeButton}>
                  <XIcon color={AppColors.text} size={22} />
                </Pressable>
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Service Name</Text>
                <TextInput
                  value={editableName}
                  onChangeText={setEditableName}
                  placeholder="Enter service name"
                  placeholderTextColor={AppColors.secondaryText}
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
                    const isCategorySelected = category === selectedCategory;
                    return (
                      <Pressable
                        key={category}
                        style={[
                          styles.categoryChip,
                          isCategorySelected && styles.categoryChipSelected,
                        ]}
                        onPress={() => setSelectedCategory(category)}
                      >
                        <Text
                          style={[
                            styles.categoryText,
                            isCategorySelected && styles.categoryTextSelected,
                          ]}
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

              <View style={styles.section}>
                <Text style={styles.label}>Website Link (optional)</Text>
                <TextInput
                  value={websiteUrl}
                  onChangeText={setWebsiteUrl}
                  placeholder="https://example.com"
                  placeholderTextColor={AppColors.secondaryText}
                  style={styles.nameInput}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Notes (optional)</Text>
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Add any notes about this service..."
                  placeholderTextColor={AppColors.secondaryText}
                  style={[styles.nameInput, styles.notesInput]}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
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
        </SafeAreaView>
      </Modal>
    );
  }

  return (
    <BaseModal
      visible={visible}
      title="Select Service"
      onClose={onClose}
      showSearch
      searchPlaceholder="Search services..."
      searchValue={search}
      onSearchChange={setSearch}
    >
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
              <ActivityIndicator size="small" color={AppColors.tint} />
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
    </BaseModal>
  );
}

const styles = StyleSheet.create({
  // Add Mode Styles
  addModeContainer: {
    flex: 1,
    backgroundColor: AppColors.background,
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
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.lg,
  },
  headerSpacer: {
    width: 40,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: AppColors.text,
    textAlign: 'center',
    flex: 1,
    letterSpacing: -0.3,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.tertiaryBackground,
  },
  // List Styles
  list: {
    flex: 1,
  },
  customBadge: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    color: AppColors.tint,
    backgroundColor: AppColors.badgeBackground,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.xs,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxxl,
    gap: SPACING.lg,
  },
  emptyText: {
    fontSize: FONT_SIZE.lg,
    color: AppColors.secondaryText,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: AppColors.tint,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.xxxl,
  },
  addButtonText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Add Service Form Styles
  section: {
    marginBottom: SPACING.xl,
  },
  label: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: AppColors.secondaryText,
    marginBottom: SPACING.md,
  },
  nameInput: {
    backgroundColor: AppColors.inputBackground,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: AppColors.text,
  },
  notesInput: {
    minHeight: 80,
    paddingTop: SPACING.md,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  categoryChip: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.xxl,
    backgroundColor: AppColors.inputBackground,
  },
  categoryChipSelected: {
    backgroundColor: AppColors.tint,
  },
  categoryText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
    color: AppColors.secondaryText,
  },
  categoryTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  colorSwatch: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: AppColors.inputBackground,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: AppColors.secondaryText,
  },
  saveButton: {
    flex: 1,
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: AppColors.tint,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  loadingText: {
    fontSize: FONT_SIZE.md,
    color: AppColors.secondaryText,
  },
});
