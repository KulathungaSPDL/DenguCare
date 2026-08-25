import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from 'react-native-svg';

import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { fontFamily, fontSize } from '../theme/typography';
import { describeArc, polarToCartesian } from './arcMath';

export interface GaugeSegment {
  key: string;
  ml: number;
  color: string;
}

interface Props {
  drinkSegments: GaugeSegment[];
  urineMl: number;
  onPressDrinks: () => void;
  onPressUrine: () => void;
}

const SIZE = 200;
const CENTER = SIZE / 2;
const OUTER_STROKE = 14;
const OUTER_RADIUS = CENTER - OUTER_STROKE / 2 - 3;
const RING_GAP = 7;
const INNER_STROKE = 11;
const INNER_RADIUS = OUTER_RADIUS - OUTER_STROKE / 2 - RING_GAP - INNER_STROKE / 2;
const GLOW_RADIUS = OUTER_STROKE * 2.6;

// Both rings sweep the long way around, sharing the same open gap at the
// bottom (the same shape as the original single-ring gauge).
const GAP_DEG = 40;
const TRACK_START = 180 + GAP_DEG / 2;
const TRACK_END = TRACK_START + (360 - GAP_DEG);
const SWEEP = 360 - GAP_DEG;

function buildArcs(segments: GaugeSegment[], targetMl: number) {
  let cumMl = 0;
  return segments
    .map((seg) => {
      const startMl = targetMl > 0 ? Math.min(cumMl, targetMl) : 0;
      cumMl += seg.ml;
      const endMl = targetMl > 0 ? Math.min(cumMl, targetMl) : 0;
      return {
        key: seg.key,
        color: seg.color,
        start: TRACK_START + (startMl / Math.max(1, targetMl)) * SWEEP,
        end: TRACK_START + (endMl / Math.max(1, targetMl)) * SWEEP,
      };
    })
    .filter((a) => a.end > a.start);
}

/** Combined fluid-balance gauge: an outer ring for today's drinks (segmented
 * by kind colour) and a concentric inner ring for urine, sharing one open
 * gap at the bottom — a small urine-logging button sits in that gap. */
export function FluidBalanceGauge({ drinkSegments, urineMl, onPressDrinks, onPressUrine }: Props) {
  const drinkMl = drinkSegments.reduce((sum, s) => sum + s.ml, 0);
  // Scale is whichever of drink/urine is larger today, not the daily target —
  // this gauge exists to show the gap between the two, so the bigger one
  // always reads as a full ring and the other reads short by exactly that
  // gap. E.g. 500 ml drunk with 0 ml urine shows drinks maxed out and urine
  // at zero, not both dwarfed by a 2000 ml daily target.
  const fullScaleMl = Math.max(drinkMl, urineMl, 1);
  const outerArcs = buildArcs(drinkSegments, fullScaleMl);
  const innerArcs = buildArcs([{ key: 'urine', ml: urineMl, color: colors.urineOut }], fullScaleMl);

  const glowColor = drinkSegments[0]?.color ?? colors.chartGrid;
  const glowPoint = polarToCartesian(CENTER, CENTER, OUTER_RADIUS, TRACK_START);
  const glowEndPoint = polarToCartesian(CENTER, CENTER, OUTER_RADIUS, TRACK_END);
  const colorKey = glowColor.replace(/[^a-zA-Z0-9]/g, '');
  const gradIdStart = `fbgStart-${colorKey}`;
  const gradIdEnd = `fbgEnd-${colorKey}`;

  const buttonPoint = polarToCartesian(CENTER, CENTER, (OUTER_RADIUS + INNER_RADIUS) / 2, 180);

  return (
    <Pressable style={styles.wrap} onPress={onPressDrinks} accessibilityRole="button">
      <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <Defs>
          <RadialGradient id={gradIdStart} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={glowColor} stopOpacity="0.6" />
            <Stop offset="0.5" stopColor={glowColor} stopOpacity="0.4" />
            <Stop offset="1" stopColor={glowColor} stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id={gradIdEnd} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={colors.borderStrong} stopOpacity="0.65" />
            <Stop offset="0.5" stopColor={colors.borderStrong} stopOpacity="0.45" />
            <Stop offset="1" stopColor={colors.borderStrong} stopOpacity="0" />
          </RadialGradient>
        </Defs>

        <Circle cx={glowPoint.x} cy={glowPoint.y + 5} r={GLOW_RADIUS} fill={`url(#${gradIdStart})`} />
        <Circle cx={glowEndPoint.x} cy={glowEndPoint.y + 5} r={GLOW_RADIUS} fill={`url(#${gradIdEnd})`} />

        {/* outer ring: drinks */}
        <Path
          d={describeArc(CENTER, CENTER, OUTER_RADIUS, TRACK_START, TRACK_END)}
          stroke={colors.chartGrid}
          strokeWidth={OUTER_STROKE}
          strokeLinecap="round"
          fill="none"
        />
        {outerArcs.map((a) => (
          <Path
            key={a.key}
            d={describeArc(CENTER, CENTER, OUTER_RADIUS, a.start, a.end)}
            stroke={a.color}
            strokeWidth={OUTER_STROKE}
            strokeLinecap="round"
            fill="none"
          />
        ))}

        {/* inner ring: urine */}
        <Path
          d={describeArc(CENTER, CENTER, INNER_RADIUS, TRACK_START, TRACK_END)}
          stroke={colors.chartGrid}
          strokeWidth={INNER_STROKE}
          strokeLinecap="round"
          fill="none"
        />
        {innerArcs.map((a) => (
          <Path
            key={a.key}
            d={describeArc(CENTER, CENTER, INNER_RADIUS, a.start, a.end)}
            stroke={a.color}
            strokeWidth={INNER_STROKE}
            strokeLinecap="round"
            fill="none"
          />
        ))}
      </Svg>

      <View style={styles.center} pointerEvents="none">
        <Text style={styles.centerValue}>{drinkMl} ml</Text>
        <View style={styles.centerDivider} />
        <Text style={[styles.centerValue, styles.centerValueMuted]}>{urineMl} ml</Text>
      </View>

      <Pressable
        onPress={onPressUrine}
        accessibilityRole="button"
        accessibilityLabel="Log urine"
        hitSlop={8}
        style={[styles.urineButton, { left: buttonPoint.x - 18, top: buttonPoint.y - 18 }]}
      >
        <Ionicons name="flask" size={16} color={colors.textOnPrimary} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: SIZE,
    height: SIZE,
    alignSelf: 'center',
  },
  center: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerValue: {
    fontFamily: fontFamily.monoBold,
    fontSize: fontSize.xl,
    color: colors.textPrimary,
  },
  centerValueMuted: {
    color: colors.urineOut,
  },
  centerDivider: {
    width: 24,
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  urineButton: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.urineOut,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
});
