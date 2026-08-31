import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AmountEntryModal } from '../../src/components/AmountEntryModal';
import { Banner } from '../../src/components/Banner';
import { Card } from '../../src/components/Card';
import { CircularGauge } from '../../src/components/CircularGauge';
import { DashboardHero } from '../../src/components/DashboardHero';
import { DayStrip } from '../../src/components/DayStrip';
import { EmptyState } from '../../src/components/EmptyState';
import { FbcTrendChart } from '../../src/components/FbcTrendChart';
import { FeverCurveChart } from '../../src/components/FeverCurveChart';
import { InfoDivider, InfoRow } from '../../src/components/InfoRow';
import { Note } from '../../src/components/Note';
import { Screen } from '../../src/components/Screen';
import { useNow } from '../../src/hooks/useNow';
import { useSuccessAlert } from '../../src/hooks/useSuccessAlert';
import { sumMl } from '../../src/state/calculations';
import {
  formatTime24,
  formatWeekdayDate,
  hoursAgo,
  illnessDayNumber,
  localDateKey,
  minutesAgo,
} from '../../src/state/dateUtils';
import { DRINK_KINDS } from '../../src/state/drinkKinds';
import { isCriticalPhase, phaseLabel } from '../../src/state/phase';
import { filterByDateKey, useFluidSummary, usePlasmaLeakageAlert, useTodayEntries } from '../../src/state/selectors';
import { useStore } from '../../src/state/store';
import { colors } from '../../src/theme/colors';
import { gradients } from '../../src/theme/gradients';
import { radius, spacing } from '../../src/theme/spacing';
import { fontFamily, fontSize } from '../../src/theme/typography';

const DRINK_PRESETS = [100, 150, 200, 250];
const URINE_PRESETS = [50, 100, 150, 200];

export default function DashboardScreen() {
  const { t } = useTranslation();
  const { state, actions } = useStore();
  const now = useNow();
  const [drinkModal, setDrinkModal] = useState(false);
  const [urineModal, setUrineModal] = useState(false);

  const warningIconScale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(warningIconScale, { toValue: 1.18, duration: 700, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(warningIconScale, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.delay(900),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [warningIconScale]);

  const illness = state.illness!;
  const currentDay = illnessDayNumber(illness.feverStartISO, now);
  const currentPhase = t(phaseLabel(currentDay));
  const { inMl, outMl, targets, behindMl } = useFluidSummary(state, now);
  const { drinks } = useTodayEntries(state, now);
  const { atRisk, latestReport } = usePlasmaLeakageAlert(state.reports);
  const { showSuccess, modal: successModal } = useSuccessAlert();

  // In Admitted mode, intake is oral + IV combined - IV fluid is still fluid in, just delivered differently.
  const todayIvMl =
    state.careMode === 'admitted'
      ? sumMl(filterByDateKey(state.ivFluids, localDateKey(now)).map((f) => ({ amountMl: f.volumeMl })))
      : 0;
  const intakeMl = inMl + todayIvMl;

  const lastTemp = state.temps[0];
  const lastUrine = state.urine[0];

  const isCritical = isCriticalPhase(currentDay);

  const fluidStatus = atRisk
    ? { word: t('dashboard.atRisk'), color: '#FF8A75', subtitle: t('dashboard.atRiskSubtitle') }
    : behindMl > 0
      ? {
          word: t('dashboard.behind'),
          color: '#F5C453',
          subtitle: t('dashboard.behindSubtitle', { ml: behindMl, goal: targets.hourlyGoalMl }),
        }
      : { word: t('dashboard.onTrack'), color: '#6EE7B7', subtitle: t('dashboard.onTrackSubtitle') };
  const gaugePercent = targets.dailyFluidMl > 0 ? intakeMl / targets.dailyFluidMl : 0;

  function saveDrink(amountMl: number, kind: string | undefined, atISO: string) {
    const kindDef = DRINK_KINDS.find((k) => k.key === kind) ?? DRINK_KINDS[0];
    actions.addDrink(amountMl, kindDef.key, t(kindDef.label), atISO);
    setDrinkModal(false);
    showSuccess(t('logging.drinkLogged', { amount: amountMl, kind: t(kindDef.label).toLowerCase() }), t('logging.drinkLoggedTitle'));
  }

  function saveUrine(amountMl: number, _kind: string | undefined, atISO: string) {
    actions.addUrine(amountMl, atISO);
    setUrineModal(false);
    showSuccess(t('logging.urineLogged', { amount: amountMl }), t('logging.urineLoggedTitle'));
  }

  return (
    <Screen>
      <DashboardHero
        subtitle={t('dashboard.heroSubtitle')}
        needsAttention={atRisk || behindMl > 0}
      />

      <View style={styles.sectionHeader}>
        <Text style={styles.pageTitle}>{t('dashboard.illnessDay')}</Text>
        <View style={styles.sectionUnderline} />
        <Text style={styles.pageSubtitle}>
          {formatWeekdayDate(now)}  -  {currentPhase}
        </Text>
      </View>

      <DayStrip currentDay={currentDay} />

      {atRisk ? (
        <View style={{ marginTop: spacing.lg }}>
          <Banner icon="alert-circle-outline" tone="danger">
            {t('fbc.plasmaLeakageBanner')}
          </Banner>
        </View>
      ) : null}

      <View style={styles.gaugeCard}>
        <LinearGradient colors={gradients.heroTeal} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        <View style={styles.gaugeCardBody}>
          <View style={styles.gaugeCardLeft}>
            <View style={styles.gaugeKickerRow}>
              <Ionicons name="shield-checkmark" size={15} color="rgba(255,255,255,0.85)" />
              <Text style={styles.gaugeKicker}>{t('dashboard.fluidBalanceToday')}</Text>
            </View>
            <Text style={[styles.gaugeStatusWord, { color: fluidStatus.color }]}>{fluidStatus.word}</Text>
            <Text style={styles.gaugeSubtitle}>{fluidStatus.subtitle}</Text>
            <Text style={styles.gaugeStats}>{t('dashboard.inOut', { inMl: intakeMl, outMl })}</Text>
            <Pressable
              onPress={() => router.push('/fluids')}
              style={styles.gaugeLinkRow}
              accessibilityRole="button"
              accessibilityLabel={t('dashboard.viewDetailsAria')}
            >
              <Text style={styles.gaugeLinkText}>{t('dashboard.viewDetails')}</Text>
              <Ionicons name="arrow-forward" size={13} color="#FFFFFF" />
            </Pressable>
          </View>

          <CircularGauge
            percent={gaugePercent}
            color={fluidStatus.color}
            trackColor="rgba(255,255,255,0.18)"
            icon="water"
            iconColor="#FFFFFF"
            label={fluidStatus.word}
            labelColor="#FFFFFF"
          />
        </View>
      </View>

      <Text style={styles.sectionTitle}>{t('dashboard.quickActions')}</Text>
      <View style={styles.quickGrid}>
        <Pressable
          onPress={() => setDrinkModal(true)}
          style={({ pressed }) => [styles.quickCard, { backgroundColor: colors.primarySoft }, pressed && styles.actionCardPressed]}
        >
          <View style={[styles.quickIconCircle, { backgroundColor: colors.surface }]}>
            <Ionicons name="water" size={17} color={colors.primary} />
          </View>
          <Text style={styles.quickLabel}>{t('dashboard.logDrink')}</Text>
        </Pressable>
        <Pressable
          onPress={() => setUrineModal(true)}
          style={({ pressed }) => [styles.quickCard, { backgroundColor: colors.urineOutSoft }, pressed && styles.actionCardPressed]}
        >
          <View style={[styles.quickIconCircle, { backgroundColor: colors.surface }]}>
            <Ionicons name="flask" size={17} color={colors.outputText} />
          </View>
          <Text style={styles.quickLabel}>{t('dashboard.logUrine')}</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push('/(tabs)/temp')}
          style={({ pressed }) => [styles.quickCard, { backgroundColor: colors.accentPurpleSoft }, pressed && styles.actionCardPressed]}
        >
          <View style={[styles.quickIconCircle, { backgroundColor: colors.surface }]}>
            <Ionicons name="thermometer" size={17} color={colors.accentPurple} />
          </View>
          <Text style={styles.quickLabel}>{t('dashboard.logTemp')}</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push('/guidelines')}
          style={({ pressed }) => [styles.quickCard, { backgroundColor: colors.accentBlueSoft }, pressed && styles.actionCardPressed]}
        >
          <View style={[styles.quickIconCircle, { backgroundColor: colors.surface }]}>
            <Ionicons name="book" size={17} color={colors.accentBlue} />
          </View>
          <Text style={styles.quickLabel}>{t('guidelines.screenTitle')}</Text>
        </Pressable>
      </View>

      <Pressable
        onPress={() => router.push('/(tabs)/safety')}
        style={({ pressed }) => [styles.tipBanner, pressed && styles.actionCardPressed]}
      >
        <View style={styles.tipMascotCircle}>
          <Animated.View style={{ transform: [{ scale: warningIconScale }] }}>
            <Ionicons name="shield-checkmark" size={26} color={colors.primary} />
          </Animated.View>
        </View>
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Text style={styles.tipTitle}>{t('dashboard.checkWarningSigns')}</Text>
          <Text style={styles.tipSubtitle}>{t('dashboard.checkWarningSignsSubtitle')}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      </Pressable>

      <Card style={{ marginTop: spacing.lg }}>
        <View style={styles.cardHeaderRow}>
          <View>
            <Text style={styles.cardTitle}>{t('dashboard.temperature')}</Text>
            <Text style={styles.cardSubtitle}>
              {lastTemp
                ? hoursAgo(lastTemp.atISO, now) > 0
                  ? t('dashboard.lastReadingHoursAgo', { count: hoursAgo(lastTemp.atISO, now) })
                  : t('dashboard.lastReadingMinutesAgo', { count: minutesAgo(lastTemp.atISO, now) })
                : t('dashboard.noReadingsYet')}
            </Text>
          </View>
          {lastTemp ? (
            <View style={[styles.tempBadge, lastTemp.celsius >= 38 && styles.tempBadgeHot]}>
              <Ionicons
                name="thermometer"
                size={14}
                color={lastTemp.celsius >= 38 ? colors.danger : colors.textSecondary}
              />
              <Text style={[styles.tempBadgeText, lastTemp.celsius >= 38 && styles.tempBadgeTextHot]}>
                {lastTemp.celsius.toFixed(1)} C
              </Text>
            </View>
          ) : null}
        </View>
        <View style={{ height: spacing.md }} />
        {state.temps.length > 0 ? (
          <FeverCurveChart readings={state.temps} feverStartISO={illness.feverStartISO} />
        ) : (
          <EmptyState
            icon="thermometer-outline"
            title={t('dashboard.noReadingsYet')}
            subtitle={t('dashboard.noReadingsSubtitle')}
          />
        )}
      </Card>

      {isCritical ? (
        <Card style={{ marginTop: spacing.lg, backgroundColor: colors.dangerSoft, borderWidth: 1, borderColor: colors.borderDanger }}>
          <View style={styles.alertHeaderRow}>
            <View style={styles.alertIconWrap}>
              <Ionicons name="warning" size={22} color={colors.danger} />
            </View>
            <Text style={styles.alertTitle}>{t('dashboard.criticalPhaseAlert')}</Text>
          </View>
          <Text style={styles.alertBody}>
            {atRisk ? t('fbc.plasmaLeakageBanner') : t('dashboard.criticalPhaseBody')}
          </Text>
        </Card>
      ) : null}

      <Card style={{ marginTop: spacing.lg }}>
        {state.reports.length > 0 ? (
          <FbcTrendChart reports={state.reports} feverStartISO={illness.feverStartISO} />
        ) : (
          <>
            <Text style={styles.cardKicker}>{t('fbc.chartTitle')}</Text>
            <EmptyState
              icon="analytics-outline"
              title={t('dashboard.noReportsYet')}
              subtitle={t('dashboard.noReportsSubtitle')}
            />
          </>
        )}
      </Card>

      <Card style={{ marginTop: spacing.lg, backgroundColor: colors.surfaceMuted, borderColor: colors.surfaceMutedBorder }}>
        <Text style={styles.cardKicker}>{t('dashboard.quickInfo')}</Text>
        <InfoRow
          icon="thermometer-outline"
          label={t('dashboard.lastTemperature')}
          value={lastTemp ? `${lastTemp.celsius.toFixed(1)}  C  -  ${formatTime24(new Date(lastTemp.atISO))}` : '-'}
          valueColor={lastTemp && lastTemp.celsius >= 38 ? colors.danger : undefined}
        />
        <InfoDivider />
        <InfoRow
          icon="flask-outline"
          label={t('dashboard.lastUrinePassed')}
          value={
            lastUrine
              ? hoursAgo(lastUrine.atISO, now) > 0
                ? t('common.hoursAgo', { count: hoursAgo(lastUrine.atISO, now) })
                : t('common.minutesAgo', { count: minutesAgo(lastUrine.atISO, now) })
              : t('dashboard.noEntryYet')
          }
        />
        <InfoDivider />
        <InfoRow
          icon="water-outline"
          label={t('dashboard.latestPlatelets')}
          value={latestReport?.plateletCount != null ? `${latestReport.plateletCount} x10^3/uL` : '-'}
          valueColor={latestReport?.plateletCount != null && latestReport.plateletCount < 100 ? colors.danger : undefined}
        />
        <InfoDivider />
        <InfoRow
          icon="analytics-outline"
          label={t('dashboard.latestHaematocrit')}
          value={latestReport?.haematocritPct != null ? `${latestReport.haematocritPct}%` : '-'}
        />
        <InfoDivider />
        <InfoRow icon="time-outline" label={t('dashboard.hourlyReminder')} value={t('dashboard.everyHour', { ml: targets.hourlyGoalMl })} />
      </Card>

      <Note>{t('dashboard.footerNote')}</Note>

      <AmountEntryModal
        visible={drinkModal}
        title={t('dashboard.logDrinkTitle')}
        presets={DRINK_PRESETS}
        accentColor={colors.drinkIn}
        kindOptions={DRINK_KINDS.map((k) => ({ key: k.key, label: t(k.label) }))}
        onClose={() => setDrinkModal(false)}
        onSave={saveDrink}
      />
      <AmountEntryModal
        visible={urineModal}
        title={t('dashboard.logUrineTitle')}
        presets={URINE_PRESETS}
        accentColor={colors.urineOut}
        onClose={() => setUrineModal(false)}
        onSave={saveUrine}
      />

      {successModal}
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    marginTop: spacing.xl,
  },
  pageTitle: {
    fontFamily: fontFamily.baseExtraBold,
    fontSize: fontSize.xxl,
    color: colors.textPrimary,
  },
  sectionUnderline: {
    marginTop: spacing.xs,
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  pageSubtitle: {
    marginTop: spacing.sm,
    fontFamily: fontFamily.base,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  sectionTitle: {
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    fontFamily: fontFamily.baseExtraBold,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
  },
  gaugeCard: {
    marginTop: spacing.lg,
    borderRadius: radius.xl,
    overflow: 'hidden',
    padding: spacing.lg,
    shadowColor: colors.shadow,
    shadowOpacity: 0.16,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  gaugeCardBody: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gaugeCardLeft: {
    flex: 1,
    marginRight: spacing.md,
  },
  gaugeKickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  gaugeKicker: {
    fontFamily: fontFamily.baseSemiBold,
    fontWeight: '700',
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.85)',
  },
  gaugeStatusWord: {
    marginTop: spacing.sm,
    fontFamily: fontFamily.baseExtraBold,
    fontWeight: '800',
    fontSize: 26,
  },
  gaugeSubtitle: {
    marginTop: spacing.xs,
    fontFamily: fontFamily.base,
    fontSize: fontSize.xs,
    lineHeight: fontSize.xs * 1.5,
    color: 'rgba(255,255,255,0.85)',
  },
  gaugeStats: {
    marginTop: spacing.md,
    fontFamily: fontFamily.mono,
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
  },
  gaugeLinkRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  gaugeLinkText: {
    fontFamily: fontFamily.baseBold,
    fontWeight: '700',
    fontSize: fontSize.xs,
    color: '#FFFFFF',
  },
  quickGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quickCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.86)',
    shadowColor: colors.shadow,
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  quickIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    marginTop: 6,
    fontFamily: fontFamily.baseBold,
    fontWeight: '700',
    fontSize: 11,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  tipBanner: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.92)',
    shadowColor: colors.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  tipMascotCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  tipTitle: {
    fontFamily: fontFamily.baseBold,
    fontWeight: '700',
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  tipSubtitle: {
    marginTop: 2,
    fontFamily: fontFamily.base,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  cardTitle: {
    fontFamily: fontFamily.baseBold,
    fontWeight: '700',
    fontSize: fontSize.lg,
    color: colors.textPrimary,
  },
  cardSubtitle: {
    marginTop: 2,
    fontFamily: fontFamily.base,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  cardKicker: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.xs,
    letterSpacing: 1,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  actionCardPressed: {
    opacity: 0.8,
  },
  tempBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
  },
  tempBadgeHot: {
    backgroundColor: colors.dangerSoft,
  },
  tempBadgeText: {
    fontFamily: fontFamily.monoBold,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  tempBadgeTextHot: {
    color: colors.danger,
  },
  alertHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  alertTitle: {
    fontFamily: fontFamily.baseBold,
    fontWeight: '800',
    fontSize: fontSize.md,
    color: colors.danger,
  },
  alertBody: {
    marginTop: spacing.md,
    fontFamily: fontFamily.base,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    lineHeight: fontSize.sm * 1.5,
  },
});
