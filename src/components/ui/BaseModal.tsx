import { MagnifyingGlassIcon, XIcon } from 'phosphor-react-native';
import React, { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors } from '@/constants/colors';

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
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <Text style={styles.title}>{title}</Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <XIcon color={AppColors.text} size={22} />
          </Pressable>
        </View>

        {/* Optional Search Bar */}
        {showSearch && (
          <View style={styles.searchContainer}>
            <MagnifyingGlassIcon color={AppColors.secondaryText} size={18} />
            <TextInput
              value={searchValue}
              onChangeText={onSearchChange}
              placeholder={searchPlaceholder}
              placeholderTextColor={AppColors.secondaryText}
              style={styles.searchInput}
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
    backgroundColor: AppColors.background,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerSpacer: {
    width: 40,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.text,
    textAlign: 'center',
    flex: 1,
    letterSpacing: -0.3,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.tertiaryBackground,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: AppColors.inputBackground,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: AppColors.text,
    padding: 0,
  },
  content: {
    flex: 1,
  },
  footer: {
    paddingVertical: 16,
  },
});
