import { Redirect } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { WelcomeContent } from '../src/components/WelcomeContent';
import { colors } from '../src/theme/colors';
import { useStore } from '../src/state/store';

export default function Entry() {
  const { state } = useStore();
  const [showWelcome, setShowWelcome] = useState(true);

  if (!state.hydrated) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (showWelcome) {
    return <WelcomeContent onContinue={() => setShowWelcome(false)} />;
  }

  const { consent, auth, profile, illness } = state;

  const consentDone = consent.understandGuidance && consent.willGoToHospital && consent.agreeTerms;
  if (!consentDone) return <Redirect href="/onboarding/consent" />;

  const authDone = auth.provider !== null;
  if (!authDone) return <Redirect href="/onboarding/signin" />;

  const profileDone = profile.name.trim().length > 0 && !!profile.dobISO && !!profile.weightKg;
  if (!profileDone) return <Redirect href="/onboarding/profile" />;

  if (!illness) return <Redirect href="/onboarding/fever-start" />;

  return <Redirect href="/(tabs)" />;
}
