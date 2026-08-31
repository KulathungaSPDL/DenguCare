// All "which day / which hour is it" logic is anchored to Asia/Colombo local time,
// regardless of the device's own timezone, since the app targets Sri Lanka.
export const APP_TIME_ZONE = 'Asia/Colombo';

function partsFor(date: Date) {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = fmt.formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
  return {
    year: Number(get('year')),
    month: Number(get('month')),
    day: Number(get('day')),
    hour: Number(get('hour')),
    minute: Number(get('minute')),
  };
}

/** yyyy-mm-dd for the given instant, in APP_TIME_ZONE. */
export function localDateKey(date: Date): string {
  const { year, month, day } = partsFor(date);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function localHour(date: Date): number {
  return partsFor(date).hour;
}

/** A Date instant safely inside the calendar day named by `key` (yyyy-mm-dd),
 * for passing to formatters — anchored at UTC noon so it can't drift into
 * the adjacent day under any timezone offset. */
export function dateFromKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12));
}

/** Every calendar-date key (yyyy-mm-dd) from `startKey` to `endKey`, inclusive,
 * in ascending order. Both are already-local date keys, so this is plain
 * calendar arithmetic — no further timezone conversion needed. */
export function dateKeysBetween(startKey: string, endKey: string): string[] {
  const [sy, sm, sd] = startKey.split('-').map(Number);
  const [ey, em, ed] = endKey.split('-').map(Number);
  const startUTC = Date.UTC(sy, sm - 1, sd);
  const endUTC = Date.UTC(ey, em - 1, ed);
  const spanDays = Math.max(0, Math.round((endUTC - startUTC) / 86400000));

  const keys: string[] = [];
  for (let i = 0; i <= spanDays; i += 1) {
    const d = new Date(Date.UTC(sy, sm - 1, sd + i));
    keys.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`);
  }
  return keys;
}

/** Whole calendar days between two instants' local dates (b - a), can be negative. */
export function calendarDayDiff(a: Date, b: Date): number {
  const [ay, am, ad] = localDateKey(a).split('-').map(Number);
  const [by, bm, bd] = localDateKey(b).split('-').map(Number);
  const aUTC = Date.UTC(ay, am - 1, ad);
  const bUTC = Date.UTC(by, bm - 1, bd);
  return Math.round((bUTC - aUTC) / 86400000);
}

/** Illness Day N (1-indexed) that `now` falls on, relative to fever start. */
export function illnessDayNumber(feverStartISO: string, now: Date = new Date()): number {
  const start = new Date(feverStartISO);
  const diff = calendarDayDiff(start, now);
  return Math.max(1, diff + 1);
}

/** Local calendar date (yyyy-mm-dd) for illness Day N. */
export function dateKeyForDay(feverStartISO: string, dayNumber: number): string {
  const start = new Date(feverStartISO);
  const startKey = localDateKey(start);
  const [y, m, d] = startKey.split('-').map(Number);
  const target = new Date(Date.UTC(y, m - 1, d + (dayNumber - 1)));
  return localDateKey(target);
}

export function formatDatePretty(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: APP_TIME_ZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatTime24(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: APP_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

export function formatWeekdayDate(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: APP_TIME_ZONE,
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  }).format(date).toUpperCase();
}

/** Fraction of the way through `date`'s local calendar day, in APP_TIME_ZONE. */
function timeOfDayFraction(date: Date): number {
  const { hour, minute } = partsFor(date);
  return (hour + minute / 60) / 24;
}

/** Continuous illness-day position (whole numbers land exactly on local
 * midnight) for plotting on a day axis. Day boundaries follow local
 * calendar midnight, matching illnessDayNumber, not raw 24-hour blocks
 * from the fever-start instant — so a fever that starts at 8pm still
 * flips to Day 2 at the next local midnight, consistent with the Day N
 * labels shown elsewhere in the app (reading history, doctor summary). */
export function illnessDayFraction(feverStartISO: string, atISO: string): number {
  const at = new Date(atISO);
  return illnessDayNumber(feverStartISO, at) + timeOfDayFraction(at);
}

/** Elapsed hours from fever start to the local-midnight boundary where
 * illness Day `dayNumber` begins (Day 1 begins at elapsed 0, at fever
 * start itself). Mirrors illnessDayNumber's calendar-midnight boundaries,
 * for hour-axis charts that need to draw day-change gridlines. */
export function illnessDayBoundaryHours(feverStartISO: string, dayNumber: number): number {
  if (dayNumber <= 1) return 0;
  const hoursUntilMidnight = 24 - timeOfDayFraction(new Date(feverStartISO)) * 24;
  return hoursUntilMidnight + 24 * (dayNumber - 2);
}

/** Hours elapsed since fever start (0 = fever start instant), for plotting on an hourly axis. */
export function illnessHourOffset(feverStartISO: string, atISO: string): number {
  const start = new Date(feverStartISO).getTime();
  const at = new Date(atISO).getTime();
  return (at - start) / 3600000;
}

/** Whole years old, in APP_TIME_ZONE, as of `now`. */
export function ageYears(dobISO: string, now: Date = new Date()): number {
  const { year: ny, month: nm, day: nd } = partsFor(now);
  const [by, bm, bd] = dobISO.split('-').map(Number);
  let age = ny - by;
  if (nm < bm || (nm === bm && nd < bd)) age -= 1;
  return Math.max(0, age);
}

export function hoursAgo(atISO: string, now: Date = new Date()): number {
  const diffMs = now.getTime() - new Date(atISO).getTime();
  return Math.max(0, Math.floor(diffMs / 3600000));
}

export function minutesAgo(atISO: string, now: Date = new Date()): number {
  const diffMs = now.getTime() - new Date(atISO).getTime();
  return Math.max(0, Math.floor(diffMs / 60000));
}
