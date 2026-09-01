import { sumMl } from './calculations';
import { ageYears, illnessDayNumber } from './dateUtils';
import {
  AppState,
  ArchivedIllness,
  BloodReport,
  DengueTestRecord,
  DrinkEntry,
  IvFluidEntry,
  MedicationDose,
  TempReading,
  UrineEntry,
  WarningSignKey,
  WarningSignsState,
  WARNING_SIGN_KEYS,
} from './types';

function byTimeAsc<T extends { atISO: string }>(a: T, b: T): number {
  return new Date(a.atISO).getTime() - new Date(b.atISO).getTime();
}

function byTimeDesc<T extends { atISO: string }>(a: T, b: T): number {
  return new Date(b.atISO).getTime() - new Date(a.atISO).getTime();
}

export interface DoctorReportData {
  now: Date; // wall-clock time this view was generated, for the "Generated at" line
  viewDate: Date; // anchor for "today"/illness-day context — real now for a live report, the illness's end date for an archived one
  age: number | null;
  dayNumber: number | null;
  feverStartISO: string | null;
  activeWarningSigns: WarningSignKey[];
  fluidInMl: number;
  fluidOutMl: number;
  drinks: DrinkEntry[];
  ivFluids: IvFluidEntry[];
  urine: UrineEntry[];
  temps: TempReading[];
  doses: MedicationDose[];
  reports: BloodReport[];
  dengueTests: DengueTestRecord[];
}

interface RecordBag {
  drinks: DrinkEntry[];
  ivFluids: IvFluidEntry[];
  urine: UrineEntry[];
  temps: TempReading[];
  reports: BloodReport[];
  dengueTests: DengueTestRecord[];
  medicationDoses: MedicationDose[];
  warningSigns: WarningSignsState;
}

function buildReportData(
  records: RecordBag,
  feverStartISO: string | null,
  dobISO: string | null,
  now: Date,
  viewDate: Date
): DoctorReportData {
  const dayNumber = feverStartISO ? illnessDayNumber(feverStartISO, viewDate) : null;
  const age = dobISO ? ageYears(dobISO, now) : null;

  const drinks = [...records.drinks].sort(byTimeDesc);
  const ivFluids = [...records.ivFluids].sort(byTimeDesc);
  const urine = [...records.urine].sort(byTimeDesc);

  const fluidInMl = sumMl(records.drinks) + sumMl(records.ivFluids.map((f) => ({ amountMl: f.volumeMl })));
  const fluidOutMl = sumMl(records.urine);

  const temps = [...records.temps].sort(byTimeDesc);
  const doses = [...records.medicationDoses].sort(byTimeDesc);
  const reports = [...records.reports].sort(byTimeAsc);
  const dengueTests = [...records.dengueTests].sort(byTimeDesc);
  const activeWarningSigns = WARNING_SIGN_KEYS.filter((k) => records.warningSigns[k]);

  return {
    now,
    viewDate,
    age,
    dayNumber,
    feverStartISO,
    activeWarningSigns,
    fluidInMl,
    fluidOutMl,
    drinks,
    ivFluids,
    urine,
    temps,
    doses,
    reports,
    dengueTests,
  };
}

/** Full-detail data for the in-app "Doctor Report" popup — patient info,
 * active warning signs, the complete fluid/temperature/dose/blood-report
 * history since recording began (not just today), all pulled from state
 * already on-device. */
export function buildDoctorReportData(state: AppState, now: Date): DoctorReportData {
  return buildReportData(
    {
      drinks: state.drinks,
      ivFluids: state.ivFluids,
      urine: state.urine,
      temps: state.temps,
      reports: state.reports,
      dengueTests: state.dengueTests,
      medicationDoses: state.medicationDoses,
      warningSigns: state.warningSigns,
    },
    state.illness?.feverStartISO ?? null,
    state.profile.dobISO,
    now,
    now
  );
}

/** Same shape as buildDoctorReportData, but for a past illness kept in
 * archivedIllnesses — anchors "today"/illness-day context to when that
 * illness ended, not the actual current moment, so its charts and default-
 * open day land on the last day it has data for. */
export function buildArchivedReportData(archived: ArchivedIllness, dobISO: string | null, now: Date): DoctorReportData {
  const viewDate = archived.illness.endedAtISO ? new Date(archived.illness.endedAtISO) : now;
  return buildReportData(
    {
      drinks: archived.drinks,
      ivFluids: archived.ivFluids,
      urine: archived.urine,
      temps: archived.temps,
      reports: archived.reports,
      dengueTests: archived.dengueTests,
      medicationDoses: archived.medicationDoses,
      warningSigns: archived.warningSigns,
    },
    archived.illness.feverStartISO,
    dobISO,
    now,
    viewDate
  );
}
