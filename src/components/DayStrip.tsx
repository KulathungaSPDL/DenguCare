import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { isCriticalPhase } from '../state/phase';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { fontFamily, fontSize } from '../theme/typography';

const TOTAL_DAYS = 10;

/** Row of "DAY N" chips spanning the full card width — every day visible at
 * once, no scrolling. Days 3-7 (the critical phase) are tinted light red;
 * the rest stay white. The current day gets an extra pulsing border. */
export function DayStrip({ currentDay }: { currentDay: number }) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.55, duration: 1400, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1400, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View style={styles.row}>
      {Array.from({ length: TOTAL_DAYS }, (_, i) => i + 1).map((day) => {
        const isCurrent = day === currentDay;
        const isCritical = isCriticalPhase(day);

        return (
          <Animated.View
            key={day}
            style={[
              styles.box,
              isCritical ? styles.boxCritical : styles.boxNeutral,
              isCurrent && styles.boxCurrent,
              isCurrent && { opacity: pulse },
            ]}
          >
            <Text style={[styles.dayNumber, isCritical && styles.dayNumberCritical]}>{day}</Text>
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  box: {
    flex: 1,
    aspectRatio: 0.85,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxNeutral: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  boxCritical: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.borderDanger,
  },
  boxCurrent: {
    borderWidth: 2,
    borderColor: colors.danger,
  },
  dayNumber: {
    fontFamily: fontFamily.baseExtraBold,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  dayNumberCritical: {
    color: colors.danger,
  },
});
