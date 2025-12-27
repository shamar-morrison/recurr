import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/src/theme/useAppTheme';

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
  const theme = useAppTheme();

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
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 14,
  },
  button: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '800',
  },
});
