import { router } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import React from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Banner } from '../../src/components/Banner';
import { Card } from '../../src/components/Card';
import { DarkButton, OutlineButton } from '../../src/components/Buttons';
import { EntryListDivider } from '../../src/components/EntryListItem';
import { Header } from '../../src/components/Header';
import { Note } from '../../src/components/Note';
import { Screen } from '../../src/components/Screen';
import { WarningSignRow } from '../../src/components/WarningSignRow';
import { buildDoctorSummaryHtml } from '../../src/pdf/doctorSummary';
import { useStore } from '../../src/state/store';
import { ORDERED_WARNING_SIGN_KEYS, WARNING_SIGN_LABELS } from '../../src/state/warningSigns';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { fontFamily, fontSize } from '../../src/theme/typography';

const EMERGENCY_NUMBERS = [
  { label: 'Suwa Seriya ambulance', number: '1990' },
  { label: 'Dengue and health hotline', number: '1999' },
  { label: 'Government Information Centre', number: '1919' },
];

export default function SafetyScreen() {
  const { t } = useTranslation();
  const { state, actions } = useStore();

  const anyChecked = ORDERED_WARNING_SIGN_KEYS.some((k) => state.warningSigns[k]);

  async function shareDoctorSummary() {
    try {
      const html = buildDoctorSummaryHtml(state, new Date());
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf' });
    } catch {
      Alert.alert(t('doctorSummary.shareFailed'));
    }
  }

  function confirmNewRecord() {
    Alert.alert(
      'Start a new illness record?',
      'This clears today’s fluid, temperature and warning-sign entries and asks when the new fever started. Your profile stays saved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start new record',
          style: 'destructive',
          onPress: () => {
            actions.resetIllness();
            router.replace('/onboarding/fever-start');
          },
        },
      ]
    );
  }

  return (
    <Screen>
      <Header
        kicker="Warning signs"
        title="Any one of these means go now"
        subtitle="Tick anything you have. Do not wait to see if it passes."
      />

      {anyChecked ? (
        <Banner icon="alert-circle-outline" tone="danger">
          Go to a hospital now. Do not wait to see if it passes — bring this record with you.
        </Banner>
      ) : null}

      <Card>
        {ORDERED_WARNING_SIGN_KEYS.map((key, i) => (
          <React.Fragment key={key}>
            {i > 0 && <EntryListDivider />}
            <WarningSignRow
              label={WARNING_SIGN_LABELS[key]}
              checked={state.warningSigns[key]}
              onToggle={() => actions.setWarningSign(key, !state.warningSigns[key])}
            />
          </React.Fragment>
        ))}
      </Card>

      <Card style={{ marginTop: spacing.lg }}>
        <Text style={styles.cardKicker}>Emergency numbers</Text>
        {EMERGENCY_NUMBERS.map((e, i) => (
          <React.Fragment key={e.number}>
            {i > 0 && <EntryListDivider />}
            <Pressable style={styles.numberRow} onPress={() => Linking.openURL(`tel:${e.number}`)}>
              <Text style={styles.numberLabel}>{e.label}</Text>
              <Text style={styles.numberValue}>{e.number}</Text>
            </Pressable>
          </React.Fragment>
        ))}
      </Card>

      <DarkButton
        label={t('doctorSummary.button')}
        icon="document-text-outline"
        onPress={shareDoctorSummary}
        style={{ marginTop: spacing.lg }}
      />

      <OutlineButton
        label="Start a new illness record"
        onPress={confirmNewRecord}
        style={{ marginTop: spacing.lg }}
      />

      <Note>
        Prototype only. Not a registered medical device. Every number, threshold, and message here must be
        reviewed and approved by a clinical panel, and the app registered with the relevant regulator, before any
        patient uses it.
      </Note>
    </Screen>
  );
}

const styles = StyleSheet.create({
  cardKicker: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.xs,
    letterSpacing: 1,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  numberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  numberLabel: {
    fontFamily: fontFamily.base,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  numberValue: {
    fontFamily: fontFamily.mono,
    fontWeight: '700',
    fontSize: fontSize.lg,
    color: colors.primaryDark,
  },
});
