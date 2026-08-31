import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

import { CareBadge } from './CareBadge';
import { PrimaryButton } from './Buttons';
import { useStore } from '../state/store';
import { AppLanguage } from '../state/types';
import { colors } from '../theme/colors';
import { gradients } from '../theme/gradients';
import { spacing } from '../theme/spacing';
import { fontFamily, fontSize } from '../theme/typography';

interface WelcomeContentProps {
  onContinue: () => void;
}

const LANGUAGE_OPTIONS: { code: Exclude<AppLanguage, null>; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'si', label: 'සිංහල' },
  { code: 'ta', label: 'தமிழ்' },
];

// Shared visual content for the startup screen, rendered on every cold start
// from app/index.tsx before the app decides where to send the user next.
// A warm teal gradient hero with the brand mark and the CTA doing the rest -
// deliberately spare, so it reads as a clinical-grade product, not a mascot app.
export function WelcomeContent({ onContinue }: WelcomeContentProps) {
  const { t, i18n } = useTranslation();
  const { actions } = useStore();
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 650, useNativeDriver: true }).start();
  }, [fade]);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <LinearGradient colors={gradients.heroTeal} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={StyleSheet.absoluteFill} />
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
        <Circle cx="88%" cy="4%" r="90" fill="#FFFFFF" opacity={0.07} />
        <Circle cx="-6%" cy="30%" r="70" fill="#FFFFFF" opacity={0.06} />
        <Circle cx="100%" cy="78%" r="120" fill="#FFFFFF" opacity={0.05} />
      </Svg>

      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.langRow}>
          {LANGUAGE_OPTIONS.map((opt) => {
            const active = i18n.language === opt.code;
            return (
              <Pressable
                key={opt.code}
                onPress={() => actions.setLanguage(opt.code)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={[styles.langPill, active && styles.langPillActive]}
              >
                <Text style={[styles.langPillText, active && styles.langPillTextActive]}>{opt.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Animated.View style={[styles.center, { opacity: fade, transform: [{ translateY: fade.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }]}>
          <CareBadge size={128} />

          <Text style={styles.brand}>DenguCare</Text>
          <View style={styles.divider} />
          <Text style={styles.tagline}>{t('welcome.tagline')}</Text>
        </Animated.View>

        <PrimaryButton label={t('welcome.getStarted')} icon="chevron-forward" onPress={onContinue} style={styles.button} />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.primaryDark,
  },
  safe: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.xs,
  },
  langPill: {
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
  },
  langPillActive: {
    backgroundColor: colors.textOnDark,
    borderColor: colors.textOnDark,
  },
  langPillText: {
    fontFamily: fontFamily.baseSemiBold,
    fontWeight: '600',
    fontSize: fontSize.xs,
    color: '#BFF0EC',
  },
  langPillTextActive: {
    color: colors.primaryDark,
    fontFamily: fontFamily.baseBold,
    fontWeight: '700',
  },
  brand: {
    marginTop: spacing.xl,
    color: colors.textOnDark,
    fontFamily: fontFamily.baseExtraBold,
    fontSize: fontSize.display,
    letterSpacing: 0.5,
  },
  divider: {
    marginTop: spacing.md,
    width: 40,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  tagline: {
    marginTop: spacing.md,
    color: '#BFF0EC',
    fontFamily: fontFamily.baseSemiBold,
    fontSize: fontSize.lg,
    textAlign: 'center',
  },
  button: {
    width: '100%',
  },
});
