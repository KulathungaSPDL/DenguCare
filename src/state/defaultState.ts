import { AppState, WarningSignsState, WARNING_SIGN_KEYS } from './types';

export const emptyWarningSigns: WarningSignsState = WARNING_SIGN_KEYS.reduce((acc, key) => {
  acc[key] = false;
  return acc;
}, {} as WarningSignsState);

export const defaultState: AppState = {
  hydrated: false,
  consent: {
    understandGuidance: false,
    willGoToHospital: false,
    agreeTerms: false,
    agreedAtISO: null,
  },
  auth: {
    signedIn: false,
    provider: null,
  },
  profile: {
    name: '',
    dobISO: null,
    sex: 'female',
    weightKg: null,
    heightCm: null,
    conditions: [],
  },
  illness: null,
  careMode: 'home',
  language: null,
  remindersOn: true,
  drinks: [],
  urine: [],
  temps: [],
  reports: [],
  medicationDoses: [],
  ivFluids: [],
  warningSigns: { ...emptyWarningSigns },
};
