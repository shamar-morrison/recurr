import { router, Stack } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Animated, Dimensions, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

import { AppColors } from '@/constants/colors';
import { Button } from '@/src/components/ui/Button';
import { useAuth } from '@/src/features/auth/AuthProvider';
import {
  BellRingingIcon,
  CaretRightIcon,
  CoinsIcon,
  GlobeIcon,
  ShieldWarningIcon,
  SparkleIcon,
} from 'phosphor-react-native';

const { width, height } = Dimensions.get('window');

type OnboardingPage = {
  key: string;
  title: string;
  description: string;
  color: string;
  accent: string;
};

const PAGES: OnboardingPage[] = [
  {
    key: 'track',
    title: 'Track every\nsubscription',
    description:
      'Netflix, Spotify, Gym, Utilities. Keep everything in one beautiful, organized list.',
    color: '#8B5CF6', // Violet
    accent: '#A78BFA',
  },
  {
    key: 'alerts',
    title: 'Never miss a\nrenewal date',
    description: 'Get notified before you pay. We’ll tell you exactly what’s due and when.',
    color: '#F59E0B', // Amber
    accent: '#FCD34D',
  },
  {
    key: 'insights',
    title: 'Know where your\nmoney goes',
    description: 'Spot rising costs and unused services. Take back control of your monthly spend.',
    color: '#10B981', // Emerald
    accent: '#34D399',
  },
  {
    key: 'start',
    title: 'Ready to take\ncontrol?',
    description: 'Join thousands of users saving money with Recurr today.',
    color: AppColors.tint,
    accent: '#818CF8',
  },
];

export default function OnboardingScreen() {
  const { markOnboardingComplete } = useAuth();
  const scrollX = useRef(new Animated.Value(0)).current;
  const listRef = useRef<Animated.FlatList<OnboardingPage> | null>(null);
  const [pageIndex, setPageIndex] = useState<number>(0);

  const finish = async () => {
    await markOnboardingComplete();
    router.replace('/auth');
  };

  const next = () => {
    const nextIndex = Math.min(PAGES.length - 1, pageIndex + 1);
    if (nextIndex === pageIndex) {
      if (pageIndex === PAGES.length - 1) finish();
      return;
    }
    listRef.current?.scrollToOffset({ offset: nextIndex * width, animated: true });
  };

  const skip = async () => {
    finish();
  };

  // Background Color Animation
  const backgroundColor = scrollX.interpolate({
    inputRange: PAGES.map((_, i) => i * width),
    outputRange: PAGES.map((p) => p.color),
  });

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.root} testID="onboardingScreen">
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor, opacity: 0.1 }]} />

        {/* Decorative Background Elements */}
        <AnimatedBackground pageIndex={pageIndex} scrollX={scrollX} />

        <SafeAreaView style={styles.overlay}>
          <View style={styles.topBar}>
            <View />
            <Button
              title="Skip"
              variant="ghost"
              size="sm"
              onPress={skip}
              style={{ shadowOpacity: 0, elevation: 0 }}
              testID="onboardingSkip"
            />
          </View>

          <Animated.FlatList
            ref={listRef}
            data={PAGES}
            keyExtractor={(i) => i.key}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            bounces={false}
            onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
              useNativeDriver: false, // backgroundColor interpolation needs false
              listener: (e: any) => {
                const x = e.nativeEvent.contentOffset.x;
                const idx = Math.round(x / width);
                if (idx !== pageIndex) setPageIndex(idx);
              },
            })}
            scrollEventThrottle={16}
            renderItem={({ item, index }) => (
              <OnboardingPageContent item={item} index={index} scrollX={scrollX} />
            )}
          />

          <View style={styles.bottomBar}>
            <PaginationDots count={PAGES.length} scrollX={scrollX} />

            <View style={styles.buttonContainer}>
              <Button
                title={pageIndex === PAGES.length - 1 ? 'Get Started' : 'Next'}
                onPress={next}
                variant="primary"
                size="lg"
                style={[styles.mainButton, { backgroundColor: PAGES[pageIndex].color }]}
                textStyle={{ fontSize: 16 }}
                icon={<CaretRightIcon color="#fff" size={20} />}
              />
            </View>
          </View>
        </SafeAreaView>
      </View>
    </>
  );
}

function AnimatedBackground({
  pageIndex,
  scrollX,
}: {
  pageIndex: number;
  scrollX: Animated.Value;
}) {
  // Helper to interpolate opacity for each page's background elements
  const getOpacity = (index: number) => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
    return scrollX.interpolate({
      inputRange,
      outputRange: [0, 1, 0],
      extrapolate: 'clamp',
    });
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Dynamic gradient bubbles or shapes could act as background here that change per page */}
      {PAGES.map((page, index) => (
        <Animated.View
          key={`bg-${index}`}
          style={[StyleSheet.absoluteFill, { opacity: getOpacity(index) }]}
        >
          <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
            <Defs>
              <LinearGradient id={`grad-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={page.color} stopOpacity="0.05" />
                <Stop offset="100%" stopColor={page.accent} stopOpacity="0.2" />
              </LinearGradient>
            </Defs>
            <Circle
              cx={width * 0.8}
              cy={height * 0.2}
              r={width * 0.6}
              fill={`url(#grad-${index})`}
            />
            <Circle
              cx={width * 0.1}
              cy={height * 0.6}
              r={width * 0.4}
              fill={`url(#grad-${index})`}
            />
          </Svg>
        </Animated.View>
      ))}
    </View>
  );
}

function OnboardingPageContent({
  item,
  index,
  scrollX,
}: {
  item: OnboardingPage;
  index: number;
  scrollX: Animated.Value;
}) {
  const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

  const scale = scrollX.interpolate({
    inputRange,
    outputRange: [0.8, 1, 0.8],
    extrapolate: 'clamp',
  });

  const opacity = scrollX.interpolate({
    inputRange,
    outputRange: [0, 1, 0],
    extrapolate: 'clamp',
  });

  const translateText = scrollX.interpolate({
    inputRange,
    outputRange: [50, 0, -50],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.pageContainer]}>
      <Animated.View style={[styles.visualContainer, { transform: [{ scale }], opacity }]}>
        {item.key === 'track' && <VisualTrack />}
        {item.key === 'alerts' && <VisualAlerts />}
        {item.key === 'insights' && <VisualInsights />}
        {item.key === 'start' && <VisualStart />}
      </Animated.View>

      <Animated.View
        style={[styles.textContainer, { opacity, transform: [{ translateX: translateText }] }]}
      >
        <Text style={[styles.title, { color: item.color }]}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </Animated.View>
    </View>
  );
}

// --- VISUALS ---

function VisualTrack() {
  return (
    <View style={styles.visualCard}>
      <View style={styles.trackList}>
        <View style={styles.row}>
          <View style={[styles.iconBox, { backgroundColor: '#E50914' }]}>
            <Text style={styles.iconText}>N</Text>
          </View>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>Netflix Premium</Text>
            <Text style={styles.rowSubtitle}>$22.99 • Monthly</Text>
          </View>
        </View>
        <View style={styles.row}>
          <View style={[styles.iconBox, { backgroundColor: '#1DB954' }]}>
            <Text style={styles.iconText}>S</Text>
          </View>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>Spotify Duo</Text>
            <Text style={styles.rowSubtitle}>$14.99 • Monthly</Text>
          </View>
        </View>
        <View style={styles.row}>
          <View style={[styles.iconBox, { backgroundColor: '#0070D1' }]}>
            <Text style={styles.iconText}>P</Text>
          </View>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>PlayStation Plus</Text>
            <Text style={styles.rowSubtitle}>$79.99 • Yearly</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function VisualAlerts() {
  return (
    <View style={styles.visualCard}>
      <View style={styles.alertCard}>
        <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
          <BellRingingIcon size={24} color="#D97706" />
        </View>
        <Text style={styles.alertTitle}>Payment Reminder</Text>
        <Text style={styles.alertDesc}>Netflix is due tomorrow!</Text>
        <View style={styles.alertAmount}>
          <Text style={styles.alertAmountText}>$22.99</Text>
        </View>
      </View>
      <View style={[styles.alertCard, styles.alertCardBack]}></View>
    </View>
  );
}

function VisualInsights() {
  return (
    <View style={styles.visualCard}>
      <View style={styles.chartContainer}>
        <View style={styles.chartBarGroup}>
          <View style={[styles.chartBar, { height: 60, backgroundColor: '#E5E7EB' }]} />
          <View style={[styles.chartBar, { height: 85, backgroundColor: '#E5E7EB' }]} />
          <View style={[styles.chartBar, { height: 120, backgroundColor: '#10B981' }]} />
          <View style={[styles.chartBar, { height: 90, backgroundColor: '#E5E7EB' }]} />
        </View>
        <View style={styles.doughnut}>
          <View style={styles.doughnutInner}>
            <Text style={styles.doughnutText}>$142</Text>
            <Text style={styles.doughnutLabel}>per month</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function VisualStart() {
  return (
    <View style={styles.visualCard}>
      <View style={styles.logoContainer}>
        <CoinsIcon size={64} color={AppColors.tint} weight="fill" />
      </View>

      <View style={styles.bulletList}>
        <View style={styles.bulletRow}>
          <SparkleIcon size={20} color={AppColors.tint} />
          <Text style={styles.bulletText}>Smart Insights</Text>
        </View>
        <View style={styles.bulletRow}>
          <ShieldWarningIcon size={20} color={AppColors.tint} />
          <Text style={styles.bulletText}>Secure Data</Text>
        </View>
        <View style={styles.bulletRow}>
          <GlobeIcon size={20} color={AppColors.tint} />
          <Text style={styles.bulletText}>Global Currencies</Text>
        </View>
      </View>
    </View>
  );
}

function PaginationDots({ count, scrollX }: { count: number; scrollX: Animated.Value }) {
  return (
    <View style={styles.dots}>
      {Array.from({ length: count }).map((_, i) => {
        const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
        const dotWidth = scrollX.interpolate({
          inputRange,
          outputRange: [8, 24, 8],
          extrapolate: 'clamp',
        });
        const dotColor = scrollX.interpolate({
          inputRange,
          outputRange: ['#D1D5DB', '#4B5563', '#D1D5DB'],
          extrapolate: 'clamp',
        });

        return (
          <Animated.View
            key={i}
            style={[styles.dot, { width: dotWidth, backgroundColor: dotColor }]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  overlay: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  pageContainer: {
    width,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  visualContainer: {
    width: width * 0.85,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  visualCard: {
    width: '100%',
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.08,
    shadowRadius: 30,
    elevation: 5,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  textContainer: {
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 40,
    letterSpacing: -1,
  },
  description: {
    fontSize: 17,
    color: AppColors.secondaryText,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 280,
  },
  bottomBar: {
    paddingHorizontal: 32,
    paddingBottom: Platform.OS === 'ios' ? 0 : 24,
    height: 130,
    justifyContent: 'flex-start',
    gap: 32,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    height: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  buttonContainer: {
    width: '100%',
  },
  mainButton: {
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 4,
  },

  trackList: {
    width: '100%',
    gap: 12,
  },
  // Visual Track Styles
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    width: '100%',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 20,
    // marginBottom: 12, // Removed
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20,
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  rowSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  floatBadge: {
    position: 'absolute',
    bottom: 12,
    borderRadius: 20,
    backgroundColor: '#111827',
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  floatBadgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },

  // Visual Alerts Styles
  alertCard: {
    width: '85%',
    aspectRatio: 0.8,
    backgroundColor: '#fff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  alertCardBack: {
    position: 'absolute',
    top: 32,
    transform: [{ scale: 0.9 }, { translateY: 10 }],
    zIndex: 1,
    backgroundColor: '#F9FAFB',
    opacity: 0.5,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 8,
  },
  alertDesc: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  alertAmount: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  alertAmountText: {
    color: '#EF4444',
    fontWeight: 'bold',
    fontSize: 18,
  },

  // Visual Insights Styles
  chartContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartBarGroup: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 16,
    marginBottom: 32,
    height: 120,
  },
  chartBar: {
    width: 24,
    borderRadius: 8,
  },
  doughnut: {
    width: 140,
    height: 140,
    marginTop: -20,
    borderRadius: 70,
    borderWidth: 12,
    borderColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftColor: '#E5E7EB', // mock 'segment'
    transform: [{ rotate: '45deg' }],
  },
  doughnutInner: {
    transform: [{ rotate: '-45deg' }],
    alignItems: 'center',
  },
  doughnutText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#1F2937',
    lineHeight: 32,
  },
  doughnutLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },

  // Visual Start
  logoContainer: {
    width: 96,
    height: 96,
    backgroundColor: 'rgba(94, 56, 248, 0.1)',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  bulletList: {
    gap: 16,
    alignItems: 'flex-start',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bulletText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
});
