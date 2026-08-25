import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { fontFamily, fontSize } from '../theme/typography';
import { PrimaryButton } from './Buttons';
import { Chip } from './Chip';
import { DateTimeField } from './DateTimeField';
import { LabeledInput } from './LabeledInput';

function combine(date: Date, time: Date): Date {
  const out = new Date(date);
  out.setHours(time.getHours(), time.getMinutes(), 0, 0);
  return out;
}

const FLUID_TYPE_KEYS = ['normalSaline', 'dextroseSaline', 'ringersLactate', 'other'] as const;

interface InitialValues {
  volumeMl: number;
  rateMlPerHr: number | null;
  fluidType: string;
  atISO: string;
}

interface Props {
  visible: boolean;
  initial?: InitialValues | null;
  onClose: () => void;
  onSave: (volumeMl: number, rateMlPerHr: number | null, fluidType: string, note: string, atISO: string) => void;
}

/** Mirrors AmountEntryModal's sheet/preset/DateTimeField layout, but logs an
 * IV bag (volume + optional infusion rate + fluid type) instead of an oral
 * drink - used only in Admitted-to-Ward care mode. */
export function IvEntryModal({ visible, initial, onClose, onSave }: Props) {
  const { t } = useTranslation();
  const [volumeText, setVolumeText] = useState('');
  const [rateText, setRateText] = useState('');
  const [fluidType, setFluidType] = useState<(typeof FLUID_TYPE_KEYS)[number]>('normalSaline');
  const [when, setWhen] = useState(new Date());

  useEffect(() => {
    if (visible) {
      setVolumeText(initial ? String(initial.volumeMl) : '');
      setRateText(initial?.rateMlPerHr != null ? String(initial.rateMlPerHr) : '');
      setFluidType((initial?.fluidType as (typeof FLUID_TYPE_KEYS)[number]) ?? 'normalSaline');
      setWhen(initial ? new Date(initial.atISO) : new Date());
    }
  }, [visible]);

  const volume = Number(volumeText);
  const canSave = volumeText.trim().length > 0 && !Number.isNaN(volume) && volume > 0;

  function save() {
    if (!canSave) return;
    const rate = rateText.trim() ? Number(rateText) : null;
    // Store the canonical key, not the translated label, so a later
    // language switch still displays past entries correctly.
    onSave(volume, rate != null && !Number.isNaN(rate) ? rate : null, fluidType, '', when.toISOString());
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>{initial ? 'Edit IV fluid' : t('ivFluids.modalTitle')}</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </Pressable>
          </View>

          <View style={styles.chipsRow}>
            {FLUID_TYPE_KEYS.map((key) => (
              <Chip
                key={key}
                label={t(`ivFluids.fluidTypes.${key}`)}
                selected={fluidType === key}
                onPress={() => setFluidType(key)}
              />
            ))}
          </View>

          <LabeledInput
            label={t('ivFluids.volumeLabel')}
            keyboardType="number-pad"
            mono
            value={volumeText}
            onChangeText={setVolumeText}
            placeholder="0"
            autoFocus
          />
          <LabeledInput
            label={t('ivFluids.rateLabel')}
            keyboardType="number-pad"
            mono
            value={rateText}
            onChangeText={setRateText}
            placeholder="0"
          />

          <View style={styles.row}>
            <DateTimeField label="Date" mode="date" value={when} maximumDate={new Date()} onChange={(d) => setWhen((p) => combine(d, p))} />
            <View style={{ width: spacing.md }} />
            <DateTimeField label="Time" mode="time" value={when} onChange={(tm) => setWhen((p) => combine(p, tm))} />
          </View>
          <View style={{ height: spacing.md }} />

          <PrimaryButton
            label={initial ? 'Save changes' : t('ivFluids.saveButton')}
            disabled={!canSave}
            onPress={save}
            style={{ backgroundColor: colors.ivFluid }}
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
  row: {
    flexDirection: 'row',
  },
});
