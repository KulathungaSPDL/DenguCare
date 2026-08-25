import React, { useEffect, useRef } from 'react';
import { Animated, ScrollView, StyleSheet, Text } from 'react-native';

import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { fontFamily, fontSize } from '../theme/typography';

const TOTAL_DAYS = 10;

/** Horizontal scroll strip of "DAY N" chips, highlighting the current illness day. */
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
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {Array.from({ length: TOTAL_DAYS }, (_, i) => i + 1).map((day) => {
        const isCurrent = day === currentDay;

        return (
          <Animated.View
            key={day}
            style={[styles.box, isCurrent && styles.boxCurrent, isCurrent && { opacity: pulse }]}
          >
            <Text style={[styles.dayLabel, isCurrent && styles.dayLabelCurrent]}>DAY</Text>
            <Text style={[styles.dayNumber, isCurrent && styles.dayNumberCurrent]}>{day}</Text>
          </Animated.View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: 2,
    paddingRight: spacing.sm,
  },
  box: {
    width: 68,
    aspectRatio: 0.85,
    marginRight: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxCurrent: {
    backgroundColor: colors.dangerSoft,
    borderWidth: 1.5,
    borderColor: colors.borderDanger,
  },
  dayLabel: {
    fontFamily: fontFamily.baseBold,
    fontWeight: '700',
    fontSize: fontSize.xs,
    letterSpacing: 0.5,
    color: colors.textSecondary,
  },
  dayLabelCurrent: {
    color: colors.danger,
  },
  dayNumber: {
    marginTop: 2,
    fontFamily: fontFamily.baseExtraBold,
    fontSize: fontSize.xl,
    color: colors.textPrimary,
  },
  dayNumberCurrent: {
    color: colors.danger,
  },
});
