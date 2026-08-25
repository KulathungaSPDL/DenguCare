import React, { useRef } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { colors } from '../theme/colors';
import { gradients } from '../theme/gradients';
import { radius, spacing } from '../theme/spacing';
import { fontFamily, fontSize } from '../theme/typography';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function usePressScale() {
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn = () => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, friction: 6, tension: 200 }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 6, tension: 200 }).start();
  return { scale, onPressIn, onPressOut };
}

interface ButtonProps {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
}

export function PrimaryButton({ label, onPress, disabled, loading, icon, style }: ButtonProps) {
  const { scale, onPressIn, onPressOut } = usePressScale();
  return (
    <AnimatedPressable
      accessibilityRole="button"
      onPress={disabled || loading ? undefined : onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={[styles.base, disabled && styles.disabled, style, { transform: [{ scale }] }]}
    >
      <LinearGradient colors={gradients.primaryButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradientFill} />
      {loading ? (
        <ActivityIndicator color={colors.textOnPrimary} />
      ) : (
        <View style={styles.row}>
          {icon ? <Ionicons name={icon} size={18} color={colors.textOnPrimary} style={styles.icon} /> : null}
          <Text style={styles.primaryLabel}>{label}</Text>
        </View>
      )}
    </AnimatedPressable>
  );
}

export function DarkButton({ label, onPress, disabled, loading, icon, style }: ButtonProps) {
  const { scale, onPressIn, onPressOut } = usePressScale();
  return (
    <AnimatedPressable
      accessibilityRole="button"
      onPress={disabled || loading ? undefined : onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={[styles.base, disabled && styles.disabled, style, { transform: [{ scale }] }]}
    >
      <LinearGradient colors={gradients.darkButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradientFill} />
      {loading ? (
        <ActivityIndicator color={colors.textOnDark} />
      ) : (
        <View style={styles.row}>
          {icon ? <Ionicons name={icon} size={18} color={colors.textOnDark} style={styles.icon} /> : null}
          <Text style={styles.darkLabel}>{label}</Text>
        </View>
      )}
    </AnimatedPressable>
  );
}

export function DangerButton({ label, onPress, disabled, loading, icon, style }: ButtonProps) {
  const { scale, onPressIn, onPressOut } = usePressScale();
  return (
    <AnimatedPressable
      accessibilityRole="button"
      onPress={disabled || loading ? undefined : onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={[styles.base, disabled && styles.disabled, style, { transform: [{ scale }] }]}
    >
      <LinearGradient colors={['#D14B3B', colors.danger]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradientFill} />
      {loading ? (
        <ActivityIndicator color={colors.textOnPrimary} />
      ) : (
        <View style={styles.row}>
          {icon ? <Ionicons name={icon} size={18} color={colors.textOnPrimary} style={styles.icon} /> : null}
          <Text style={styles.dangerLabel}>{label}</Text>
        </View>
      )}
    </AnimatedPressable>
  );
}

export function OutlineButton({ label, onPress, disabled, icon, style }: ButtonProps) {
  const { scale, onPressIn, onPressOut } = usePressScale();
  return (
    <AnimatedPressable
      accessibilityRole="button"
      onPress={disabled ? undefined : onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={[styles.base, styles.outline, disabled && styles.disabled, style, { transform: [{ scale }] }]}
    >
      <View style={styles.row}>
        {icon ? <Ionicons name={icon} size={18} color={colors.textPrimary} style={styles.icon} /> : null}
        <Text style={styles.outlineLabel}>{label}</Text>
      </View>
    </AnimatedPressable>
  );
}

export function TextLinkButton({ label, onPress, style }: { label: string; onPress?: () => void; style?: ViewStyle }) {
  return (
    <Pressable onPress={onPress} style={[styles.textLink, style]}>
      <Text style={styles.textLinkLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    paddingVertical: 16,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  gradientFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: radius.pill,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: spacing.sm,
  },
  primaryLabel: {
    color: colors.textOnPrimary,
    fontFamily: fontFamily.baseBold,
    fontSize: fontSize.lg,
  },
  darkLabel: {
    color: colors.textOnDark,
    fontFamily: fontFamily.baseBold,
    fontSize: fontSize.lg,
  },
  dangerLabel: {
    color: colors.textOnPrimary,
    fontFamily: fontFamily.baseBold,
    fontSize: fontSize.lg,
  },
  outline: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  outlineLabel: {
    color: colors.textPrimary,
    fontFamily: fontFamily.baseBold,
    fontSize: fontSize.lg,
  },
  disabled: {
    opacity: 0.45,
  },
  textLink: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  textLinkLabel: {
    color: colors.textPrimary,
    fontFamily: fontFamily.baseBold,
    fontSize: fontSize.md,
    textDecorationLine: 'underline',
  },
});
