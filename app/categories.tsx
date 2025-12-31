import { router, Stack } from 'expo-router';
import { CaretLeftIcon, PlusIcon, TagIcon, TrashIcon } from 'phosphor-react-native';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getCategoryColors } from '@/constants/colors';
import { CategoryCreatorModal } from '@/src/components/CategoryCreatorModal';
import { BORDER_RADIUS, FONT_SIZE, SPACING } from '@/src/constants/theme';
import { useTheme } from '@/src/context/ThemeContext';
import { CustomCategory } from '@/src/features/subscriptions/categoriesRepo';
import { useCategories } from '@/src/features/subscriptions/hooks';
import { DEFAULT_CATEGORIES } from '@/src/features/subscriptions/types';

export default function CategoriesScreen() {
  const { colors } = useTheme();
  const {
    customCategories,
    allCategories,
    isLoading,
    addCategory,
    deleteCategory,
    isDeleting,
    getSubscriptionCount,
  } = useCategories();

  const [showCreatorModal, setShowCreatorModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteCategory = useCallback(
    async (category: CustomCategory) => {
      // Get subscription count
      const count = await getSubscriptionCount(category.name);

      const message =
        count > 0
          ? `This will delete "${category.name}" and move ${count} subscription${count === 1 ? '' : 's'} to "Other".`
          : `Delete the category "${category.name}"?`;

      Alert.alert('Delete Category', message, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(category.id);
            try {
              await deleteCategory({ categoryId: category.id, categoryName: category.name });
            } catch (e) {
              const msg = e instanceof Error ? e.message : 'Unknown error';
              Alert.alert('Error', msg);
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]);
    },
    [deleteCategory, getSubscriptionCount]
  );

  const headerLeft = useCallback(
    () => (
      <Pressable
        onPress={() => router.back()}
        style={[styles.headerButton, { backgroundColor: colors.tertiaryBackground }]}
        testID="categoriesBack"
      >
        <CaretLeftIcon color={colors.text} size={22} />
      </Pressable>
    ),
    [colors]
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Manage Categories',
          headerBackVisible: false,
          headerLeft,
        }}
      />

      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['bottom']}
      >
        <ScrollView contentContainerStyle={styles.content}>
          {/* Default Categories */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.secondaryText }]}>
              DEFAULT CATEGORIES
            </Text>
            <View style={[styles.card, { backgroundColor: colors.card }]}>
              {DEFAULT_CATEGORIES.map((cat, index) => {
                const categoryColors = getCategoryColors(cat);
                return (
                  <View key={cat}>
                    {index > 0 && (
                      <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    )}
                    <View style={styles.row}>
                      <View style={[styles.colorDot, { backgroundColor: categoryColors.text }]} />
                      <Text style={[styles.categoryName, { color: colors.text }]}>{cat}</Text>
                      <Text style={[styles.defaultLabel, { color: colors.secondaryText }]}>
                        Default
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Custom Categories */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.secondaryText }]}>
              CUSTOM CATEGORIES
            </Text>
            {isLoading ? (
              <View style={[styles.card, styles.loadingCard, { backgroundColor: colors.card }]}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : customCategories.length === 0 ? (
              <View style={[styles.card, styles.emptyCard, { backgroundColor: colors.card }]}>
                <TagIcon color={colors.secondaryText} size={32} />
                <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
                  No custom categories yet
                </Text>
              </View>
            ) : (
              <View style={[styles.card, { backgroundColor: colors.card }]}>
                {customCategories.map((cat, index) => {
                  const categoryColors = getCategoryColors(cat.name, cat.color);
                  const isDeleting = deletingId === cat.id;
                  return (
                    <View key={cat.id}>
                      {index > 0 && (
                        <View style={[styles.divider, { backgroundColor: colors.border }]} />
                      )}
                      <View style={styles.row}>
                        <View style={[styles.colorDot, { backgroundColor: categoryColors.text }]} />
                        <Text style={[styles.categoryName, { color: colors.text }]}>
                          {cat.name}
                        </Text>
                        <Pressable
                          onPress={() => handleDeleteCategory(cat)}
                          disabled={isDeleting}
                          style={[styles.deleteButton, isDeleting && { opacity: 0.5 }]}
                          testID={`categoryDelete_${cat.id}`}
                        >
                          {isDeleting ? (
                            <ActivityIndicator color={colors.negative} size="small" />
                          ) : (
                            <TrashIcon color={colors.negative} size={20} />
                          )}
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Add Button */}
        <View style={styles.footer}>
          <Pressable
            onPress={() => setShowCreatorModal(true)}
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            testID="categoriesAddButton"
          >
            <PlusIcon color="#fff" size={20} weight="bold" />
            <Text style={styles.addButtonText}>Add Category</Text>
          </Pressable>
        </View>
      </SafeAreaView>

      <CategoryCreatorModal
        visible={showCreatorModal}
        onClose={() => setShowCreatorModal(false)}
        onSave={addCategory}
        existingCategories={allCategories}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: SPACING.xl,
    paddingBottom: 100,
    gap: SPACING.xxl,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    gap: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginLeft: SPACING.xs,
  },
  card: {
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
  },
  loadingCard: {
    padding: SPACING.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    padding: SPACING.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  emptyText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  categoryName: {
    flex: 1,
    fontSize: FONT_SIZE.lg,
    fontWeight: '500',
  },
  defaultLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 44,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.xl,
    paddingBottom: SPACING.xxl,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    height: 56,
    borderRadius: BORDER_RADIUS.full,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  addButtonText: {
    color: '#fff',
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
});
