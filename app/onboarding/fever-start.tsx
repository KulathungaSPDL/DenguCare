import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '../../src/components/Buttons';
import { Card } from '../../src/components/Card';
import { DateTimeField } from '../../src/components/DateTimeField';
import { Header } from '../../src/components/Header';
import { Screen } from '../../src/components/Screen';
import { useStore } from '../../src/state/store';
import { illnessDayNumber } from '../../src/state/dateUtils';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { fontFamily, fontSize } from '../../src/theme/typography';

function combine(date: Date, time: Date): Date {
  const out = new Date(date);
  out.setHours(time.getHours(), time.getMinutes(), 0, 0);
  return out;
}

export default function FeverStartScreen() {
  const { actions } = useStore();
  const [feverStart, setFeverStart] = useState(new Date());

  const dayNumber = useMemo(() => illnessDayNumber(feverStart.toISOString()), [feverStart]);

  function onStart() {
    actions.startIllness(feverStart.toISOString());
    router.replace('/(tabs)');
  }

  return (
    <Screen>
      <Header
        kicker="Step 2 of 2"
        title="When did the fever start?"
        subtitle="Everything in dengue is counted from the first day of fever. Day 1 is the day it began, even if it started at night."
      />

      <View style={styles.row}>
        <DateTimeField
          label="First day of fever"
          mode="date"
          value={feverStart}
          maximumDate={new Date()}
          onChange={(d) => setFeverStart((prev) => combine(d, prev))}
        />
        <View style={{ width: spacing.md }} />
        <DateTimeField
          label="Time"
          mode="time"
          value={feverStart}
          onChange={(t) => setFeverStart((prev) => combine(prev, t))}
        />
      </View>

      <Card style={styles.dayCard}>
        <Text style={styles.dayKicker}>You are on</Text>
        <Text style={styles.dayNumber}>Day {dayNumber}</Text>
        <Text style={styles.daySubtitle}>Fever phase · counted in Asia/Colombo</Text>
      </Card>

      <PrimaryButton label="Start tracking" onPress={onStart} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginBottom: spacing.xl,
  },
  dayCard: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    marginBottom: spacing.xl,
  },
  dayKicker: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.xs,
    letterSpacing: 1.2,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  dayNumber: {
    fontFamily: fontFamily.baseBold,
    fontWeight: '800',
    fontSize: 56,
    color: colors.textPrimary,
  },
  daySubtitle: {
    marginTop: spacing.sm,
    fontFamily: fontFamily.base,
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
});
