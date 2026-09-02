export const SLEEP_HOUR_OPTIONS = [4, 5, 6, 7, 8, 9, 10];
export const DEFAULT_SLEEP_HOURS = 8;

/** ISO timestamp `hours` from now (or from `from`, if given) - the moment
 * hydration reminders should resume. */
export function sleepSnoozeUntilISO(hours: number, from: Date = new Date()): string {
  return new Date(from.getTime() + hours * 60 * 60 * 1000).toISOString();
}
