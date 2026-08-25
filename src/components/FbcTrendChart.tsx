import React, { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { fontFamily, fontSize } from '../theme/typography';
import { illnessDayFraction } from '../state/dateUtils';
import { BloodReport } from '../state/types';

interface Props {
  reports: BloodReport[]; // any order
  feverStartISO: string;
}

const CHART_HEIGHT = 200;
const TOP_PAD = 14;
const BOTTOM_PAD = 20;
const AXIS_WIDTH = 34;

const PLATELET_MIN = 0;
const PLATELET_MAX = 300; // x10^3/uL - dengue-critical threshold sits at 100
const HCT_MIN = 30;
const HCT_MAX = 55;

/** Dual-axis SVG chart mirroring FeverCurveChart's layout: platelets on the
 * left axis (falling as dengue progresses), haematocrit on the right axis
 * (rising with plasma leakage), sharing an illness-day x-axis. */
export function FbcTrendChart({ reports, feverStartISO }: Props) {
  const { t } = useTranslation();
  const [width, setWidth] = useState(300);
  function onLayout(e: LayoutChangeEvent) {
    setWidth(e.nativeEvent.layout.width);
  }

  const sorted = [...reports].sort((a, b) => new Date(a.atISO).getTime() - new Date(b.atISO).getTime());
  const days = sorted.map((r) => illnessDayFraction(feverStartISO, r.atISO));
  const maxDay = Math.max(8, ...days.map((d) => Math.ceil(d) + 1));
  const minDay = 1;

  const plotH = CHART_HEIGHT - TOP_PAD - BOTTOM_PAD;

  function xFor(day: number) {
    return ((day - minDay) / (maxDay - minDay)) * width;
  }
  function yForPlatelet(value: number) {
    const clamped = Math.min(PLATELET_MAX, Math.max(PLATELET_MIN, value));
    return TOP_PAD + (1 - (clamped - PLATELET_MIN) / (PLATELET_MAX - PLATELET_MIN)) * plotH;
  }
  function yForHct(value: number) {
    const clamped = Math.min(HCT_MAX, Math.max(HCT_MIN, value));
    return TOP_PAD + (1 - (clamped - HCT_MIN) / (HCT_MAX - HCT_MIN)) * plotH;
  }

  const plateletPoints = sorted
    .map((r, i) => (r.plateletCount != null ? { x: xFor(days[i]), y: yForPlatelet(r.plateletCount), id: r.id } : null))
    .filter((p): p is { x: number; y: number; id: string } => p != null);
  const hctPoints = sorted
    .map((r, i) => (r.haematocritPct != null ? { x: xFor(days[i]), y: yForHct(r.haematocritPct), id: r.id } : null))
    .filter((p): p is { x: number; y: number; id: string } => p != null);

  const plateletLinePoints = plateletPoints.map((p) => `${p.x},${p.y}`).join(' ');
  const hctLinePoints = hctPoints.map((p) => `${p.x},${p.y}`).join(' ');

  const plateletTicks = [0, 100, 200, 300];
  const hctTicks = [30, 40, 50];
  const dayTicks = Array.from({ length: maxDay }, (_, i) => i + 1);

  return (
    <View>
      <Text style={styles.chartTitle}>{t('fbc.chartTitle')}</Text>
      <View style={{ height: spacing.sm }} />
      <View style={styles.row}>
        <View style={[styles.axisCol, { height: plotH, marginTop: TOP_PAD }]}>
          {plateletTicks
            .slice()
            .reverse()
            .map((v) => (
              <Text key={v} style={[styles.axisLabel, { color: colors.plateletLine }]}>
                {v}
              </Text>
            ))}
        </View>

        <View style={{ flex: 1 }} onLayout={onLayout}>
          <Svg width={width} height={CHART_HEIGHT}>
            {hctTicks.map((v) => (
              <Line key={v} x1={0} y1={yForHct(v)} x2={width} y2={yForHct(v)} stroke={colors.chartGrid} strokeWidth={1} />
            ))}

            {plateletPoints.length > 1 && (
              <Polyline points={plateletLinePoints} fill="none" stroke={colors.plateletLine} strokeWidth={1.5} opacity={0.7} />
            )}
            {plateletPoints.map((p) => (
              <Circle key={`platelet-${p.id}`} cx={p.x} cy={p.y} r={4.5} fill={colors.plateletLine} />
            ))}

            {hctPoints.length > 1 && (
              <Polyline points={hctLinePoints} fill="none" stroke={colors.hctLine} strokeWidth={1.5} opacity={0.7} />
            )}
            {hctPoints.map((p) => (
              <Circle key={`hct-${p.id}`} cx={p.x} cy={p.y} r={4.5} fill={colors.hctLine} />
            ))}
          </Svg>

          <View style={styles.xAxisRow}>
            {dayTicks.map((d) => {
              const show = d === 1 || d % 2 === 0;
              return show ? (
                <Text key={d} style={[styles.xLabel, { position: 'absolute', left: xFor(d) - 8 }]}>
                  D{d}
                </Text>
              ) : null;
            })}
          </View>
        </View>

        <View style={[styles.axisCol, { height: plotH, marginTop: TOP_PAD }]}>
          {hctTicks
            .slice()
            .reverse()
            .map((v) => (
              <Text key={v} style={[styles.axisLabel, { color: colors.hctLine }]}>
                {v}%
              </Text>
            ))}
        </View>
      </View>

      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.plateletLine }]} />
          <Text style={styles.legendText}>{t('fbc.plateletsAxis')}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.hctLine }]} />
          <Text style={styles.legendText}>{t('fbc.hctAxis')}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chartTitle: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.xs,
    letterSpacing: 1,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
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
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  legendText: {
    fontFamily: fontFamily.base,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
});
