import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { fontFamily, fontSize } from '../theme/typography';

export function LinkRow({
  icon,
  label,
  tone = 'default',
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  tone?: 'default' | 'dark';
  onPress?: () => void;
}) {
  const dark = tone === 'dark';
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, dark && styles.rowDark, pressed && (dark ? styles.pressedDark : styles.pressed)]}
    >
      <Ionicons name={icon} size={18} color={dark ? colors.textOnDark : colors.textPrimary} />
      <Text style={[styles.label, dark && styles.labelDark]}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={dark ? colors.textOnDark : colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  rowDark: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  pressed: {
    backgroundColor: colors.background,
  },
  pressedDark: {
    opacity: 0.88,
  },
  label: {
    flex: 1,
    marginLeft: spacing.md,
    fontFamily: fontFamily.baseBold,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  labelDark: {
    color: colors.textOnDark,
  },
});
