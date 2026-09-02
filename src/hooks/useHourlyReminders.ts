import { useEffect } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  cancelHourlyReminder,
  isReminderSupported,
  requestReminderPermissionAsync,
  scheduleHourlyReminder,
} from '../notifications/reminders';
import { useFluidSummary } from '../state/selectors';
import { useStore } from '../state/store';
import { useNow } from './useNow';

/**
 * Keeps the OS-level hourly hydration notification in sync with
 * `state.remindersOn`. Mount once for the whole tab group (app/(tabs)/_layout.tsx)
 * — AppTopBar just reads/toggles the store flag, this hook does the actual
 * permission request + scheduling side effects.
 */
export function useHourlyReminders(): void {
  const { t } = useTranslation();
  const { state, actions } = useStore();
  const now = useNow();
  const { targets } = useFluidSummary(state, now);
  const { remindersOn, remindersSnoozedUntilISO } = state;
  // useNow ticks every minute (and on app foreground), so this flips back to
  // false - re-running the effect below to resume the reminder - as soon as
  // the sleep window is over, without needing its own timer.
  const isSnoozed = remindersSnoozedUntilISO != null && new Date(remindersSnoozedUntilISO).getTime() > now.getTime();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (remindersOn && !isSnoozed) {
        if (!isReminderSupported()) {
          if (!cancelled) actions.setRemindersOn(false);
          Alert.alert(t('reminders.expoGoTitle'), t('reminders.expoGoMsg'));
          return;
        }
        const granted = await requestReminderPermissionAsync(t('reminders.channelName'));
        if (cancelled) return;
        if (!granted) {
          actions.setRemindersOn(false);
          Alert.alert(t('reminders.disabledTitle'), t('reminders.disabledMsg'));
          return;
        }
        await scheduleHourlyReminder(
          t('reminders.notificationTitle'),
          t('reminders.notificationBody', { ml: targets.hourlyGoalMl })
        );
      } else {
        await cancelHourlyReminder();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [remindersOn, isSnoozed, targets.hourlyGoalMl]);
}
