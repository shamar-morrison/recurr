import { router, Stack } from 'expo-router';
import { ArrowRight, Check, ShieldCheck, Sparkles, Wallet } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/src/features/auth/AuthProvider';
import { useAppTheme } from '@/src/theme/useAppTheme';
import { Button } from '@/src/components/ui/Button';

type OnboardingPage = {
  key: string;
  title: string;
  description: string;
  icon: 'sparkles' | 'wallet' | 'shield' | 'check';
};

const PAGES: OnboardingPage[] = [
  {
    key: 'track',
    title: 'Track every subscription',
    description: 'Keep Netflix, Spotify, utilities, and everything else in one clean list.',
    icon: 'sparkles',
  },
  {
    key: 'avoid',
    title: 'Avoid forgotten charges',
    description: 'See what renews next and how soon — so surprises don’t hit your bank account.',
    icon: 'shield',
  },
  {
    key: 'understand',
    title: 'Understand monthly spend',
    description: 'We automatically convert yearly plans into monthly equivalents for clarity.',
    icon: 'wallet',
  },
  {
    key: 'start',
    title: 'Ready when you are',
    description: 'Add a few subscriptions and you’ll instantly see totals and category breakdowns.',
    icon: 'check',
  },
];

const FLOATERS = [
  { label: 'N', color: '#E50914' },
  { label: 'S', color: '#1DB954' },
  { label: 'H', color: '#1CE783' },
  { label: 'D+', color: '#0A1E5D' },
  { label: 'YT', color: '#FF0033' },
  { label: 'AM', color: '#FA243C' },
  { label: 'PS', color: '#0070D1' },
  { label: 'HB', color: '#6B4CFF' },
] as const;

export default function OnboardingScreen() {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { markOnboardingComplete } = useAuth();

  const screen = Dimensions.get('window');
  const width = Math.max(320, screen.width);

  const scrollX = useRef(new Animated.Value(0)).current;
  const listRef = useRef<Animated.FlatList<OnboardingPage> | null>(null);

  const [pageIndex, setPageIndex] = useState<number>(0);

  const finish = async () => {
    await markOnboardingComplete();
    router.replace('/auth');
  };

  const next = () => {
    const nextIndex = Math.min(PAGES.length - 1, pageIndex + 1);
    if (nextIndex === pageIndex) return;
    listRef.current?.scrollToOffset({ offset: nextIndex * width, animated: true });
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.root} testID="onboardingScreen">
        <FloatingIconsBackground />

        <SafeAreaView style={styles.overlay}>
          <View style={styles.topBar}>
            <View style={styles.brandPill} testID="onboardingBrand">
              <Text style={styles.brandText}>SubSense</Text>
            </View>
            <Button
              title="Skip"
              variant="ghost"
              size="sm"
              onPress={finish}
              testID="onboardingSkip"
            />
          </View>

          <Animated.FlatList
            ref={(r) => {
              listRef.current = r;
            }}
            data={PAGES}
            keyExtractor={(i) => i.key}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            bounces={false}
            onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
              useNativeDriver: false,
              listener: (e) => {
                const x = (e as unknown as { nativeEvent?: { contentOffset?: { x?: number } } })
                  .nativeEvent?.contentOffset?.x;
                if (typeof x !== 'number') return;
                const idx = Math.round(x / width);
                if (idx !== pageIndex && idx >= 0 && idx < PAGES.length) {
                  setPageIndex(idx);
                }
              },
            })}
            scrollEventThrottle={16}
            renderItem={({ item, index }) => (
              <OnboardingPageCard page={item} index={index} width={width} scrollX={scrollX} />
            )}
            testID="onboardingPager"
          />

          <View style={styles.bottomBar}>
            <PaginationDots count={PAGES.length} width={width} scrollX={scrollX} />

            {pageIndex === PAGES.length - 1 ? (
              <Button
                title="Get Started"
                onPress={finish}
                testID="onboardingGetStarted"
                icon={<ArrowRight color="#fff" size={18} />}
                style={{ flexDirection: 'row-reverse' }} // Icon on right
              />
            ) : (
              <Button
                title="Next"
                onPress={next}
                testID="onboardingNext"
                icon={<ArrowRight color="#fff" size={18} />}
                style={{ flexDirection: 'row-reverse' }}
              />
            )}
          </View>
        </SafeAreaView>
      </View>
    </>
  );
}

function FloatingIconsBackground() {
  const theme = useAppTheme();
  const styles = useMemo(() => createBgStyles(theme), [theme]);

  const { width, height } = Dimensions.get('window');
  const useNativeDriver = Platform.OS !== 'web';

  const anims = useRef<
    { y: Animated.Value; x: number; size: number; label: string; color: string; opacity: number }[]
  >([]).current;

  if (anims.length === 0) {
    for (let i = 0; i < FLOATERS.length; i += 1) {
      const f = FLOATERS[i];
      const size = 44 + ((i * 7) % 18);
      const x = ((i * 97) % Math.max(1, width - size)) + 8;
      const startY = height + 40 + i * 26;
      anims.push({
        y: new Animated.Value(startY),
        x,
        size,
        label: f.label,
        color: f.color,
        opacity: 0.18 + ((i * 3) % 10) / 100,
      });
    }
  }

  useEffect(() => {
    const loops: Animated.CompositeAnimation[] = [];

    for (let i = 0; i < anims.length; i += 1) {
      const { y, size } = anims[i];
      const startY = height + 60 + i * 26;
      const endY = -120 - size;

      y.setValue(startY);

      const duration = 14_000 + (i % 4) * 2_200;
      const delay = (i % 6) * 700;

      const loop = Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(y, {
            toValue: endY,
            duration,
            useNativeDriver,
          }),
        ])
      );

      loop.start();
      loops.push(loop);
    }

    return () => {
      for (const l of loops) l.stop();
    };
  }, [anims, height, useNativeDriver]);

  return (
    <View style={styles.bg} pointerEvents="none" testID="onboardingBg">
      <View style={styles.glowA} />
      <View style={styles.glowB} />

      {anims.map((a, idx) => (
        <Animated.View
          key={`${a.label}_${idx}`}
          style={[
            styles.floater,
            {
              width: a.size,
              height: a.size,
              borderRadius: Math.round(a.size / 3),
              left: a.x,
              transform: [{ translateY: a.y }],
              opacity: a.opacity,
              backgroundColor: a.color,
            },
          ]}
        >
          <Text style={styles.floaterText}>{a.label}</Text>
        </Animated.View>
      ))}
    </View>
  );
}

function OnboardingPageCard({
  page,
  index,
  width,
  scrollX,
}: {
  page: OnboardingPage;
  index: number;
  width: number;
  scrollX: Animated.Value;
}) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

  const titleOpacity = scrollX.interpolate({
    inputRange,
    outputRange: [0.0, 1.0, 0.0],
    extrapolate: 'clamp',
  });

  const titleTranslate = scrollX.interpolate({
    inputRange,
    outputRange: [20, 0, -20],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.page, { width }]} testID={`onboardingPage_${page.key}`}>
      <View style={styles.card}>
        <Animated.View
          style={{ opacity: titleOpacity, transform: [{ translateY: titleTranslate }] }}
        >
          <View
            style={[
              styles.bigIcon,
              {
                backgroundColor: theme.isDark ? 'rgba(121,167,255,0.12)' : 'rgba(79,140,255,0.12)',
              },
            ]}
          >
            {page.icon === 'sparkles' ? (
              <Sparkles color={theme.colors.tint} size={26} />
            ) : page.icon === 'wallet' ? (
              <Wallet color={theme.colors.tint} size={26} />
            ) : page.icon === 'shield' ? (
              <ShieldCheck color={theme.colors.tint} size={26} />
            ) : (
              <Check color={theme.colors.tint} size={26} />
            )}
          </View>

          <Text style={styles.h1}>{page.title}</Text>
          <Text style={styles.p}>{page.description}</Text>
        </Animated.View>
      </View>
    </View>
  );
}

function PaginationDots({
  count,
  width,
  scrollX,
}: {
  count: number;
  width: number;
  scrollX: Animated.Value;
}) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.dots} testID="onboardingDots">
      {Array.from({ length: count }).map((_, i) => {
        const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
        const dotW = scrollX.interpolate({
          inputRange,
          outputRange: [8, 22, 8],
          extrapolate: 'clamp',
        });
        const dotOpacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.35, 1, 0.35],
          extrapolate: 'clamp',
        });
        return (
          <Animated.View
            key={i}
            style={[
              styles.dot,
              {
                width: dotW,
                opacity: dotOpacity,
                backgroundColor: theme.isDark ? 'rgba(236,242,255,0.55)' : 'rgba(15,23,42,0.45)',
              },
            ]}
          />
        );
      })}
    </View>
  );
}

function createBgStyles(theme: ReturnType<typeof useAppTheme>) {
  return StyleSheet.create({
    bg: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: theme.colors.background,
    },
    glowA: {
      position: 'absolute',
      top: -120,
      left: -120,
      width: 320,
      height: 320,
      borderRadius: 999,
      backgroundColor: theme.isDark ? 'rgba(121,167,255,0.12)' : 'rgba(79,140,255,0.14)',
    },
    glowB: {
      position: 'absolute',
      bottom: -160,
      right: -140,
      width: 380,
      height: 380,
      borderRadius: 999,
      backgroundColor: theme.isDark ? 'rgba(45,226,180,0.10)' : 'rgba(31,214,164,0.12)',
    },
    floater: {
      position: 'absolute',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.isDark ? 'rgba(236,242,255,0.20)' : 'rgba(15,23,42,0.12)',
    },
    floaterText: {
      color: '#fff',
      fontWeight: '900',
      letterSpacing: -0.2,
      fontSize: 12,
    },
  });
}

function createStyles(theme: ReturnType<typeof useAppTheme>) {
  const shadowColor = theme.isDark ? 'rgba(0,0,0,0.70)' : 'rgba(15,23,42,0.18)';

  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    overlay: {
      flex: 1,
    },
    topBar: {
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    brandPill: {
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: theme.isDark ? 'rgba(236,242,255,0.08)' : 'rgba(15,23,42,0.06)',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
    },
    brandText: {
      color: theme.colors.text,
      fontWeight: '900',
      letterSpacing: 0.5,
      fontSize: 12,
      textTransform: 'uppercase',
    },
    skip: {
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: theme.isDark ? 'rgba(236,242,255,0.08)' : 'rgba(15,23,42,0.06)',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
    },
    skipText: {
      color: theme.colors.text,
      fontWeight: '900',
      fontSize: 12,
      letterSpacing: -0.1,
    },
    page: {
      paddingHorizontal: 16,
      paddingTop: 26,
      paddingBottom: 16,
    },
    card: {
      flex: 1,
      borderRadius: 30,
      padding: 18,
      backgroundColor: theme.colors.cardAlt,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      shadowColor,
      shadowOpacity: 1,
      shadowRadius: 22,
      shadowOffset: { width: 0, height: 12 },
      elevation: 2,
      justifyContent: 'center',
      gap: 12,
    },
    bigIcon: {
      width: 56,
      height: 56,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 6,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
    },
    h1: {
      color: theme.colors.text,
      fontSize: 30,
      fontWeight: '900',
      letterSpacing: -1.0,
      lineHeight: 34,
      maxWidth: 320,
    },
    p: {
      color: theme.colors.secondaryText,
      fontSize: 14,
      lineHeight: 19,
      maxWidth: 340,
    },
    bottomBar: {
      paddingHorizontal: 16,
      paddingBottom: 18,
      gap: 12,
    },
    dots: {
      flexDirection: 'row',
      gap: 8,
      justifyContent: 'center',
      alignItems: 'center',
      height: 16,
    },
    dot: {
      height: 8,
      borderRadius: 999,
    },
    primary: {
      borderRadius: 18,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 10,
    },
    primaryText: {
      color: '#fff',
      fontWeight: '900',
      fontSize: 15,
      letterSpacing: -0.1,
    },
  });
}
