import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { BORDER_RADIUS, FONT_SIZE, SPACING } from '@/src/constants/theme';
import { useTheme } from '@/src/context/ThemeContext';
import { PaywallSheet } from '@/src/features/monetization/PaywallSheet';

export default function ModalScreen() {
  const { colors } = useTheme();

  return (
    <Modal transparent animationType="fade" visible>
      <Pressable style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>Premium</Text>
          <Text style={[styles.subtitle, { color: colors.secondaryText }]}>
            Unlock unlimited subscriptions and advanced insights.
          </Text>
          <PaywallSheet variant="inline" />
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    padding: SPACING.lg,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderRadius: BORDER_RADIUS.xxxl,
    padding: SPACING.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: FONT_SIZE.xxxl,
    letterSpacing: -0.2,
    fontWeight: '800',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: FONT_SIZE.md,
    lineHeight: 18,
    marginBottom: SPACING.md,
  },
});
