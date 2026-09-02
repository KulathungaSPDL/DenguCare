import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { useStore } from '../state/store';
import { DEFAULT_SLEEP_HOURS, SLEEP_HOUR_OPTIONS, sleepSnoozeUntilISO } from '../state/sleepMode';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { fontFamily, fontSize } from '../theme/typography';
import { PrimaryButton } from './Buttons';
import { Checkbox } from './Checkbox';
import { Chip } from './Chip';
import { DateTimeField } from './DateTimeField';
import { LabeledInput } from './LabeledInput';

function combine(date: Date, time: Date): Date {
  const out = new Date(date);
  out.setHours(time.getHours(), time.getMinutes(), 0, 0);
  return out;
}

interface KindOption {
  key: string;
  label: string;
}

interface InitialValues {
  amountMl: number;
  kind?: string;
  atISO: string;
}

interface Props {
  visible: boolean;
  title: string;
  presets: number[];
  accentColor: string;
  kindOptions?: KindOption[];
  initial?: InitialValues | null;
  onClose: () => void;
  onSave: (amountMl: number, kind: string | undefined, atISO: string) => void;
}

export function AmountEntryModal({ visible, title, presets, accentColor, kindOptions, initial, onClose, onSave }: Props) {
  const { t } = useTranslation();
  const { actions } = useStore();
  const [amountText, setAmountText] = useState('');
  const [kind, setKind] = useState(kindOptions?.[0]?.key);
  const [when, setWhen] = useState(new Date());
  const [sleepChecked, setSleepChecked] = useState(false);
  const [sleepHours, setSleepHours] = useState(DEFAULT_SLEEP_HOURS);

  useEffect(() => {
    if (visible) {
      setAmountText(initial ? String(initial.amountMl) : '');
      setKind(initial?.kind ?? kindOptions?.[0]?.key);
      setWhen(initial ? new Date(initial.atISO) : new Date());
      setSleepChecked(false);
      setSleepHours(DEFAULT_SLEEP_HOURS);
    }
  }, [visible]);

  const amount = Number(amountText);
  const canSave = amountText.trim().length > 0 && !Number.isNaN(amount) && amount > 0;
  // Logging a drink or urine entry is the natural "last thing before bed"
  // moment, so this lets the patient pause hydration reminders (both the OS
  // one and the in-app missed-reminder popup) right from here instead of
  // hunting for it in settings - same shared snooze Sleep Mode uses, so it
  // applies regardless of whether this save came from the drink or urine form.
  const showSleepOption = !initial;

  function save() {
    if (!canSave) return;
    onSave(amount, kind, when.toISOString());
    if (showSleepOption && sleepChecked) {
      actions.setRemindersSnoozedUntil(sleepSnoozeUntilISO(sleepHours));
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </Pressable>
          </View>

          {kindOptions ? (
            <View style={styles.chipsRow}>
              {kindOptions.map((opt) => (
                <Chip key={opt.key} label={opt.label} selected={kind === opt.key} onPress={() => setKind(opt.key)} />
              ))}
            </View>
          ) : null}

          <View style={styles.chipsRow}>
            {presets.map((p) => (
              <Pressable key={p} onPress={() => setAmountText(String(p))} style={styles.preset}>
                <Text style={styles.presetLabel}>{p} ml</Text>
              </Pressable>
            ))}
          </View>

          <LabeledInput
            label={t('amountEntryModal.amountLabel')}
            keyboardType="number-pad"
            mono
            value={amountText}
            onChangeText={setAmountText}
            placeholder="0"
            autoFocus
          />

          <View style={styles.row}>
            <DateTimeField label={t('common.date')} mode="date" value={when} maximumDate={new Date()} onChange={(d) => setWhen((p) => combine(d, p))} />
            <View style={{ width: spacing.md }} />
            <DateTimeField label={t('common.time')} mode="time" value={when} onChange={(tm) => setWhen((p) => combine(p, tm))} />
          </View>
          <View style={{ height: spacing.md }} />

          {showSleepOption ? (
            <View style={styles.sleepSection}>
              <Checkbox checked={sleepChecked} onToggle={() => setSleepChecked((v) => !v)} label={t('amountEntryModal.sleepCheckboxLabel')} />
              {sleepChecked ? (
                <>
                  <Text style={styles.sleepHint}>{t('amountEntryModal.sleepCheckboxHint')}</Text>
                  <View style={styles.chipsRow}>
                    {SLEEP_HOUR_OPTIONS.map((h) => (
                      <Chip key={h} label={t('sleepMode.hoursLabel', { count: h })} selected={sleepHours === h} onPress={() => setSleepHours(h)} />
                    ))}
                  </View>
                </>
              ) : null}
            </View>
          ) : null}

          <PrimaryButton
            label={initial ? t('common.saveChanges') : t('common.saveEntry')}
            disabled={!canSave}
            onPress={save}
            style={{ backgroundColor: accentColor }}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15,20,18,0.4)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: fontFamily.baseBold,
    fontWeight: '700',
    fontSize: fontSize.xl,
    color: colors.textPrimary,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  sleepSection: {
    marginBottom: spacing.md,
  },
  sleepHint: {
    fontFamily: fontFamily.base,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginLeft: 30,
  },
  row: {
    flexDirection: 'row',
  },
  preset: {
    borderRadius: radius.pill,
    paddingVertical: 10,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  presetLabel: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
  },
});
