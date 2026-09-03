import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Banner } from './Banner';
import { Card } from './Card';
import { EntryListDivider, EntryListItem } from './EntryListItem';
import { FbcTrendChart } from './FbcTrendChart';
import { FeverCurveChart } from './FeverCurveChart';
import { FullBloodReportModal } from './FullBloodReportModal';
import { HourlyBalanceCarousel } from './HourlyBalanceCarousel';
import { InfoDivider, InfoRow } from './InfoRow';
import { Pagination } from './Pagination';
import { sumMl, FluidTargets } from '../state/calculations';
import { DoctorReportData } from '../state/doctorReport';
import { dateFromKey, formatDatePretty, formatTime24, localDateKey } from '../state/dateUtils';
import { drinkKindColor } from '../state/drinkKinds';
import { filterByDateKey } from '../state/selectors';
import { DrinkEntry, IvFluidEntry, Profile } from '../state/types';
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

type IntakeEntry = { id: string; atISO: string; kind: 'drink'; drink: DrinkEntry } | { id: string; atISO: string; kind: 'iv'; iv: IvFluidEntry };

const PAGE_SIZE = 10;

/** The actual "Doctor Report" content — patient info, active warning
 * signs, fluid balance, and the full temperature/medication/blood-report
 * history — shared between the live report (current illness) and the
 * previous-data viewer (an archived one), which differ only in which
 * DoctorReportData they pass in. */
export function ReportBody({ data, profile, targets, visible }: Props) {
  const { t } = useTranslation();

  const todayKey = localDateKey(data.viewDate);
  const yesterdayKey = localDateKey(new Date(data.viewDate.getTime() - 86400000));
  function dayLabel(key: string): string {
    if (key === todayKey) return t('common.today');
    if (key === yesterdayKey) return t('common.yesterday');
    return formatDatePretty(dateFromKey(key));
  }

  // Tracks whichever day the fluid-balance graph is currently showing, so
  // the totals and entry list below it stay in sync as the user swipes it.
  const [selectedDayKey, setSelectedDayKey] = useState(todayKey);
  const [entryTab, setEntryTab] = useState<'intake' | 'output'>('intake');
  const [entriesExpanded, setEntriesExpanded] = useState(false);
  const [fullReportVisible, setFullReportVisible] = useState(false);
  const [tempsExpanded, setTempsExpanded] = useState(false);
  const [tempsPage, setTempsPage] = useState(0);
  const [dosesExpanded, setDosesExpanded] = useState(false);
  const [dosesPage, setDosesPage] = useState(0);
  const [intakePage, setIntakePage] = useState(0);
  const [outputPage, setOutputPage] = useState(0);

  useEffect(() => {
    if (!visible) return;
    setSelectedDayKey(todayKey);
    setEntryTab('intake');
    setEntriesExpanded(false);
    setFullReportVisible(false);
    setTempsExpanded(false);
    setTempsPage(0);
    setDosesExpanded(false);
    setDosesPage(0);
    setIntakePage(0);
    setOutputPage(0);
    // Reset to "today, Intake tab, collapsed" each time this view is opened, not on every data change.
  }, [visible]);

  // The selected day's intake/output lists change size as the fluid-balance
  // graph is swiped between days, so start each newly-selected day back at page 1.
  useEffect(() => {
    setIntakePage(0);
    setOutputPage(0);
  }, [selectedDayKey]);

  const dayDrinks = useMemo(() => filterByDateKey(data.drinks, selectedDayKey), [data.drinks, selectedDayKey]);
  const dayIvFluids = useMemo(() => filterByDateKey(data.ivFluids, selectedDayKey), [data.ivFluids, selectedDayKey]);
  const dayUrine = useMemo(() => filterByDateKey(data.urine, selectedDayKey), [data.urine, selectedDayKey]);

  const dayFluidInMl = sumMl(dayDrinks) + sumMl(dayIvFluids.map((f) => ({ amountMl: f.volumeMl })));
  const dayFluidOutMl = sumMl(dayUrine);

  const dayIntakeEntries: IntakeEntry[] = useMemo(() => {
    const combined: IntakeEntry[] = [
      ...dayDrinks.map((d) => ({ id: d.id, atISO: d.atISO, kind: 'drink' as const, drink: d })),
      ...dayIvFluids.map((f) => ({ id: f.id, atISO: f.atISO, kind: 'iv' as const, iv: f })),
    ];
    return combined.sort((a, b) => new Date(b.atISO).getTime() - new Date(a.atISO).getTime());
  }, [dayDrinks, dayIvFluids]);

  const intakeTotalPages = Math.max(1, Math.ceil(dayIntakeEntries.length / PAGE_SIZE));
  const intakePageSafe = Math.min(intakePage, intakeTotalPages - 1);
  const pagedIntakeEntries = dayIntakeEntries.slice(intakePageSafe * PAGE_SIZE, intakePageSafe * PAGE_SIZE + PAGE_SIZE);

  const outputTotalPages = Math.max(1, Math.ceil(dayUrine.length / PAGE_SIZE));
  const outputPageSafe = Math.min(outputPage, outputTotalPages - 1);
  const pagedUrine = dayUrine.slice(outputPageSafe * PAGE_SIZE, outputPageSafe * PAGE_SIZE + PAGE_SIZE);

  const tempsTotalPages = Math.max(1, Math.ceil(data.temps.length / PAGE_SIZE));
  const tempsPageSafe = Math.min(tempsPage, tempsTotalPages - 1);
  const pagedTemps = data.temps.slice(tempsPageSafe * PAGE_SIZE, tempsPageSafe * PAGE_SIZE + PAGE_SIZE);

  const dosesTotalPages = Math.max(1, Math.ceil(data.doses.length / PAGE_SIZE));
  const dosesPageSafe = Math.min(dosesPage, dosesTotalPages - 1);
  const pagedDoses = data.doses.slice(dosesPageSafe * PAGE_SIZE, dosesPageSafe * PAGE_SIZE + PAGE_SIZE);

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
        <HourlyBalanceCarousel
          allDrinks={data.drinks}
          allUrine={data.urine}
          allIvFluids={data.ivFluids}
          now={data.viewDate}
          hourlyGoalMl={targets.hourlyGoalMl}
          onDayChange={setSelectedDayKey}
        />
      </Card>

      <Text style={styles.dayCaption}>{dayLabel(selectedDayKey)}</Text>
      <View style={styles.balanceRow}>
        <View style={styles.balanceBox}>
          <Text style={styles.balanceLabel}>{t('doctorReportModal.fluidInLabel')}</Text>
          <Text style={styles.balanceValue}>{dayFluidInMl} ml</Text>
        </View>
        <View style={{ width: spacing.md }} />
        <View style={styles.balanceBox}>
          <Text style={styles.balanceLabel}>{t('doctorReportModal.fluidOutLabel')}</Text>
          <Text style={styles.balanceValue}>{dayFluidOutMl} ml</Text>
        </View>
      </View>

      <Pressable
        onPress={() => setEntriesExpanded((v) => !v)}
        style={styles.entriesToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: entriesExpanded }}
      >
        <Text style={styles.entriesToggleText}>
          {entriesExpanded ? t('common.hide') : t('common.show')} {t('doctorReportModal.entryDetailsLabel')}
        </Text>
        <Ionicons name={entriesExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.primaryDark} />
      </Pressable>

      {entriesExpanded ? (
        <>
          <View style={styles.tabRow}>
            <Pressable
              onPress={() => setEntryTab('intake')}
              style={[styles.tabButton, entryTab === 'intake' && styles.tabButtonActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: entryTab === 'intake' }}
            >
              <Ionicons name="water-outline" size={15} color={entryTab === 'intake' ? colors.textOnPrimary : colors.textSecondary} />
              <Text style={[styles.tabButtonText, entryTab === 'intake' && styles.tabButtonTextActive]}>
                {t('doctorReportModal.oralIntakeTitle')}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setEntryTab('output')}
              style={[styles.tabButton, entryTab === 'output' && styles.tabButtonActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: entryTab === 'output' }}
            >
              <Ionicons name="flask-outline" size={15} color={entryTab === 'output' ? colors.textOnPrimary : colors.textSecondary} />
              <Text style={[styles.tabButtonText, entryTab === 'output' && styles.tabButtonTextActive]}>
                {t('doctorReportModal.urineOutputTitle')}
              </Text>
            </Pressable>
          </View>

          {entryTab === 'intake' ? (
            dayIntakeEntries.length === 0 ? (
              <Text style={styles.emptyNote}>{t('dayEntriesModal.noDrinks')}</Text>
            ) : (
              <>
                <View style={styles.entryList}>
                  {pagedIntakeEntries.map((entry, i) => (
                    <React.Fragment key={entry.id}>
                      {i > 0 && <EntryListDivider />}
                      {entry.kind === 'drink' ? (
                        <EntryListItem
                          icon="water-outline"
                          iconColor={drinkKindColor(entry.drink.kind)}
                          title={t(`drinkKinds.${entry.drink.kind}`)}
                          time={formatTime24(new Date(entry.drink.atISO))}
                          valueLabel={`${entry.drink.amountMl} ml`}
                        />
                      ) : (
                        <EntryListItem
                          icon="medkit-outline"
                          iconColor={colors.ivFluid}
                          title={t(`ivFluids.fluidTypes.${entry.iv.fluidType}`)}
                          time={formatTime24(new Date(entry.iv.atISO))}
                          valueLabel={
                            entry.iv.rateMlPerHr != null
                              ? `${entry.iv.volumeMl} ml  ·  ${entry.iv.rateMlPerHr} ml/hr`
                              : `${entry.iv.volumeMl} ml`
                          }
                        />
                      )}
                    </React.Fragment>
                  ))}
                </View>
                {dayIntakeEntries.length > PAGE_SIZE ? (
                  <Pagination
                    page={intakePageSafe}
                    totalPages={intakeTotalPages}
                    onPrev={() => setIntakePage((p) => Math.max(0, p - 1))}
                    onNext={() => setIntakePage((p) => Math.min(intakeTotalPages - 1, p + 1))}
                  />
                ) : null}
              </>
            )
          ) : dayUrine.length === 0 ? (
            <Text style={styles.emptyNote}>{t('dayEntriesModal.noUrine')}</Text>
          ) : (
            <>
              <View style={styles.entryList}>
                {pagedUrine.map((u, i) => (
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
              </View>
              {dayUrine.length > PAGE_SIZE ? (
                <Pagination
                  page={outputPageSafe}
                  totalPages={outputTotalPages}
                  onPrev={() => setOutputPage((p) => Math.max(0, p - 1))}
                  onNext={() => setOutputPage((p) => Math.min(outputTotalPages - 1, p + 1))}
                />
              ) : null}
            </>
          )}
        </>
      ) : null}

      <Text style={styles.sectionKicker}>{t('doctorReportModal.temperatureHistoryTitle')}</Text>
      {data.feverStartISO && data.temps.length > 0 ? (
        <Card style={{ marginBottom: spacing.md }}>
          <FeverCurveChart readings={data.temps} feverStartISO={data.feverStartISO} />
        </Card>
      ) : null}
      {data.temps.length === 0 ? (
        <Text style={styles.emptyNote}>{t('tempScreen.noReadingsYet')}</Text>
      ) : (
        <>
          <Pressable
            onPress={() => setTempsExpanded((v) => !v)}
            style={styles.entriesToggle}
            accessibilityRole="button"
            accessibilityState={{ expanded: tempsExpanded }}
          >
            <Text style={styles.entriesToggleText}>
              {tempsExpanded ? t('common.hide') : t('common.show')} {t('doctorReportModal.temperatureReadingsLabel')}
            </Text>
            <Ionicons name={tempsExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.primaryDark} />
          </Pressable>
          {tempsExpanded ? (
            <>
              {pagedTemps.map((r, i) => (
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
              ))}
              {data.temps.length > PAGE_SIZE ? (
                <Pagination
                  page={tempsPageSafe}
                  totalPages={tempsTotalPages}
                  onPrev={() => setTempsPage((p) => Math.max(0, p - 1))}
                  onNext={() => setTempsPage((p) => Math.min(tempsTotalPages - 1, p + 1))}
                />
              ) : null}
            </>
          ) : null}
        </>
      )}

      <Text style={styles.sectionKicker}>{t('doctorReportModal.medicationTitle')}</Text>
      {data.doses.length === 0 ? (
        <Text style={styles.emptyNote}>{t('doctorReportModal.noDoses')}</Text>
      ) : (
        <>
          <Pressable
            onPress={() => setDosesExpanded((v) => !v)}
            style={styles.entriesToggle}
            accessibilityRole="button"
            accessibilityState={{ expanded: dosesExpanded }}
          >
            <Text style={styles.entriesToggleText}>
              {dosesExpanded ? t('common.hide') : t('common.show')} {t('doctorReportModal.medicationDosesLabel')}
            </Text>
            <Ionicons name={dosesExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.primaryDark} />
          </Pressable>
          {dosesExpanded ? (
            <>
              {pagedDoses.map((d, i) => (
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
              ))}
              {data.doses.length > PAGE_SIZE ? (
                <Pagination
                  page={dosesPageSafe}
                  totalPages={dosesTotalPages}
                  onPrev={() => setDosesPage((p) => Math.max(0, p - 1))}
                  onNext={() => setDosesPage((p) => Math.min(dosesTotalPages - 1, p + 1))}
                />
              ) : null}
            </>
          ) : null}
        </>
      )}

      <View style={styles.bloodReportHeaderRow}>
        <Text style={[styles.sectionKicker, styles.bloodReportKicker]}>{t('doctorReportModal.bloodReportTitle')}</Text>
        <Pressable
          onPress={() => setFullReportVisible(true)}
          style={styles.viewFullReportBtn}
          accessibilityRole="button"
        >
          <Ionicons name="scan-outline" size={14} color={colors.primaryDark} />
          <Text style={styles.viewFullReportBtnText}>{t('doctorReportModal.viewFullReportButton')}</Text>
        </Pressable>
      </View>
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

      <Text style={styles.sectionKicker}>{t('doctorReportModal.dengueTestTitle')}</Text>
      {data.dengueTests.length === 0 ? (
        <Text style={styles.emptyNote}>{t('doctorReportModal.noDengueTests')}</Text>
      ) : (
        data.dengueTests.map((test, i) => (
          <React.Fragment key={test.id}>
            {i > 0 && <EntryListDivider />}
            <EntryListItem
              icon="flask-outline"
              iconColor={test.result === 'positive' ? colors.danger : colors.primary}
              title={`${t(`reportsScreen.dengueTestType.${test.type}`)} — ${t(`reportsScreen.dengueTestResult.${test.result}`)}`}
              time={dateTime(test.atISO)}
              valueLabel={test.photoUri ? t('doctorReportModal.photoAttached') : ''}
            />
          </React.Fragment>
        ))
      )}

      <View style={{ height: spacing.lg }} />

      <FullBloodReportModal
        visible={fullReportVisible}
        onClose={() => setFullReportVisible(false)}
        reports={data.reports}
        feverStartISO={data.feverStartISO}
      />
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
  emptyNote: {
    fontFamily: fontFamily.base,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    paddingVertical: spacing.sm,
  },
  bloodReportHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  bloodReportKicker: {
    marginTop: 0,
    marginBottom: 0,
  },
  viewFullReportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  viewFullReportBtnText: {
    fontFamily: fontFamily.baseBold,
    fontWeight: '600',
    fontSize: fontSize.xs,
    color: colors.primaryDark,
  },
  dayCaption: {
    fontFamily: fontFamily.baseBold,
    fontWeight: '600',
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  entryList: {
    marginTop: spacing.md,
  },
  entriesToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
  },
  entriesToggleText: {
    fontFamily: fontFamily.baseBold,
    fontWeight: '600',
    fontSize: fontSize.xs,
    color: colors.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tabRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  tabButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabButtonText: {
    fontFamily: fontFamily.baseBold,
    fontWeight: '600',
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  tabButtonTextActive: {
    color: colors.textOnPrimary,
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
