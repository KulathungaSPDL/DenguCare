// Placeholder home-care targets, shaped after commonly cited dengue fluid-management
// guidance (weight-based maintenance fluid, minimum urine output as a hydration check).
// These are NOT clinically validated — see the consent screen and Safety tab disclaimer.
// A clinical panel must review and approve every number here before real patients use it.

import { ageYears } from './dateUtils';

const ML_PER_KG_DAILY_FLUID = 40; // ~ WHO-style maintenance fluid estimate
const ML_PER_KG_HR_URINE_MIN_ADULT = 0.5; // adult minimum acceptable urine output floor
const ML_PER_KG_HR_URINE_MIN_PEDIATRIC = 1.0; // children need a higher per-kg floor
const URINE_MONITORED_HOURS = 20.4; // approximates a floor over a monitored day
const MONITORED_WAKING_HOURS = 16; // hourly reminder is spread over waking hours, not all 24
const PEDIATRIC_AGE_CUTOFF_YEARS = 12;
const ADULT_WEIGHT_CAP_KG = 50; // caps adult fluid-intake maintenance to avoid overhydrating overweight patients

function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step;
}

export interface FluidTargets {
  dailyFluidMl: number;
  dailyUrineMinMl: number;
  hourlyGoalMl: number;
}

const DEFAULT_WEIGHT_KG = 60;

export function getFluidTargets(
  weightKg: number | null | undefined,
  dobISO: string | null | undefined,
  now: Date = new Date()
): FluidTargets {
  const w = weightKg && weightKg > 0 ? weightKg : DEFAULT_WEIGHT_KG;
  const isPediatric = dobISO ? ageYears(dobISO, now) < PEDIATRIC_AGE_CUTOFF_YEARS : false;

  // Fluid-intake maintenance uses a capped weight for adults only — the cap
  // is a safety ceiling on intake, not a claim about the patient's true
  // weight, so it must not also shrink the urine-output expectation below.
  const fluidWeight = isPediatric ? w : Math.min(w, ADULT_WEIGHT_CAP_KG);
  const dailyFluidMl = roundTo(fluidWeight * ML_PER_KG_DAILY_FLUID, 50);

  const urineRate = isPediatric ? ML_PER_KG_HR_URINE_MIN_PEDIATRIC : ML_PER_KG_HR_URINE_MIN_ADULT;
  const dailyUrineMinMl = Math.round(w * urineRate * URINE_MONITORED_HOURS);

  const hourlyGoalMl = roundTo(dailyFluidMl / MONITORED_WAKING_HOURS, 10);
  return { dailyFluidMl, dailyUrineMinMl, hourlyGoalMl };
}

export function sumMl(entries: { amountMl: number }[]): number {
  return entries.reduce((total, e) => total + (e.amountMl || 0), 0);
}
