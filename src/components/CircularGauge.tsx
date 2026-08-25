import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { fontFamily, fontSize } from '../theme/typography';
import { describeArc } from './arcMath';

const SIZE = 108;
const STROKE = 10;
const CENTER = SIZE / 2;
const RADIUS = CENTER - STROKE / 2 - 2;
const GAP_DEG = 46;
const TRACK_START = 90 + GAP_DEG / 2;
const TRACK_END = TRACK_START + (360 - GAP_DEG);
const SWEEP = 360 - GAP_DEG;

interface Props {
  /** 0-1 */
  percent: number;
  color: string;
  trackColor: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  label: string;
  labelColor: string;
}

/** Compact ring gauge - icon centered, a status word below it, used for the
 * dashboard's hero status card. */
export function CircularGauge({ percent, color, trackColor, icon, iconColor, label, labelColor }: Props) {
  const clamped = Math.max(0, Math.min(1, percent));
  const valueEnd = TRACK_START + clamped * SWEEP;

  return (
    <View style={styles.wrap}>
      <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <Path
          d={describeArc(CENTER, CENTER, RADIUS, TRACK_START, TRACK_END)}
          stroke={trackColor}
          strokeWidth={STROKE}
          strokeLinecap="round"
          fill="none"
        />
        {clamped > 0 ? (
          <Path
            d={describeArc(CENTER, CENTER, RADIUS, TRACK_START, valueEnd)}
            stroke={color}
            strokeWidth={STROKE}
            strokeLinecap="round"
            fill="none"
          />
        ) : null}
      </Svg>
      <View style={styles.center} pointerEvents="none">
        <Ionicons name={icon} size={26} color={iconColor} />
        <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    marginTop: 4,
    fontFamily: fontFamily.baseBold,
    fontWeight: '700',
    fontSize: fontSize.xs,
  },
});
