import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppTopBar } from '../../src/components/AppTopBar';
import { PrimaryButton } from '../../src/components/Buttons';
import { Card } from '../../src/components/Card';
import { ConsentCheckbox } from '../../src/components/ConsentCheckbox';
import { Header } from '../../src/components/Header';
import { Note } from '../../src/components/Note';
import { Screen } from '../../src/components/Screen';
import { useStore } from '../../src/state/store';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { fontFamily, fontSize } from '../../src/theme/typography';

const BULLETS = [
  'The data insights and trends provided by DenguCare are based on user input and general algorithms, which may not account for your specific medical history.',
  'Any decisions made regarding your health, treatment, or medication must be consulted with your doctor.',
  'The developers and affiliated partners of DenguCare hold no liability for any adverse health outcomes resulting from the misuse of information provided within this app.',
  'Your personal health data is processed in accordance with our Privacy Policy to provide monitoring services.',
];

export default function ConsentScreen() {
  const { state, actions } = useStore();
  const { consent } = state;

  const allChecked = consent.understandGuidance && consent.willGoToHospital && consent.agreeTerms;

  function toggle(key: 'understandGuidance' | 'willGoToHospital' | 'agreeTerms') {
    actions.setConsent({ [key]: !consent[key] });
  }

  function onContinue() {
    actions.setConsent({ agreedAtISO: new Date().toISOString() });
    router.push('/onboarding/signin');
  }

  return (
    <Screen>
      <AppTopBar variant="back" title="Clinical Disclaimer" />
      <Header
        title="Clinical Disclaimer"
        subtitle="Please read carefully before proceeding to use the DenguCare health monitoring platform."
      />

      <Card style={{ marginBottom: spacing.lg }}>
        <Text style={styles.paragraph}>
          This application is designed to assist in the monitoring and management of dengue-related symptoms and
          health metrics. It is intended for informational and supplementary tracking purposes only.
        </Text>

        <View style={styles.warningBox}>
          <View style={styles.warningHeaderRow}>
            <Ionicons name="warning" size={18} color={colors.danger} />
            <Text style={styles.warningTitle}>Not a Substitute for Professional Medical Advice</Text>
          </View>
          <Text style={styles.warningBody}>
            DenguCare is NOT a diagnostic tool and does NOT replace consultation with qualified healthcare
            professionals. If you experience severe symptoms, seek immediate emergency medical care.
          </Text>
        </View>

        <Text style={[styles.paragraph, { marginTop: spacing.lg }]}>
          By using this application, you acknowledge and agree that:
        </Text>

        <View style={{ marginTop: spacing.sm }}>
          {BULLETS.map((b) => (
            <View key={b} style={styles.bulletRow}>
              <Text style={styles.bulletDot}>-</Text>
              <Text style={styles.bulletText}>{b}</Text>
            </View>
          ))}
        </View>

        <Text style={[styles.paragraph, { marginTop: spacing.lg }]}>
          In cases of rapid symptom deterioration, such as severe abdominal pain, persistent vomiting, or bleeding
          gums, do not rely on app notifications. Proceed to the nearest hospital immediately.
        </Text>
      </Card>

      <View style={{ marginBottom: spacing.md }}>
        <ConsentCheckbox checked={consent.understandGuidance} onToggle={() => toggle('understandGuidance')}>
          I understand this app gives general guidance only. It is not a diagnosis and it does not replace a
          doctor.
        </ConsentCheckbox>
        <ConsentCheckbox checked={consent.willGoToHospital} onToggle={() => toggle('willGoToHospital')}>
          I will go to a hospital straight away if I get any warning sign, no matter what the app says.
        </ConsentCheckbox>
        <ConsentCheckbox checked={consent.agreeTerms} onToggle={() => toggle('agreeTerms')}>
          I agree to the Terms of Use and the Privacy Notice, including storing my health records on this device
          and in my account.
        </ConsentCheckbox>
      </View>

      <Note>Emergency in Sri Lanka: call 1990 (Suwa Seriya ambulance). Dengue hotline: 1999.</Note>

      <View style={{ marginTop: spacing.xl }}>
        <PrimaryButton label="Agree and Continue" disabled={!allChecked} onPress={onContinue} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  paragraph: {
    fontFamily: fontFamily.base,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    lineHeight: fontSize.md * 1.5,
  },
  warningBox: {
    marginTop: spacing.lg,
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: colors.borderDanger,
    borderRadius: 16,
    padding: spacing.lg,
  },
  warningHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  warningTitle: {
    flex: 1,
    fontFamily: fontFamily.baseBold,
    fontWeight: '800',
    fontSize: fontSize.md,
    color: colors.danger,
  },
  warningBody: {
    marginTop: spacing.sm,
    fontFamily: fontFamily.base,
    fontSize: fontSize.sm,
    color: colors.danger,
    lineHeight: fontSize.sm * 1.5,
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  bulletDot: {
    fontFamily: fontFamily.base,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginRight: spacing.sm,
  },
  bulletText: {
    flex: 1,
    fontFamily: fontFamily.base,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    lineHeight: fontSize.sm * 1.5,
  },
});
