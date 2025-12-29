import * as Haptics from 'expo-haptics';
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

import { AppColors } from '@/constants/colors';
import { BORDER_RADIUS, FONT_SIZE, SHADOWS, SPACING } from '@/src/constants/theme';

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

type VariantColors = Record<ButtonVariant, { bg: string; text: string }>;

function getVariantColors(colors: typeof AppColors): VariantColors {
  return {
    primary: { bg: colors.tint, text: '#FFFFFF' },
    secondary: { bg: colors.cardAlt, text: colors.text },
    outline: { bg: 'transparent', text: colors.text },
    ghost: { bg: 'transparent', text: colors.text },
    danger: { bg: colors.negative, text: '#FFFFFF' },
  };
}

const SIZE_STYLES = {
  sm: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    minHeight: 36,
    fontSize: FONT_SIZE.md,
  },
  md: {
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xxl,
    minHeight: 52,
    fontSize: FONT_SIZE.lg,
  },
  lg: {
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.xxxl,
    minHeight: 60,
    fontSize: FONT_SIZE.xl,
  },
} as const;

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
  const themeColors = AppColors;
  const variantColors = getVariantColors(themeColors);
  const colors = variantColors[variant];
  const sizeStyle = SIZE_STYLES[size];

  const handlePress = (e: any) => {
    if (haptic && Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    onPress?.(e);
  };

  const bgColor = disabled ? '#E4E7EC' : colors.bg;
  const txtColor = disabled ? '#667085' : colors.text;

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      style={[
        styles.base,
        {
          backgroundColor: bgColor,
          paddingVertical: sizeStyle.paddingVertical,
          paddingHorizontal: sizeStyle.paddingHorizontal,
          minHeight: sizeStyle.minHeight,
          borderWidth: variant === 'outline' ? 1.5 : 0,
          borderColor: variant === 'outline' ? themeColors.border : 'transparent',
        },
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={txtColor} size="small" />
      ) : (
        <>
          {icon}
          {title && (
            <Text
              style={[styles.text, { color: txtColor, fontSize: sizeStyle.fontSize }, textStyle]}
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
    gap: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    ...SHADOWS.md,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: 'Inter_600SemiBold',
  },
});
