import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { AmountEntryModal } from '../../src/components/AmountEntryModal';
import { Banner } from '../../src/components/Banner';
import { Card } from '../../src/components/Card';
import { DayEntriesModal } from '../../src/components/DayEntriesModal';
import { EmptyState } from '../../src/components/EmptyState';
import { Header } from '../../src/components/Header';
import { HourlyBalanceChart } from '../../src/components/HourlyBalanceChart';
import { IvEntryModal } from '../../src/components/IvEntryModal';
import { Note } from '../../src/components/Note';
import { Screen } from '../../src/components/Screen';
import { useDeleteConfirmation } from '../../src/hooks/useDeleteConfirmation';
import { useNow } from '../../src/hooks/useNow';
import { useSuccessAlert } from '../../src/hooks/useSuccessAlert';
import { localDateKey } from '../../src/state/dateUtils';
import { DRINK_KINDS } from '../../src/state/drinkKinds';
import { filterByDateKey, useFluidSummary, useHourlyBuckets, useHyponatremiaWarning, useTodayEntries } from '../../src/state/selectors';
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
  const { confirmDelete, modals } = useDeleteConfirmation();
  const { showSuccess, modal: successModal } = useSuccessAlert();

  const { drinks, urine } = useTodayEntries(state, now);
  const { inMl, outMl, targets, thisHourMl } = useFluidSummary(state, now);
  const buckets = useHourlyBuckets(drinks, urine);
  const goalMet = thisHourMl >= targets.hourlyGoalMl;
  const showHyponatremiaWarning = useHyponatremiaWarning(state, now);
  const hasHourlyData = buckets.some((b) => b.drinkMl > 0 || b.urineMl > 0);
  const todayIvFluids = filterByDateKey(state.ivFluids, localDateKey(now));
  const isAdmitted = state.careMode === 'admitted';

  function saveEntry(amountMl: number, kind: string | undefined, atISO: string) {
    if (editingAmount?.kind === 'drink') {
      const kindDef = DRINK_KINDS.find((k) => k.key === kind) ?? DRINK_KINDS[0];
      actions.updateDrink(editingAmount.entry.id, amountMl, kindDef.key, kindDef.label, atISO);
      showSuccess('Drink entry updated.', 'Saved');
    } else if (editingAmount?.kind === 'urine') {
      actions.updateUrine(editingAmount.entry.id, amountMl, atISO);
      showSuccess('Urine entry updated.', 'Saved');
    } else if (tab === 'drinks') {
      const kindDef = DRINK_KINDS.find((k) => k.key === kind) ?? DRINK_KINDS[0];
      actions.addDrink(amountMl, kindDef.key, kindDef.label, atISO);
      showSuccess(`${amountMl} ml of ${kindDef.label.toLowerCase()} logged.`, 'Drink logged');
    } else {
      actions.addUrine(amountMl, atISO);
      showSuccess(`${amountMl} ml of urine logged.`, 'Urine logged');
    }
    setModalOpen(false);
    setEditingAmount(null);
  }

  function saveIvEntry(volumeMl: number, rateMlPerHr: number | null, fluidType: string, note: string, atISO: string) {
    if (editingIv) {
      actions.updateIvFluid(editingIv.id, volumeMl, rateMlPerHr, fluidType, note, atISO);
      showSuccess('IV fluid entry updated.', 'Saved');
    } else {
      actions.addIvFluid(volumeMl, rateMlPerHr, fluidType, note, atISO);
      showSuccess(`${volumeMl} ml IV fluid logged.`, 'IV fluid logged');
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
      title: 'Delete this drink entry?',
      message: "This will remove it from today's fluid balance. This can't be undone.",
      successMessage: 'The drink entry has been removed.',
    });
  }

  function deleteUrine(id: string) {
    confirmDelete(() => actions.removeUrine(id), {
      title: 'Delete this urine entry?',
      message: "This will remove it from today's fluid balance. This can't be undone.",
      successMessage: 'The urine entry has been removed.',
    });
  }

  function deleteIvFluid(id: string) {
    confirmDelete(() => actions.removeIvFluid(id), {
      title: 'Delete this IV fluid entry?',
      message: "This will remove it from today's fluid balance. This can't be undone.",
      successMessage: 'The IV fluid entry has been removed.',
    });
  }

  return (
    <Screen>
      <Header kicker="Fluid balance" title={`In ${inMl} ml · Out ${outMl} ml`} />

      {showHyponatremiaWarning ? (
        <Banner icon="warning-outline" tone="warning">
          {t('fluids.hyponatremiaWarning')}
        </Banner>
      ) : null}

      <Card>
        <View style={styles.hourHeaderRow}>
          <Text style={styles.cardKicker}>This hour</Text>
          {goalMet ? (
            <View style={styles.goalPill}>
              <Text style={styles.goalPillText}>Goal met</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.hourValue}>
          {thisHourMl} <Text style={styles.hourTarget}>/ {targets.hourlyGoalMl} ml</Text>
        </Text>
        <View style={styles.progressTrack}>
          <View style={styles.progressRow}>
            <View
              style={[
                styles.progressFill,
                { flex: Math.min(thisHourMl, targets.hourlyGoalMl) },
              ]}
            />
            {thisHourMl > targets.hourlyGoalMl ? (
              <View style={[styles.progressOverflow, { flex: thisHourMl - targets.hourlyGoalMl }]} />
            ) : null}
            <View style={{ flex: Math.max(0, targets.hourlyGoalMl - thisHourMl) }} />
          </View>
        </View>
      </Card>

      <Card style={{ marginTop: spacing.lg }}>
        <View style={styles.hourHeaderRow}>
          <Text style={styles.cardKicker}>Fluid balance by hour</Text>
          <Pressable
            onPress={() => setEntriesVisible(true)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="View today's entries"
          >
            <MaterialCommunityIcons name="eye-circle-outline" size={20} color={colors.textSecondary} />
          </Pressable>
        </View>
        <View style={{ height: spacing.md }} />
        {hasHourlyData ? (
          <HourlyBalanceChart buckets={buckets} hourlyGoalMl={targets.hourlyGoalMl} />
        ) : (
          <EmptyState
            icon="water-outline"
            title="No fluids logged yet"
            subtitle="Log a drink or urine below and this chart will fill in hour by hour."
          />
        )}
      </Card>

      <View style={styles.addRow}>
        <Pressable
          onPress={() => openAdd('drinks')}
          style={({ pressed }) => [styles.addBtn, pressed && styles.addBtnPressed]}
        >
          <View style={[styles.addBtnIcon, { backgroundColor: colors.drinkIn }]}>
            <Ionicons name="water-outline" size={16} color={colors.textOnPrimary} />
          </View>
          <Text style={styles.addBtnLabel}>Drink</Text>
        </Pressable>
        <Pressable
          onPress={() => openAdd('urine')}
          style={({ pressed }) => [styles.addBtn, pressed && styles.addBtnPressed]}
        >
          <View style={[styles.addBtnIcon, { backgroundColor: colors.urineOut }]}>
            <Ionicons name="flask-outline" size={16} color={colors.textOnPrimary} />
          </View>
          <Text style={styles.addBtnLabel}>Urine</Text>
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
            <Text style={styles.addBtnLabel}>IV Fluid</Text>
          </Pressable>
        ) : null}
      </View>

      <Note>{t('fluids.darkFluidAdvisory')}</Note>

      <AmountEntryModal
        visible={modalOpen}
        title={
          editingAmount
            ? tab === 'drinks' ? 'Edit a drink' : 'Edit urine'
            : tab === 'drinks' ? 'Log a drink' : 'Log urine'
        }
        presets={tab === 'drinks' ? DRINK_PRESETS : URINE_PRESETS}
        accentColor={tab === 'drinks' ? colors.drinkIn : colors.urineOut}
        kindOptions={tab === 'drinks' ? DRINK_KINDS : undefined}
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
        drinks={drinks}
        urine={urine}
        ivFluids={todayIvFluids}
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
