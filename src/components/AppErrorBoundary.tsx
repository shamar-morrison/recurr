import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { LightColors } from '@/constants/colors';
import { BORDER_RADIUS, FONT_SIZE, SPACING } from '@/src/constants/theme';

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
  errorMessage?: string;
};

/**
 * Error boundary component that catches JavaScript errors in child components.
 * Note: This is a class component and cannot use hooks, so we use LightColors
 * as a sensible fallback for the error screen.
 */
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

/**
 * Error fallback UI component.
 * Uses LightColors as this is shown in error state when theme might not be available.
 */
function ErrorFallback({ onReset }: { onReset: () => void }) {
  // Use LightColors as fallback since theme context may not be available in error state
  const colors = LightColors;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]} testID="errorBoundary">
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.title, { color: colors.text }]}>Oops</Text>
        <Text
          style={[styles.subtitle, { color: colors.secondaryText }]}
          testID="errorBoundarySubtitle"
        >
          Something went wrong. Try again.
        </Text>
        <Pressable
          onPress={onReset}
          style={[styles.button, { backgroundColor: colors.tint }]}
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
