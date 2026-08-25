export type Sex = 'female' | 'male';

export type Condition = 'pregnant' | 'diabetes' | 'heart_kidney' | 'blood_thinners';

export interface Profile {
  name: string;
  dobISO: string | null; // date of birth, ISO date (yyyy-mm-dd)
  sex: Sex;
  weightKg: number | null;
  heightCm: number | null;
  conditions: Condition[];
}

export interface Consent {
  understandGuidance: boolean;
  willGoToHospital: boolean;
  agreeTerms: boolean;
  agreedAtISO: string | null;
}

export type AuthProvider = 'google' | 'apple' | 'mobile' | 'skipped';

export interface AuthState {
  signedIn: boolean;
  provider: AuthProvider | null;
}

export interface IllnessRecord {
  id: string;
  feverStartISO: string; // full timestamp, local wall time captured as ISO-with-offset-less string
  startedAtISO: string; // when the record was created
  endedAtISO: string | null; // set when user starts a new illness record
}

export type DrinkKind = 'water' | 'ors' | 'king_coconut' | 'juice' | 'soup' | 'other';

export interface DrinkEntry {
  id: string;
  atISO: string;
  amountMl: number;
  kind: DrinkKind;
  label: string;
}

export interface UrineEntry {
  id: string;
  atISO: string;
  amountMl: number;
}

export type CareMode = 'home' | 'admitted';

/** null = follow the device's language, falling back to English if unsupported. */
export type AppLanguage = 'en' | 'si' | 'ta' | null;

export type MedicationName = 'paracetamol';

export interface MedicationDose {
  id: string;
  atISO: string;
  doseMg: number;
  medication: MedicationName;
}

export interface IvFluidEntry {
  id: string;
  atISO: string;
  volumeMl: number;
  rateMlPerHr: number | null;
  fluidType: string;
  note: string;
}

export type TempMethod = 'mouth' | 'armpit' | 'ear' | 'forehead';

export interface TempReading {
  id: string;
  atISO: string;
  celsius: number;
  method: TempMethod;
}

export interface BloodReport {
  id: string;
  atISO: string;
  plateletCount: number | null; // x10^3/uL
  haematocritPct: number | null;
  wbcCount: number | null; // x10^3/uL
  note: string;
  photoUri: string | null;
}

export const WARNING_SIGN_KEYS = [
  'abdominal_pain',
  'persistent_vomiting',
  'bleeding',
  'confused_restless',
  'dizzy_faint',
  'cold_clammy',
  'no_urine_6h',
  'breathless_swelling',
  'fever_settled_worse',
] as const;

export type WarningSignKey = (typeof WARNING_SIGN_KEYS)[number];

export type WarningSignsState = Record<WarningSignKey, boolean>;

export interface AppState {
  hydrated: boolean;
  consent: Consent;
  auth: AuthState;
  profile: Profile;
  illness: IllnessRecord | null;
  careMode: CareMode;
  language: AppLanguage;
  remindersOn: boolean;
  drinks: DrinkEntry[];
  urine: UrineEntry[];
  temps: TempReading[];
  reports: BloodReport[];
  medicationDoses: MedicationDose[];
  ivFluids: IvFluidEntry[];
  warningSigns: WarningSignsState;
}
