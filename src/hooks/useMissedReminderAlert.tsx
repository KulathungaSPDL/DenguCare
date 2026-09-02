import React, { useEffect, useRef, useState } from 'react';
import { AppState as RNAppState } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { ConfirmModal } from '../components/ConfirmModal';
import { isReminderSupported } from '../notifications/reminders';
import { useFluidSummary } from '../state/selectors';
import { useStore } from '../state/store';

const MISSED_REMINDER_THRESHOLD_MS = 60 * 60 * 1000;
// Once shown (logged or cancelled), don't show it again just because the app
// got foregrounded again a few minutes later (locking/unlocking the phone,
// switching apps briefly, tapping a notification all trigger AppState
// "active") - re-showing this on every such event made cancel feel like it
// did nothing. Reusing the overdue threshold as the snooze window: there's
// no extra safety value in nagging again before the next hour is even up.
const RESHOW_SNOOZE_MS = MISSED_REMINDER_THRESHOLD_MS;

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
  const { hydrated, remindersOn, remindersSnoozedUntilISO, drinks, illness } = state;
  const [visible, setVisible] = useState(false);
  const hasCheckedOnOpenRef = useRef(false);
  const lastShownAtRef = useRef(0);
  const { thisHourMl, targets } = useFluidSummary(state, new Date());
  const remainingMl = Math.max(0, targets.hourlyGoalMl - thisHourMl);

  function isSnoozedForSleep() {
    return remindersSnoozedUntilISO != null && new Date(remindersSnoozedUntilISO).getTime() > Date.now();
  }

  function isOverdue() {
    if (!remindersOn || !illness || !isReminderSupported() || isSnoozedForSleep()) return false;
    const lastDrinkAtMs = drinks.reduce((latest, d) => Math.max(latest, new Date(d.atISO).getTime()), 0);
    const baselineMs = lastDrinkAtMs || new Date(illness.feverStartISO).getTime();
    return Date.now() - baselineMs > MISSED_REMINDER_THRESHOLD_MS;
  }

  function maybeShow() {
    if (!isOverdue()) return;
    const now = Date.now();
    if (now - lastShownAtRef.current < RESHOW_SNOOZE_MS) return;
    lastShownAtRef.current = now;
    setVisible(true);
  }

  useEffect(() => {
    if (!hydrated || hasCheckedOnOpenRef.current) return;
    hasCheckedOnOpenRef.current = true;
    // Skip the very first check on a user's first-ever dashboard visit —
    // popping "log your fluids" over the welcome copy right after onboarding
    // reads as broken, not helpful. Normal overdue checks resume from the
    // next app open or foreground onward.
    if (state.dashboardWelcomeSeen) maybeShow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  useEffect(() => {
    const subscription = RNAppState.addEventListener('change', (status) => {
      if (status === 'active') maybeShow();
    });
    return () => subscription.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remindersOn, remindersSnoozedUntilISO, drinks, illness]);

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
      message={t('missedReminder.message', { drunkMl: thisHourMl, remainingMl, goalMl: targets.hourlyGoalMl })}
      confirmLabel={t('missedReminder.logNow')}
      cancelLabel={t('missedReminder.cancel')}
      onConfirm={handleLogNow}
      onCancel={handleCancel}
    />
  );

  return { modal };
}
