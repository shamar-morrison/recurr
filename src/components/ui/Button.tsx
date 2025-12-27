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

const VARIANT_COLORS = {
  primary: { bg: AppColors.light.tint, text: '#FFFFFF' },
  secondary: { bg: AppColors.light.cardAlt, text: AppColors.light.text },
  outline: { bg: 'transparent', text: AppColors.light.text },
  ghost: { bg: 'transparent', text: AppColors.light.text },
  danger: { bg: AppColors.light.negative, text: '#FFFFFF' },
} as const;

const SIZE_STYLES = {
  sm: { paddingVertical: 8, paddingHorizontal: 16, minHeight: 36, fontSize: 13 },
  md: { paddingVertical: 14, paddingHorizontal: 24, minHeight: 52, fontSize: 16 },
  lg: { paddingVertical: 18, paddingHorizontal: 32, minHeight: 60, fontSize: 18 },
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
  const colors = VARIANT_COLORS[variant];
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
          borderColor: variant === 'outline' ? AppColors.light.border : 'transparent',
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
    gap: 8,
    borderRadius: 60,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: 'Inter_600SemiBold',
  },
});
