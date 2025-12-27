/**
 * ActionSheet for creating a custom service.
 * Shows service name (pre-filled), category picker, and color picker.
 */

import { CheckIcon } from 'phosphor-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
} from '@/components/ui/actionsheet';
import { CustomServiceInput, SERVICE_COLORS } from '@/src/constants/customServices';
import { SUBSCRIPTION_CATEGORIES, SubscriptionCategory } from '@/src/features/subscriptions/types';
import { useAppTheme } from '@/src/theme/useAppTheme';

interface AddServiceSheetProps {
  isOpen: boolean;
  onClose: () => void;
  serviceName: string;
  onSave: (input: CustomServiceInput) => void;
}

export function AddServiceSheet({ isOpen, onClose, serviceName, onSave }: AddServiceSheetProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [selectedCategory, setSelectedCategory] = useState<SubscriptionCategory>('Other');
  const [selectedColor, setSelectedColor] = useState<string>(SERVICE_COLORS[1]);

  const handleSave = useCallback(() => {
    onSave({
      name: serviceName,
      category: selectedCategory,
      color: selectedColor,
    });
    // Reset state
    setSelectedCategory('Other');
    setSelectedColor(SERVICE_COLORS[1]);
    onClose();
  }, [serviceName, selectedCategory, selectedColor, onSave, onClose]);

  const handleClose = useCallback(() => {
    setSelectedCategory('Other');
    setSelectedColor(SERVICE_COLORS[1]);
    onClose();
  }, [onClose]);

  return (
    <Actionsheet isOpen={isOpen} onClose={handleClose}>
      <ActionsheetBackdrop />
      <ActionsheetContent style={styles.content}>
        <ActionsheetDragIndicatorWrapper>
          <ActionsheetDragIndicator />
        </ActionsheetDragIndicatorWrapper>

        <Text style={styles.title}>Add Custom Service</Text>

        {/* Service Name Display */}
        <View style={styles.section}>
          <Text style={styles.label}>Service Name</Text>
          <View style={styles.nameContainer}>
            <Text style={styles.nameText}>{serviceName}</Text>
          </View>
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
          <Pressable style={styles.cancelButton} onPress={handleClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
          <Pressable style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save</Text>
          </Pressable>
        </View>
      </ActionsheetContent>
    </Actionsheet>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>) {
  return StyleSheet.create({
    content: {
      backgroundColor: theme.colors.card,
      paddingBottom: 24,
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.text,
      marginTop: 8,
      marginBottom: 20,
      textAlign: 'center',
    },
    section: {
      width: '100%',
      marginBottom: 20,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.secondaryText,
      marginBottom: 10,
    },
    nameContainer: {
      backgroundColor: theme.isDark ? 'rgba(236,242,255,0.06)' : 'rgba(15,23,42,0.04)',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderRadius: 12,
    },
    nameText: {
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
      width: '100%',
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
    saveButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },
  });
}
