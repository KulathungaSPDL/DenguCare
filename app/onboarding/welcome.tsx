import { router } from 'expo-router';
import React from 'react';

import { WelcomeContent } from '../../src/components/WelcomeContent';

export default function WelcomeScreen() {
  return <WelcomeContent onContinue={() => router.push('/onboarding/consent')} />;
}
