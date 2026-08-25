import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

/** Re-renders the caller roughly once a minute, so relative times ("2h ago")
 * and day/date boundaries stay fresh. Also refreshes immediately whenever the
 * app returns to the foreground — Android in particular throttles or
 * suspends JS timers while backgrounded, so relying on the interval alone
 * can leave "today"/"Illness Day" stuck on a stale date after the device's
 * clock has rolled past midnight while the app was in the background. */
export function useNow(intervalMs = 60000): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    const subscription = AppState.addEventListener('change', (status) => {
      if (status === 'active') setNow(new Date());
    });
    return () => {
      clearInterval(id);
      subscription.remove();
    };
  }, [intervalMs]);

  return now;
}
