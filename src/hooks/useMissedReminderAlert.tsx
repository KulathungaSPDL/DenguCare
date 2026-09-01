import React, { useEffect, useRef, useState } from 'react';
import { AppState as RNAppState } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { ConfirmModal } from '../components/ConfirmModal';
import { isReminderSupported } from '../notifications/reminders';
import { useStore } from '../state/store';

const MISSED_REMINDER_THRESHOLD_MS = 60 * 60 * 1000;

/**
 * Prompts the user to log fluids as soon as the app is opened (cold start or
 * returning from background) if hourly reminders are on and it's been over
 * an hour since the last log. The scheduled OS notification only fires on
 * its own timer, so it can't cover "I just opened the app and I'm overdue" —
 * this fills that gap and lets the user cancel/dismiss instead of logging.
 */
export function useMissedReminderAlert() {
  const { t } = useTranslation();
  const { state } = useStore();
  const { hydrated, remindersOn, drinks, illness } = state;
  const [visible, setVisible] = useState(false);
  const hasCheckedOnOpenRef = useRef(false);

  function isOverdue() {
    if (!remindersOn || !illness || !isReminderSupported()) return false;
    const lastDrinkAtMs = drinks.reduce((latest, d) => Math.max(latest, new Date(d.atISO).getTime()), 0);
    const baselineMs = lastDrinkAtMs || new Date(illness.feverStartISO).getTime();
    return Date.now() - baselineMs > MISSED_REMINDER_THRESHOLD_MS;
  }

  useEffect(() => {
    if (!hydrated || hasCheckedOnOpenRef.current) return;
    hasCheckedOnOpenRef.current = true;
    if (isOverdue()) setVisible(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  useEffect(() => {
    const subscription = RNAppState.addEventListener('change', (status) => {
      if (status === 'active' && isOverdue()) setVisible(true);
    });
    return () => subscription.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remindersOn, drinks, illness]);

  function handleLogNow() {
    setVisible(false);
    router.push('/(tabs)/fluids');
  }

  function handleCancel() {
    setVisible(false);
  }

  const modal = (
    <ConfirmModal
      visible={visible}
      tone="primary"
      icon="water-outline"
      title={t('missedReminder.title')}
      message={t('missedReminder.message')}
      confirmLabel={t('missedReminder.logNow')}
      cancelLabel={t('missedReminder.cancel')}
      onConfirm={handleLogNow}
      onCancel={handleCancel}
    />
  );

  return { modal };
}
