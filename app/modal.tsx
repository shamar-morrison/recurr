import { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { PaywallSheet } from '@/src/features/monetization/PaywallSheet';
import { useAppTheme } from '@/src/theme/useAppTheme';

export default function ModalScreen() {
  const theme = useAppTheme();

  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Modal transparent animationType="fade" visible>
      <Pressable style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Premium</Text>
          <Text style={styles.subtitle}>Unlock unlimited subscriptions and advanced insights.</Text>
          <PaywallSheet variant="inline" />
        </View>
      </Pressable>
    </Modal>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: theme.isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.45)',
      padding: 16,
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: theme.colors.card,
      borderRadius: 24,
      padding: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
    },
    title: {
      color: theme.colors.text,
      fontSize: 22,
      letterSpacing: -0.2,
      fontWeight: '800',
      marginBottom: 6,
    },
    subtitle: {
      color: theme.colors.secondaryText,
      fontSize: 14,
      lineHeight: 18,
      marginBottom: 12,
    },
  });
}
