import { Ionicons } from '@expo/vector-icons';
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

const featureItems = [
  { icon: 'water-outline', title: 'Fluid tracking', caption: 'Daily intake and urine output at a glance.' },
  { icon: 'shield-checkmark-outline', title: 'Warning signs', caption: 'Know what to watch for and when to act.' },
  { icon: 'document-text-outline', title: 'Recovery summary', caption: 'Share clear updates with your care team.' },
] as const;

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
      <LinearGradient colors={gradients.heroTeal} start={{ x: 0.2, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
        <Circle cx="88%" cy="6%" r="120" fill="#FFFFFF" opacity={0.08} />
        <Circle cx="-8%" cy="28%" r="90" fill="#FFFFFF" opacity={0.06} />
        <Circle cx="82%" cy="90%" r="160" fill="#FFFFFF" opacity={0.05} />
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

        <Animated.View
          style={[
            styles.center,
            {
              opacity: fade,
              transform: [{ translateY: fade.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
            },
          ]}
        >
          <View style={styles.heroWrap}>
            <View style={styles.logoWrap}>
              <CareBadge size={138} />
            </View>

            <View style={styles.textBlock}>
              <Text style={styles.h1}>DenguCare</Text>
              <Text style={styles.tagline}>{t('welcome.tagline')}</Text>
            </View>
          </View>

          <View style={styles.featurePanel}>
            <Text style={styles.featureTitle}>Everything you need, in one place</Text>
            {featureItems.map((feature) => (
              <View key={feature.title} style={styles.featureRow}>
                <View style={styles.featureIconWrap}>
                  <Ionicons name={feature.icon} size={18} color={colors.primary} />
                </View>
                <View style={styles.featureTextWrap}>
                  <Text style={styles.featureLabel}>{feature.title}</Text>
                  <Text style={styles.featureCaption}>{feature.caption}</Text>
                </View>
              </View>
            ))}
          </View>
        </Animated.View>

        <PrimaryButton label={t('welcome.getStarted')} icon="arrow-forward" onPress={onContinue} style={styles.button} />
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
  center: {
    flex: 1,
    justifyContent: 'center',
  },
  heroWrap: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  logoWrap: {
    width: 138,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  textBlock: {
    width: '100%',
    alignItems: 'center',
  },
  h1: {
    color: colors.textOnDark,
    fontFamily: fontFamily.baseExtraBold,
    fontSize: 48,
    lineHeight: 52,
    letterSpacing: -1.2,
    textShadowColor: 'rgba(0,0,0,0.18)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 12,
  },
  tagline: {
    marginTop: spacing.sm,
    color: '#C9F1ED',
    fontFamily: fontFamily.baseSemiBold,
    fontSize: fontSize.md,
    lineHeight: 22,
  },
  highlightsRow: {
    flexDirection: 'row',
    marginTop: spacing.xl,
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  highlightChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  highlightChipText: {
    color: colors.textOnDark,
    fontFamily: fontFamily.baseMedium,
    fontSize: fontSize.sm,
  },
  featurePanel: {
    marginTop: spacing.xl,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 24,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  featureTitle: {
    color: colors.textOnDark,
    fontFamily: fontFamily.baseBold,
    fontSize: fontSize.lg,
    marginBottom: spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  featureIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#DDF8F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  featureTextWrap: {
    flex: 1,
  },
  featureLabel: {
    color: colors.textOnDark,
    fontFamily: fontFamily.baseSemiBold,
    fontSize: fontSize.md,
  },
  featureCaption: {
    marginTop: 2,
    color: '#C9F1ED',
    fontFamily: fontFamily.base,
    fontSize: fontSize.sm,
    lineHeight: 18,
  },
  button: {
    width: '100%',
  },
});
