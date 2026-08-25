import { router } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { PrimaryButton } from '../../src/components/Buttons';
import { ConsentCheckbox } from '../../src/components/ConsentCheckbox';
import { Header } from '../../src/components/Header';
import { Note } from '../../src/components/Note';
import { Screen } from '../../src/components/Screen';
import { useStore } from '../../src/state/store';
import { spacing } from '../../src/theme/spacing';

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
      <Header
        kicker="Before you start"
        title={'This app helps you keep track.\nIt does not treat you.'}
        subtitle="Dengue turns dangerous quietly, and often just as the fever settles. Your job is to drink steadily, pass urine, and get checked. This app keeps the record so you and your doctor can see what is happening."
      />

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
        <PrimaryButton label="Agree and continue" disabled={!allChecked} onPress={onContinue} />
      </View>
    </Screen>
  );
}
