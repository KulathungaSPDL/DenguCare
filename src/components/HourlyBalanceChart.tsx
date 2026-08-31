import React, { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { fontFamily, fontSize } from '../theme/typography';
import { HourBucket } from '../state/selectors';

interface Props {
  buckets: HourBucket[];
  hourlyGoalMl: number;
  tickHours?: number[];
}

const CHART_HEIGHT = 180;
const TOP_PAD = 10;
const BOTTOM_PAD = 20;
const AXIS_WIDTH = 34;

/** Catmull-Rom-to-Bezier smoothing: a curve through every point instead of
 * straight polyline segments between them. */
function smoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x},${points[0].y}`;

  let d = `M ${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }
  return d;
}

/** Two-curve hourly trend: drinks and urine each as their own smoothed curve
 * across the day, sharing one ml scale - so a balanced day reads as two
 * curves tracking close together, and a gap between them reads as exactly
 * that. */
export function HourlyBalanceChart({ buckets, hourlyGoalMl, tickHours = [0, 3, 6, 9, 12, 15, 18, 21] }: Props) {
  const { t } = useTranslation();
  const [width, setWidth] = useState(300);
  function onLayout(e: LayoutChangeEvent) {
    setWidth(e.nativeEvent.layout.width);
  }

  const plotH = CHART_HEIGHT - TOP_PAD - BOTTOM_PAD;

  const maxObserved = Math.max(...buckets.map((b) => Math.max(b.drinkMl, b.urineMl)), 0);
  const maxScale = Math.max(hourlyGoalMl * 1.3, maxObserved * 1.15, 50);

  const minHour = buckets[0]?.hour ?? 0;
  const maxHour = buckets[buckets.length - 1]?.hour ?? 23;
  const hourSpan = Math.max(1, maxHour - minHour);

  function xFor(hour: number) {
    return ((hour - minHour) / hourSpan) * width;
  }
  function yFor(ml: number) {
    const clamped = Math.min(maxScale, Math.max(0, ml));
    return TOP_PAD + (1 - clamped / maxScale) * plotH;
  }

  const drinkPoints = buckets.map((b) => ({ hour: b.hour, x: xFor(b.hour), y: yFor(b.drinkMl), ml: b.drinkMl }));
  const urinePoints = buckets.map((b) => ({ hour: b.hour, x: xFor(b.hour), y: yFor(b.urineMl), ml: b.urineMl }));
  const drinkCurve = smoothPath(drinkPoints);
  const urineCurve = smoothPath(urinePoints);

  const goalY = yFor(hourlyGoalMl);
  const yTicks = [0, Math.round(maxScale / 2), Math.round(maxScale)];

  return (
    <View>
      <View style={styles.row}>
        <View style={[styles.axisCol, { height: plotH, marginTop: TOP_PAD }]}>
          {yTicks
            .slice()
            .reverse()
            .map((v) => (
              <Text key={v} style={styles.axisLabel}>
                {v}
              </Text>
            ))}
        </View>

        <View style={{ flex: 1 }} onLayout={onLayout}>
          <Svg width={width} height={CHART_HEIGHT}>
            {yTicks.map((v) => (
              <Line key={v} x1={0} y1={yFor(v)} x2={width} y2={yFor(v)} stroke={colors.chartGrid} strokeWidth={1} />
            ))}

            <Line x1={0} y1={goalY} x2={width} y2={goalY} stroke={colors.chartDashed} strokeWidth={1.5} strokeDasharray="6,5" />

            <Path d={drinkCurve} fill="none" stroke={colors.drinkIn} strokeWidth={2} opacity={0.85} strokeLinecap="round" />
            <Path d={urineCurve} fill="none" stroke={colors.urineOut} strokeWidth={2} opacity={0.85} strokeLinecap="round" />

            {drinkPoints.map((p) =>
              p.ml > 0 ? <Circle key={`d-${p.hour}`} cx={p.x} cy={p.y} r={4} fill={colors.drinkIn} /> : null
            )}
            {urinePoints.map((p) =>
              p.ml > 0 ? <Circle key={`u-${p.hour}`} cx={p.x} cy={p.y} r={4} fill={colors.urineOut} /> : null
            )}
          </Svg>

          <View style={styles.xAxisRow}>
            {buckets.map((b) =>
              tickHours.includes(b.hour) ? (
                <Text key={b.hour} style={[styles.xLabel, { position: 'absolute', left: xFor(b.hour) - 10 }]}>
                  {b.hour}h
                </Text>
              ) : null
            )}
          </View>
        </View>
      </View>

      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: colors.drinkIn }]} />
          <Text style={styles.legendText}>{t('dayEntriesModal.drinksTab')}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: colors.urineOut }]} />
          <Text style={styles.legendText}>{t('dayEntriesModal.urineTab')}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={styles.dashLegend} />
          <Text style={styles.legendText}>{t('fluidsScreen.hourlyGoalLegend', { ml: hourlyGoalMl })}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  axisCol: {
    width: AXIS_WIDTH,
    justifyContent: 'space-between',
  },
  axisLabel: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  xAxisRow: {
    height: 16,
    marginTop: spacing.xs,
  },
  xLabel: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.md,
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.lg,
    marginBottom: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  dashLegend: {
    width: 14,
    height: 0,
    borderTopWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.chartDashed,
    marginRight: spacing.xs,
  },
  legendText: {
    fontFamily: fontFamily.base,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
});
