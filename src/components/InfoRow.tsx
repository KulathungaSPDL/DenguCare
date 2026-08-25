import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { fontFamily, fontSize } from '../theme/typography';

export function InfoRow({
  label,
  value,
  valueColor,
  icon,
}: {
  label: string;
  value: string;
  valueColor?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.labelGroup}>
        {icon ? (
          <View style={styles.iconBadge}>
            <Ionicons name={icon} size={16} color={colors.textSecondary} />
          </View>
        ) : null}
        <Text style={styles.label}>{label}</Text>
      </View>
      <Text style={[styles.value, valueColor ? { color: valueColor } : null]}>{value}</Text>
    </View>
  );
}

export function InfoDivider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  labelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  iconBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  label: {
    fontFamily: fontFamily.base,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  value: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 30 + spacing.md,
  },
});
