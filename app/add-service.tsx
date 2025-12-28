/**
 * Screen for creating a custom service.
 * Shows service name (pre-filled), category picker, and color picker.
 */

import { CheckIcon } from 'phosphor-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { router, Stack, useLocalSearchParams } from 'expo-router';

import { SERVICE_COLORS } from '@/src/constants/customServices';
import { useCustomServices } from '@/src/features/services/useCustomServices';
import { SUBSCRIPTION_CATEGORIES, SubscriptionCategory } from '@/src/features/subscriptions/types';
import { getFirestoreErrorMessage } from '@/src/lib/firestore';
import { useAppTheme } from '@/src/theme/useAppTheme';

type RouteParams = {
  serviceName?: string;
};

export default function AddServiceScreen() {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const params = useLocalSearchParams<RouteParams>();
  const initialName = params.serviceName ?? '';

  const { addService: addCustomService } = useCustomServices();

  const [editableName, setEditableName] = useState(initialName);
  const [selectedCategory, setSelectedCategory] = useState<SubscriptionCategory>('Other');
  const [selectedColor, setSelectedColor] = useState<string>(SERVICE_COLORS[1]);
  const [isSaving, setIsSaving] = useState(false);

  const isValidName = editableName.trim().length > 0;

  const handleSave = useCallback(async () => {
    const trimmedName = editableName.trim();
    if (!trimmedName || !addCustomService) return;

    setIsSaving(true);
    try {
      const newService = await addCustomService({
        name: trimmedName,
        category: selectedCategory,
        color: selectedColor,
      });

      if (newService) {
        // Navigate back to select-service with the new service selected
        router.navigate({
          pathname: '/select-service',
          params: {
            _newServiceName: newService.name,
            _newServiceCategory: newService.category,
          },
        });
      } else {
        Alert.alert(
          'Failed to Create Service',
          'Something went wrong while creating your custom service. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Failed to Create Service', getFirestoreErrorMessage(error), [{ text: 'OK' }]);
    } finally {
      setIsSaving(false);
    }
  }, [editableName, selectedCategory, selectedColor, addCustomService]);

  const handleCancel = useCallback(() => {
    router.back();
  }, []);

  return (
    <>
      <Stack.Screen
        options={{
          presentation: 'formSheet',
          headerShown: false,
          sheetAllowedDetents: 'fitToContents',
          sheetGrabberVisible: true,
          sheetCornerRadius: 24,
        }}
      />

      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>Add Custom Service</Text>
        </View>

        {/* Service Name Input */}
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

        {/* Category Picker */}
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
                  <Text style={[styles.categoryText, isSelected && styles.categoryTextSelected]}>
                    {category}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Color Picker */}
        <View style={styles.section}>
          <Text style={styles.label}>Color</Text>
          <View style={styles.colorGrid}>
            {SERVICE_COLORS.map((color) => {
              const isSelected = color === selectedColor;
              return (
                <Pressable
                  key={color}
                  style={[styles.colorSwatch, { backgroundColor: color }]}
                  onPress={() => setSelectedColor(color)}
                >
                  {isSelected && <CheckIcon color="#FFFFFF" size={20} weight="bold" />}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonRow}>
          <Pressable style={styles.cancelButton} onPress={handleCancel} disabled={isSaving}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
          <Pressable
            style={[styles.saveButton, (!isValidName || isSaving) && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={!isValidName || isSaving}
          >
            <Text style={styles.saveButtonText}>{isSaving ? 'Saving...' : 'Save'}</Text>
          </Pressable>
        </View>
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
      backgroundColor: theme.isDark ? 'rgba(236,242,255,0.06)' : 'rgba(15,23,42,0.04)',
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
      backgroundColor: theme.isDark ? 'rgba(236,242,255,0.06)' : 'rgba(15,23,42,0.04)',
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
      paddingBottom: 16,
    },
    cancelButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: theme.isDark ? 'rgba(236,242,255,0.06)' : 'rgba(15,23,42,0.04)',
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
  });
}
