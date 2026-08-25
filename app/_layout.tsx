import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '../src/i18n';
import { StoreProvider } from '../src/state/store';
import { GOOGLE_FONTS_TO_LOAD } from '../src/theme/fonts';

export default function RootLayout() {
  // Non-blocking: text simply falls back to the system font until these
  // finish loading, rather than gating the whole app behind font readiness.
  useFonts(GOOGLE_FONTS_TO_LOAD);

  return (
    <SafeAreaProvider>
      <StoreProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </StoreProvider>
    </SafeAreaProvider>
  );
}
