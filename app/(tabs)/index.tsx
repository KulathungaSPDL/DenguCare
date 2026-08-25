import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AmountEntryModal } from '../../src/components/AmountEntryModal';
import { Banner } from '../../src/components/Banner';
import { Card } from '../../src/components/Card';
import { DayStrip } from '../../src/components/DayStrip';
import { DrinkLegendModal } from '../../src/components/DrinkLegendModal';
import { EmptyState } from '../../src/components/EmptyState';
import { FbcTrendChart } from '../../src/components/FbcTrendChart';
import { FeverCurveChart } from '../../src/components/FeverCurveChart';
import { FluidBalanceGauge } from '../../src/components/FluidBalanceGauge';
import { InfoDivider, InfoRow } from '../../src/components/InfoRow';
import { LinkRow } from '../../src/components/LinkRow';
import { Note } from '../../src/components/Note';
import { Screen } from '../../src/components/Screen';
import { useNow } from '../../src/hooks/useNow';
import { useSuccessAlert } from '../../src/hooks/useSuccessAlert';
import {
  cancelHourlyReminder,
  isReminderSupported,
  requestReminderPermissionAsync,
  scheduleHourlyReminder,
} from '../../src/notifications/reminders';
import { sumMl } from '../../src/state/calculations';
import {
  ageYears,
  formatTime24,
  formatWeekdayDate,
  hoursAgo,
  illnessDayNumber,
  localDateKey,
  minutesAgo,
} from '../../src/state/dateUtils';
import { DRINK_KINDS } from '../../src/state/drinkKinds';
import { phaseLabel } from '../../src/state/phase';
import { filterByDateKey, useFluidSummary, usePlasmaLeakageAlert, useTodayEntries } from '../../src/state/selectors';
import { useStore } from '../../src/state/store';
import { colors } from '../../src/theme/colors';
import { radius, spacing } from '../../src/theme/spacing';
import { fontFamily, fontSize } from '../../src/theme/typography';

const DRINK_PRESETS = [100, 150, 200, 250];
const URINE_PRESETS = [50, 100, 150, 200];

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '—';
  return parts
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');
}

export default function DashboardScreen() {
  const { t } = useTranslation();
  const { state, actions } = useStore();
  const now = useNow();
  const [drinkModal, setDrinkModal] = useState(false);
  const [urineModal, setUrineModal] = useState(false);
  const [remindersOn, setRemindersOn] = useState(true);
  const [legendVisible, setLegendVisible] = useState(false);

  const illness = state.illness!;
  const { profile } = state;
  const currentDay = illnessDayNumber(illness.feverStartISO, now);
  const { outMl, targets, behindMl } = useFluidSummary(state, now);
  const { drinks } = useTodayEntries(state, now);
  const { atRisk, latestReport } = usePlasmaLeakageAlert(state.reports);
  const { showSuccess, modal: successModal } = useSuccessAlert();

  const drinkSegments: { key: string; ml: number; color: string }[] = DRINK_KINDS.map((k) => ({
    key: k.key,
    ml: sumMl(drinks.filter((d) => d.kind === k.key)),
    color: k.color,
  }));

  // In Admitted mode, "drunk today" on the gauge is oral + IV combined —
  // IV fluid is still fluid in, just delivered a different way.
  if (state.careMode === 'admitted') {
    const todayIvMl = sumMl(
      filterByDateKey(state.ivFluids, localDateKey(now)).map((f) => ({ amountMl: f.volumeMl }))
    );
    if (todayIvMl > 0) {
      drinkSegments.push({ key: 'iv', ml: todayIvMl, color: colors.ivFluid });
    }
  }

  const lastTemp = state.temps[0];
  const lastUrine = state.urine[0];

  const patientMeta = [
    profile.dobISO ? `${ageYears(profile.dobISO, now)} yrs` : null,
    profile.sex === 'female' ? 'Female' : 'Male',
    profile.weightKg ? `${profile.weightKg} kg` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (remindersOn) {
        if (!isReminderSupported()) {
          setRemindersOn(false);
          Alert.alert(
            'Not available in Expo Go',
            'Hourly hydration reminders need a development build — they are not supported inside Expo Go.'
          );
          return;
        }
        const granted = await requestReminderPermissionAsync();
        if (cancelled) return;
        if (!granted) {
          setRemindersOn(false);
          Alert.alert(
            'Notifications disabled',
            'Turn on notifications for DenguCare in your device settings to get hourly hydration reminders.'
          );
          return;
        }
        await scheduleHourlyReminder(targets.hourlyGoalMl);
      } else {
        await cancelHourlyReminder();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [remindersOn, targets.hourlyGoalMl]);

  function saveDrink(amountMl: number, kind: string | undefined, atISO: string) {
    const kindDef = DRINK_KINDS.find((k) => k.key === kind) ?? DRINK_KINDS[0];
    actions.addDrink(amountMl, kindDef.key, kindDef.label, atISO);
    setDrinkModal(false);
    showSuccess(`${amountMl} ml of ${kindDef.label.toLowerCase()} logged.`, 'Drink logged');
  }

  function saveUrine(amountMl: number, _kind: string | undefined, atISO: string) {
    actions.addUrine(amountMl, atISO);
    setUrineModal(false);
    showSuccess(`${amountMl} ml of urine logged.`, 'Urine logged');
  }

  return (
    <Screen>
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.dateLabel}>{formatWeekdayDate(now)}</Text>
          <Text style={styles.title}>
            Day {currentDay} · {phaseLabel(currentDay)}
          </Text>
        </View>
        <Pressable onPress={() => setRemindersOn((v) => !v)} style={styles.bell} hitSlop={10}>
          <Ionicons name={remindersOn ? 'notifications' : 'notifications-outline'} size={20} color={colors.textPrimary} />
        </Pressable>
      </View>

      <DayStrip currentDay={currentDay} />

      <Card style={{ marginTop: spacing.xl }}>
        <View style={styles.patientRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initialsFor(profile.name)}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Text style={styles.patientName}>{profile.name.trim() || 'Patient'}</Text>
            <Text style={styles.patientMeta}>{patientMeta || '—'}</Text>
          </View>
          <View style={[styles.careBadge, state.careMode === 'admitted' && styles.careBadgeAdmitted]}>
            <Text style={[styles.careBadgeText, state.careMode === 'admitted' && styles.careBadgeTextAdmitted]}>
              {state.careMode === 'admitted' ? t('careMode.admitted') : t('careMode.home')}
            </Text>
          </View>
        </View>
      </Card>

      {atRisk ? (
        <View style={{ marginTop: spacing.lg }}>
          <Banner icon="alert-circle-outline" tone="danger">
            {t('fbc.plasmaLeakageBanner')}
          </Banner>
        </View>
      ) : null}

      <Card style={{ marginTop: spacing.lg }}>
        <View style={styles.balanceHeaderRow}>
          <Text style={styles.cardKicker}>Today&apos;s balance</Text>
          <Pressable
            onPress={() => setLegendVisible(true)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="What do the ring colours mean?"
          >
            <Ionicons name="information-circle-outline" size={20} color={colors.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.gaugeRow}>
          <FluidBalanceGauge
            drinkSegments={drinkSegments}
            urineMl={outMl}
            onPressDrinks={() => setDrinkModal(true)}
            onPressUrine={() => setUrineModal(true)}
          />
        </View>

        <View style={styles.gaugeLegendRow}>
          <View style={styles.gaugeLegendItem}>
            <View style={[styles.gaugeLegendDot, { backgroundColor: colors.drinkIn }]} />
            <Text style={styles.gaugeLegendText}>Drunk today</Text>
          </View>
          <View style={styles.gaugeLegendItem}>
            <View style={[styles.gaugeLegendDot, { backgroundColor: colors.urineOut }]} />
            <Text style={styles.gaugeLegendText}>Urine passed</Text>
          </View>
        </View>

        {behindMl > 0 ? (
          <View style={{ marginTop: spacing.lg }}>
            <Banner icon="water-outline">
              You are about <Text style={styles.bold}>{behindMl} ml</Text> behind for this time of day. Sip{' '}
              <Text style={styles.bold}>{targets.hourlyGoalMl} ml</Text> now — small sips are easier than a big
              glass.
            </Banner>
          </View>
        ) : null}
      </Card>

      <Card style={{ marginTop: spacing.lg }}>
        <View style={styles.balanceHeaderRow}>
          <Text style={styles.cardKicker}>Temperature</Text>
          {lastTemp ? (
            <Text style={[styles.legend, lastTemp.celsius >= 38 ? styles.legendDanger : null]}>
              {lastTemp.celsius.toFixed(1)} °C now
            </Text>
          ) : null}
        </View>
        {state.temps.length > 0 ? (
          <FeverCurveChart readings={state.temps} feverStartISO={illness.feverStartISO} />
        ) : (
          <EmptyState
            icon="thermometer-outline"
            title="No readings yet"
            subtitle="Log your temperature from the Temp tab to see your fever curve here."
          />
        )}
      </Card>

      <Card style={{ marginTop: spacing.lg }}>
        {state.reports.length > 0 ? (
          <FbcTrendChart reports={state.reports} feverStartISO={illness.feverStartISO} />
        ) : (
          <>
            <Text style={styles.cardKicker}>{t('fbc.chartTitle')}</Text>
            <EmptyState
              icon="flask-outline"
              title="No blood reports yet"
              subtitle="Add a platelet and haematocrit report from the Reports tab to track the trend here."
            />
          </>
        )}
      </Card>

      <Card style={{ marginTop: spacing.lg, backgroundColor: colors.surfaceMuted, borderColor: colors.surfaceMutedBorder }}>
        <Text style={styles.cardKicker}>Quick info</Text>
        <InfoRow
          icon="thermometer-outline"
          label="Last temperature"
          value={lastTemp ? `${lastTemp.celsius.toFixed(1)} °C · ${formatTime24(new Date(lastTemp.atISO))}` : '—'}
          valueColor={lastTemp && lastTemp.celsius >= 38 ? colors.danger : undefined}
        />
        <InfoDivider />
        <InfoRow
          icon="flask-outline"
          label="Last urine passed"
          value={
            lastUrine
              ? hoursAgo(lastUrine.atISO, now) > 0
                ? `${hoursAgo(lastUrine.atISO, now)}h ago`
                : `${minutesAgo(lastUrine.atISO, now)}m ago`
              : 'No entry yet'
          }
        />
        <InfoDivider />
        <InfoRow
          icon="water-outline"
          label="Latest platelets"
          value={latestReport?.plateletCount != null ? `${latestReport.plateletCount} x10³/µL` : '—'}
          valueColor={latestReport?.plateletCount != null && latestReport.plateletCount < 100 ? colors.danger : undefined}
        />
        <InfoDivider />
        <InfoRow
          icon="analytics-outline"
          label="Latest haematocrit"
          value={latestReport?.haematocritPct != null ? `${latestReport.haematocritPct}%` : '—'}
        />
        <InfoDivider />
        <InfoRow icon="time-outline" label="Hourly reminder" value={`Every hour · ${targets.hourlyGoalMl} ml`} />
      </Card>

      <View style={{ marginTop: spacing.lg }}>
        <LinkRow icon="shield-outline" tone="dark" label="Check my warning signs" onPress={() => router.push('/(tabs)/safety')} />
      </View>

      <Note>
        These targets are a general guide based on your weight, from national dengue home-care advice. Your doctor
        may set different amounts, and their instructions come first.
      </Note>

      <AmountEntryModal
        visible={drinkModal}
        title="Log a drink"
        presets={DRINK_PRESETS}
        accentColor={colors.drinkIn}
        kindOptions={DRINK_KINDS}
        onClose={() => setDrinkModal(false)}
        onSave={saveDrink}
      />
      <AmountEntryModal
        visible={urineModal}
        title="Log urine"
        presets={URINE_PRESETS}
        accentColor={colors.urineOut}
        onClose={() => setUrineModal(false)}
        onSave={saveUrine}
      />

      <DrinkLegendModal
        visible={legendVisible}
        onClose={() => setLegendVisible(false)}
        showIv={state.careMode === 'admitted'}
      />

      {successModal}
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  dateLabel: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.xs,
    letterSpacing: 1,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  title: {
    fontFamily: fontFamily.baseBold,
    fontWeight: '800',
    fontSize: fontSize.xxl,
    color: colors.textPrimary,
  },
  bell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: fontFamily.baseBold,
    fontWeight: '800',
    fontSize: fontSize.lg,
    color: colors.primary,
  },
  patientName: {
    fontFamily: fontFamily.baseBold,
    fontWeight: '700',
    fontSize: fontSize.lg,
    color: colors.textPrimary,
  },
  patientMeta: {
    marginTop: 2,
    fontFamily: fontFamily.mono,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  careBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  careBadgeAdmitted: {
    backgroundColor: colors.ink,
  },
  careBadgeText: {
    fontFamily: fontFamily.baseBold,
    fontWeight: '700',
    fontSize: fontSize.xs,
    color: colors.primary,
  },
  careBadgeTextAdmitted: {
    color: colors.textOnDark,
  },
  balanceHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  cardKicker: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.xs,
    letterSpacing: 1,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  legend: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  legendDanger: {
    color: colors.danger,
    fontWeight: '700',
  },
  gaugeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  gaugeLegendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  gaugeLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
  },
  gaugeLegendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  gaugeLegendText: {
    fontFamily: fontFamily.base,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  bold: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
});
