import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@/constants/colors';
import { BORDER_RADIUS, FONT_SIZE, SPACING } from '@/src/constants/theme';
import { PaywallSheet } from '@/src/features/monetization/PaywallSheet';

export default function ModalScreen() {
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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    padding: SPACING.lg,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: AppColors.card,
    borderRadius: BORDER_RADIUS.xxxl,
    padding: SPACING.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: AppColors.border,
  },
  title: {
    color: AppColors.text,
    fontSize: FONT_SIZE.xxxl,
    letterSpacing: -0.2,
    fontWeight: '800',
    marginBottom: 6,
  },
  subtitle: {
    color: AppColors.secondaryText,
    fontSize: FONT_SIZE.md,
    lineHeight: 18,
    marginBottom: SPACING.md,
  },
});
