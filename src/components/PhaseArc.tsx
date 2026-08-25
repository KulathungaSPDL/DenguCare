import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { fontFamily, fontSize } from '../theme/typography';
import { describeArc } from './arcMath';

interface Band {
  key: string;
  label: string;
  days: number;
  color: string;
}

const BANDS: Band[] = [
  { key: 'fever', label: 'Fever phase', days: 2, color: colors.primary },
  { key: 'critical', label: 'Critical phase', days: 5, color: colors.warning },
  { key: 'recovery', label: 'Recovery phase', days: 3, color: colors.borderStrong },
];

const TOTAL_DAYS = BANDS.reduce((sum, b) => sum + b.days, 0);
const GAP_DEG = 5;
const SIZE = 96;
const STROKE = 11;
const RADIUS = SIZE / 2 - STROKE / 2 - 2;
const CENTER = SIZE / 2;
const VIEW_HEIGHT = SIZE / 2 + STROKE;

/** Half-circle gauge showing where the current illness day sits within the
 * three named phases (Fever / Critical / Recovery), replacing the old
 * tappable day-strip with an at-a-glance status readout. */
export function PhaseArc({ currentDay }: { currentDay: number }) {
  let cursor = -90;
  const segments = BANDS.map((band) => {
    const sweep = (band.days / TOTAL_DAYS) * 180;
    const start = cursor + GAP_DEG / 2;
    const end = cursor + sweep - GAP_DEG / 2;
    cursor += sweep;
    return { ...band, start, end };
  });

  let daysBefore = 0;
  const activeIndex = Math.max(
    0,
    BANDS.findIndex((band) => {
      daysBefore += band.days;
      return currentDay <= daysBefore;
    })
  );
  const activeBand = BANDS[activeIndex] ?? BANDS[BANDS.length - 1];
  const rangeStart = BANDS.slice(0, activeIndex).reduce((sum, b) => sum + b.days, 0) + 1;
  const rangeEnd = rangeStart + activeBand.days - 1;
  const critical = BANDS[1];
  const criticalStart = BANDS[0].days + 1;
  const criticalEnd = criticalStart + critical.days - 1;

  return (
    <View>
      <View style={styles.row}>
        <Svg width={SIZE} height={VIEW_HEIGHT} viewBox={`0 0 ${SIZE} ${VIEW_HEIGHT}`}>
          {segments.map((seg) => (
            <Path
              key={seg.key}
              d={describeArc(CENTER, CENTER, RADIUS, seg.start, seg.end)}
              stroke={seg.color}
              strokeWidth={STROKE}
              strokeLinecap="round"
              fill="none"
            />
          ))}
        </Svg>

        <Text style={styles.phaseTitle}>
          Phase {activeIndex + 1} (Days {rangeStart}-{rangeEnd}): {activeBand.label}
        </Text>
      </View>

      <Text style={styles.caption}>
        Days {criticalStart}-{criticalEnd}: the window when dengue can turn serious.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phaseTitle: {
    flex: 1,
    marginLeft: spacing.md,
    fontFamily: fontFamily.baseSemiBold,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  caption: {
    marginTop: spacing.sm,
    fontFamily: fontFamily.base,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
});
