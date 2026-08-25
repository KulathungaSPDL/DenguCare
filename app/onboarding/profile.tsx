import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppTopBar } from '../../src/components/AppTopBar';
import { PrimaryButton } from '../../src/components/Buttons';
import { Card } from '../../src/components/Card';
import { Chip } from '../../src/components/Chip';
import { DateTimeField } from '../../src/components/DateTimeField';
import { LabeledInput } from '../../src/components/LabeledInput';
import { Screen } from '../../src/components/Screen';
import { SegmentedToggle } from '../../src/components/SegmentedToggle';
import { useStore } from '../../src/state/store';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { fontFamily, fontSize } from '../../src/theme/typography';
import { CareMode, Condition } from '../../src/state/types';

const CONDITIONS: { key: Condition; label: string; sexOnly?: 'female' }[] = [
  { key: 'pregnant', label: 'Pregnant', sexOnly: 'female' },
  { key: 'diabetes', label: 'Diabetes' },
  { key: 'heart_kidney', label: 'Heart or kidney disease' },
  { key: 'blood_thinners', label: 'On blood thinners' },
];

const DEFAULT_DOB = (() => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 25);
  return d;
})();

function SectionHeader({ icon, title }: { icon: keyof typeof Ionicons.glyphMap; title: string }) {
  return (
    <View style={styles.sectionHeaderRow}>
      <View style={styles.sectionIconCircle}>
        <Ionicons name={icon} size={16} color={colors.primaryDark} />
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { state, actions } = useStore();
  const { profile } = state;
  const [weightText, setWeightText] = useState(profile.weightKg ? String(profile.weightKg) : '');
  const [heightText, setHeightText] = useState(profile.heightCm ? String(profile.heightCm) : '');

  const dob = profile.dobISO ? new Date(profile.dobISO) : null;
  const weightKg = Number(weightText);
  const isValidWeight = weightText.trim().length > 0 && !Number.isNaN(weightKg) && weightKg > 0;

  const canContinue = useMemo(
    () => profile.name.trim().length > 0 && !!dob && isValidWeight,
    [profile.name, dob, isValidWeight]
  );

  const visibleConditions = CONDITIONS.filter((c) => !c.sexOnly || c.sexOnly === profile.sex);

  function onContinue() {
    actions.setProfile({
      weightKg: isValidWeight ? weightKg : null,
      heightCm: heightText.trim() ? Number(heightText) : null,
    });
    router.push('/onboarding/fever-start');
  }

  return (
    <Screen
      footer={
        <View>
          <PrimaryButton label="Complete Setup" disabled={!canContinue} onPress={onContinue} />
          {!canContinue ? <Text style={hintStyle}>Add your name, date of birth and weight to continue.</Text> : null}
        </View>
      }
    >
      <AppTopBar
        variant="back"
        title="Patient Profile Setup"
        subtitle="Step 1 of 2 - please provide accurate information for monitoring."
      />
      <Card style={{ marginBottom: spacing.lg }}>
        <SectionHeader icon="person" title="Demographics" />

        <Text style={labelStyle}>
          Where are you being cared for?<Text style={{ color: colors.danger }}> *</Text>
        </Text>
        <SegmentedToggle
          options={[
            { value: 'home', label: t('careMode.home') },
            { value: 'admitted', label: t('careMode.admitted') },
          ]}
          value={state.careMode}
          onChange={(mode: CareMode) => actions.setCareMode(mode)}
        />

        <View style={{ height: spacing.lg }} />

        <LabeledInput
          label="Full Name"
          required
          placeholder="e.g. Jane Doe"
          value={profile.name}
          onChangeText={(name) => actions.setProfile({ name })}
        />

        <DateTimeField
          label="Date of birth *"
          mode="date"
          value={dob}
          defaultValue={DEFAULT_DOB}
          maximumDate={new Date()}
          onChange={(d) => actions.setProfile({ dobISO: d.toISOString().slice(0, 10) })}
        />

        <View style={{ height: spacing.lg }} />

        <Text style={labelStyle}>
          Sex at birth<Text style={{ color: colors.danger }}> *</Text>
        </Text>
        <SegmentedToggle
          options={[
            { value: 'female', label: 'Female' },
            { value: 'male', label: 'Male' },
          ]}
          value={profile.sex}
          onChange={(sex) => actions.setProfile({ sex })}
        />

        <View style={{ height: spacing.lg }} />

        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <View style={{ flex: 1 }}>
            <LabeledInput
              label="Weight (kg)"
              required
              keyboardType="decimal-pad"
              mono
              value={weightText}
              onChangeText={setWeightText}
              placeholder="Required for fluid calc"
            />
          </View>
          <View style={{ flex: 1 }}>
            <LabeledInput
              label="Height (cm) (optional)"
              keyboardType="decimal-pad"
              mono
              value={heightText}
              onChangeText={setHeightText}
              placeholder="0"
            />
          </View>
        </View>
        <Text style={hintInlineStyle}>Adding your height makes your fluid target more accurate.</Text>
      </Card>

      <Card>
        <SectionHeader icon="medkit" title="Medical History" />
        <Text style={hintInlineStyle}>Anything else we should know</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.sm }}>
          {visibleConditions.map((c) => (
            <Chip
              key={c.key}
              label={c.label}
              selected={profile.conditions.includes(c.key)}
              onPress={() => actions.toggleCondition(c.key)}
            />
          ))}
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  sectionTitle: {
    fontFamily: fontFamily.baseBold,
    fontWeight: '800',
    fontSize: fontSize.lg,
    color: colors.textPrimary,
  },
});

const labelStyle = {
  fontFamily: fontFamily.baseBold,
  fontWeight: '600' as const,
  fontSize: fontSize.md,
  color: colors.textPrimary,
  marginBottom: spacing.sm,
};

const hintStyle = {
  textAlign: 'center' as const,
  marginTop: spacing.md,
  fontFamily: fontFamily.base,
  fontSize: fontSize.sm,
  color: colors.textSecondary,
};

const hintInlineStyle = {
  marginBottom: spacing.sm,
  fontFamily: fontFamily.base,
  fontSize: fontSize.sm,
  color: colors.textSecondary,
};
