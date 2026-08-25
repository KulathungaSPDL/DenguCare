import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { phaseLabel } from '../state/phase';
import { fontFamily, fontSize } from '../theme/typography';

const TOTAL_DAYS = 10;
const CRITICAL_DAYS = Array.from({ length: TOTAL_DAYS }, (_, i) => i + 1).filter(
  (day) => phaseLabel(day) === 'Critical phase'
);
const CRITICAL_START = CRITICAL_DAYS[0];
const CRITICAL_END = CRITICAL_DAYS[CRITICAL_DAYS.length - 1];

/** Row of day-number boxes 1-10, shading the critical-phase window and
 * pulsing the box for the current illness day so it draws the eye. */
export function DayStrip({ currentDay }: { currentDay: number }) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.35, duration: 1400, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1400, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View>
      <View style={styles.row}>
        {Array.from({ length: TOTAL_DAYS }, (_, i) => i + 1).map((day) => {
          const isCurrent = day === currentDay;
          const isCritical = phaseLabel(day) === 'Critical phase';

          return (
            <Animated.View
              key={day}
              style={[
                styles.box,
                isCritical && styles.boxCritical,
                isCurrent && styles.boxCurrent,
                isCurrent && { opacity: pulse },
              ]}
            >
              <Text style={[styles.dayText, isCurrent && styles.dayTextCurrent]}>{day}</Text>
            </Animated.View>
          );
        })}
      </View>

      <Text style={styles.caption}>
        Shaded days {CRITICAL_START}-{CRITICAL_END}: the window when dengue can turn serious.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  box: {
    flex: 1,
    aspectRatio: 1,
    marginHorizontal: 2,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxCritical: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.surfaceMutedBorder,
  },
  boxCurrent: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  dayText: {
    fontFamily: fontFamily.baseSemiBold,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  dayTextCurrent: {
    color: colors.textOnDark,
  },
  caption: {
    marginTop: spacing.sm,
    fontFamily: fontFamily.base,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
});
