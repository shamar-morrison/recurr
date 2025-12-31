import { PlusIcon } from 'phosphor-react-native';
import React, { useCallback, useState } from 'react';
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

interface CategoryCreatorModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (name: string) => Promise<unknown>;
  existingCategories: string[];
}

/**
 * Modal for creating a new custom category.
 * Validates input and prevents duplicates.
 */
export function CategoryCreatorModal({
  visible,
  onClose,
  onSave,
  existingCategories,
}: CategoryCreatorModalProps) {
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const trimmedName = name.trim();

  const handleSave = useCallback(async () => {
    if (!trimmedName) {
      Alert.alert('Invalid Name', 'Please enter a category name.');
      return;
    }

    // Check for duplicates (case-insensitive)
    const isDuplicate = existingCategories.some(
      (cat) => cat.toLowerCase() === trimmedName.toLowerCase()
    );
    if (isDuplicate) {
      Alert.alert('Duplicate Category', 'This category already exists.');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(trimmedName);
      setName('');
      onClose();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      Alert.alert('Error', msg);
    } finally {
      setIsSaving(false);
    }
  }, [trimmedName, existingCategories, onSave, onClose]);

  const handleClose = useCallback(() => {
    if (isSaving) return;
    setName('');
    onClose();
  }, [isSaving, onClose]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea}>
          <View style={[styles.container, { backgroundColor: colors.card }]}>
            <View style={styles.header}>
              <View style={[styles.iconContainer, { backgroundColor: colors.primary }]}>
                <PlusIcon color="#fff" size={24} weight="bold" />
              </View>
              <Text style={[styles.title, { color: colors.text }]}>New Category</Text>
            </View>

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
              maxLength={30}
              editable={!isSaving}
              testID="categoryCreatorInput"
            />

            <View style={styles.actions}>
              <Pressable
                onPress={handleClose}
                style={[styles.button, styles.cancelButton, { borderColor: colors.border }]}
                disabled={isSaving}
                testID="categoryCreatorCancel"
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
                testID="categoryCreatorSave"
              >
                {isSaving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={[styles.buttonText, { color: '#fff' }]}>Create</Text>
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
  input: {
    height: 56,
    borderRadius: BORDER_RADIUS.xxl,
    paddingHorizontal: SPACING.lg,
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    borderWidth: 1,
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
