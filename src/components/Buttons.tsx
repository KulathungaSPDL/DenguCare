import React, { useRef } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme/colors';
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
      style={[styles.base, styles.primary, disabled && styles.disabled, style, { transform: [{ scale }] }]}
    >
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
      style={[styles.base, styles.dark, disabled && styles.disabled, style, { transform: [{ scale }] }]}
    >
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
      style={[styles.base, styles.danger, disabled && styles.disabled, style, { transform: [{ scale }] }]}
    >
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
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: spacing.sm,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  primaryLabel: {
    color: colors.textOnPrimary,
    fontFamily: fontFamily.baseBold,
    fontSize: fontSize.lg,
  },
  dark: {
    backgroundColor: colors.ink,
  },
  darkLabel: {
    color: colors.textOnDark,
    fontFamily: fontFamily.baseBold,
    fontSize: fontSize.lg,
  },
  danger: {
    backgroundColor: colors.danger,
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
