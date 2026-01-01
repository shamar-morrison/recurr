import { CheckIcon, PencilSimpleIcon, PlusIcon } from 'phosphor-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CustomService, CustomServiceInput, SERVICE_COLORS } from '@/src/constants/customServices';
import { BORDER_RADIUS, FONT_SIZE, SPACING } from '@/src/constants/theme';
import { useTheme } from '@/src/context/ThemeContext';
import { useCategories } from '@/src/features/subscriptions/hooks';
import { SubscriptionCategory } from '@/src/features/subscriptions/types';

const MAX_NAME_LENGTH = 100;

interface ServiceEditorModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (input: CustomServiceInput) => Promise<unknown>;
  existingServiceNames: string[];
  /** If provided, the modal enters edit mode for this service */
  editingService?: CustomService | null;
}

/**
 * Modal for creating or editing a custom service with color picker and category selector.
 * Validates input and prevents duplicates.
 */
export function ServiceEditorModal({
  visible,
  onClose,
  onSave,
  existingServiceNames,
  editingService,
}: ServiceEditorModalProps) {
  const { colors } = useTheme();
  const { allCategories } = useCategories();

  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState<string>(SERVICE_COLORS[0]);
  const [selectedCategory, setSelectedCategory] = useState<SubscriptionCategory>('Other');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const isEditMode = Boolean(editingService);

  // Pre-fill form when editing
  useEffect(() => {
    if (visible && editingService) {
      setName(editingService.name);
      setSelectedColor(editingService.color);
      setSelectedCategory(editingService.category);
      setWebsiteUrl(editingService.websiteUrl ?? '');
    } else if (visible && !editingService) {
      setName('');
      setSelectedColor(SERVICE_COLORS[0]);
      setSelectedCategory('Other');
      setWebsiteUrl('');
    }
  }, [visible, editingService]);

  const trimmedName = name.trim();
  const charCount = trimmedName.length;

  const handleSave = useCallback(async () => {
    if (!trimmedName) {
      Alert.alert('Invalid Name', 'Please enter a service name.');
      return;
    }

    if (trimmedName.length > MAX_NAME_LENGTH) {
      Alert.alert('Name Too Long', `Service name must be ${MAX_NAME_LENGTH} characters or less.`);
      return;
    }

    // Check for duplicates (case-insensitive), excluding current service when editing
    const isDuplicate = existingServiceNames.some((serviceName) => {
      const isMatch = serviceName.toLowerCase() === trimmedName.toLowerCase();
      // When editing, allow the same name (user might just change color/category)
      if (isEditMode && editingService) {
        return isMatch && serviceName.toLowerCase() !== editingService.name.toLowerCase();
      }
      return isMatch;
    });

    if (isDuplicate) {
      Alert.alert('Duplicate Service', 'A service with this name already exists.');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        name: trimmedName,
        color: selectedColor,
        category: selectedCategory,
        websiteUrl: websiteUrl.trim() || undefined,
      });
      handleClose();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      Alert.alert('Error', msg);
    } finally {
      setIsSaving(false);
    }
  }, [
    trimmedName,
    selectedColor,
    selectedCategory,
    websiteUrl,
    existingServiceNames,
    isEditMode,
    editingService,
    onSave,
  ]);

  const handleClose = useCallback(() => {
    if (isSaving) return;
    setName('');
    setSelectedColor(SERVICE_COLORS[0]);
    setSelectedCategory('Other');
    setWebsiteUrl('');
    onClose();
  }, [isSaving, onClose]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea}>
          <View style={[styles.container, { backgroundColor: colors.card }]}>
            <View style={styles.header}>
              <View style={[styles.iconContainer, { backgroundColor: selectedColor }]}>
                {isEditMode ? (
                  <PencilSimpleIcon color="#fff" size={24} weight="bold" />
                ) : (
                  <PlusIcon color="#fff" size={24} weight="bold" />
                )}
              </View>
              <Text style={[styles.title, { color: colors.text }]}>
                {isEditMode ? 'Edit Service' : 'New Service'}
              </Text>
            </View>

            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Name Input */}
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.secondaryText }]}>NAME</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g., Netflix, Spotify, Gym"
                  placeholderTextColor={colors.secondaryText}
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.inputBackground,
                      color: colors.text,
                      borderColor: colors.border,
                    },
                  ]}
                  autoFocus
                  maxLength={MAX_NAME_LENGTH}
                  editable={!isSaving}
                  testID="serviceEditorInput"
                />
                <Text
                  style={[
                    styles.charCount,
                    {
                      color: charCount >= MAX_NAME_LENGTH ? colors.negative : colors.secondaryText,
                    },
                  ]}
                >
                  {charCount}/{MAX_NAME_LENGTH}
                </Text>
              </View>

              {/* Website URL Input (Optional) */}
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.secondaryText }]}>
                  WEBSITE URL (OPTIONAL)
                </Text>
                <TextInput
                  value={websiteUrl}
                  onChangeText={setWebsiteUrl}
                  placeholder="e.g., netflix.com"
                  placeholderTextColor={colors.secondaryText}
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.inputBackground,
                      color: colors.text,
                      borderColor: colors.border,
                    },
                  ]}
                  keyboardType="url"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isSaving}
                  testID="serviceEditorUrl"
                />
              </View>

              {/* Color Picker */}
              <View style={styles.colorSection}>
                <Text style={[styles.label, { color: colors.secondaryText }]}>COLOR</Text>
                <View style={styles.colorRow}>
                  {SERVICE_COLORS.map((color) => (
                    <Pressable
                      key={color}
                      onPress={() => setSelectedColor(color)}
                      style={[
                        styles.colorOption,
                        { backgroundColor: color },
                        selectedColor === color && styles.colorOptionSelected,
                      ]}
                      disabled={isSaving}
                      testID={`serviceEditorColor_${color}`}
                    >
                      {selectedColor === color && (
                        <CheckIcon color="#fff" size={18} weight="bold" />
                      )}
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Category Selector */}
              <View style={styles.categorySection}>
                <Text style={[styles.label, { color: colors.secondaryText }]}>CATEGORY</Text>
                <View style={styles.categoryRow}>
                  {allCategories.map((cat) => {
                    const isActive = cat === selectedCategory;
                    return (
                      <Pressable
                        key={cat}
                        onPress={() => setSelectedCategory(cat)}
                        style={[
                          styles.categoryChip,
                          { backgroundColor: colors.inputBackground, borderColor: colors.border },
                          isActive && {
                            backgroundColor: colors.primary,
                            borderColor: colors.primary,
                          },
                        ]}
                        disabled={isSaving}
                        testID={`serviceEditorCategory_${cat}`}
                      >
                        <Text
                          style={[
                            styles.categoryChipText,
                            { color: isActive ? '#fff' : colors.text },
                          ]}
                          numberOfLines={1}
                        >
                          {cat}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            <View style={styles.actions}>
              <Pressable
                onPress={handleClose}
                style={[
                  styles.button,
                  styles.cancelButton,
                  { borderColor: colors.border },
                  isSaving && { opacity: 0.5 },
                ]}
                disabled={isSaving}
                testID="serviceEditorCancel"
              >
                <Text style={[styles.buttonText, { color: colors.text }]}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={handleSave}
                style={[
                  styles.button,
                  styles.saveButton,
                  { backgroundColor: colors.primary },
                  (!trimmedName || isSaving) && { opacity: 0.5 },
                ]}
                disabled={!trimmedName || isSaving}
                testID="serviceEditorSave"
              >
                {isSaving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={[styles.buttonText, { color: '#fff' }]}>
                    {isEditMode ? 'Save' : 'Create'}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  safeArea: {
    width: '100%',
    paddingHorizontal: SPACING.lg,
    maxHeight: '90%',
  },
  container: {
    borderRadius: BORDER_RADIUS.xxxl,
    padding: SPACING.xl,
    gap: SPACING.lg,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
    maxHeight: '100%',
  },
  scrollView: {
    maxHeight: 400,
  },
  scrollContent: {
    gap: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  inputContainer: {
    gap: SPACING.xs,
  },
  label: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginLeft: SPACING.xs,
  },
  input: {
    height: 52,
    borderRadius: BORDER_RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    borderWidth: 1,
  },
  charCount: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    textAlign: 'right',
    marginRight: SPACING.sm,
  },
  colorSection: {
    gap: SPACING.sm,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    justifyContent: 'center',
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  categorySection: {
    gap: SPACING.sm,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  categoryChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  button: {
    flex: 1,
    height: 50,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  saveButton: {},
  buttonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
});
