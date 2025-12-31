import { TrashIcon } from 'phosphor-react-native';
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@/constants/colors';
import { Button } from '@/src/components/ui/Button';
import { BORDER_RADIUS, FONT_SIZE, SPACING } from '@/src/constants/theme';
import { useTheme } from '@/src/context/ThemeContext';

interface EditorActionButtonsProps {
  isEditing: boolean;
  isPaused: boolean;
  processingAction: 'save' | 'pause' | 'delete' | null;
  onSave: () => void;
  onPauseResume: () => void;
  onDelete: () => void;
}

/**
 * Action buttons section: Save, Pause/Resume, Delete.
 */
export function EditorActionButtons({
  isEditing,
  isPaused,
  processingAction,
  onSave,
  onPauseResume,
  onDelete,
}: EditorActionButtonsProps) {
  const { colors } = useTheme();
  const isProcessing = processingAction !== null;

  return (
    <>
      {/* Save Button */}
      <View style={styles.section}>
        <Button
          title={isEditing ? 'Update Subscription' : 'Save Subscription'}
          onPress={onSave}
          loading={processingAction === 'save'}
          disabled={isProcessing}
          testID="subscriptionEditorSave"
        />
      </View>

      {/* Danger Zone: Pause & Delete (only when editing) */}
      {isEditing && (
        <View style={styles.section}>
          <Button
            title={isPaused ? 'Resume Subscription' : 'Pause Subscription'}
            onPress={onPauseResume}
            style={{
              backgroundColor: colors.warning || '#F59E0B',
              marginBottom: SPACING.md,
            }}
            textStyle={{ color: '#fff' }}
            loading={processingAction === 'pause'}
            disabled={isProcessing}
          />

          <Pressable
            onPress={onDelete}
            style={[
              styles.deleteButton,
              { backgroundColor: 'rgba(255,59,48,0.1)' },
              isProcessing && { opacity: 0.5 },
            ]}
            disabled={isProcessing}
            testID="subscriptionEditorDelete"
          >
            {processingAction === 'delete' ? (
              <ActivityIndicator color={AppColors.negative} />
            ) : (
              <TrashIcon color={AppColors.negative} size={20} />
            )}
            <Text style={styles.deleteText}>Delete Subscription</Text>
          </Pressable>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: SPACING.md,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  deleteText: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '600',
  },
});
