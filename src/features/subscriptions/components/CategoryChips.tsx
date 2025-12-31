import {
  AppWindowIcon,
  DotsThreeCircleIcon,
  ForkKnifeIcon,
  GraduationCapIcon,
  HeartbeatIcon,
  LightbulbIcon,
  MusicNotesIcon,
  PlayCircleIcon,
  RobotIcon,
  ShoppingCartIcon,
} from 'phosphor-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CATEGORY_COLORS } from '@/constants/colors';
import { BORDER_RADIUS, FONT_SIZE, SPACING } from '@/src/constants/theme';
import { useTheme } from '@/src/context/ThemeContext';
import { SUBSCRIPTION_CATEGORIES, SubscriptionCategory } from '@/src/features/subscriptions/types';

interface CategoryChipsProps {
  selectedCategory: SubscriptionCategory;
  onSelectCategory: (category: SubscriptionCategory) => void;
  disabled?: boolean;
}

const CATEGORY_ICONS: Record<SubscriptionCategory, React.FC<any>> = {
  Streaming: PlayCircleIcon,
  Music: MusicNotesIcon,
  Software: AppWindowIcon,
  Utilities: LightbulbIcon,
  Health: HeartbeatIcon,
  Food: ForkKnifeIcon,
  Education: GraduationCapIcon,
  Shopping: ShoppingCartIcon,
  AI: RobotIcon,
  Other: DotsThreeCircleIcon,
};

/**
 * Category selection chips grid.
 * Displays all subscription categories with icons in a responsive grid.
 */
export function CategoryChips({
  selectedCategory,
  onSelectCategory,
  disabled = false,
}: CategoryChipsProps) {
  const { colors } = useTheme();
  const iconSize = 26;

  return (
    <View style={styles.chipsRow} testID="subscriptionEditorCategories">
      {SUBSCRIPTION_CATEGORIES.map((cat) => {
        const active = cat === selectedCategory;
        const categoryColor = CATEGORY_COLORS[cat];
        const iconColor = active ? '#fff' : colors.text;
        const IconComponent = CATEGORY_ICONS[cat];
        const weight = active ? 'fill' : 'regular';

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
            <IconComponent
              color={iconColor}
              size={iconSize}
              weight={cat === 'Music' || cat === 'Software' || cat === 'Other' ? 'regular' : weight}
            />
            <Text style={[styles.chipText, { color: active ? '#fff' : colors.text }]}>{cat}</Text>
          </Pressable>
        );
      })}
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
  chipText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  disabledInput: {
    opacity: 0.5,
  },
});
