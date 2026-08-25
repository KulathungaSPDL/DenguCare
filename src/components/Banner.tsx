import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { fontFamily, fontSize } from '../theme/typography';

type Tone = 'warning' | 'info' | 'danger';

const TONES: Record<Tone, { bg: string; border: string; iconColor: string }> = {
  warning: { bg: colors.surfaceMuted, border: colors.surfaceMutedBorder, iconColor: colors.warning },
  info: { bg: colors.primarySoft, border: colors.borderInfo, iconColor: colors.primaryDark },
  danger: { bg: colors.dangerSoft, border: colors.borderDanger, iconColor: colors.danger },
};

/** Soft banner used for hydration reminders, feature notices, and similar nudges.
 * Fades/scales in on mount; a "danger" tone also pulses its icon to draw the eye. */
export function Banner({
  icon = 'water-outline',
  tone = 'warning',
  children,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  tone?: Tone;
  children: React.ReactNode;
}) {
  const t = TONES[tone];
  const mount = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    mount.setValue(0);
    Animated.spring(mount, { toValue: 1, useNativeDriver: true, friction: 7, tension: 60 }).start();
  }, [mount]);

  useEffect(() => {
    if (tone !== 'danger') return undefined;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [tone, pulse]);

  const iconScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.22] });

  return (
    <Animated.View
      style={[
        styles.wrap,
        { backgroundColor: t.bg, borderColor: t.border },
        {
          opacity: mount,
          transform: [{ scale: mount.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) }],
        },
      ]}
    >
      <Animated.View style={tone === 'danger' ? { transform: [{ scale: iconScale }] } : undefined}>
        <Ionicons name={icon} size={18} color={t.iconColor} style={styles.icon} />
      </Animated.View>
      <Text style={styles.text}>{children}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  icon: {
    marginRight: spacing.md,
    marginTop: 2,
  },
  text: {
    flex: 1,
    fontFamily: fontFamily.base,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    lineHeight: fontSize.md * 1.4,
  },
});
