import React from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';

import { useAppTheme } from '@/src/theme/useAppTheme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  title?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  haptic?: boolean;
}

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading,
  icon,
  style,
  textStyle,
  disabled,
  onPress,
  haptic = true,
  ...props
}: ButtonProps) {
  const theme = useAppTheme();

  const handlePress = (e: any) => {
    if (haptic && Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    onPress?.(e);
  };

  const getBackgroundColor = (pressed: boolean) => {
    if (disabled) return theme.isDark ? '#2C2C35' : '#E4E7EC';

    switch (variant) {
      case 'primary':
        return pressed ? theme.colors.tint + 'E6' : theme.colors.tint;
      case 'secondary':
        return pressed ? theme.colors.cardAlt + 'E6' : theme.colors.cardAlt;
      case 'outline':
      case 'ghost':
        return 'transparent';
      case 'danger':
        return pressed ? theme.colors.negative + 'E6' : theme.colors.negative;
      default:
        return theme.colors.tint;
    }
  };

  const getTextColor = () => {
    if (disabled) return theme.colors.secondaryText;

    switch (variant) {
      case 'primary':
        return '#FFFFFF';
      case 'secondary':
        return theme.colors.text;
      case 'outline':
      case 'ghost':
        return theme.colors.text;
      case 'danger':
        return '#FFFFFF';
      default:
        return '#FFFFFF';
    }
  };

  const getBorderColor = () => {
    if (variant === 'outline') {
      return disabled ? theme.colors.border : theme.colors.border;
    }
    return 'transparent';
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        styles[size],
        {
          backgroundColor: getBackgroundColor(pressed),
          borderColor: getBorderColor(),
          borderWidth: variant === 'outline' ? 1.5 : 0,
        },
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <>
          {icon && icon}
          {title && (
            <Text
              style={[
                styles.text,
                styles[`text_${size}`],
                { color: getTextColor(), fontFamily: 'Inter_600SemiBold' },
                textStyle,
              ]}
            >
              {title}
            </Text>
          )}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 60, // Pill shape for premium feel
  },
  sm: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    minHeight: 36,
  },
  md: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    minHeight: 52,
  },
  lg: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    minHeight: 60,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  text_sm: {
    fontSize: 13,
  },
  text_md: {
    fontSize: 16,
  },
  text_lg: {
    fontSize: 18,
  },
});
