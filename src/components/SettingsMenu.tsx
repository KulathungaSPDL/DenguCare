import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useStore } from '../state/store';
import { AppLanguage } from '../state/types';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { fontFamily, fontSize } from '../theme/typography';

const LANGUAGE_OPTIONS: { code: Exclude<AppLanguage, null>; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'si', label: '\u0dc3\u0dd2\u0d82\u0dc4\u0dbd' },
  { code: 'ta', label: '\u0ba4\u0bae\u0bbf\u0bb4\u0bcd' },
];

/** Shared language / reminders / care-mode menu, opened from the three-dot
 * button on both AppTopBar and DashboardHero. */
export function SettingsMenu({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { t, i18n } = useTranslation();
  const { state, actions } = useStore();
  const isAdmitted = state.careMode === 'admitted';
  const remindersOn = state.remindersOn;

  function toggleCareMode() {
    const next = isAdmitted ? 'home' : 'admitted';
    Alert.alert(
      next === 'admitted' ? 'Switch to Admitted to Ward Mode?' : 'Switch to Home Care Mode?',
      next === 'admitted'
        ? 'This adds IV fluid tracking to your fluid balance for while you are in hospital.'
        : 'This turns off IV fluid tracking and goes back to oral-intake-only fluid balance.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Switch', onPress: () => actions.setCareMode(next) },
      ]
    );
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.modalCard}>
          <Text style={styles.modalSectionLabel}>{t('topBar.language')}</Text>
          {LANGUAGE_OPTIONS.map((opt) => {
            const active = i18n.language === opt.code;
            return (
              <Pressable
                key={opt.code}
                onPress={() => actions.setLanguage(opt.code)}
                style={[styles.modalRow, active && styles.modalRowActive]}
              >
                <Text style={[styles.modalRowText, active && styles.modalRowTextActive]}>{opt.label}</Text>
                {active ? <Ionicons name="checkmark-circle" size={18} color={colors.primary} /> : null}
              </Pressable>
            );
          })}

          <View style={styles.modalDivider} />

          <Pressable
            onPress={() => actions.setRemindersOn(!remindersOn)}
            style={styles.modalRow}
            accessibilityRole="button"
            accessibilityLabel="Toggle hourly hydration reminders"
          >
            <View style={styles.modalRowLabelWrap}>
              <Ionicons
                name={remindersOn ? 'notifications' : 'notifications-off-outline'}
                size={18}
                color={colors.textPrimary}
                style={styles.modalRowIcon}
              />
              <Text style={styles.modalRowText}>Hourly reminders</Text>
            </View>
            <View style={[styles.pillIndicator, remindersOn && styles.pillIndicatorOn]}>
              <Text style={[styles.pillIndicatorText, remindersOn && styles.pillIndicatorTextOn]}>
                {remindersOn ? 'On' : 'Off'}
              </Text>
            </View>
          </Pressable>

          <View style={styles.modalDivider} />

          <Pressable
            onPress={toggleCareMode}
            style={styles.modalRow}
            accessibilityRole="button"
            accessibilityLabel="Toggle admitted-to-ward mode"
          >
            <View style={styles.modalRowLabelWrap}>
              <Text style={styles.modalRowText}>{isAdmitted ? t('careMode.admitted') : t('careMode.home')}</Text>
            </View>
            <Ionicons name="swap-horizontal" size={16} color={colors.primaryDark} />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 46, 46, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    shadowColor: colors.shadow,
    shadowOpacity: 0.18,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  modalSectionLabel: {
    fontFamily: fontFamily.mono,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  modalRowActive: {
    backgroundColor: colors.primarySoft,
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
    borderTopColor: 'transparent',
  },
  modalRowLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalRowIcon: {
    marginRight: spacing.sm,
  },
  modalRowText: {
    fontFamily: fontFamily.baseSemiBold,
    fontWeight: '600',
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  modalRowTextActive: {
    color: colors.primaryDark,
    fontFamily: fontFamily.baseBold,
    fontWeight: '700',
  },
  modalDivider: {
    height: spacing.md,
  },
  pillIndicator: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
  },
  pillIndicatorOn: {
    backgroundColor: colors.primarySoft,
  },
  pillIndicatorText: {
    fontFamily: fontFamily.baseBold,
    fontWeight: '700',
    fontSize: 11,
    color: colors.textSecondary,
  },
  pillIndicatorTextOn: {
    color: colors.primaryDark,
  },
});
