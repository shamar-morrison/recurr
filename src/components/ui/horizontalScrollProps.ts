import { SPACING } from '@/src/constants/theme';

/**
 * Shared anti-bounce tuning for horizontal lists.
 *
 * Ported from ShowSeek mobile (`show-seek/src/components/ui/horizontalScrollProps.ts`)
 * so recurr's horizontal rows stop dead at the edge instead of rubber-banding.
 *
 * - `bounces: false` (iOS) kills end-of-list overshoot + spring-back.
 * - `alwaysBounceHorizontal: false` covers short rows that don't fill the viewport.
 * - `overScrollMode: 'never'` (Android) kills the edge glow.
 *
 * Note: `decelerationRate` is intentionally not enforced so fling distance
 * stays at the RN default (`normal`), preserving scroll momentum.
 *
 * Kept dependency-free (no list import) so ScrollView, FlatList,
 * Animated.FlatList, and LegendList can all share it.
 */
export const HORIZONTAL_SCROLL_PROPS = {
  horizontal: true,
  bounces: false,
  alwaysBounceHorizontal: false,
  overScrollMode: 'never',
} as const;

/**
 * Leading inset shared by section titles and carousel items.
 *
 * ShowSeek mapping: ShowSeek `SPACING.l` (24) -> recurr `SPACING.xxl` (24).
 */
export const HORIZONTAL_LIST_EDGE_INSET = SPACING.xxl;

/**
 * Inter-card gap for future card carousels.
 *
 * ShowSeek mapping: ShowSeek `SPACING.m` (16) -> recurr `SPACING.lg` (16).
 */
export const HORIZONTAL_LIST_CARD_GAP = SPACING.lg;

/**
 * Content-container inset for future card carousels that use
 * `marginRight: HORIZONTAL_LIST_CARD_GAP` on cards.
 *
 * A symmetric `paddingHorizontal: EDGE_INSET` container would end with
 * `EDGE_INSET + CARD_GAP` of trailing space versus `EDGE_INSET` leading.
 * Compensating `paddingRight` (`EDGE_INSET - CARD_GAP`) restores symmetry.
 */
export const HORIZONTAL_LIST_CONTENT_STYLE = {
  paddingLeft: SPACING.xxl,
  paddingRight: SPACING.xxl - SPACING.lg,
} as const;
