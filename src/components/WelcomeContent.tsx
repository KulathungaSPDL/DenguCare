import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from './Buttons';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { fontFamily, fontSize } from '../theme/typography';

interface WelcomeContentProps {
  onContinue: () => void;
}

// Shared visual content for the startup screen, rendered on every cold start
// from app/index.tsx before the app decides where to send the user next.
// Photo-free: a calm neutral canvas with a small brand mark, typography, and
// the CTA doing the work, no illustration or imagery.
export function WelcomeContent({ onContinue }: WelcomeContentProps) {
  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.brandMark}>
          <Text style={styles.brandMarkText}>DC</Text>
        </View>
        <View style={styles.center}>
          <Text style={styles.brand}>DenguCare</Text>
          <Text style={styles.tagline}>Stay informed. Stay protected.</Text>
          <Text style={styles.subtext}>Track hydration, symptoms and recovery in one place.</Text>
        </View>

        <PrimaryButton label="Get Started" icon="chevron-forward" onPress={onContinue} style={styles.button} />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safe: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  brandMark: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  brandMarkText: {
    color: colors.textOnPrimary,
    fontFamily: fontFamily.baseBold,
    fontSize: fontSize.xl,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    color: colors.textPrimary,
    fontFamily: fontFamily.baseExtraBold,
    fontSize: fontSize.display,
  },
  tagline: {
    color: colors.primary,
    fontFamily: fontFamily.baseSemiBold,
    fontSize: fontSize.xl,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  subtext: {
    color: colors.textSecondary,
    fontFamily: fontFamily.base,
    fontSize: fontSize.md,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  button: {
    width: '100%',
  },
});
