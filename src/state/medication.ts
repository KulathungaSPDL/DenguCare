// Placeholder paracetamol dosing guard, same "not clinically validated" caveat
// as the fluid targets in calculations.ts — a clinical panel must review and
// approve every number here before real patients use it.

import { filterByDateKey } from './selectors';
import { ageYears, localDateKey } from './dateUtils';
import { Condition, MedicationDose } from './types';

export const MIN_DOSE_INTERVAL_HOURS = 4;
export const ADULT_MAX_SINGLE_DOSE_MG = 1000;
export const ADULT_MAX_DAILY_MG = 3000; // conservative within the commonly cited 3-4 g/day range
export const PEDIATRIC_MAX_SINGLE_DOSE_MG = 500; // conservative single-dose ceiling under the pediatric cutoff
export const MG_PER_KG_DOSE = 12.5; // adult midpoint of the 10-15 mg/kg range
export const MG_PER_KG_DOSE_PEDIATRIC = 15; // WHO/BNF pediatric per-dose mg/kg
export const MG_PER_KG_DOSE_CAUTIOUS = 10; // low end of the range, used for renal/anticoagulant caution
const PEDIATRIC_AGE_CUTOFF_YEARS = 12;
const DEFAULT_ADULT_WEIGHT_KG = 60;
const DEFAULT_PEDIATRIC_WEIGHT_KG = 25; // rough fallback (~ an 8-year-old) when a child's weight isn't set yet

// Conditions that call for the low end of the mg/kg range rather than the
// midpoint: reduced renal clearance (heart_kidney) and the bleeding/INR
// interaction with paracetamol seen on long-term anticoagulant use.
const CAUTIOUS_CONDITIONS: Condition[] = ['heart_kidney', 'blood_thinners'];

function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step;
}

/** Age- and weight-based single-dose suggestion. Uses the higher pediatric
 * mg/kg rate and a lower single-dose ceiling under the pediatric age cutoff,
 * and falls back to the cautious low end of the mg/kg range for conditions
 * that reduce paracetamol clearance or interact with it. Rounded to a
 * practical step (25 mg for children, 50 mg for adults). */
export function calcParacetamolDoseMg(
  weightKg: number | null | undefined,
  dobISO?: string | null,
  conditions: Condition[] = [],
  now: Date = new Date()
): number {
  const isPediatric = dobISO ? ageYears(dobISO, now) < PEDIATRIC_AGE_CUTOFF_YEARS : false;
  const w = weightKg && weightKg > 0 ? weightKg : isPediatric ? DEFAULT_PEDIATRIC_WEIGHT_KG : DEFAULT_ADULT_WEIGHT_KG;

  const isCautious = conditions.some((c) => CAUTIOUS_CONDITIONS.includes(c));
  const mgPerKg = isCautious
    ? MG_PER_KG_DOSE_CAUTIOUS
    : isPediatric
      ? MG_PER_KG_DOSE_PEDIATRIC
      : MG_PER_KG_DOSE;

  const ceiling = isPediatric ? PEDIATRIC_MAX_SINGLE_DOSE_MG : ADULT_MAX_SINGLE_DOSE_MG;
  const step = isPediatric ? 25 : 50;
  return Math.min(ceiling, roundTo(w * mgPerKg, step));
}

export function nextSafeDoseAtISO(lastDoseISO: string): string {
  const next = new Date(lastDoseISO);
  next.setHours(next.getHours() + MIN_DOSE_INTERVAL_HOURS);
  return next.toISOString();
}

export function todayDosesTotalMg(doses: MedicationDose[], now: Date = new Date()): number {
  const todays = filterByDateKey(doses, localDateKey(now));
  return todays.reduce((sum, d) => sum + d.doseMg, 0);
}

/** Most recent dose, or null if none logged yet. */
export function latestDose(doses: MedicationDose[]): MedicationDose | null {
  if (doses.length === 0) return null;
  return doses.reduce((latest, d) => (new Date(d.atISO) > new Date(latest.atISO) ? d : latest));
}
