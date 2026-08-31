import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Banner } from './Banner';
import { Card } from './Card';
import { EntryListDivider, EntryListItem } from './EntryListItem';
import { FbcTrendChart } from './FbcTrendChart';
import { FeverCurveChart } from './FeverCurveChart';
import { HourlyBalanceCarousel } from './HourlyBalanceCarousel';
import { InfoDivider, InfoRow } from './InfoRow';
import { FluidTargets } from '../state/calculations';
import { DoctorReportData } from '../state/doctorReport';
import { dateFromKey, formatDatePretty, formatTime24, localDateKey } from '../state/dateUtils';
import { drinkKindColor } from '../state/drinkKinds';
import { Profile } from '../state/types';
import { WARNING_SIGN_LABELS } from '../state/warningSigns';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { fontFamily, fontSize } from '../theme/typography';
import { initialsFor } from '../utils/initials';

interface Props {
  data: DoctorReportData;
  profile: Profile;
  targets: FluidTargets;
  visible: boolean;
}

function dateTime(atISO: string): string {
  const d = new Date(atISO);
  return `${formatDatePretty(d)}  ${formatTime24(d)}`;
}

interface DayGroup<T> {
  key: string;
  items: T[];
}

/** Groups already-sorted entries into one bucket per calendar day, keeping
 * the day order they first appear in — so a list sorted most-recent-first
 * comes out with the most recent day first too. */
function groupByDay<T extends { atISO: string }>(items: T[]): DayGroup<T>[] {
  const order: string[] = [];
  const byKey = new Map<string, T[]>();
  items.forEach((item) => {
    const key = localDateKey(new Date(item.atISO));
    if (!byKey.has(key)) {
      byKey.set(key, []);
      order.push(key);
    }
    byKey.get(key)!.push(item);
  });
  return order.map((key) => ({ key, items: byKey.get(key)! }));
}

/** One calendar day's worth of itemised entries, collapsed behind a
 * Show/Hide toggle so a long history doesn't force endless scrolling. */
function DayGroupSection({
  label,
  count,
  expanded,
  onToggle,
  children,
}: {
  label: string;
  count: number;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <View style={styles.dayGroup}>
      <Pressable onPress={onToggle} style={styles.dayGroupHeader} accessibilityRole="button">
        <Text style={styles.dayGroupLabel}>
          {label} · {count}
        </Text>
        <View style={styles.dayGroupToggle}>
          <Text style={styles.dayGroupToggleText}>{expanded ? t('common.hide') : t('common.show')}</Text>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={colors.primaryDark} />
        </View>
      </Pressable>
      {expanded ? children : null}
    </View>
  );
}

/** The actual "Doctor Report" content — patient info, active warning
 * signs, fluid balance, and the full temperature/medication/blood-report
 * history — shared between the live report (current illness) and the
 * previous-data viewer (an archived one), which differ only in which
 * DoctorReportData they pass in. */
export function ReportBody({ data, profile, targets, visible }: Props) {
  const { t } = useTranslation();
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

  const drinkGroups = groupByDay(data.drinks);
  const ivGroups = groupByDay(data.ivFluids);
  const urineGroups = groupByDay(data.urine);

  useEffect(() => {
    if (!visible) return;
    const initial = new Set<string>();
    if (drinkGroups[0]) initial.add(`drinks-${drinkGroups[0].key}`);
    if (ivGroups[0]) initial.add(`iv-${ivGroups[0].key}`);
    if (urineGroups[0]) initial.add(`urine-${urineGroups[0].key}`);
    setExpandedDays(initial);
    // Reset to "most recent day open" each time this view is opened, not on every data change.
  }, [visible]);

  function toggleDay(groupKey: string) {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(groupKey)) next.delete(groupKey);
      else next.add(groupKey);
      return next;
    });
  }

  const todayKey = localDateKey(data.viewDate);
  const yesterdayKey = localDateKey(new Date(data.viewDate.getTime() - 86400000));
  function dayLabel(key: string): string {
    if (key === todayKey) return t('common.today');
    if (key === yesterdayKey) return t('common.yesterday');
    return formatDatePretty(dateFromKey(key));
  }

  return (
    <>
      <View style={styles.avatarRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initialsFor(profile.name)}</Text>
        </View>
        <View style={{ marginLeft: spacing.md, flex: 1 }}>
          <Text style={styles.nameText}>{profile.name.trim() || t('topBar.patientFallback')}</Text>
          <Text style={styles.subText}>
            {profile.sex === 'female' ? t('topBar.sexFemale') : t('topBar.sexMale')}
            {data.age != null ? `  ·  ${data.age} ${t('topBar.yearsSuffix')}` : ''}
          </Text>
        </View>
      </View>

      <InfoRow icon="barbell-outline" label={t('profileModal.weight')} value={profile.weightKg ? `${profile.weightKg} kg` : '—'} />
      <InfoDivider />
      <InfoRow icon="resize-outline" label={t('profileModal.height')} value={profile.heightCm ? `${profile.heightCm} cm` : '—'} />
      <InfoDivider />
      <InfoRow
        icon="calendar-outline"
        label={t('dashboard.illnessDay')}
        value={
          data.dayNumber != null && data.feverStartISO != null
            ? t('doctorReportModal.dayWithDate', { day: data.dayNumber, date: formatDatePretty(new Date(data.feverStartISO)) })
            : '—'
        }
      />
      <InfoDivider />
      <InfoRow
        icon="medkit-outline"
        label={t('profileModal.medicalHistory')}
        value={profile.conditions.length > 0 ? profile.conditions.map((key) => t(`conditions.${key}`)).join(', ') : t('common.none')}
      />

      <Text style={styles.generatedAt}>
        {t('doctorReportModal.generatedAt', { date: formatDatePretty(data.now), time: formatTime24(data.now) })}
      </Text>

      {data.activeWarningSigns.length > 0 ? (
        <Banner icon="warning" tone="danger">
          {t('doctorReportModal.warningSignsTitle')}
          {'\n'}
          {data.activeWarningSigns.map((k) => `•  ${t(WARNING_SIGN_LABELS[k])}`).join('\n')}
        </Banner>
      ) : (
        <Text style={styles.emptyNote}>{t('doctorReportModal.noWarningSigns')}</Text>
      )}

      <Text style={styles.sectionKicker}>{t('doctorReportModal.fluidBalanceTitle')}</Text>
      <Card style={{ marginBottom: spacing.md }}>
        <HourlyBalanceCarousel allDrinks={data.drinks} allUrine={data.urine} now={data.viewDate} hourlyGoalMl={targets.hourlyGoalMl} />
      </Card>
      <View style={styles.balanceRow}>
        <View style={styles.balanceBox}>
          <Text style={styles.balanceLabel}>{t('doctorReportModal.fluidInLabel')}</Text>
          <Text style={styles.balanceValue}>{data.fluidInMl} ml</Text>
        </View>
        <View style={{ width: spacing.md }} />
        <View style={styles.balanceBox}>
          <Text style={styles.balanceLabel}>{t('doctorReportModal.fluidOutLabel')}</Text>
          <Text style={styles.balanceValue}>{data.fluidOutMl} ml</Text>
        </View>
      </View>

      <Text style={styles.subKicker}>{t('doctorReportModal.oralIntakeTitle')}</Text>
      {data.drinks.length === 0 ? (
        <Text style={styles.emptyNote}>{t('dayEntriesModal.noDrinks')}</Text>
      ) : (
        drinkGroups.map((g) => (
          <DayGroupSection
            key={g.key}
            label={dayLabel(g.key)}
            count={g.items.length}
            expanded={expandedDays.has(`drinks-${g.key}`)}
            onToggle={() => toggleDay(`drinks-${g.key}`)}
          >
            {g.items.map((d, i) => (
              <React.Fragment key={d.id}>
                {i > 0 && <EntryListDivider />}
                <EntryListItem
                  icon="water-outline"
                  iconColor={drinkKindColor(d.kind)}
                  title={t(`drinkKinds.${d.kind}`)}
                  time={formatTime24(new Date(d.atISO))}
                  valueLabel={`${d.amountMl} ml`}
                />
              </React.Fragment>
            ))}
          </DayGroupSection>
        ))
      )}

      {data.ivFluids.length > 0 ? (
        <>
          <Text style={styles.subKicker}>{t('doctorReportModal.ivFluidsTitle')}</Text>
          {ivGroups.map((g) => (
            <DayGroupSection
              key={g.key}
              label={dayLabel(g.key)}
              count={g.items.length}
              expanded={expandedDays.has(`iv-${g.key}`)}
              onToggle={() => toggleDay(`iv-${g.key}`)}
            >
              {g.items.map((f, i) => (
                <React.Fragment key={f.id}>
                  {i > 0 && <EntryListDivider />}
                  <EntryListItem
                    icon="medkit-outline"
                    iconColor={colors.ivFluid}
                    title={t(`ivFluids.fluidTypes.${f.fluidType}`)}
                    time={formatTime24(new Date(f.atISO))}
                    valueLabel={f.rateMlPerHr != null ? `${f.volumeMl} ml  ·  ${f.rateMlPerHr} ml/hr` : `${f.volumeMl} ml`}
                  />
                </React.Fragment>
              ))}
            </DayGroupSection>
          ))}
        </>
      ) : null}

      <Text style={styles.subKicker}>{t('doctorReportModal.urineOutputTitle')}</Text>
      {data.urine.length === 0 ? (
        <Text style={styles.emptyNote}>{t('dayEntriesModal.noUrine')}</Text>
      ) : (
        urineGroups.map((g) => (
          <DayGroupSection
            key={g.key}
            label={dayLabel(g.key)}
            count={g.items.length}
            expanded={expandedDays.has(`urine-${g.key}`)}
            onToggle={() => toggleDay(`urine-${g.key}`)}
          >
            {g.items.map((u, i) => (
              <React.Fragment key={u.id}>
                {i > 0 && <EntryListDivider />}
                <EntryListItem
                  icon="flask-outline"
                  iconColor={colors.urineOut}
                  title={t('dayEntriesModal.urineTab')}
                  time={formatTime24(new Date(u.atISO))}
                  valueLabel={`${u.amountMl} ml`}
                />
              </React.Fragment>
            ))}
          </DayGroupSection>
        ))
      )}

      <Text style={styles.sectionKicker}>{t('doctorReportModal.temperatureHistoryTitle')}</Text>
      {data.feverStartISO && data.temps.length > 0 ? (
        <Card style={{ marginBottom: spacing.md }}>
          <FeverCurveChart readings={data.temps} feverStartISO={data.feverStartISO} />
        </Card>
      ) : null}
      {data.temps.length === 0 ? (
        <Text style={styles.emptyNote}>{t('tempScreen.noReadingsYet')}</Text>
      ) : (
        data.temps.map((r, i) => (
          <React.Fragment key={r.id}>
            {i > 0 && <EntryListDivider />}
            <EntryListItem
              icon="thermometer-outline"
              iconColor={colors.danger}
              title={t(`tempScreen.methods.${r.method}`)}
              time={dateTime(r.atISO)}
              valueLabel={`${r.celsius.toFixed(1)} °C`}
            />
          </React.Fragment>
        ))
      )}

      <Text style={styles.sectionKicker}>{t('doctorReportModal.medicationTitle')}</Text>
      {data.doses.length === 0 ? (
        <Text style={styles.emptyNote}>{t('doctorReportModal.noDoses')}</Text>
      ) : (
        data.doses.map((d, i) => (
          <React.Fragment key={d.id}>
            {i > 0 && <EntryListDivider />}
            <EntryListItem
              icon="medical-outline"
              iconColor={colors.primary}
              title={t('paracetamol.title')}
              time={dateTime(d.atISO)}
              valueLabel={`${d.doseMg} mg`}
            />
          </React.Fragment>
        ))
      )}

      <Text style={styles.sectionKicker}>{t('doctorReportModal.bloodReportTitle')}</Text>
      {data.feverStartISO && data.reports.length > 0 ? (
        <Card style={{ marginBottom: spacing.md }}>
          <FbcTrendChart reports={data.reports} feverStartISO={data.feverStartISO} />
        </Card>
      ) : null}
      {data.reports.length === 0 ? (
        <Text style={styles.emptyNote}>{t('reportsScreen.noReportsYet')}</Text>
      ) : (
        data.reports.map((r, i) => (
          <React.Fragment key={r.id}>
            {i > 0 && <EntryListDivider />}
            <View style={styles.reportBlock}>
              <Text style={styles.reportDate}>{dateTime(r.atISO)}</Text>
              <Text style={styles.reportValues}>
                {r.plateletCount != null ? t('reportsScreen.plateletsValue', { value: r.plateletCount }) : t('reportsScreen.plateletsDash')}
                {'   ·   '}
                {r.haematocritPct != null ? t('reportsScreen.hctValue', { value: r.haematocritPct }) : t('reportsScreen.hctDash')}
                {r.wbcCount != null ? `   ·   WBC ${r.wbcCount}` : ''}
              </Text>
              {r.note ? <Text style={styles.reportNote}>{t('doctorReportModal.noteLabel')}: {r.note}</Text> : null}
            </View>
          </React.Fragment>
        ))
      )}

      <View style={{ height: spacing.lg }} />
    </>
  );
}

const styles = StyleSheet.create({
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
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
  nameText: {
    fontFamily: fontFamily.baseExtraBold,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
  },
  subText: {
    marginTop: 2,
    fontFamily: fontFamily.base,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  generatedAt: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    fontFamily: fontFamily.mono,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  sectionKicker: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.xs,
    letterSpacing: 1,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  subKicker: {
    fontFamily: fontFamily.baseBold,
    fontWeight: '600',
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptyNote: {
    fontFamily: fontFamily.base,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    paddingVertical: spacing.sm,
  },
  dayGroup: {
    marginTop: spacing.xs,
  },
  dayGroupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  dayGroupLabel: {
    fontFamily: fontFamily.baseBold,
    fontWeight: '600',
    fontSize: fontSize.sm,
    color: colors.textPrimary,
  },
  dayGroupToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dayGroupToggleText: {
    fontFamily: fontFamily.baseBold,
    fontWeight: '600',
    fontSize: fontSize.xs,
    color: colors.primaryDark,
    textTransform: 'uppercase',
  },
  balanceRow: {
    flexDirection: 'row',
  },
  balanceBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  balanceLabel: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  balanceValue: {
    marginTop: 2,
    fontFamily: fontFamily.baseBold,
    fontWeight: '700',
    fontSize: fontSize.lg,
    color: colors.textPrimary,
  },
  reportBlock: {
    paddingVertical: spacing.sm,
  },
  reportDate: {
    fontFamily: fontFamily.baseBold,
    fontWeight: '600',
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  reportValues: {
    marginTop: 2,
    fontFamily: fontFamily.mono,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  reportNote: {
    marginTop: 2,
    fontFamily: fontFamily.base,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
});
