import React, { useMemo, useState } from 'react';
import { LayoutChangeEvent, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline, Rect } from 'react-native-svg';

import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { fontFamily, fontSize } from '../theme/typography';
import { illnessDayBoundaryHours, illnessDayFraction, illnessHourOffset } from '../state/dateUtils';
import { TempReading } from '../state/types';

interface Props {
  readings: TempReading[]; // any order
  feverStartISO: string;
  shadedStart?: number;
  shadedEnd?: number;
  settledLine?: number;
}

type ChartMode = 'daily' | 'hourly';

const CHART_HEIGHT = 200;
const TOP_PAD = 14;
const BOTTOM_PAD = 20;
const Y_AXIS_WIDTH = 28;
const HOUR_WIDTH = 22;

// Absolute clinical bounds the Y-axis will never go outside.
const ABS_Y_MIN = 35;
const ABS_Y_MAX = 41;

export function FeverCurveChart({ readings, feverStartISO, shadedStart = 3, shadedEnd = 7, settledLine = 37.5 }: Props) {
  const [mode, setMode] = useState<ChartMode>('daily');
  const [width, setWidth] = useState(300);
  function onLayout(e: LayoutChangeEvent) {
    setWidth(e.nativeEvent.layout.width);
  }

  const sorted = [...readings].sort((a, b) => new Date(a.atISO).getTime() - new Date(b.atISO).getTime());

  // Zoom the Y-axis to the actual readings (padded, rounded to whole degrees)
  // instead of always spanning the full clinical range — small swings stay readable.
  const { yMin, yMax } = useMemo(() => {
    const values = sorted.map((r) => r.celsius).concat(settledLine);
    const lo = Math.min(...values, 37);
    const hi = Math.max(...values, 38);
    const min = Math.max(ABS_Y_MIN, Math.floor(lo - 0.5));
    const max = Math.min(ABS_Y_MAX, Math.ceil(hi + 0.5));
    return max - min >= 2 ? { yMin: min, yMax: max } : { yMin: ABS_Y_MIN, yMax: ABS_Y_MAX };
  }, [sorted, settledLine]);

  const plotH = CHART_HEIGHT - TOP_PAD - BOTTOM_PAD;

  function yFor(celsius: number) {
    const clamped = Math.min(yMax, Math.max(yMin, celsius));
    return TOP_PAD + (1 - (clamped - yMin) / (yMax - yMin)) * plotH;
  }

  const yTicks: number[] = [];
  for (let t = yMin; t <= yMax; t += 1) yTicks.push(t);
  const settledY = yFor(settledLine);

  return (
    <View>
      <View style={styles.modeRow}>
        <View style={styles.modeToggle}>
          <Pressable onPress={() => setMode('daily')} style={[styles.modeBtn, mode === 'daily' && styles.modeBtnActive]}>
            <Text style={[styles.modeBtnText, mode === 'daily' && styles.modeBtnTextActive]}>Daily</Text>
          </Pressable>
          <Pressable onPress={() => setMode('hourly')} style={[styles.modeBtn, mode === 'hourly' && styles.modeBtnActive]}>
            <Text style={[styles.modeBtnText, mode === 'hourly' && styles.modeBtnTextActive]}>Hourly</Text>
          </Pressable>
        </View>
      </View>
      <View style={{ height: spacing.sm }} />

      <View style={styles.row}>
        <View style={[styles.yAxisCol, { height: plotH, marginTop: TOP_PAD }]}>
          {yTicks
            .slice()
            .reverse()
            .map((t) => (
              <Text key={t} style={styles.yLabel}>
                {t}
              </Text>
            ))}
        </View>

        {mode === 'daily' ? (
          <DailyPlot
            width={width}
            onLayout={onLayout}
            sorted={sorted}
            feverStartISO={feverStartISO}
            yFor={yFor}
            yTicks={yTicks}
            settledY={settledY}
            shadedStart={shadedStart}
            shadedEnd={shadedEnd}
          />
        ) : (
          <HourlyPlot
            containerWidth={width}
            onLayout={onLayout}
            sorted={sorted}
            feverStartISO={feverStartISO}
            yFor={yFor}
            yTicks={yTicks}
            settledY={settledY}
            shadedStart={shadedStart}
            shadedEnd={shadedEnd}
          />
        )}
      </View>

      <Text style={styles.caption}>
        {mode === 'daily'
          ? `Shaded band: days ${shadedStart}–${shadedEnd}. `
          : 'Scroll to see every hour. '}
        Dashed line: {settledLine} °C, where fever is counted as settled.
      </Text>
    </View>
  );
}

function DailyPlot({
  width,
  onLayout,
  sorted,
  feverStartISO,
  yFor,
  yTicks,
  settledY,
  shadedStart,
  shadedEnd,
}: {
  width: number;
  onLayout: (e: LayoutChangeEvent) => void;
  sorted: TempReading[];
  feverStartISO: string;
  yFor: (c: number) => number;
  yTicks: number[];
  settledY: number;
  shadedStart: number;
  shadedEnd: number;
}) {
  const days = sorted.map((r) => illnessDayFraction(feverStartISO, r.atISO));
  const maxDay = Math.max(8, ...days.map((d) => Math.ceil(d) + 1));
  const minDay = 1;

  function xFor(day: number) {
    return ((day - minDay) / (maxDay - minDay)) * width;
  }

  const points = sorted.map((r, i) => ({ x: xFor(days[i]), y: yFor(r.celsius) }));
  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');

  const bandX1 = xFor(shadedStart);
  const bandX2 = xFor(shadedEnd + 1);
  const dayTicks = Array.from({ length: maxDay }, (_, i) => i + 1);
  const plotTop = TOP_PAD;
  const plotBottom = CHART_HEIGHT - BOTTOM_PAD;

  return (
    <View style={{ flex: 1 }} onLayout={onLayout}>
      <Svg width={width} height={CHART_HEIGHT}>
        <Rect x={bandX1} y={plotTop} width={Math.max(0, bandX2 - bandX1)} height={plotBottom - plotTop} fill={colors.chartBand} />

        {yTicks.map((t) => (
          <Line key={t} x1={0} y1={yFor(t)} x2={width} y2={yFor(t)} stroke={colors.chartGrid} strokeWidth={1} />
        ))}

        <Line x1={0} y1={settledY} x2={width} y2={settledY} stroke={colors.chartDashed} strokeWidth={1.5} strokeDasharray="6,5" />

        {points.length > 1 && (
          <Polyline points={polylinePoints} fill="none" stroke={colors.chartLine} strokeWidth={1.5} opacity={0.6} />
        )}
        {points.map((p, i) => (
          <Circle key={sorted[i].id} cx={p.x} cy={p.y} r={5} fill={colors.chartLine} />
        ))}
      </Svg>

      <View style={styles.xAxisRow}>
        {dayTicks.map((d) => {
          const show = d % 2 === 1;
          return show ? (
            <Text key={d} style={[styles.xLabel, { position: 'absolute', left: xFor(d) - 8 }]}>
              D{d}
            </Text>
          ) : null;
        })}
      </View>
    </View>
  );
}

function HourlyPlot({
  containerWidth,
  onLayout,
  sorted,
  feverStartISO,
  yFor,
  yTicks,
  settledY,
  shadedStart,
  shadedEnd,
}: {
  containerWidth: number;
  onLayout: (e: LayoutChangeEvent) => void;
  sorted: TempReading[];
  feverStartISO: string;
  yFor: (c: number) => number;
  yTicks: number[];
  settledY: number;
  shadedStart: number;
  shadedEnd: number;
}) {
  const hourOffsets = sorted.map((r) => illnessHourOffset(feverStartISO, r.atISO));
  const nowHours = illnessHourOffset(feverStartISO, new Date().toISOString());
  const maxHourSeen = Math.max(24, nowHours, ...hourOffsets);
  const totalHours = Math.max(24, Math.ceil(maxHourSeen / 24) * 24);
  const chartWidth = Math.max(containerWidth, totalHours * HOUR_WIDTH);

  function xForHour(h: number) {
    return h * HOUR_WIDTH;
  }

  const points = sorted.map((r, i) => ({ x: xForHour(hourOffsets[i]), y: yFor(r.celsius) }));
  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');

  const bandX1 = xForHour(illnessDayBoundaryHours(feverStartISO, shadedStart));
  const bandX2 = xForHour(illnessDayBoundaryHours(feverStartISO, shadedEnd + 1));

  // Calendar-midnight boundaries, not evenly-spaced 24h blocks -- Day 1 can
  // be shorter than 24h depending on what time of day the fever started.
  const dayBoundaries: { hour: number; day: number }[] = [];
  for (let day = 1; ; day += 1) {
    const hour = illnessDayBoundaryHours(feverStartISO, day);
    if (hour > totalHours) break;
    dayBoundaries.push({ hour, day });
  }
  const plotTop = TOP_PAD;
  const plotBottom = CHART_HEIGHT - BOTTOM_PAD;

  return (
    <View style={{ flex: 1 }} onLayout={onLayout}>
      <ScrollView horizontal showsHorizontalScrollIndicator>
        <View>
          <Svg width={chartWidth} height={CHART_HEIGHT}>
            <Rect
              x={bandX1}
              y={plotTop}
              width={Math.max(0, bandX2 - bandX1)}
              height={plotBottom - plotTop}
              fill={colors.chartBand}
            />

            {yTicks.map((t) => (
              <Line key={t} x1={0} y1={yFor(t)} x2={chartWidth} y2={yFor(t)} stroke={colors.chartGrid} strokeWidth={1} />
            ))}

            {dayBoundaries.map(({ hour, day }) => (
              <Line
                key={day}
                x1={xForHour(hour)}
                y1={plotTop}
                x2={xForHour(hour)}
                y2={plotBottom}
                stroke={colors.borderStrong}
                strokeWidth={1}
              />
            ))}

            <Line
              x1={0}
              y1={settledY}
              x2={chartWidth}
              y2={settledY}
              stroke={colors.chartDashed}
              strokeWidth={1.5}
              strokeDasharray="6,5"
            />

            {points.length > 1 && (
              <Polyline points={polylinePoints} fill="none" stroke={colors.chartLine} strokeWidth={1.5} opacity={0.6} />
            )}
            {points.map((p, i) => (
              <Circle key={sorted[i].id} cx={p.x} cy={p.y} r={5} fill={colors.chartLine} />
            ))}
          </Svg>

          <View style={[styles.xAxisRow, { width: chartWidth }]}>
            {dayBoundaries.map(({ hour, day }) => (
              <Text key={day} style={[styles.xLabel, { position: 'absolute', left: xForHour(hour) + 4 }]}>
                D{day}
              </Text>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  modeRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 2,
  },
  modeBtn: {
    paddingVertical: 4,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
  },
  modeBtnActive: {
    backgroundColor: colors.primary,
  },
  modeBtnText: {
    fontFamily: fontFamily.baseBold,
    fontWeight: '600',
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  modeBtnTextActive: {
    color: colors.textOnPrimary,
  },
  row: {
    flexDirection: 'row',
  },
  yAxisCol: {
    width: Y_AXIS_WIDTH,
    justifyContent: 'space-between',
  },
  yLabel: {
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
  caption: {
    marginTop: spacing.md,
    marginLeft: Y_AXIS_WIDTH,
    fontFamily: fontFamily.base,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
});
