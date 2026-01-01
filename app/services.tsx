import { Stack } from 'expo-router';
import { CubeIcon, PencilSimpleIcon, PlusIcon, TrashIcon } from 'phosphor-react-native';
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

import { ServiceEditorModal } from '@/src/components/ServiceEditorModal';
import { CategoryBadge } from '@/src/components/ui/CategoryBadge';
import { StackHeader } from '@/src/components/ui/StackHeader';
import { CustomService, CustomServiceInput } from '@/src/constants/customServices';
import { BORDER_RADIUS, FONT_SIZE, SPACING } from '@/src/constants/theme';
import { useTheme } from '@/src/context/ThemeContext';
import { useCustomServices } from '@/src/features/services/useCustomServices';

export default function ServicesScreen() {
  const { colors } = useTheme();
  const { customServices, isLoading, addService, updateService, deleteService } =
    useCustomServices();

  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<CustomService | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleOpenCreate = useCallback(() => {
    setEditingService(null);
    setShowModal(true);
  }, []);

  const handleOpenEdit = useCallback((service: CustomService) => {
    setEditingService(service);
    setShowModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setEditingService(null);
  }, []);

  const handleSaveService = useCallback(
    async (input: CustomServiceInput) => {
      if (editingService) {
        // Edit mode
        await updateService({
          serviceId: editingService.id,
          input,
        });
      } else {
        // Create mode
        await addService(input);
      }
    },
    [editingService, addService, updateService]
  );

  const handleDeleteService = useCallback(
    async (service: CustomService) => {
      Alert.alert('Delete Service', `Delete "${service.name}"?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(service.id);
            try {
              await deleteService(service.id);
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
    [deleteService]
  );

  const existingServiceNames = useMemo(() => customServices.map((s) => s.name), [customServices]);

  const headerRight = useMemo(
    () => (
      <Pressable
        onPress={handleOpenCreate}
        style={[styles.headerButton, { backgroundColor: colors.primary }]}
        testID="servicesAddButton"
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
          header: () => <StackHeader title="Manage Services" showBack headerRight={headerRight} />,
        }}
      />

      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['bottom']}
      >
        <ScrollView contentContainerStyle={styles.content}>
          {/* Custom Services */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.secondaryText }]}>
              CUSTOM SERVICES
            </Text>
            {isLoading ? (
              <View style={[styles.card, styles.loadingCard, { backgroundColor: colors.card }]}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : customServices.length === 0 ? (
              <View style={[styles.card, styles.emptyCard, { backgroundColor: colors.card }]}>
                <CubeIcon color={colors.secondaryText} size={32} />
                <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
                  No custom services yet
                </Text>
                <Text style={[styles.emptySubtext, { color: colors.secondaryText }]}>
                  Custom services you create when adding subscriptions will appear here.
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
                {customServices.map((service, index) => {
                  const isServiceDeleting = deletingId === service.id;

                  return (
                    <View key={service.id}>
                      {index > 0 && (
                        <View style={[styles.divider, { backgroundColor: colors.border }]} />
                      )}
                      <View style={styles.row}>
                        <View style={[styles.colorDot, { backgroundColor: service.color }]} />
                        <View style={styles.rowMain}>
                          <Text style={[styles.serviceName, { color: colors.text }]}>
                            {service.name}
                          </Text>
                          <CategoryBadge category={service.category} size="sm" />
                        </View>

                        <View style={styles.actionButtons}>
                          <Pressable
                            onPress={() => handleOpenEdit(service)}
                            disabled={isServiceDeleting}
                            style={[styles.actionButton, isServiceDeleting && { opacity: 0.5 }]}
                            testID={`serviceEdit_${service.id}`}
                          >
                            <PencilSimpleIcon color={colors.primary} size={20} />
                          </Pressable>

                          <Pressable
                            onPress={() => handleDeleteService(service)}
                            disabled={isServiceDeleting}
                            style={[styles.actionButton, isServiceDeleting && { opacity: 0.5 }]}
                            testID={`serviceDelete_${service.id}`}
                          >
                            {isServiceDeleting ? (
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

          {/* Info */}
          <View style={styles.infoSection}>
            <Text style={[styles.infoText, { color: colors.secondaryText }]}>
              Custom services are ones you create when adding a subscription that isn't in our
              database. You can edit or delete them here.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>

      <ServiceEditorModal
        visible={showModal}
        onClose={handleCloseModal}
        onSave={handleSaveService}
        existingServiceNames={existingServiceNames}
        editingService={editingService}
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
  emptySubtext: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 20,
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
  rowMain: {
    flex: 1,
    gap: 4,
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  serviceName: {
    fontSize: FONT_SIZE.lg,
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
  infoSection: {
    paddingHorizontal: SPACING.sm,
  },
  infoText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '400',
    lineHeight: 20,
    textAlign: 'center',
  },
});
