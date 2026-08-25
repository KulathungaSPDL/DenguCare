import Constants, { AppOwnership } from 'expo-constants';
import { Platform } from 'react-native';

const HOURLY_REMINDER_ID = 'dengucare-hourly-reminder';
const ANDROID_CHANNEL_ID = 'hourly-reminders';

// expo-notifications throws on import inside Expo Go (SDK 53+ removed its
// Android native module there); it only works in a development/standalone
// build. Detect that up front and lazy-load the module so Expo Go never
// touches it, instead of crashing the whole app on startup.
const isExpoGo = Constants.appOwnership === AppOwnership.Expo;

let handlerConfigured = false;

async function loadNotifications() {
  if (isExpoGo) return null;
  const Notifications = await import('expo-notifications');

  if (!handlerConfigured) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    handlerConfigured = true;
  }

  return Notifications;
}

export function isReminderSupported(): boolean {
  return !isExpoGo;
}

export async function requestReminderPermissionAsync(): Promise<boolean> {
  const Notifications = await loadNotifications();
  if (!Notifications) return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: 'Hourly hydration reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) return true;

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function scheduleHourlyReminder(hourlyGoalMl: number): Promise<void> {
  const Notifications = await loadNotifications();
  if (!Notifications) return;

  await Notifications.cancelScheduledNotificationAsync(HOURLY_REMINDER_ID).catch(() => {});
  await Notifications.scheduleNotificationAsync({
    identifier: HOURLY_REMINDER_ID,
    content: {
      title: 'Time to hydrate',
      body: `Sip ${hourlyGoalMl} ml now to stay on track this hour.`,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 3600,
      repeats: true,
      channelId: Platform.OS === 'android' ? ANDROID_CHANNEL_ID : undefined,
    },
  });
}

export async function cancelHourlyReminder(): Promise<void> {
  const Notifications = await loadNotifications();
  if (!Notifications) return;
  await Notifications.cancelScheduledNotificationAsync(HOURLY_REMINDER_ID).catch(() => {});
}
