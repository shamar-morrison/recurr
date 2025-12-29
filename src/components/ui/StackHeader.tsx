import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppColors } from '@/constants/colors';
import { CaretLeftIcon } from 'phosphor-react-native';

interface StackHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  headerRight?: React.ReactNode;
  headerLeft?: React.ReactNode;
}

export function StackHeader({
  title,
  subtitle,
  showBack = false,
  headerRight,
  headerLeft,
}: StackHeaderProps) {
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    router.back();
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + 8,
          backgroundColor: AppColors.background,
        },
      ]}
    >
      <View style={styles.content}>
        {/* Left side - only render if there's content */}
        {(showBack || headerLeft) && (
          <View style={styles.leftContainer}>
            {headerLeft ? (
              headerLeft
            ) : showBack ? (
              <Pressable
                onPress={handleBack}
                style={[
                  styles.backButton,
                  {
                    backgroundColor: 'rgba(15,23,42,0.06)',
                  },
                ]}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <CaretLeftIcon color={AppColors.text} size={22} />
              </Pressable>
            ) : null}
          </View>
        )}

        {/* Center - Title */}
        <View
          style={[styles.titleContainer, !(showBack || headerLeft) && styles.titleContainerNoLeft]}
        >
          {title && (
            <Text style={[styles.title, { color: AppColors.text }]} numberOfLines={1}>
              {title}
            </Text>
          )}
          {subtitle && (
            <Text style={[styles.subtitle, { color: AppColors.secondaryText }]} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>

        {/* Right side */}
        <View style={styles.rightContainer}>{headerRight}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  leftContainer: {
    minWidth: 44,
    alignItems: 'flex-start',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'flex-start',
    paddingHorizontal: 8,
    gap: 2,
  },
  titleContainerNoLeft: {
    paddingLeft: 0,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  rightContainer: {
    minWidth: 44,
    alignItems: 'flex-end',
  },
});
