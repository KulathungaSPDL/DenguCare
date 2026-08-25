import { useMemo } from 'react';

import { getFluidTargets, sumMl } from './calculations';
import { localDateKey, localHour } from './dateUtils';
import { AppState, BloodReport, DrinkEntry, UrineEntry } from './types';

export function filterByDateKey<T extends { atISO: string }>(entries: T[], dateKey: string): T[] {
  return entries.filter((e) => localDateKey(new Date(e.atISO)) === dateKey);
}

export function useTodayEntries(state: AppState, now: Date) {
  const dateKey = localDateKey(now);
  return useMemo(() => {
    const drinks = filterByDateKey(state.drinks, dateKey);
    const urine = filterByDateKey(state.urine, dateKey);
    return { drinks, urine, dateKey };
  }, [state.drinks, state.urine, dateKey]);
}

export function useFluidSummary(state: AppState, now: Date) {
  const { drinks, urine } = useTodayEntries(state, now);
  const targets = useMemo(
    () => getFluidTargets(state.profile.weightKg, state.profile.dobISO, now),
    [state.profile.weightKg, state.profile.dobISO, now]
  );

  const inMl = sumMl(drinks);
  const outMl = sumMl(urine);

  const currentHour = localHour(now);
  const thisHourDrinks = drinks.filter((d) => localHour(new Date(d.atISO)) === currentHour);
  const thisHourMl = sumMl(thisHourDrinks);

  // Expected progress so far today, spread evenly across the monitored window (06:00-22:00).
  const MONITOR_START_HOUR = 6;
  const MONITOR_END_HOUR = 22;
  const hoursElapsed = Math.min(
    Math.max(currentHour - MONITOR_START_HOUR + 1, currentHour >= MONITOR_START_HOUR ? 1 : 0),
    MONITOR_END_HOUR - MONITOR_START_HOUR
  );
  const expectedByNowMl = Math.round((hoursElapsed / (MONITOR_END_HOUR - MONITOR_START_HOUR)) * targets.dailyFluidMl);
  const behindMl = Math.max(0, expectedByNowMl - inMl);

  return { inMl, outMl, targets, thisHourMl, behindMl };
}

const HYPONATREMIA_MIN_TOTAL_ML = 500; // don't warn on the first sip or two of the day
const HYPONATREMIA_WATER_SHARE = 0.5;

/** True when plain water alone has made up more than half of today's fluid intake. */
export function useHyponatremiaWarning(state: AppState, now: Date): boolean {
  const { drinks } = useTodayEntries(state, now);
  return useMemo(() => {
    const total = sumMl(drinks);
    if (total < HYPONATREMIA_MIN_TOTAL_ML) return false;
    const waterMl = sumMl(drinks.filter((d) => d.kind === 'water'));
    return waterMl / total > HYPONATREMIA_WATER_SHARE;
  }, [drinks]);
}

const PLASMA_LEAKAGE_HCT_RISE = 1.2; // +20% over baseline
const PLASMA_LEAKAGE_PLATELET_THRESHOLD = 100; // x10^3/uL

export interface PlasmaLeakageAlert {
  atRisk: boolean;
  latestReport: BloodReport | null;
  baselineHct: number | null;
}

/** Baseline is the earliest report on record; risk flips true once the most
 * recent report shows a big HCT rise alongside a low platelet count — the
 * classic dengue plasma-leakage signature. */
export function usePlasmaLeakageAlert(reports: BloodReport[]): PlasmaLeakageAlert {
  return useMemo(() => {
    if (reports.length === 0) return { atRisk: false, latestReport: null, baselineHct: null };
    const sorted = [...reports].sort((a, b) => new Date(a.atISO).getTime() - new Date(b.atISO).getTime());
    const baseline = sorted[0];
    const latest = sorted[sorted.length - 1];
    const baselineHct = baseline.haematocritPct;
    const atRisk =
      latest.id !== baseline.id &&
      baselineHct != null &&
      latest.haematocritPct != null &&
      latest.plateletCount != null &&
      latest.haematocritPct >= baselineHct * PLASMA_LEAKAGE_HCT_RISE &&
      latest.plateletCount < PLASMA_LEAKAGE_PLATELET_THRESHOLD;
    return { atRisk, latestReport: latest, baselineHct };
  }, [reports]);
}

export interface HourBucket {
  hour: number;
  drinkMl: number;
  urineMl: number;
}

export function useHourlyBuckets(drinks: DrinkEntry[], urine: UrineEntry[], startHour = 0, endHour = 23): HourBucket[] {
  return useMemo(() => {
    const buckets: HourBucket[] = [];
    for (let h = startHour; h <= endHour; h += 1) {
      buckets.push({ hour: h, drinkMl: 0, urineMl: 0 });
    }
    const byHour = new Map(buckets.map((b) => [b.hour, b]));
    drinks.forEach((d) => {
      const h = localHour(new Date(d.atISO));
      const bucket = byHour.get(h);
      if (bucket) bucket.drinkMl += d.amountMl;
    });
    urine.forEach((u) => {
      const h = localHour(new Date(u.atISO));
      const bucket = byHour.get(h);
      if (bucket) bucket.urineMl += u.amountMl;
    });
    return buckets;
  }, [drinks, urine, startHour, endHour]);
}
