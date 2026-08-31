import { router } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppTopBar } from '../../src/components/AppTopBar';
import { DarkButton, OutlineButton, TextLinkButton } from '../../src/components/Buttons';
import { Header } from '../../src/components/Header';
import { Note } from '../../src/components/Note';
import { Screen } from '../../src/components/Screen';
import { AuthProvider } from '../../src/state/types';
import { useStore } from '../../src/state/store';
import { spacing } from '../../src/theme/spacing';

export default function SignInScreen() {
  const { t } = useTranslation();
  const { actions } = useStore();

  function proceed(provider: AuthProvider) {
    actions.setAuth(provider !== 'skipped', provider);
    router.push('/onboarding/profile');
  }

  return (
    <Screen>
      <AppTopBar variant="back" title={t('signin.title')} />
      <Header
        title={t('signin.headerTitle')}
        subtitle={t('signin.headerSubtitle')}
      />

      <View style={{ gap: spacing.md }}>
        <DarkButton label={t('signin.google')} onPress={() => proceed('google')} />
        <OutlineButton label={t('signin.apple')} onPress={() => proceed('apple')} />
        <OutlineButton label={t('signin.mobile')} onPress={() => proceed('mobile')} />
      </View>

      <TextLinkButton label={t('signin.skip')} onPress={() => proceed('skipped')} style={{ marginTop: spacing.lg }} />

      <Note>{t('signin.note')}</Note>
    </Screen>
  );
}
