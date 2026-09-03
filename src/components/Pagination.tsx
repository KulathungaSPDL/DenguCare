import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { fontFamily, fontSize } from '../theme/typography';

interface Props {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
}

/** Prev/next pager for a long entry list (e.g. doctor-report temperature or
 * medication history) — keeps the list itself scannable without paginating
 * the trend chart above it. */
export function Pagination({ page, totalPages, onPrev, onNext }: Props) {
  const { t } = useTranslation();
  const atStart = page <= 0;
  const atEnd = page >= totalPages - 1;

  return (
    <View style={styles.row}>
      <Pressable
        onPress={onPrev}
        disabled={atStart}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={t('pagination.prevAria')}
        style={[styles.btn, atStart && styles.btnDisabled]}
      >
        <Ionicons name="chevron-back" size={16} color={atStart ? colors.textMuted : colors.primaryDark} />
      </Pressable>
      <Text style={styles.pageText}>{t('pagination.pageOf', { page: page + 1, total: totalPages })}</Text>
      <Pressable
        onPress={onNext}
        disabled={atEnd}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={t('pagination.nextAria')}
        style={[styles.btn, atEnd && styles.btnDisabled]}
      >
        <Ionicons name="chevron-forward" size={16} color={atEnd ? colors.textMuted : colors.primaryDark} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  btn: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    backgroundColor: colors.background,
  },
  pageText: {
    fontFamily: fontFamily.baseSemiBold,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
});
