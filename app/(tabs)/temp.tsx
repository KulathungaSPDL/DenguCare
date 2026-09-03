import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { AppTopBar } from '../../src/components/AppTopBar';
import { Banner } from '../../src/components/Banner';
import { PrimaryButton } from '../../src/components/Buttons';
import { Card } from '../../src/components/Card';
import { Chip } from '../../src/components/Chip';
import { ConfirmModal } from '../../src/components/ConfirmModal';
import { DateTimeField } from '../../src/components/DateTimeField';
import { EntryListDivider, EntryListItem } from '../../src/components/EntryListItem';
import { FeverCurveChart } from '../../src/components/FeverCurveChart';
import { Header } from '../../src/components/Header';
import { LabeledInput } from '../../src/components/LabeledInput';
import { Note } from '../../src/components/Note';
import { Pagination } from '../../src/components/Pagination';
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

const METHODS: { key: TempMethod; labelKey: string }[] = [
  { key: 'mouth', labelKey: 'tempScreen.methods.mouth' },
  { key: 'armpit', labelKey: 'tempScreen.methods.armpit' },
  { key: 'ear', labelKey: 'tempScreen.methods.ear' },
  { key: 'forehead', labelKey: 'tempScreen.methods.forehead' },
];

function combine(date: Date, time: Date): Date {
  const out = new Date(date);
  out.setHours(time.getHours(), time.getMinutes(), 0, 0);
  return out;
}

const PAGE_SIZE = 10;

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
  const [doseConfirmVisible, setDoseConfirmVisible] = useState(false);
  const [tempsPage, setTempsPage] = useState(0);
  const [dosesPage, setDosesPage] = useState(0);
  const [tempHistoryVisible, setTempHistoryVisible] = useState(false);
  const [doseHistoryVisible, setDoseHistoryVisible] = useState(false);

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
      showSuccess(t('tempScreen.readingUpdated'), t('logging.savedTitle'));
    } else {
      actions.addTemp(temp, method, when.toISOString());
      showSuccess(t('tempScreen.readingSaved'), t('logging.savedTitle'));
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
    setDoseConfirmVisible(true);
  }

  function confirmLogDose() {
    setDoseConfirmVisible(false);
    actions.addMedicationDose(doseMg);
    setDoseOverride(null);
    showSuccess(t('tempScreen.doseLoggedMsg', { mg: doseMg }), t('tempScreen.doseLoggedTitle'));
  }

  const tempsTotalPages = Math.max(1, Math.ceil(state.temps.length / PAGE_SIZE));
  const tempsPageSafe = Math.min(tempsPage, tempsTotalPages - 1);
  const pagedTemps = state.temps.slice(tempsPageSafe * PAGE_SIZE, tempsPageSafe * PAGE_SIZE + PAGE_SIZE);

  const dosesTotalPages = Math.max(1, Math.ceil(state.medicationDoses.length / PAGE_SIZE));
  const dosesPageSafe = Math.min(dosesPage, dosesTotalPages - 1);
  const pagedDoses = state.medicationDoses.slice(dosesPageSafe * PAGE_SIZE, dosesPageSafe * PAGE_SIZE + PAGE_SIZE);

  return (
    <Screen>
      <AppTopBar icon="thermometer" title={t('topBar.temperature')} />
      <Header
        title={t('tempScreen.headerTitle')}
        subtitle={t('tempScreen.headerSubtitle')}
      />

      <Card>
        <View style={styles.hourHeaderRow}>
          <Text style={styles.cardKicker}>{t('paracetamol.title')}</Text>
          <Pressable
            onPress={() => setDoseHistoryVisible((v) => !v)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('tempScreen.viewDoseHistoryAria')}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
          >
            <Ionicons name="time-outline" size={20} color={colors.primaryDark} />
          </Pressable>
        </View>
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
              label={t('tempScreen.doseLabel')}
              hint={t('tempScreen.doseHint', { mg: suggestedDoseMg })}
              keyboardType="decimal-pad"
              mono
              value={doseMgText}
              onChangeText={setDoseOverride}
            />
            {doseOverride !== null && doseOverride !== String(suggestedDoseMg) ? (
              <Text style={[styles.cancelEdit, styles.resetDose]} onPress={() => setDoseOverride(null)}>
                {t('tempScreen.useSuggestedDose')}
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
        <View style={styles.hourHeaderRow}>
          <Text style={styles.cardKicker}>{t('tempScreen.feverCurve')}</Text>
          <Pressable
            onPress={() => setTempHistoryVisible((v) => !v)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('tempScreen.viewHistoryAria')}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
          >
            <Ionicons name="time-outline" size={20} color={colors.primaryDark} />
          </Pressable>
        </View>
        <View style={{ height: spacing.md }} />
        <FeverCurveChart readings={state.temps} feverStartISO={illness.feverStartISO} />
      </Card>

      <Card style={{ marginTop: spacing.lg }}>
        <View style={styles.hourHeaderRow}>
          <Text style={styles.cardKicker}>{editingId ? t('tempScreen.editReading') : t('tempScreen.addReading')}</Text>
          {editingId ? (
            <Text style={styles.cancelEdit} onPress={resetForm}>
              {t('common.cancel')}
            </Text>
          ) : null}
        </View>
        <View style={{ height: spacing.lg }} />

        <View style={styles.row}>
          <DateTimeField label={t('common.date')} mode="date" value={when} maximumDate={new Date()} onChange={(d) => setWhen((p) => combine(d, p))} />
          <View style={{ width: spacing.md }} />
          <DateTimeField label={t('common.time')} mode="time" value={when} onChange={(t) => setWhen((p) => combine(p, t))} />
        </View>

        <View style={{ height: spacing.lg }} />

        <LabeledInput
          label={t('tempScreen.temperatureLabel')}
          keyboardType="decimal-pad"
          mono
          value={tempText}
          onChangeText={setTempText}
          placeholder="0.0"
        />

        <View style={styles.chipsRow}>
          {METHODS.map((m) => (
            <Chip key={m.key} label={t(m.labelKey)} selected={method === m.key} onPress={() => setMethod(m.key)} />
          ))}
        </View>

        <PrimaryButton
          label={editingId ? t('common.saveChanges') : t('tempScreen.saveReading')}
          icon={editingId ? undefined : 'add'}
          disabled={!canSave}
          onPress={onSave}
          style={{ marginTop: spacing.sm }}
        />
      </Card>

      {tempHistoryVisible ? (
        <Card style={{ marginTop: spacing.lg }}>
          <Text style={styles.cardKicker}>{t('tempScreen.history')}</Text>
          <View style={{ height: spacing.sm }} />
          {state.temps.length === 0 ? (
            <Text style={styles.empty}>{t('tempScreen.noReadingsYet')}</Text>
          ) : (
            <>
              {pagedTemps.map((reading, i) => (
                <React.Fragment key={reading.id}>
                  {i > 0 && <EntryListDivider />}
                  <EntryListItem
                    title={t('tempScreen.readingRow', {
                      time: formatTime24(new Date(reading.atISO)),
                      day: illnessDayNumber(illness.feverStartISO, new Date(reading.atISO)),
                    })}
                    time=""
                    valueLabel={`${reading.celsius.toFixed(1)}  C`}
                    onPress={() => startEdit(reading)}
                    onDelete={() =>
                      confirmDelete(() => actions.removeTemp(reading.id), {
                        title: t('tempScreen.deleteReadingTitle'),
                        message: t('tempScreen.deleteReadingMsg'),
                        successMessage: t('tempScreen.deleteReadingSuccess'),
                      })
                    }
                  />
                </React.Fragment>
              ))}
              {state.temps.length > PAGE_SIZE ? (
                <Pagination
                  page={tempsPageSafe}
                  totalPages={tempsTotalPages}
                  onPrev={() => setTempsPage((p) => Math.max(0, p - 1))}
                  onNext={() => setTempsPage((p) => Math.min(tempsTotalPages - 1, p + 1))}
                />
              ) : null}
            </>
          )}
        </Card>
      ) : null}

      {doseHistoryVisible ? (
        <Card style={{ marginTop: spacing.lg }}>
          <Text style={styles.cardKicker}>{t('tempScreen.doseHistory')}</Text>
          <View style={{ height: spacing.sm }} />
          {state.medicationDoses.length === 0 ? (
            <Text style={styles.empty}>{t('tempScreen.noDosesYet')}</Text>
          ) : (
            <>
              {pagedDoses.map((dose, i) => (
                <React.Fragment key={dose.id}>
                  {i > 0 && <EntryListDivider />}
                  <EntryListItem
                    title={t('tempScreen.doseRow', {
                      time: formatTime24(new Date(dose.atISO)),
                      day: illnessDayNumber(illness.feverStartISO, new Date(dose.atISO)),
                    })}
                    time=""
                    valueLabel={`${dose.doseMg} mg`}
                    onDelete={() =>
                      confirmDelete(() => actions.removeMedicationDose(dose.id), {
                        title: t('tempScreen.deleteDoseTitle'),
                        message: t('tempScreen.deleteDoseMsg'),
                        successMessage: t('tempScreen.deleteDoseSuccess'),
                      })
                    }
                  />
                </React.Fragment>
              ))}
              {state.medicationDoses.length > PAGE_SIZE ? (
                <Pagination
                  page={dosesPageSafe}
                  totalPages={dosesTotalPages}
                  onPrev={() => setDosesPage((p) => Math.max(0, p - 1))}
                  onNext={() => setDosesPage((p) => Math.min(dosesTotalPages - 1, p + 1))}
                />
              ) : null}
            </>
          )}
        </Card>
      ) : null}

      <Note>{t('tempScreen.note')}</Note>

      <View style={{ height: spacing.xxl }} />

      {modals}
      {successModal}

      <ConfirmModal
        visible={doseConfirmVisible}
        title={t('paracetamol.confirmTitle')}
        message={t('paracetamol.confirmMessage', { doseMg })}
        confirmLabel={t('paracetamol.confirmOk')}
        cancelLabel={t('paracetamol.confirmCancel')}
        tone="primary"
        icon="medical"
        onConfirm={confirmLogDose}
        onCancel={() => setDoseConfirmVisible(false)}
      />
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
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnPressed: {
    backgroundColor: colors.primaryMist,
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
