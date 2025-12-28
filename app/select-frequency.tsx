import { CheckIcon } from 'phosphor-react-native';
import React, { useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { router, Stack, useLocalSearchParams } from 'expo-router';

import { BILLING_CYCLES, BillingCycle } from '@/src/features/subscriptions/types';
import { useAppTheme } from '@/src/theme/useAppTheme';

type RouteParams = {
  selectedFrequency?: string;
};

export default function SelectFrequencyScreen() {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const params = useLocalSearchParams<RouteParams>();
  const selectedFrequency = (params.selectedFrequency ?? 'Monthly') as BillingCycle;

  const handleSelect = useCallback((frequency: BillingCycle) => {
    router.navigate({
      pathname: '/(tabs)/(home)/subscription-editor',
      params: {
        _selectedFrequency: frequency,
      },
    });
  }, []);

  return (
    <>
      <Stack.Screen
        options={{
          presentation: 'formSheet',
          headerShown: false,
          sheetAllowedDetents: 'fitToContents',
          sheetGrabberVisible: true,
          sheetCornerRadius: 24,
        }}
      />

      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>Select Frequency</Text>
        </View>

        <View style={styles.list}>
          {BILLING_CYCLES.map((cycle) => {
            const isSelected = cycle === selectedFrequency;
            return (
              <Pressable
                key={cycle}
                onPress={() => handleSelect(cycle)}
                style={[styles.item, isSelected && styles.itemSelected]}
              >
                <View style={styles.frequencyInfo}>
                  <Text style={styles.frequencyName}>{cycle}</Text>
                </View>
                {isSelected && <CheckIcon color={theme.colors.tint} size={20} weight="bold" />}
              </Pressable>
            );
          })}
        </View>
      </SafeAreaView>
    </>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.card,
      paddingHorizontal: 16,
    },
    header: {
      paddingTop: 20,
      paddingBottom: 16,
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.text,
      textAlign: 'center',
    },
    list: {
      paddingBottom: 20,
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
      paddingHorizontal: 12,
      borderRadius: 12,
    },
    itemSelected: {
      backgroundColor: theme.isDark ? 'rgba(121,167,255,0.12)' : 'rgba(79,140,255,0.08)',
    },
    frequencyInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    frequencyName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
    },
  });
}
