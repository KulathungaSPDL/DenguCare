import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

import { CareBadge } from './CareBadge';
import { PrimaryButton } from './Buttons';
import { colors } from '../theme/colors';
import { gradients } from '../theme/gradients';
import { spacing } from '../theme/spacing';
import { fontFamily, fontSize } from '../theme/typography';

interface WelcomeContentProps {
  onContinue: () => void;
}

// Shared visual content for the startup screen, rendered on every cold start
// from app/index.tsx before the app decides where to send the user next.
// A warm teal gradient hero with the care-badge mark, a real close-up of the
// Aedes mosquito that makes the app necessary, and the CTA doing the rest.
export function WelcomeContent({ onContinue }: WelcomeContentProps) {
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
        <Animated.View style={[styles.center, { opacity: fade, transform: [{ translateY: fade.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }]}>
          <CareBadge size={112} />

          <Text style={styles.brand}>DenguCare</Text>
          <Text style={styles.tagline}>Stay informed. Stay protected.</Text>

          <View style={styles.factCard}>
            <View style={styles.photoRing}>
              <Image source={require('../../assets/welcome-mosquito.jpg')} style={styles.photo} />
            </View>
            <Text style={styles.factText}>
              The <Text style={styles.factHighlight}>Aedes mosquito</Text> spreads dengue to millions every year.
              DenguCare helps you track symptoms and hydration so you can respond fast.
            </Text>
          </View>
        </Animated.View>

        <PrimaryButton label="Get Started" icon="chevron-forward" onPress={onContinue} style={styles.button} />
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
  brand: {
    marginTop: spacing.lg,
    color: colors.textOnDark,
    fontFamily: fontFamily.baseExtraBold,
    fontSize: fontSize.display,
  },
  tagline: {
    color: '#BFF0EC',
    fontFamily: fontFamily.baseSemiBold,
    fontSize: fontSize.lg,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  factCard: {
    marginTop: spacing.xxl,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    padding: spacing.md,
  },
  photoRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    padding: 2,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginRight: spacing.md,
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: 26,
  },
  factText: {
    flex: 1,
    color: colors.textOnDark,
    fontFamily: fontFamily.base,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.5,
  },
  factHighlight: {
    fontFamily: fontFamily.baseBold,
    fontWeight: '700',
  },
  button: {
    width: '100%',
  },
});
