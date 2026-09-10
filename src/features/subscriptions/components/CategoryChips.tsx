import {
  Add01Icon,
  AiBrain01Icon,
  AppWindowIcon,
  GraduationCapIcon,
  HeartPulseIcon,
  LightbulbIcon,
  MoreHorizontalCircleIcon,
  MusicNote01Icon,
  PlayCircle02Icon,
  Restaurant01Icon,
  ShoppingCart01Icon,
  Tag01Icon,
} from '@hugeicons/core-free-icons';
import type { IconSvgElement } from '@hugeicons/react-native';
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { getCategoryColors } from '@/constants/colors';
import { AppIcon } from '@/src/components/ui/AppIcon';
import { BORDER_RADIUS, FONT_FAMILY, FONT_SIZE, SPACING } from '@/src/constants/theme';
import { useTheme } from '@/src/context/ThemeContext';
import {
  DefaultCategory,
  isDefaultCategory,
  SubscriptionCategory,
} from '@/src/features/subscriptions/types';

interface CategoryChipsProps {
  selectedCategory: SubscriptionCategory;
  onSelectCategory: (category: SubscriptionCategory) => void;
  /** All categories to display (defaults + custom) */
  categories: SubscriptionCategory[];
  /** Called when user taps the "+" button */
  onAddCategory?: () => void;
  disabled?: boolean;
  /** Show loading state on the Add button */
  isAddingCategory?: boolean;
  /** Show loading skeleton while categories are being fetched */
  isLoading?: boolean;
}

const CATEGORY_ICONS: Record<DefaultCategory, IconSvgElement> = {
  Streaming: PlayCircle02Icon,
  Music: MusicNote01Icon,
  Software: AppWindowIcon,
  Utilities: LightbulbIcon,
  Health: HeartPulseIcon,
  Food: Restaurant01Icon,
  Education: GraduationCapIcon,
  Shopping: ShoppingCart01Icon,
  AI: AiBrain01Icon,
  Other: MoreHorizontalCircleIcon,
};

/**
 * Get the icon component for a category.
 * Returns Tag01Icon for custom categories.
 */
function getCategoryIcon(category: string): IconSvgElement {
  if (isDefaultCategory(category)) {
    return CATEGORY_ICONS[category];
  }
  return Tag01Icon;
}

/**
 * Category selection chips grid.
 * Displays all subscription categories with icons in a responsive grid.
 */
export function CategoryChips({
  selectedCategory,
  onSelectCategory,
  categories,
  onAddCategory,
  disabled = false,
  isAddingCategory = false,
  isLoading = false,
}: CategoryChipsProps) {
  const { colors } = useTheme();
  const iconSize = 26;

  if (isLoading) {
    return (
      <View style={styles.chipsRow} testID="subscriptionEditorCategoriesLoading">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <View
            key={i}
            style={[
              styles.chip,
              styles.skeletonChip,
              {
                backgroundColor: colors.cardAlt,
                borderColor: colors.border,
              },
            ]}
          >
            <ActivityIndicator color={colors.secondaryText} size="small" />
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.chipsRow} testID="subscriptionEditorCategories">
      {categories.map((cat) => {
        const active = cat === selectedCategory;
        const categoryColor = getCategoryColors(cat);
        const iconColor = active ? '#fff' : colors.text;
        const IconComponent = getCategoryIcon(cat);
        const isDefault = isDefaultCategory(cat);
        // For certain icons, always use outline style
        const isFilled =
          active && isDefault && cat !== 'Music' && cat !== 'Software' && cat !== 'Other';

        return (
          <Pressable
            key={cat}
            onPress={() => onSelectCategory(cat)}
            disabled={disabled}
            style={[
              styles.chip,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
              active && {
                backgroundColor: categoryColor.text,
                borderColor: categoryColor.text,
              },
              disabled && styles.disabledInput,
            ]}
            testID={`subscriptionEditorCategory_${cat}`}
          >
            <AppIcon
              icon={IconComponent}
              color={iconColor}
              size={iconSize}
              fill={isFilled ? iconColor : 'transparent'}
            />
            <Text
              style={[styles.chipText, { color: active ? '#fff' : colors.text }]}
              numberOfLines={1}
            >
              {cat}
            </Text>
          </Pressable>
        );
      })}

      {/* Add Category Button */}
      {onAddCategory && (
        <Pressable
          onPress={onAddCategory}
          disabled={disabled || isAddingCategory}
          style={[
            styles.chip,
            styles.addChip,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderStyle: 'dashed',
            },
            (disabled || isAddingCategory) && styles.disabledInput,
          ]}
          testID="subscriptionEditorCategoryAdd"
        >
          {isAddingCategory ? (
            <ActivityIndicator color={colors.primary} size="small" />
          ) : (
            <AppIcon icon={Add01Icon} color={colors.primary} size={iconSize} />
          )}
          <Text style={[styles.chipText, { color: colors.primary }]}>
            {isAddingCategory ? 'Adding...' : 'New'}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'flex-start',
  },
  chip: {
    borderRadius: BORDER_RADIUS.xxl,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
    borderWidth: 1.5,
    flexBasis: '30%',
    flexGrow: 1,
    maxWidth: '32%',
    minHeight: 70,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 7,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  addChip: {
    borderStyle: 'dashed',
  },
  chipText: {
    fontSize: FONT_SIZE.md - 1,
    fontFamily: FONT_FAMILY.bold,
  },
  disabledInput: {
    opacity: 0.5,
  },
  skeletonChip: {
    opacity: 0.6,
  },
});
