import { CheckIcon, PencilSimpleIcon, PlusIcon } from 'phosphor-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BORDER_RADIUS, FONT_SIZE, SPACING } from '@/src/constants/theme';
import { useTheme } from '@/src/context/ThemeContext';
import {
  CATEGORY_COLOR_OPTIONS,
  CustomCategory,
  CustomCategoryInput,
} from '@/src/features/subscriptions/categoriesRepo';

const MAX_NAME_LENGTH = 30;

interface CategoryEditorModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (input: CustomCategoryInput) => Promise<unknown>;
  existingCategories: string[];
  /** If provided, the modal enters edit mode for this category */
  editingCategory?: CustomCategory | null;
}

/**
 * Modal for creating or editing a custom category with color picker.
 * Validates input and prevents duplicates.
 */
export function CategoryCreatorModal({
  visible,
  onClose,
  onSave,
  existingCategories,
  editingCategory,
}: CategoryEditorModalProps) {
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState<string>(CATEGORY_COLOR_OPTIONS[0]);
  const [isSaving, setIsSaving] = useState(false);

  const isEditMode = Boolean(editingCategory);

  // Pre-fill form when editing
  useEffect(() => {
    if (visible && editingCategory) {
      setName(editingCategory.name);
      setSelectedColor(editingCategory.color);
    } else if (visible && !editingCategory) {
      setName('');
      setSelectedColor(CATEGORY_COLOR_OPTIONS[0]);
    }
  }, [visible, editingCategory]);

  const trimmedName = name.trim();
  const charCount = trimmedName.length;

  const handleSave = useCallback(async () => {
    if (!trimmedName) {
      Alert.alert('Invalid Name', 'Please enter a category name.');
      return;
    }

    if (trimmedName.length > MAX_NAME_LENGTH) {
      Alert.alert('Name Too Long', `Category name must be ${MAX_NAME_LENGTH} characters or less.`);
      return;
    }

    // Check for duplicates (case-insensitive), excluding current category when editing
    const isDuplicate = existingCategories.some((cat) => {
      const isMatch = cat.toLowerCase() === trimmedName.toLowerCase();
      // When editing, allow the same name (user might just change color)
      if (isEditMode && editingCategory) {
        return isMatch && cat.toLowerCase() !== editingCategory.name.toLowerCase();
      }
      return isMatch;
    });

    if (isDuplicate) {
      Alert.alert('Duplicate Category', 'This category already exists.');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({ name: trimmedName, color: selectedColor });
      handleClose();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      Alert.alert('Error', msg);
    } finally {
      setIsSaving(false);
    }
  }, [trimmedName, selectedColor, existingCategories, isEditMode, editingCategory, onSave]);

  const handleClose = useCallback(() => {
    if (isSaving) return;
    setName('');
    setSelectedColor(CATEGORY_COLOR_OPTIONS[0]);
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
                {isEditMode ? 'Edit Category' : 'New Category'}
              </Text>
            </View>

            {/* Name Input */}
            <View style={styles.inputContainer}>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g., Gaming, Travel, Pet Care"
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
                testID="categoryEditorInput"
              />
              <Text
                style={[
                  styles.charCount,
                  { color: charCount >= MAX_NAME_LENGTH ? colors.negative : colors.secondaryText },
                ]}
              >
                {charCount}/{MAX_NAME_LENGTH}
              </Text>
            </View>

            {/* Color Picker */}
            <View style={styles.colorSection}>
              <Text style={[styles.colorLabel, { color: colors.secondaryText }]}>COLOR</Text>
              <View style={styles.colorRow}>
                {CATEGORY_COLOR_OPTIONS.map((color) => (
                  <Pressable
                    key={color}
                    onPress={() => setSelectedColor(color)}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      selectedColor === color && styles.colorOptionSelected,
                    ]}
                    disabled={isSaving}
                    testID={`categoryEditorColor_${color}`}
                  >
                    {selectedColor === color && <CheckIcon color="#fff" size={18} weight="bold" />}
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.actions}>
              <Pressable
                onPress={handleClose}
                style={[styles.button, styles.cancelButton, { borderColor: colors.border }]}
                disabled={isSaving}
                testID="categoryEditorCancel"
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
                testID="categoryEditorSave"
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
  input: {
    height: 56,
    borderRadius: BORDER_RADIUS.xxl,
    paddingHorizontal: SPACING.lg,
    fontSize: FONT_SIZE.lg,
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
  colorLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginLeft: SPACING.xs,
  },
  colorRow: {
    flexDirection: 'row',
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
