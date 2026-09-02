import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useStore } from '../state/store';
import { AppLanguage, CareMode } from '../state/types';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { fontFamily, fontSize } from '../theme/typography';
import { ConfirmModal } from './ConfirmModal';
import { PreviousDataModal } from './PreviousDataModal';
import { ProfileModal } from './ProfileModal';
import { SleepModeModal } from './SleepModeModal';

const LANGUAGE_OPTIONS: { code: Exclude<AppLanguage, null>; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'si', label: 'සිංහල' },
  { code: 'ta', label: 'தமிழ்' },
];

/** Shared language / reminders / care-mode / profile menu, opened from the
 * three-dot button on both AppTopBar and DashboardHero. */
export function SettingsMenu({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { t, i18n } = useTranslation();
  const { state, actions } = useStore();
  const isAdmitted = state.careMode === 'admitted';
  const remindersOn = state.remindersOn;
  const isSleepModeActive =
    state.remindersSnoozedUntilISO != null && new Date(state.remindersSnoozedUntilISO).getTime() > Date.now();
  const [profileVisible, setProfileVisible] = useState(false);
  const [previousDataVisible, setPreviousDataVisible] = useState(false);
  const [sleepModeVisible, setSleepModeVisible] = useState(false);
  const [careModeConfirm, setCareModeConfirm] = useState<CareMode | null>(null);

  function openProfile() {
    onClose();
    setProfileVisible(true);
  }

  function openPreviousData() {
    onClose();
    setPreviousDataVisible(true);
  }

  function openSleepMode() {
    onClose();
    setSleepModeVisible(true);
  }

  function toggleCareMode() {
    setCareModeConfirm(isAdmitted ? 'home' : 'admitted');
  }

  function confirmCareModeSwitch() {
    if (careModeConfirm) actions.setCareMode(careModeConfirm);
    setCareModeConfirm(null);
  }

  return (
    <>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
          <View style={styles.modalCard}>
            <Pressable
              onPress={openProfile}
              style={styles.modalRow}
              accessibilityRole="button"
              accessibilityLabel={t('settingsMenu.viewProfileAria')}
            >
              <View style={styles.modalRowLabelWrap}>
                <Ionicons name="person-circle-outline" size={20} color={colors.textPrimary} style={styles.modalRowIcon} />
                <Text style={styles.modalRowText}>{t('settingsMenu.viewProfile')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </Pressable>

            <Pressable
              onPress={openPreviousData}
              style={styles.modalRow}
              accessibilityRole="button"
              accessibilityLabel={t('settingsMenu.previousDataAria')}
            >
              <View style={styles.modalRowLabelWrap}>
                <Ionicons name="time-outline" size={20} color={colors.textPrimary} style={styles.modalRowIcon} />
                <Text style={styles.modalRowText}>{t('settingsMenu.previousData')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </Pressable>

            <View style={styles.modalDivider} />

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
              accessibilityLabel={t('settingsMenu.hourlyRemindersAria')}
            >
              <View style={styles.modalRowLabelWrap}>
                <Ionicons
                  name={remindersOn ? 'notifications' : 'notifications-off-outline'}
                  size={18}
                  color={colors.textPrimary}
                  style={styles.modalRowIcon}
                />
                <Text style={styles.modalRowText}>{t('settingsMenu.hourlyReminders')}</Text>
              </View>
              <View style={[styles.pillIndicator, remindersOn && styles.pillIndicatorOn]}>
                <Text style={[styles.pillIndicatorText, remindersOn && styles.pillIndicatorTextOn]}>
                  {remindersOn ? t('settingsMenu.on') : t('settingsMenu.off')}
                </Text>
              </View>
            </Pressable>

            <Pressable
              onPress={openSleepMode}
              style={styles.modalRow}
              accessibilityRole="button"
              accessibilityLabel={t('settingsMenu.sleepModeAria')}
            >
              <View style={styles.modalRowLabelWrap}>
                <Ionicons name="moon-outline" size={18} color={colors.textPrimary} style={styles.modalRowIcon} />
                <Text style={styles.modalRowText}>{t('settingsMenu.sleepMode')}</Text>
              </View>
              {isSleepModeActive ? (
                <View style={[styles.pillIndicator, styles.pillIndicatorOn]}>
                  <Text style={[styles.pillIndicatorText, styles.pillIndicatorTextOn]}>{t('settingsMenu.sleeping')}</Text>
                </View>
              ) : (
                <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
              )}
            </Pressable>

            <View style={styles.modalDivider} />

            <Pressable
              onPress={toggleCareMode}
              style={styles.modalRow}
              accessibilityRole="button"
              accessibilityLabel={t('settingsMenu.careModeAria')}
            >
              <View style={styles.modalRowLabelWrap}>
                <Text style={styles.modalRowText}>{isAdmitted ? t('careMode.admitted') : t('careMode.home')}</Text>
              </View>
              <Ionicons name="swap-horizontal" size={16} color={colors.primaryDark} />
            </Pressable>
          </View>
        </View>
      </Modal>

      <ProfileModal visible={profileVisible} onClose={() => setProfileVisible(false)} />
      <PreviousDataModal visible={previousDataVisible} onClose={() => setPreviousDataVisible(false)} />
      <SleepModeModal visible={sleepModeVisible} onClose={() => setSleepModeVisible(false)} />
      <ConfirmModal
        visible={careModeConfirm != null}
        title={careModeConfirm === 'admitted' ? t('settingsMenu.switchToAdmittedTitle') : t('settingsMenu.switchToHomeTitle')}
        message={careModeConfirm === 'admitted' ? t('settingsMenu.switchToAdmittedMsg') : t('settingsMenu.switchToHomeMsg')}
        confirmLabel={t('settingsMenu.switchButton')}
        cancelLabel={t('common.cancel')}
        tone="primary"
        icon="swap-horizontal"
        onConfirm={confirmCareModeSwitch}
        onCancel={() => setCareModeConfirm(null)}
      />
    </>
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
