import { Stack } from 'expo-router';
import { PencilSimpleIcon, PlusIcon, TagIcon, TrashIcon } from 'phosphor-react-native';
import React, { useCallback, useMemo, useState } from 'react';
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
import { StackHeader } from '@/src/components/ui/StackHeader';
import { BORDER_RADIUS, FONT_SIZE, SPACING } from '@/src/constants/theme';
import { useTheme } from '@/src/context/ThemeContext';
import { CustomCategory, CustomCategoryInput } from '@/src/features/subscriptions/categoriesRepo';
import { useCategories } from '@/src/features/subscriptions/hooks';
import { DEFAULT_CATEGORIES } from '@/src/features/subscriptions/types';

export default function CategoriesScreen() {
  const { colors } = useTheme();
  const {
    customCategories,
    allCategories,
    isLoading,
    addCategory,
    updateCategory,
    deleteCategory,
    getSubscriptionCount,
  } = useCategories();

  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CustomCategory | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleOpenCreate = useCallback(() => {
    setEditingCategory(null);
    setShowModal(true);
  }, []);

  const handleOpenEdit = useCallback((category: CustomCategory) => {
    setEditingCategory(category);
    setShowModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setEditingCategory(null);
  }, []);

  const handleSaveCategory = useCallback(
    async (input: CustomCategoryInput) => {
      if (editingCategory) {
        // Edit mode
        await updateCategory({
          categoryId: editingCategory.id,
          oldName: editingCategory.name,
          input,
        });
      } else {
        // Create mode
        await addCategory(input);
      }
    },
    [editingCategory, addCategory, updateCategory]
  );

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

  const headerRight = useMemo(
    () => (
      <Pressable
        onPress={handleOpenCreate}
        style={[styles.headerButton, { backgroundColor: colors.primary }]}
        testID="categoriesAddButton"
      >
        <PlusIcon color="#fff" size={20} weight="bold" />
      </Pressable>
    ),
    [colors, handleOpenCreate]
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          header: () => (
            <StackHeader title="Manage Categories" showBack headerRight={headerRight} />
          ),
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
                <Pressable
                  onPress={handleOpenCreate}
                  style={[styles.emptyButton, { backgroundColor: colors.primary }]}
                >
                  <PlusIcon color="#fff" size={18} weight="bold" />
                  <Text style={styles.emptyButtonText}>Create One</Text>
                </Pressable>
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

                        <View style={styles.actionButtons}>
                          <Pressable
                            onPress={() => handleOpenEdit(cat)}
                            disabled={isDeleting}
                            style={[styles.actionButton, isDeleting && { opacity: 0.5 }]}
                            testID={`categoryEdit_${cat.id}`}
                          >
                            <PencilSimpleIcon color={colors.primary} size={20} />
                          </Pressable>

                          <Pressable
                            onPress={() => handleDeleteCategory(cat)}
                            disabled={isDeleting}
                            style={[styles.actionButton, isDeleting && { opacity: 0.5 }]}
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
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>

      <CategoryCreatorModal
        visible={showModal}
        onClose={handleCloseModal}
        onSave={handleSaveCategory}
        existingCategories={allCategories}
        editingCategory={editingCategory}
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
    paddingBottom: SPACING.xxxl,
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
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    marginTop: SPACING.sm,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
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
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  actionButton: {
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
});
