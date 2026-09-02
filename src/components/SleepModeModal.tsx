import React, { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { Chip } from './Chip';
import { PrimaryButton } from './Buttons';
import { useStore } from '../state/store';
import { formatTime24 } from '../state/dateUtils';
import { DEFAULT_SLEEP_HOURS, SLEEP_HOUR_OPTIONS, sleepSnoozeUntilISO } from '../state/sleepMode';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { fontFamily, fontSize } from '../theme/typography';

/** Lets the patient pause hourly hydration nudges (the OS reminder and the
 * in-app "missed reminder" popup) for a chosen number of hours so a
 * sleeping patient isn't woken up by them - opened from SettingsMenu. */
export function SleepModeModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const { state, actions } = useStore();
  const [hours, setHours] = useState(DEFAULT_SLEEP_HOURS);
  const scale = useRef(new Animated.Value(0.9)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const snoozedUntil =
    state.remindersSnoozedUntilISO != null && new Date(state.remindersSnoozedUntilISO).getTime() > Date.now()
      ? new Date(state.remindersSnoozedUntilISO)
      : null;

  useEffect(() => {
    if (!visible) return;
    scale.setValue(0.9);
    opacity.setValue(0);
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 7, tension: 90 }),
      Animated.timing(opacity, { toValue: 1, duration: 160, useNativeDriver: true }),
    ]).start();
  }, [visible, scale, opacity]);

  function startSleepMode() {
    actions.setRemindersSnoozedUntil(sleepSnoozeUntilISO(hours));
    onClose();
  }

  function wakeUpNow() {
    actions.setRemindersSnoozedUntil(null);
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View style={[styles.card, { opacity, transform: [{ scale }] }]}>
          <View style={styles.iconBadge}>
            <Ionicons name="moon" size={30} color={colors.primary} />
          </View>

          {snoozedUntil ? (
            <>
              <Text style={styles.title}>{t('sleepMode.activeTitle')}</Text>
              <Text style={styles.message}>{t('sleepMode.activeMessage', { time: formatTime24(snoozedUntil) })}</Text>
              <PrimaryButton label={t('sleepMode.wakeUpNow')} icon="sunny-outline" onPress={wakeUpNow} style={{ marginTop: spacing.xl, width: '100%' }} />
            </>
          ) : (
            <>
              <Text style={styles.title}>{t('sleepMode.title')}</Text>
              <Text style={styles.message}>{t('sleepMode.message')}</Text>

              <View style={styles.chipsRow}>
                {SLEEP_HOUR_OPTIONS.map((h) => (
                  <Chip key={h} label={t('sleepMode.hoursLabel', { count: h })} selected={hours === h} onPress={() => setHours(h)} />
                ))}
              </View>

              <PrimaryButton label={t('sleepMode.startButton')} icon="moon-outline" onPress={startSleepMode} style={{ marginTop: spacing.md, width: '100%' }} />
            </>
          )}

          <Pressable onPress={onClose} style={styles.closeRow} accessibilityRole="button">
            <Text style={styles.closeText}>{t('common.cancel')}</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 46, 46, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: fontFamily.baseBold,
    fontWeight: '800',
    fontSize: fontSize.lg,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  message: {
    marginTop: spacing.sm,
    fontFamily: fontFamily.base,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: fontSize.sm * 1.5,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  closeRow: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
  },
  closeText: {
    fontFamily: fontFamily.baseBold,
    fontWeight: '600',
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
});
