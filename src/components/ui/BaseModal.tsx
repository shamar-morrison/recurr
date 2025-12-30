import { MagnifyingGlassIcon, XIcon } from 'phosphor-react-native';
import React, { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BORDER_RADIUS, FONT_SIZE, SPACING } from '@/src/constants/theme';
import { useTheme } from '@/src/context/ThemeContext';

type BaseModalProps = {
  /** Controls modal visibility */
  visible: boolean;
  /** Centered header title */
  title: string;
  /** Close handler */
  onClose: () => void;
  /** Custom content */
  children: ReactNode;
  /** Enable built-in search bar */
  showSearch?: boolean;
  /** Placeholder text for search */
  searchPlaceholder?: string;
  /** Controlled search value */
  searchValue?: string;
  /** Search change handler */
  onSearchChange?: (text: string) => void;
  /** Optional footer content */
  footer?: ReactNode;
};

export function BaseModal({
  visible,
  title,
  onClose,
  children,
  showSearch = false,
  searchPlaceholder = 'Search...',
  searchValue = '',
  onSearchChange,
  footer,
}: BaseModalProps) {
  const { colors } = useTheme();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['top', 'bottom']}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Pressable
            onPress={onClose}
            style={[styles.closeButton, { backgroundColor: colors.tertiaryBackground }]}
          >
            <XIcon color={colors.text} size={22} />
          </Pressable>
        </View>

        {/* Optional Search Bar */}
        {showSearch && (
          <View style={[styles.searchContainer, { backgroundColor: colors.inputBackground }]}>
            <MagnifyingGlassIcon color={colors.secondaryText} size={18} />
            <TextInput
              value={searchValue}
              onChangeText={onSearchChange}
              placeholder={searchPlaceholder}
              placeholderTextColor={colors.secondaryText}
              style={[styles.searchInput, { color: colors.text }]}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
          </View>
        )}

        {/* Content */}
        <View style={styles.content}>{children}</View>

        {/* Optional Footer */}
        {footer && <View style={styles.footer}>{footer}</View>}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.lg,
  },
  headerSpacer: {
    width: 40,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    textAlign: 'center',
    flex: 1,
    letterSpacing: -0.3,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZE.lg,
    padding: 0,
  },
  content: {
    flex: 1,
  },
  footer: {
    paddingVertical: SPACING.lg,
  },
});
