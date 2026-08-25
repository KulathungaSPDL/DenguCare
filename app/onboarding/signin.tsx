import { router } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { AppTopBar } from '../../src/components/AppTopBar';
import { DarkButton, OutlineButton, TextLinkButton } from '../../src/components/Buttons';
import { Header } from '../../src/components/Header';
import { Note } from '../../src/components/Note';
import { Screen } from '../../src/components/Screen';
import { AuthProvider } from '../../src/state/types';
import { useStore } from '../../src/state/store';
import { spacing } from '../../src/theme/spacing';

export default function SignInScreen() {
  const { actions } = useStore();

  function proceed(provider: AuthProvider) {
    actions.setAuth(provider !== 'skipped', provider);
    router.push('/onboarding/profile');
  }

  return (
    <Screen>
      <AppTopBar variant="back" title="Sign In" />
      <Header
        title="Save your record so nothing is lost."
        subtitle="If your phone dies or you are admitted, your chart is still there."
      />

      <View style={{ gap: spacing.md }}>
        <DarkButton label="Continue with Google" onPress={() => proceed('google')} />
        <OutlineButton label="Continue with Apple" onPress={() => proceed('apple')} />
        <OutlineButton label="Continue with mobile number" onPress={() => proceed('mobile')} />
      </View>

      <TextLinkButton label="Skip for now" onPress={() => proceed('skipped')} style={{ marginTop: spacing.lg }} />

      <Note>
        Prototype: sign-in is simulated. In production this is Firebase Auth or Supabase Auth with Google, Apple,
        and OTP.
      </Note>
    </Screen>
  );
}
