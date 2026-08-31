import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppTopBar } from '../../src/components/AppTopBar';
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
  const { t } = useTranslation();
  const { actions } = useStore();
  const [feverStart, setFeverStart] = useState(new Date());

  const dayNumber = useMemo(() => illnessDayNumber(feverStart.toISOString()), [feverStart]);

  function onStart() {
    actions.startIllness(feverStart.toISOString());
    router.replace('/(tabs)');
  }

  return (
    <Screen>
      <AppTopBar
        variant="back"
        title={t('feverStart.title')}
        subtitle={t('feverStart.subtitle')}
      />
      <Header
        title={t('feverStart.headerTitle')}
        subtitle={t('feverStart.headerSubtitle')}
      />

      <View style={styles.row}>
        <DateTimeField
          label={t('feverStart.firstDayLabel')}
          mode="date"
          value={feverStart}
          maximumDate={new Date()}
          onChange={(d) => setFeverStart((prev) => combine(d, prev))}
        />
        <View style={{ width: spacing.md }} />
        <DateTimeField
          label={t('common.time')}
          mode="time"
          value={feverStart}
          onChange={(tm) => setFeverStart((prev) => combine(prev, tm))}
        />
      </View>

      <Card style={styles.dayCard}>
        <Text style={styles.dayKicker}>{t('feverStart.youAreOn')}</Text>
        <Text style={styles.dayNumber}>{t('feverStart.day', { day: dayNumber })}</Text>
        <Text style={styles.daySubtitle}>{t('feverStart.daySubtitle')}</Text>
      </Card>

      <PrimaryButton label={t('feverStart.startButton')} onPress={onStart} />
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
