import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { fontFamily, fontSize } from '../theme/typography';

export function EmptyState({
  title,
  subtitle,
  icon = 'file-tray-outline',
}: {
  title: string;
  subtitle: string;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={26} color={colors.textMuted} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: spacing.md,
    fontFamily: fontFamily.baseBold,
    fontWeight: '700',
    fontSize: fontSize.lg,
    color: colors.textPrimary,
  },
  subtitle: {
    marginTop: spacing.sm,
    fontFamily: fontFamily.base,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: fontSize.sm * 1.5,
  },
});
