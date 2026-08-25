import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { fontFamily, fontSize } from '../theme/typography';

interface HeaderProps {
  kicker?: string;
  title: string;
  subtitle?: string;
}

export function Header({ kicker, title, subtitle }: HeaderProps) {
  return (
    <View style={styles.wrap}>
      {kicker ? <Text style={styles.kicker}>{kicker}</Text> : null}
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.xl,
  },
  kicker: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.xs,
    letterSpacing: 1.2,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  title: {
    fontFamily: fontFamily.baseBold,
    fontWeight: '800',
    fontSize: fontSize.xxl,
    color: colors.textPrimary,
    lineHeight: fontSize.xxl * 1.2,
  },
  subtitle: {
    marginTop: spacing.sm,
    fontFamily: fontFamily.base,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: fontSize.md * 1.45,
  },
});
