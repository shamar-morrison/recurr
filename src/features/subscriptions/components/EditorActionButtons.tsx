import {
  Delete02Icon,
  PauseCircleIcon,
  PlayCircle02Icon,
  Tick02Icon,
} from '@hugeicons/core-free-icons';
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/src/components/ui/AppIcon';
import { Button } from '@/src/components/ui/Button';
import { BORDER_RADIUS, FONT_FAMILY, FONT_SIZE, SPACING } from '@/src/constants/theme';
import { useTheme } from '@/src/context/ThemeContext';

interface EditorActionButtonsProps {
  isEditing: boolean;
  isPaused: boolean;
  processingAction: 'save' | 'pause' | 'delete' | null;
  isSaveDisabled?: boolean;
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
  isSaveDisabled = false,
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
          disabled={isProcessing || isSaveDisabled}
          testID="subscriptionEditorSave"
          icon={<AppIcon icon={Tick02Icon} color="#fff" size={20} />}
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
            icon={
              <AppIcon
                icon={isPaused ? PlayCircle02Icon : PauseCircleIcon}
                color="#fff"
                size={20}
              />
            }
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
              <ActivityIndicator color={colors.negative} />
            ) : (
              <AppIcon icon={Delete02Icon} color={colors.negative} size={20} />
            )}
            <Text style={[styles.deleteText, { color: colors.negative }]}>Delete Subscription</Text>
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
    fontSize: FONT_SIZE.xl - 1,
    fontFamily: FONT_FAMILY.semiBold,
  },
});
