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
  neutrophilsCount: number | null; // Neut#, x10^3/uL
  lymphocytesCount: number | null; // Lymph#, x10^3/uL
  monocytesCount: number | null; // Mono#, x10^3/uL
  mpv: number | null; // Mean platelet volume, fL
  hgb: number | null; // Haemoglobin, g/dL
  note: string;
  photoUri: string | null;
}

export type DengueTestType = 'ns1' | 'igm' | 'igg' | 'pcr';
export type DengueTestResult = 'positive' | 'negative' | 'pending';

/** A dengue-specific test (NS1/IgM/IgG/PCR) logged independently of the FBC
 * blood reports above — its own card, its own save, since it's often done
 * at a different time/lab than the platelet/HCT count. */
export interface DengueTestRecord {
  id: string;
  atISO: string;
  type: DengueTestType;
  result: DengueTestResult;
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

/** A snapshot of one completed illness's full log, kept when the user
 * starts a new record so past data stays reachable instead of being wiped. */
export interface ArchivedIllness {
  illness: IllnessRecord; // endedAtISO is always set here
  drinks: DrinkEntry[];
  urine: UrineEntry[];
  temps: TempReading[];
  reports: BloodReport[];
  dengueTests: DengueTestRecord[];
  medicationDoses: MedicationDose[];
  ivFluids: IvFluidEntry[];
  warningSigns: WarningSignsState;
}

export interface AppState {
  hydrated: boolean;
  consent: Consent;
  auth: AuthState;
  profile: Profile;
  illness: IllnessRecord | null;
  careMode: CareMode;
  language: AppLanguage;
  remindersOn: boolean;
  // Pauses hourly hydration reminders/nudges until this moment - set when
  // the patient is about to sleep, so they aren't woken up by them.
  remindersSnoozedUntilISO: string | null;
  dashboardWelcomeSeen: boolean;
  drinks: DrinkEntry[];
  urine: UrineEntry[];
  temps: TempReading[];
  reports: BloodReport[];
  dengueTests: DengueTestRecord[];
  medicationDoses: MedicationDose[];
  ivFluids: IvFluidEntry[];
  warningSigns: WarningSignsState;
  archivedIllnesses: ArchivedIllness[];
}
