import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { CONDITIONS } from '../state/conditions';
import { ageYears, formatDatePretty } from '../state/dateUtils';
import { useStore } from '../state/store';
import { Condition, Sex } from '../state/types';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { fontFamily, fontSize } from '../theme/typography';
import { OutlineButton, PrimaryButton } from './Buttons';
import { Chip } from './Chip';
import { DateTimeField } from './DateTimeField';
import { InfoDivider, InfoRow } from './InfoRow';
import { LabeledInput } from './LabeledInput';
import { SegmentedToggle } from './SegmentedToggle';
import { initialsFor } from '../utils/initials';

interface Props {
  visible: boolean;
  onClose: () => void;
}

/** View-and-edit sheet for the patient's own profile — opened from the
 * shared settings menu's "View Profile" row. Opens read-only, with an
 * Update Profile button that switches to an editable form. */
export function ProfileModal({ visible, onClose }: Props) {
  const { t } = useTranslation();
  const { state, actions } = useStore();
  const { profile } = state;

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile.name);
  const [dob, setDob] = useState<Date | null>(profile.dobISO ? new Date(profile.dobISO) : null);
  const [sex, setSex] = useState<Sex>(profile.sex);
  const [weightText, setWeightText] = useState(profile.weightKg ? String(profile.weightKg) : '');
  const [heightText, setHeightText] = useState(profile.heightCm ? String(profile.heightCm) : '');
  const [conditions, setConditions] = useState<Condition[]>(profile.conditions);

  useEffect(() => {
    if (!visible) return;
    setEditing(false);
    setName(profile.name);
    setDob(profile.dobISO ? new Date(profile.dobISO) : null);
    setSex(profile.sex);
    setWeightText(profile.weightKg ? String(profile.weightKg) : '');
    setHeightText(profile.heightCm ? String(profile.heightCm) : '');
    setConditions(profile.conditions);
    // Depends on `profile` (not just `visible`) so the form can't go stale
    // if the store finishes hydrating/updating after this modal has mounted.
  }, [visible, profile]);

  const age = profile.dobISO ? ageYears(profile.dobISO) : null;
  const weightKg = Number(weightText);
  const isValidWeight = weightText.trim().length > 0 && !Number.isNaN(weightKg) && weightKg > 0;
  const canSave = name.trim().length > 0 && !!dob && isValidWeight;
  const visibleConditions = CONDITIONS.filter((c) => !c.sexOnly || c.sexOnly === sex);

  function toggleCondition(key: Condition) {
    setConditions((prev) => (prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]));
  }

  function save() {
    if (!canSave || !dob) return;
    actions.setProfile({
      name: name.trim(),
      dobISO: dob.toISOString().slice(0, 10),
      sex,
      weightKg,
      heightCm: heightText.trim() ? Number(heightText) : null,
      conditions,
    });
    setEditing(false);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>{editing ? t('profileModal.editProfile') : t('profileModal.myProfile')}</Text>
            <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel={t('profileModal.closeAria')}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {!editing ? (
              <>
                <View style={styles.avatarRow}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{initialsFor(profile.name)}</Text>
                  </View>
                  <View style={{ marginLeft: spacing.md }}>
                    <Text style={styles.nameText}>{profile.name.trim() || t('topBar.patientFallback')}</Text>
                    <Text style={styles.subText}>{sex === 'female' ? t('profileSetup.female') : t('profileSetup.male')}</Text>
                  </View>
                </View>

                <InfoRow
                  icon="calendar-outline"
                  label={t('profileModal.dob')}
                  value={profile.dobISO ? formatDatePretty(new Date(profile.dobISO)) : '—'}
                />
                <InfoDivider />
                <InfoRow icon="hourglass-outline" label={t('profileModal.age')} value={age != null ? `${age} ${t('topBar.yearsSuffix')}` : '—'} />
                <InfoDivider />
                <InfoRow icon="barbell-outline" label={t('profileModal.weight')} value={profile.weightKg ? `${profile.weightKg} kg` : '—'} />
                <InfoDivider />
                <InfoRow icon="resize-outline" label={t('profileModal.height')} value={profile.heightCm ? `${profile.heightCm} cm` : '—'} />
                <InfoDivider />
                <InfoRow
                  icon="medkit-outline"
                  label={t('profileModal.medicalHistory')}
                  value={profile.conditions.length > 0 ? profile.conditions.map((key) => t(`conditions.${key}`)).join(', ') : t('common.none')}
                />

                <PrimaryButton
                  label={t('profileModal.updateProfile')}
                  icon="create-outline"
                  onPress={() => setEditing(true)}
                  style={{ marginTop: spacing.xl }}
                />
              </>
            ) : (
              <>
                <LabeledInput label={t('profileModal.fullName')} required placeholder={t('profileModal.fullNamePlaceholder')} value={name} onChangeText={setName} />

                <DateTimeField label={t('profileModal.dob')} mode="date" value={dob} maximumDate={new Date()} onChange={setDob} />
                <View style={{ height: spacing.lg }} />

                <Text style={styles.fieldLabel}>{t('profileModal.sexAtBirth')}</Text>
                <SegmentedToggle
                  options={[
                    { value: 'female', label: t('profileSetup.female') },
                    { value: 'male', label: t('profileSetup.male') },
                  ]}
                  value={sex}
                  onChange={setSex}
                />
                <View style={{ height: spacing.lg }} />

                <View style={{ flexDirection: 'row', gap: spacing.md }}>
                  <View style={{ flex: 1 }}>
                    <LabeledInput
                      label={t('profileModal.weightLabel')}
                      required
                      keyboardType="decimal-pad"
                      mono
                      value={weightText}
                      onChangeText={setWeightText}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <LabeledInput
                      label={t('profileModal.heightLabel')}
                      keyboardType="decimal-pad"
                      mono
                      value={heightText}
                      onChangeText={setHeightText}
                    />
                  </View>
                </View>

                <Text style={styles.fieldLabel}>{t('profileModal.medicalHistory')}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {visibleConditions.map((c) => (
                    <Chip key={c.key} label={t(c.label)} selected={conditions.includes(c.key)} onPress={() => toggleCondition(c.key)} />
                  ))}
                </View>

                <View style={styles.editActions}>
                  <OutlineButton label={t('common.cancel')} onPress={() => setEditing(false)} style={{ flex: 1 }} />
                  <View style={{ width: spacing.md }} />
                  <PrimaryButton label={t('common.saveChanges')} disabled={!canSave} onPress={save} style={{ flex: 1 }} />
                </View>
              </>
            )}
          </ScrollView>
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
    maxHeight: '88%',
  },
  scroll: {
    flexGrow: 0,
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
  fieldLabel: {
    fontFamily: fontFamily.baseBold,
    fontWeight: '600',
    fontSize: fontSize.md,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  editActions: {
    flexDirection: 'row',
    marginTop: spacing.xl,
  },
});
