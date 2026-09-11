import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react-native';
import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/src/context/ThemeContext';

export type { IconSvgElement };

/**
 * Central app icon component backed by HugeIcons.
 *
 * Mirrors the terse icon prop shape the codebase relies on
 * (`size` / `color`) so call sites stay terse:
 * `<AppIcon icon={Search01Icon} size={22} color={colors.text} />`.
 *
 * Notes:
 * - `fill` reproduces Phosphor's filled states (e.g. rated stars):
 *   pass the same color as `color` to fill, or `'transparent'`/omit for
 *   outline. It is only forwarded when defined — forwarding
 *   `fill={undefined}` would clobber the renderer's `fill="none"` default
 *   and paint every glyph black.
 * - Only pass `fill` for solid-object glyphs without hollow interiors
 *   (star, sparkles, bell, crown, funnel, chart bars). Never for glyphs with
 *   hollow containers or inner detail (disc/circle outlines, bills, coin
 *   stacks, check-circles, category art) — the fill inherits into every
 *   sub-shape and floods them solid. Render check-circles as a colored
 *   circle `View` with a white `Tick02Icon` instead (see payment-history).
 * - Default `strokeWidth` is left undefined so icons render at the HugeIcons
 *   1.5px design weight. Pass explicitly to override.
 * - `style` is applied via a wrapper View because HugeIconsIcon accepts a
 *   `style` prop but silently drops it instead of applying it to the Svg.
 */
interface AppIconProps {
  icon: IconSvgElement;
  size?: number;
  color?: string;
  strokeWidth?: number;
  fill?: string;
  opacity?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function AppIcon({
  icon,
  size = 24,
  color,
  strokeWidth,
  fill,
  opacity,
  style,
  testID,
}: AppIconProps) {
  const { colors } = useTheme();
  const resolvedColor = color ?? colors.text;
  const renderedIcon = (
    <HugeiconsIcon
      icon={icon}
      size={size}
      color={resolvedColor}
      {...(strokeWidth !== undefined ? { strokeWidth } : null)}
      {...(fill !== undefined ? { fill } : null)}
      {...(opacity !== undefined ? { opacity } : null)}
      {...(style === undefined && testID !== undefined ? { testID } : null)}
    />
  );

  if (style === undefined) {
    return renderedIcon;
  }

  return (
    <View style={style} {...(testID !== undefined ? { testID } : null)}>
      {renderedIcon}
    </View>
  );
}
