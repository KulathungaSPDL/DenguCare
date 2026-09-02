import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { AmountEntryModal } from '../../src/components/AmountEntryModal';
import { AppTopBar } from '../../src/components/AppTopBar';
import { Banner } from '../../src/components/Banner';
import { Card } from '../../src/components/Card';
import { DayEntriesModal } from '../../src/components/DayEntriesModal';
import { Header } from '../../src/components/Header';
import { HourlyBalanceCarousel } from '../../src/components/HourlyBalanceCarousel';
import { IvEntryModal } from '../../src/components/IvEntryModal';
import { Note } from '../../src/components/Note';
import { Screen } from '../../src/components/Screen';
import { useDeleteConfirmation } from '../../src/hooks/useDeleteConfirmation';
import { useNow } from '../../src/hooks/useNow';
import { useSuccessAlert } from '../../src/hooks/useSuccessAlert';
import { sumMl } from '../../src/state/calculations';
import { dateFromKey, formatDatePretty, localDateKey, localHour } from '../../src/state/dateUtils';
import { DRINK_KINDS } from '../../src/state/drinkKinds';
import {
  filterByDateKey,
  useFluidSummary,
  useHyponatremiaWarning,
  useLowUrineOutputWarning,
} from '../../src/state/selectors';
import { useStore } from '../../src/state/store';
import { DrinkEntry, IvFluidEntry, UrineEntry } from '../../src/state/types';
import { colors } from '../../src/theme/colors';
import { radius, spacing } from '../../src/theme/spacing';
import { fontFamily, fontSize } from '../../src/theme/typography';

type EditingAmount = { kind: 'drink'; entry: DrinkEntry } | { kind: 'urine'; entry: UrineEntry } | null;

const DRINK_PRESETS = [100, 150, 200, 250];
const URINE_PRESETS = [50, 100, 150, 200];

export default function FluidsScreen() {
  const { t } = useTranslation();
  const { state, actions } = useStore();
  const now = useNow();
  const [tab, setTab] = useState<'drinks' | 'urine'>('drinks');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAmount, setEditingAmount] = useState<EditingAmount>(null);
  const [ivModalOpen, setIvModalOpen] = useState(false);
  const [editingIv, setEditingIv] = useState<IvFluidEntry | null>(null);
  const [entriesVisible, setEntriesVisible] = useState(false);
  const todayKey = localDateKey(now);
  const [selectedDayKey, setSelectedDayKey] = useState(todayKey);
  const { confirmDelete, modals } = useDeleteConfirmation();
  const { showSuccess, modal: successModal } = useSuccessAlert();

  const { inMl, outMl, targets, thisHourMl } = useFluidSummary(state, now);
  const hyponatremia = useHyponatremiaWarning(state, now);
  const todayIvFluids = filterByDateKey(state.ivFluids, todayKey);
  const isAdmitted = state.careMode === 'admitted';
  const todayIvMl = isAdmitted ? sumMl(todayIvFluids.map((f) => ({ amountMl: f.volumeMl }))) : 0;
  const totalIntakeMl = inMl + todayIvMl;
  const showLowUrineOutputWarning = useLowUrineOutputWarning(totalIntakeMl, outMl);

  // IV drip is still fluid in - fold this hour's IV entries into the hourly
  // goal the same way the daily total already does.
  const currentHour = localHour(now);
  const thisHourIvMl = isAdmitted ? sumMl(todayIvFluids.filter((f) => localHour(new Date(f.atISO)) === currentHour).map((f) => ({ amountMl: f.volumeMl }))) : 0;
  const thisHourTotalMl = thisHourMl + thisHourIvMl;
  const goalMet = thisHourTotalMl >= targets.hourlyGoalMl;

  // The entry-list popup (opened via the chart's eye icon) mirrors whichever
  // day the hourly chart is currently showing, not always "today".
  const yesterdayKey = localDateKey(new Date(now.getTime() - 86400000));
  function dayLabel(key: string): string {
    if (key === todayKey) return t('dayEntriesModal.title');
    if (key === yesterdayKey) return t('common.yesterday');
    return formatDatePretty(dateFromKey(key));
  }
  const selectedDayDrinks = filterByDateKey(state.drinks, selectedDayKey);
  const selectedDayUrine = filterByDateKey(state.urine, selectedDayKey);
  const selectedDayIvFluids = isAdmitted ? filterByDateKey(state.ivFluids, selectedDayKey) : [];

  function saveEntry(amountMl: number, kind: string | undefined, atISO: string) {
    if (editingAmount?.kind === 'drink') {
      const kindDef = DRINK_KINDS.find((k) => k.key === kind) ?? DRINK_KINDS[0];
      actions.updateDrink(editingAmount.entry.id, amountMl, kindDef.key, t(kindDef.label), atISO);
      showSuccess(t('logging.drinkUpdated'), t('logging.savedTitle'));
    } else if (editingAmount?.kind === 'urine') {
      actions.updateUrine(editingAmount.entry.id, amountMl, atISO);
      showSuccess(t('logging.urineUpdated'), t('logging.savedTitle'));
    } else if (tab === 'drinks') {
      const kindDef = DRINK_KINDS.find((k) => k.key === kind) ?? DRINK_KINDS[0];
      actions.addDrink(amountMl, kindDef.key, t(kindDef.label), atISO);
      showSuccess(t('logging.drinkLogged', { amount: amountMl, kind: t(kindDef.label).toLowerCase() }), t('logging.drinkLoggedTitle'));
    } else {
      actions.addUrine(amountMl, atISO);
      showSuccess(t('logging.urineLogged', { amount: amountMl }), t('logging.urineLoggedTitle'));
    }
    setModalOpen(false);
    setEditingAmount(null);
  }

  function saveIvEntry(volumeMl: number, rateMlPerHr: number | null, fluidType: string, note: string, atISO: string) {
    if (editingIv) {
      actions.updateIvFluid(editingIv.id, volumeMl, rateMlPerHr, fluidType, note, atISO);
      showSuccess(t('logging.ivUpdated'), t('logging.savedTitle'));
    } else {
      actions.addIvFluid(volumeMl, rateMlPerHr, fluidType, note, atISO);
      showSuccess(t('logging.ivLogged', { amount: volumeMl }), t('logging.ivLoggedTitle'));
    }
    setIvModalOpen(false);
    setEditingIv(null);
  }

  function openAdd(kind: 'drinks' | 'urine') {
    setTab(kind);
    setEditingAmount(null);
    setModalOpen(true);
  }

  function openEditDrink(entry: DrinkEntry) {
    setTab('drinks');
    setEditingAmount({ kind: 'drink', entry });
    setEntriesVisible(false);
    setModalOpen(true);
  }

  function openEditUrine(entry: UrineEntry) {
    setTab('urine');
    setEditingAmount({ kind: 'urine', entry });
    setEntriesVisible(false);
    setModalOpen(true);
  }

  function openEditIv(entry: IvFluidEntry) {
    setEditingIv(entry);
    setEntriesVisible(false);
    setIvModalOpen(true);
  }

  function deleteDrink(id: string) {
    confirmDelete(() => actions.removeDrink(id), {
      title: t('fluidsScreen.deleteDrinkTitle'),
      message: t('fluidsScreen.deleteEntryMsg'),
      successMessage: t('fluidsScreen.deleteDrinkSuccess'),
    });
  }

  function deleteUrine(id: string) {
    confirmDelete(() => actions.removeUrine(id), {
      title: t('fluidsScreen.deleteUrineTitle'),
      message: t('fluidsScreen.deleteEntryMsg'),
      successMessage: t('fluidsScreen.deleteUrineSuccess'),
    });
  }

  function deleteIvFluid(id: string) {
    confirmDelete(() => actions.removeIvFluid(id), {
      title: t('fluidsScreen.deleteIvTitle'),
      message: t('fluidsScreen.deleteEntryMsg'),
      successMessage: t('fluidsScreen.deleteIvSuccess'),
    });
  }

  return (
    <Screen>
      <AppTopBar icon="water" title={t('topBar.fluidBalance')} />
      <Header title={`In ${inMl + todayIvMl} ml  -  Out ${outMl} ml`} />

      {showLowUrineOutputWarning ? (
        <Banner icon="alert-circle-outline" tone="danger">
          {t('fluids.lowUrineOutputWarning', { inMl: totalIntakeMl, outMl })}
        </Banner>
      ) : null}

      {hyponatremia.show ? (
        <Banner icon="warning-outline" tone="warning">
          {t('fluids.hyponatremiaWarning', { waterMl: hyponatremia.waterMl, totalMl: hyponatremia.totalMl })}
        </Banner>
      ) : null}

      <Card>
        <View style={styles.hourHeaderRow}>
          <Text style={styles.cardKicker}>{t('fluidsScreen.thisHour')}</Text>
          {goalMet ? (
            <View style={styles.goalPill}>
              <Text style={styles.goalPillText}>{t('fluidsScreen.goalMet')}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.hourValue}>
          {thisHourTotalMl} <Text style={styles.hourTarget}>/ {targets.hourlyGoalMl} ml</Text>
        </Text>
        <View style={styles.progressTrack}>
          <View style={styles.progressRow}>
            <View
              style={[
                styles.progressFill,
                { flex: Math.min(thisHourTotalMl, targets.hourlyGoalMl) },
              ]}
            />
            {thisHourTotalMl > targets.hourlyGoalMl ? (
              // Capped so the "over goal" segment can never grow past the goal
              // segment itself - drinking well past the target should still
              // read as mostly green, not mostly yellow.
              <View
                style={[
                  styles.progressOverflow,
                  { flex: Math.min(thisHourTotalMl - targets.hourlyGoalMl, targets.hourlyGoalMl * 0.5) },
                ]}
              />
            ) : null}
            <View style={{ flex: Math.max(0, targets.hourlyGoalMl - thisHourTotalMl) }} />
          </View>
        </View>
      </Card>

      <Card style={{ marginTop: spacing.lg }}>
        <View style={styles.hourHeaderRow}>
          <Text style={styles.cardKicker}>{t('fluidsScreen.fluidBalanceByHour')}</Text>
          <Pressable
            onPress={() => setEntriesVisible(true)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={t('fluidsScreen.viewTodayEntriesAria')}
          >
            <MaterialCommunityIcons name="eye-circle-outline" size={20} color={colors.textSecondary} />
          </Pressable>
        </View>
        <View style={{ height: spacing.md }} />
        <HourlyBalanceCarousel
          allDrinks={state.drinks}
          allUrine={state.urine}
          allIvFluids={isAdmitted ? state.ivFluids : []}
          now={now}
          hourlyGoalMl={targets.hourlyGoalMl}
          onDayChange={setSelectedDayKey}
        />
      </Card>

      <View style={styles.addRow}>
        <Pressable
          onPress={() => openAdd('drinks')}
          style={({ pressed }) => [styles.addBtn, pressed && styles.addBtnPressed]}
        >
          <View style={[styles.addBtnIcon, { backgroundColor: colors.drinkIn }]}>
            <Ionicons name="water-outline" size={16} color={colors.textOnPrimary} />
          </View>
          <Text style={styles.addBtnLabel}>{t('fluidsScreen.drink')}</Text>
        </Pressable>
        <Pressable
          onPress={() => openAdd('urine')}
          style={({ pressed }) => [styles.addBtn, pressed && styles.addBtnPressed]}
        >
          <View style={[styles.addBtnIcon, { backgroundColor: colors.urineOut }]}>
            <Ionicons name="flask-outline" size={16} color={colors.textOnPrimary} />
          </View>
          <Text style={styles.addBtnLabel}>{t('fluidsScreen.urine')}</Text>
        </Pressable>
        {isAdmitted ? (
          <Pressable
            onPress={() => {
              setEditingIv(null);
              setIvModalOpen(true);
            }}
            style={({ pressed }) => [styles.addBtn, pressed && styles.addBtnPressed]}
          >
            <View style={[styles.addBtnIcon, { backgroundColor: colors.ivFluid }]}>
              <Ionicons name="medkit-outline" size={16} color={colors.textOnPrimary} />
            </View>
            <Text style={styles.addBtnLabel}>{t('fluidsScreen.ivFluid')}</Text>
          </Pressable>
        ) : null}
      </View>

      <Note>{t('fluids.darkFluidAdvisory')}</Note>

      <AmountEntryModal
        visible={modalOpen}
        title={
          editingAmount
            ? tab === 'drinks' ? t('fluidsScreen.editDrink') : t('fluidsScreen.editUrine')
            : tab === 'drinks' ? t('fluidsScreen.logDrink') : t('fluidsScreen.logUrine')
        }
        presets={tab === 'drinks' ? DRINK_PRESETS : URINE_PRESETS}
        accentColor={tab === 'drinks' ? colors.drinkIn : colors.urineOut}
        kindOptions={tab === 'drinks' ? DRINK_KINDS.map((k) => ({ key: k.key, label: t(k.label) })) : undefined}
        initial={
          editingAmount
            ? {
                amountMl: editingAmount.entry.amountMl,
                kind: editingAmount.kind === 'drink' ? editingAmount.entry.kind : undefined,
                atISO: editingAmount.entry.atISO,
              }
            : null
        }
        onClose={() => {
          setModalOpen(false);
          setEditingAmount(null);
        }}
        onSave={saveEntry}
      />

      {isAdmitted ? (
        <IvEntryModal
          visible={ivModalOpen}
          initial={
            editingIv
              ? {
                  volumeMl: editingIv.volumeMl,
                  rateMlPerHr: editingIv.rateMlPerHr,
                  fluidType: editingIv.fluidType,
                  atISO: editingIv.atISO,
                }
              : null
          }
          onClose={() => {
            setIvModalOpen(false);
            setEditingIv(null);
          }}
          onSave={saveIvEntry}
        />
      ) : null}

      <DayEntriesModal
        visible={entriesVisible}
        onClose={() => setEntriesVisible(false)}
        title={dayLabel(selectedDayKey)}
        drinks={selectedDayDrinks}
        urine={selectedDayUrine}
        ivFluids={selectedDayIvFluids}
        showIv={isAdmitted}
        onEditDrink={openEditDrink}
        onDeleteDrink={deleteDrink}
        onEditUrine={openEditUrine}
        onDeleteUrine={deleteUrine}
        onEditIv={openEditIv}
        onDeleteIv={deleteIvFluid}
      />

      {modals}
      {successModal}
    </Screen>
  );
}

const styles = StyleSheet.create({
  addRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  addBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addBtnPressed: {
    backgroundColor: colors.background,
  },
  addBtnIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnLabel: {
    fontFamily: fontFamily.baseBold,
    fontWeight: '700',
    fontSize: fontSize.sm,
    color: colors.textPrimary,
  },
  hourHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardKicker: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.xs,
    letterSpacing: 1,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  goalPill: {
    backgroundColor: colors.successSoft,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  goalPillText: {
    fontFamily: fontFamily.baseBold,
    fontWeight: '700',
    fontSize: fontSize.xs,
    color: colors.success,
    textTransform: 'uppercase',
  },
  hourValue: {
    marginTop: spacing.sm,
    fontFamily: fontFamily.mono,
    fontWeight: '700',
    fontSize: fontSize.xxl,
    color: colors.textPrimary,
  },
  hourTarget: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    fontWeight: '400',
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.background,
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  progressRow: {
    flex: 1,
    flexDirection: 'row',
    height: '100%',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  progressOverflow: {
    height: '100%',
    backgroundColor: colors.warning,
  },
});
