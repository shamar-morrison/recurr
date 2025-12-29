import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@/constants/colors';
import { BORDER_RADIUS, FONT_SIZE, SPACING } from '@/src/constants/theme';

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
  errorMessage?: string;
};

export class AppErrorBoundary extends React.PureComponent<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: unknown): State {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[AppErrorBoundary] getDerivedStateFromError', { message });
    return { hasError: true, errorMessage: message };
  }

  componentDidCatch(error: unknown, errorInfo: unknown) {
    console.error('[AppErrorBoundary] componentDidCatch', { error, errorInfo });
  }

  private handleReset = () => {
    console.log('[AppErrorBoundary] Reset pressed');
    this.setState({ hasError: false, errorMessage: undefined });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return <ErrorFallback onReset={this.handleReset} />;
  }
}

function ErrorFallback({ onReset }: { onReset: () => void }) {
  const theme = { colors: AppColors };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      testID="errorBoundary"
    >
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Text style={[styles.title, { color: theme.colors.text }]}>Oops</Text>
        <Text
          style={[styles.subtitle, { color: theme.colors.secondaryText }]}
          testID="errorBoundarySubtitle"
        >
          Something went wrong. Try again.
        </Text>
        <Pressable
          onPress={onReset}
          style={[styles.button, { backgroundColor: theme.colors.tint }]}
          testID="errorBoundaryReset"
        >
          <Text style={styles.buttonText}>Reset</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: BORDER_RADIUS.xxl,
    padding: SPACING.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '900',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: FONT_SIZE.md,
    lineHeight: 18,
    marginBottom: SPACING.lg,
  },
  button: {
    alignSelf: 'flex-start',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '800',
  },
});
