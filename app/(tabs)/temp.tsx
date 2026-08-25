import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppTopBar } from '../../src/components/AppTopBar';
import { Banner } from '../../src/components/Banner';
import { PrimaryButton } from '../../src/components/Buttons';
import { Card } from '../../src/components/Card';
import { Chip } from '../../src/components/Chip';
import { DateTimeField } from '../../src/components/DateTimeField';
import { EntryListDivider, EntryListItem } from '../../src/components/EntryListItem';
import { FeverCurveChart } from '../../src/components/FeverCurveChart';
import { Header } from '../../src/components/Header';
import { LabeledInput } from '../../src/components/LabeledInput';
import { Note } from '../../src/components/Note';
import { Screen } from '../../src/components/Screen';
import { useDeleteConfirmation } from '../../src/hooks/useDeleteConfirmation';
import { useNow } from '../../src/hooks/useNow';
import { useSuccessAlert } from '../../src/hooks/useSuccessAlert';
import { formatTime24, illnessDayNumber } from '../../src/state/dateUtils';
import {
  ADULT_MAX_DAILY_MG,
  calcParacetamolDoseMg,
  latestDose,
  nextSafeDoseAtISO,
  todayDosesTotalMg,
} from '../../src/state/medication';
import { useStore } from '../../src/state/store';
import { TempMethod, TempReading } from '../../src/state/types';
import { colors } from '../../src/theme/colors';
import { radius, spacing } from '../../src/theme/spacing';
import { fontFamily, fontSize } from '../../src/theme/typography';

const METHODS: { key: TempMethod; label: string }[] = [
  { key: 'mouth', label: 'Mouth' },
  { key: 'armpit', label: 'Armpit' },
  { key: 'ear', label: 'Ear' },
  { key: 'forehead', label: 'Forehead' },
];

function combine(date: Date, time: Date): Date {
  const out = new Date(date);
  out.setHours(time.getHours(), time.getMinutes(), 0, 0);
  return out;
}

export default function TempScreen() {
  const { t } = useTranslation();
  const { state, actions } = useStore();
  const now = useNow();
  const illness = state.illness!;
  const { confirmDelete, modals } = useDeleteConfirmation();
  const { showSuccess, modal: successModal } = useSuccessAlert();

  const [when, setWhen] = useState(new Date());
  const [tempText, setTempText] = useState('');
  const [method, setMethod] = useState<TempMethod>('ear');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [doseOverride, setDoseOverride] = useState<string | null>(null);

  const temp = Number(tempText);
  const canSave = tempText.trim().length > 0 && !Number.isNaN(temp);

  function resetForm() {
    setWhen(new Date());
    setTempText('');
    setMethod('ear');
    setEditingId(null);
  }

  function startEdit(reading: TempReading) {
    setWhen(new Date(reading.atISO));
    setTempText(String(reading.celsius));
    setMethod(reading.method);
    setEditingId(reading.id);
  }

  function onSave() {
    if (!canSave) return;
    if (editingId) {
      actions.updateTemp(editingId, temp, method, when.toISOString());
      showSuccess('Temperature reading updated.', 'Saved');
    } else {
      actions.addTemp(temp, method, when.toISOString());
      showSuccess('Temperature reading saved.', 'Saved');
    }
    resetForm();
  }

  const suggestedDoseMg = calcParacetamolDoseMg(
    state.profile.weightKg,
    state.profile.dobISO,
    state.profile.conditions
  );
  const doseMgText = doseOverride ?? String(suggestedDoseMg);
  const doseMg = Number(doseMgText);
  const doseValid = doseMgText.trim().length > 0 && !Number.isNaN(doseMg) && doseMg > 0;
  const last = latestDose(state.medicationDoses);
  const lockedUntil = last ? new Date(nextSafeDoseAtISO(last.atISO)) : null;
  const isLocked = !!lockedUntil && lockedUntil > now;
  const remainingMs = isLocked && lockedUntil ? lockedUntil.getTime() - now.getTime() : 0;
  const remainingHours = Math.floor(remainingMs / 3600000);
  const remainingMinutes = Math.floor((remainingMs % 3600000) / 60000);

  const todayTotalMg = todayDosesTotalMg(state.medicationDoses, now);
  const dailyLimitExceeded = todayTotalMg >= ADULT_MAX_DAILY_MG;
  const dailyLimitNear = !dailyLimitExceeded && todayTotalMg >= ADULT_MAX_DAILY_MG * 0.8;

  function onLogDose() {
    if (!doseValid) return;
    Alert.alert(
      t('paracetamol.confirmTitle'),
      t('paracetamol.confirmMessage', { doseMg }),
      [
        { text: t('paracetamol.confirmCancel'), style: 'cancel' },
        {
          text: t('paracetamol.confirmOk'),
          onPress: () => {
            actions.addMedicationDose(doseMg);
            setDoseOverride(null);
            showSuccess(`${doseMg} mg of paracetamol logged.`, 'Dose logged');
          },
        },
      ]
    );
  }

  return (
    <Screen>
      <AppTopBar icon="thermometer" title={t('topBar.temperature')} />
      <Header
        kicker="Temperature"
        title={'Track the fever,\nand the fall'}
        subtitle="The dangerous phase usually starts as the fever comes down. That is why the falling line matters as much as the high one."
      />

      <Card>
        <Text style={styles.cardKicker}>{t('paracetamol.title')}</Text>
        <View style={{ height: spacing.md }} />
        <Text style={styles.doseValue}>{t('paracetamol.suggestedDose', { doseMg: suggestedDoseMg })}</Text>
        <Text style={styles.doseHint}>{t('paracetamol.doseHint')}</Text>

        {dailyLimitExceeded ? (
          <Banner icon="alert-circle-outline" tone="danger">
            {t('paracetamol.dailyLimitExceeded')}
          </Banner>
        ) : dailyLimitNear ? (
          <Banner icon="warning-outline" tone="warning">
            {t('paracetamol.dailyLimitWarning')}
          </Banner>
        ) : null}

        {isLocked ? (
          <View style={styles.countdownBox}>
            <Text style={styles.countdownText}>
              {t('paracetamol.nextSafeDose', { hours: remainingHours, minutes: remainingMinutes })}
            </Text>
          </View>
        ) : (
          <>
            <LabeledInput
              label="Dose to log (mg)"
              hint={`System suggestion: ${suggestedDoseMg} mg, based on weight, age and health conditions. You can adjust it before logging.`}
              keyboardType="decimal-pad"
              mono
              value={doseMgText}
              onChangeText={setDoseOverride}
            />
            {doseOverride !== null && doseOverride !== String(suggestedDoseMg) ? (
              <Text style={[styles.cancelEdit, styles.resetDose]} onPress={() => setDoseOverride(null)}>
                Use suggested dose
              </Text>
            ) : null}
            <PrimaryButton
              label={t('paracetamol.logDoseButton')}
              icon="add"
              disabled={!doseValid}
              onPress={onLogDose}
            />
          </>
        )}
      </Card>

      <Card style={{ marginTop: spacing.lg }}>
        <Text style={styles.cardKicker}>Fever curve</Text>
        <View style={{ height: spacing.md }} />
        <FeverCurveChart readings={state.temps} feverStartISO={illness.feverStartISO} />
      </Card>

      <Card style={{ marginTop: spacing.lg }}>
        <View style={styles.hourHeaderRow}>
          <Text style={styles.cardKicker}>{editingId ? 'Edit reading' : 'Add a reading'}</Text>
          {editingId ? (
            <Text style={styles.cancelEdit} onPress={resetForm}>
              Cancel
            </Text>
          ) : null}
        </View>
        <View style={{ height: spacing.lg }} />

        <View style={styles.row}>
          <DateTimeField label="Date" mode="date" value={when} maximumDate={new Date()} onChange={(d) => setWhen((p) => combine(d, p))} />
          <View style={{ width: spacing.md }} />
          <DateTimeField label="Time" mode="time" value={when} onChange={(t) => setWhen((p) => combine(p, t))} />
        </View>

        <View style={{ height: spacing.lg }} />

        <LabeledInput
          label="Temperature ( C)"
          keyboardType="decimal-pad"
          mono
          value={tempText}
          onChangeText={setTempText}
          placeholder="0.0"
        />

        <View style={styles.chipsRow}>
          {METHODS.map((m) => (
            <Chip key={m.key} label={m.label} selected={method === m.key} onPress={() => setMethod(m.key)} />
          ))}
        </View>

        <PrimaryButton
          label={editingId ? 'Save changes' : 'Save reading'}
          icon={editingId ? undefined : 'add'}
          disabled={!canSave}
          onPress={onSave}
          style={{ marginTop: spacing.sm }}
        />
      </Card>

      <Card style={{ marginTop: spacing.lg }}>
        <Text style={styles.cardKicker}>History</Text>
        <View style={{ height: spacing.sm }} />
        {state.temps.length === 0 ? (
          <Text style={styles.empty}>No readings yet.</Text>
        ) : (
          state.temps.map((t, i) => (
            <React.Fragment key={t.id}>
              {i > 0 && <EntryListDivider />}
              <EntryListItem
                title={`${formatTime24(new Date(t.atISO))}  -  Day ${illnessDayNumber(illness.feverStartISO, new Date(t.atISO))}`}
                time=""
                valueLabel={`${t.celsius.toFixed(1)}  C`}
                onPress={() => startEdit(t)}
                onDelete={() =>
                  confirmDelete(() => actions.removeTemp(t.id), {
                    title: 'Delete this reading?',
                    message: "This temperature reading will be removed from your fever curve. This can't be undone.",
                    successMessage: 'The temperature reading has been removed.',
                  })
                }
              />
            </React.Fragment>
          ))
        )}
      </Card>

      <Note>
        Use paracetamol only for fever. Do not take ibuprofen, diclofenac, mefenamic acid, or aspirin - they raise
        the risk of bleeding in dengue.
      </Note>

      {modals}
      {successModal}
    </Screen>
  );
}

const styles = StyleSheet.create({
  doseValue: {
    fontFamily: fontFamily.mono,
    fontWeight: '700',
    fontSize: fontSize.xxl,
    color: colors.textPrimary,
  },
  doseHint: {
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
    fontFamily: fontFamily.base,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  countdownBox: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.surfaceMutedBorder,
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  countdownText: {
    fontFamily: fontFamily.mono,
    fontWeight: '700',
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  cardKicker: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.xs,
    letterSpacing: 1,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  hourHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cancelEdit: {
    fontFamily: fontFamily.baseBold,
    fontWeight: '600',
    fontSize: fontSize.xs,
    color: colors.primary,
  },
  resetDose: {
    alignSelf: 'flex-start',
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
  },
  empty: {
    fontFamily: fontFamily.base,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.sm,
  },
});
