import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react';

import {
  clearAllLogs,
  deleteDrink,
  deleteIvFluid,
  deleteMedicationDose,
  deleteReport,
  deleteTemp,
  deleteUrine,
  getAllKv,
  insertDrink,
  insertIvFluid,
  insertMedicationDose,
  insertReport,
  insertTemp,
  insertUrine,
  listDrinks,
  listIvFluids,
  listMedicationDoses,
  listReports,
  listTemps,
  listUrine,
  setKv,
  updateDrink as updateDrinkRow,
  updateIvFluid as updateIvFluidRow,
  updateReport as updateReportRow,
  updateTemp as updateTempRow,
  updateUrine as updateUrineRow,
} from '../db/repo';
import i18next from '../i18n';
import { defaultState, emptyWarningSigns } from './defaultState';
import { makeId } from './id';
import {
  AppLanguage,
  AppState,
  AuthProvider,
  BloodReport,
  CareMode,
  Condition,
  Consent,
  DrinkEntry,
  DrinkKind,
  IvFluidEntry,
  MedicationDose,
  Profile,
  Sex,
  TempMethod,
  TempReading,
  UrineEntry,
  WarningSignKey,
} from './types';

type Action =
  | { type: 'HYDRATE'; payload: AppState | null }
  | { type: 'SET_CONSENT'; payload: Partial<Consent> }
  | { type: 'SET_AUTH'; payload: { signedIn: boolean; provider: AuthProvider | null } }
  | { type: 'SET_PROFILE'; payload: Partial<Profile> }
  | { type: 'TOGGLE_CONDITION'; payload: { condition: Condition } }
  | { type: 'SET_CARE_MODE'; payload: { careMode: CareMode } }
  | { type: 'SET_LANGUAGE'; payload: { language: AppLanguage } }
  | { type: 'SET_REMINDERS_ON'; payload: { remindersOn: boolean } }
  | { type: 'START_ILLNESS'; payload: { feverStartISO: string } }
  | { type: 'RESET_ILLNESS' }
  | { type: 'ADD_DRINK'; payload: DrinkEntry }
  | { type: 'UPDATE_DRINK'; payload: DrinkEntry }
  | { type: 'REMOVE_DRINK'; payload: { id: string } }
  | { type: 'ADD_URINE'; payload: UrineEntry }
  | { type: 'UPDATE_URINE'; payload: UrineEntry }
  | { type: 'REMOVE_URINE'; payload: { id: string } }
  | { type: 'ADD_TEMP'; payload: TempReading }
  | { type: 'UPDATE_TEMP'; payload: TempReading }
  | { type: 'REMOVE_TEMP'; payload: { id: string } }
  | { type: 'ADD_REPORT'; payload: BloodReport }
  | { type: 'UPDATE_REPORT'; payload: BloodReport }
  | { type: 'REMOVE_REPORT'; payload: { id: string } }
  | { type: 'ADD_MEDICATION_DOSE'; payload: MedicationDose }
  | { type: 'REMOVE_MEDICATION_DOSE'; payload: { id: string } }
  | { type: 'ADD_IV_FLUID'; payload: IvFluidEntry }
  | { type: 'UPDATE_IV_FLUID'; payload: IvFluidEntry }
  | { type: 'REMOVE_IV_FLUID'; payload: { id: string } }
  | { type: 'SET_WARNING_SIGN'; payload: { key: WarningSignKey; value: boolean } }
  | { type: 'CLEAR_WARNING_SIGNS' };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'HYDRATE':
      return action.payload ? { ...action.payload, hydrated: true } : { ...state, hydrated: true };
    case 'SET_CONSENT':
      return { ...state, consent: { ...state.consent, ...action.payload } };
    case 'SET_AUTH':
      return { ...state, auth: { ...action.payload } };
    case 'SET_PROFILE':
      return { ...state, profile: { ...state.profile, ...action.payload } };
    case 'TOGGLE_CONDITION': {
      const { condition } = action.payload;
      const has = state.profile.conditions.includes(condition);
      const conditions = has
        ? state.profile.conditions.filter((c) => c !== condition)
        : [...state.profile.conditions, condition];
      return { ...state, profile: { ...state.profile, conditions } };
    }
    case 'SET_CARE_MODE':
      return { ...state, careMode: action.payload.careMode };
    case 'SET_LANGUAGE':
      return { ...state, language: action.payload.language };
    case 'SET_REMINDERS_ON':
      return { ...state, remindersOn: action.payload.remindersOn };
    case 'START_ILLNESS':
      return {
        ...state,
        illness: {
          id: makeId(),
          feverStartISO: action.payload.feverStartISO,
          startedAtISO: new Date().toISOString(),
          endedAtISO: null,
        },
      };
    case 'RESET_ILLNESS': {
      const archivedIllnesses = state.illness
        ? [
            {
              illness: { ...state.illness, endedAtISO: new Date().toISOString() },
              drinks: state.drinks,
              urine: state.urine,
              temps: state.temps,
              reports: state.reports,
              medicationDoses: state.medicationDoses,
              ivFluids: state.ivFluids,
              warningSigns: state.warningSigns,
            },
            ...state.archivedIllnesses,
          ]
        : state.archivedIllnesses;
      return {
        ...state,
        illness: null,
        archivedIllnesses,
        drinks: [],
        urine: [],
        temps: [],
        reports: [],
        medicationDoses: [],
        ivFluids: [],
        warningSigns: { ...emptyWarningSigns },
      };
    }
    case 'ADD_DRINK':
      return { ...state, drinks: [action.payload, ...state.drinks] };
    case 'UPDATE_DRINK':
      return { ...state, drinks: state.drinks.map((d) => (d.id === action.payload.id ? action.payload : d)) };
    case 'REMOVE_DRINK':
      return { ...state, drinks: state.drinks.filter((d) => d.id !== action.payload.id) };
    case 'ADD_URINE':
      return { ...state, urine: [action.payload, ...state.urine] };
    case 'UPDATE_URINE':
      return { ...state, urine: state.urine.map((u) => (u.id === action.payload.id ? action.payload : u)) };
    case 'REMOVE_URINE':
      return { ...state, urine: state.urine.filter((u) => u.id !== action.payload.id) };
    case 'ADD_TEMP':
      return { ...state, temps: [action.payload, ...state.temps] };
    case 'UPDATE_TEMP':
      return { ...state, temps: state.temps.map((t) => (t.id === action.payload.id ? action.payload : t)) };
    case 'REMOVE_TEMP':
      return { ...state, temps: state.temps.filter((t) => t.id !== action.payload.id) };
    case 'ADD_REPORT':
      return { ...state, reports: [action.payload, ...state.reports] };
    case 'UPDATE_REPORT':
      return { ...state, reports: state.reports.map((r) => (r.id === action.payload.id ? action.payload : r)) };
    case 'REMOVE_REPORT':
      return { ...state, reports: state.reports.filter((r) => r.id !== action.payload.id) };
    case 'ADD_MEDICATION_DOSE':
      return { ...state, medicationDoses: [action.payload, ...state.medicationDoses] };
    case 'REMOVE_MEDICATION_DOSE':
      return { ...state, medicationDoses: state.medicationDoses.filter((m) => m.id !== action.payload.id) };
    case 'ADD_IV_FLUID':
      return { ...state, ivFluids: [action.payload, ...state.ivFluids] };
    case 'UPDATE_IV_FLUID':
      return { ...state, ivFluids: state.ivFluids.map((f) => (f.id === action.payload.id ? action.payload : f)) };
    case 'REMOVE_IV_FLUID':
      return { ...state, ivFluids: state.ivFluids.filter((f) => f.id !== action.payload.id) };
    case 'SET_WARNING_SIGN':
      return {
        ...state,
        warningSigns: { ...state.warningSigns, [action.payload.key]: action.payload.value },
      };
    case 'CLEAR_WARNING_SIGNS':
      return { ...state, warningSigns: { ...emptyWarningSigns } };
    default:
      return state;
  }
}

interface StoreContextValue {
  state: AppState;
  actions: {
    setConsent: (patch: Partial<Consent>) => void;
    setAuth: (signedIn: boolean, provider: AuthProvider | null) => void;
    setProfile: (patch: Partial<Profile>) => void;
    setSex: (sex: Sex) => void;
    toggleCondition: (condition: Condition) => void;
    setCareMode: (careMode: CareMode) => void;
    setLanguage: (language: AppLanguage) => void;
    setRemindersOn: (remindersOn: boolean) => void;
    startIllness: (feverStartISO: string) => void;
    resetIllness: () => void;
    addDrink: (amountMl: number, kind: DrinkKind, label: string, atISO?: string) => void;
    updateDrink: (id: string, amountMl: number, kind: DrinkKind, label: string, atISO: string) => void;
    removeDrink: (id: string) => void;
    addUrine: (amountMl: number, atISO?: string) => void;
    updateUrine: (id: string, amountMl: number, atISO: string) => void;
    removeUrine: (id: string) => void;
    addTemp: (celsius: number, method: TempMethod, atISO?: string) => void;
    updateTemp: (id: string, celsius: number, method: TempMethod, atISO: string) => void;
    removeTemp: (id: string) => void;
    addReport: (report: Omit<BloodReport, 'id' | 'atISO'> & { atISO?: string }) => void;
    updateReport: (id: string, report: Omit<BloodReport, 'id' | 'atISO'> & { atISO: string }) => void;
    removeReport: (id: string) => void;
    addMedicationDose: (doseMg: number, atISO?: string) => void;
    removeMedicationDose: (id: string) => void;
    addIvFluid: (volumeMl: number, rateMlPerHr: number | null, fluidType: string, note: string, atISO?: string) => void;
    updateIvFluid: (
      id: string,
      volumeMl: number,
      rateMlPerHr: number | null,
      fluidType: string,
      note: string,
      atISO: string
    ) => void;
    removeIvFluid: (id: string) => void;
    setWarningSign: (key: WarningSignKey, value: boolean) => void;
    clearWarningSigns: () => void;
  };
}

const StoreContext = createContext<StoreContextValue | null>(null);

function parseKv<T>(raw: string | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { ...defaultState });

  // Local-first hydration: every log table plus the kv-stored singleton
  // fields are read straight from SQLite, never from a network call.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [kv, drinks, urine, temps, reports, medicationDoses, ivFluids] = await Promise.all([
          getAllKv(),
          listDrinks(),
          listUrine(),
          listTemps(),
          listReports(),
          listMedicationDoses(),
          listIvFluids(),
        ]);
        const payload: AppState = {
          hydrated: true,
          consent: parseKv(kv.consent, defaultState.consent),
          auth: parseKv(kv.auth, defaultState.auth),
          profile: parseKv(kv.profile, defaultState.profile),
          illness: parseKv(kv.illness, defaultState.illness),
          careMode: parseKv(kv.careMode, defaultState.careMode),
          language: parseKv(kv.language, defaultState.language),
          remindersOn: parseKv(kv.remindersOn, defaultState.remindersOn),
          warningSigns: parseKv(kv.warningSigns, { ...emptyWarningSigns }),
          archivedIllnesses: parseKv(kv.archivedIllnesses, defaultState.archivedIllnesses),
          drinks,
          urine,
          temps,
          reports,
          medicationDoses,
          ivFluids,
        };
        if (!cancelled) dispatch({ type: 'HYDRATE', payload });
      } catch {
        if (!cancelled) dispatch({ type: 'HYDRATE', payload: null });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Singleton/low-volume fields persist here on change. Log entities
  // (drinks, urine, temps, reports, medication doses, IV fluids) persist
  // immediately inside each action below instead, so they aren't re-written
  // on every unrelated state change.
  useEffect(() => {
    if (!state.hydrated) return;
    setKv('profile', state.profile).catch(() => {});
  }, [state.hydrated, state.profile]);
  useEffect(() => {
    if (!state.hydrated) return;
    setKv('consent', state.consent).catch(() => {});
  }, [state.hydrated, state.consent]);
  useEffect(() => {
    if (!state.hydrated) return;
    setKv('auth', state.auth).catch(() => {});
  }, [state.hydrated, state.auth]);
  useEffect(() => {
    if (!state.hydrated) return;
    setKv('illness', state.illness).catch(() => {});
  }, [state.hydrated, state.illness]);
  useEffect(() => {
    if (!state.hydrated) return;
    setKv('archivedIllnesses', state.archivedIllnesses).catch(() => {});
  }, [state.hydrated, state.archivedIllnesses]);
  useEffect(() => {
    if (!state.hydrated) return;
    setKv('careMode', state.careMode).catch(() => {});
  }, [state.hydrated, state.careMode]);
  useEffect(() => {
    if (!state.hydrated) return;
    setKv('warningSigns', state.warningSigns).catch(() => {});
  }, [state.hydrated, state.warningSigns]);
  useEffect(() => {
    if (!state.hydrated) return;
    setKv('language', state.language).catch(() => {});
    if (state.language) i18next.changeLanguage(state.language).catch(() => {});
  }, [state.hydrated, state.language]);
  useEffect(() => {
    if (!state.hydrated) return;
    setKv('remindersOn', state.remindersOn).catch(() => {});
  }, [state.hydrated, state.remindersOn]);

  const actions = useMemo<StoreContextValue['actions']>(
    () => ({
      setConsent: (patch) => dispatch({ type: 'SET_CONSENT', payload: patch }),
      setAuth: (signedIn, provider) => dispatch({ type: 'SET_AUTH', payload: { signedIn, provider } }),
      setProfile: (patch) => dispatch({ type: 'SET_PROFILE', payload: patch }),
      setSex: (sex) => dispatch({ type: 'SET_PROFILE', payload: { sex } }),
      toggleCondition: (condition) => dispatch({ type: 'TOGGLE_CONDITION', payload: { condition } }),
      setCareMode: (careMode) => dispatch({ type: 'SET_CARE_MODE', payload: { careMode } }),
      setLanguage: (language) => dispatch({ type: 'SET_LANGUAGE', payload: { language } }),
      setRemindersOn: (remindersOn) => dispatch({ type: 'SET_REMINDERS_ON', payload: { remindersOn } }),
      startIllness: (feverStartISO) => dispatch({ type: 'START_ILLNESS', payload: { feverStartISO } }),
      resetIllness: () => {
        dispatch({ type: 'RESET_ILLNESS' });
        clearAllLogs().catch(() => {});
      },
      addDrink: (amountMl, kind, label, atISO) => {
        const entry: DrinkEntry = { id: makeId(), atISO: atISO ?? new Date().toISOString(), amountMl, kind, label };
        dispatch({ type: 'ADD_DRINK', payload: entry });
        insertDrink(entry).catch(() => {});
      },
      updateDrink: (id, amountMl, kind, label, atISO) => {
        const entry: DrinkEntry = { id, atISO, amountMl, kind, label };
        dispatch({ type: 'UPDATE_DRINK', payload: entry });
        updateDrinkRow(entry).catch(() => {});
      },
      removeDrink: (id) => {
        dispatch({ type: 'REMOVE_DRINK', payload: { id } });
        deleteDrink(id).catch(() => {});
      },
      addUrine: (amountMl, atISO) => {
        const entry: UrineEntry = { id: makeId(), atISO: atISO ?? new Date().toISOString(), amountMl };
        dispatch({ type: 'ADD_URINE', payload: entry });
        insertUrine(entry).catch(() => {});
      },
      updateUrine: (id, amountMl, atISO) => {
        const entry: UrineEntry = { id, atISO, amountMl };
        dispatch({ type: 'UPDATE_URINE', payload: entry });
        updateUrineRow(entry).catch(() => {});
      },
      removeUrine: (id) => {
        dispatch({ type: 'REMOVE_URINE', payload: { id } });
        deleteUrine(id).catch(() => {});
      },
      addTemp: (celsius, method, atISO) => {
        const entry: TempReading = { id: makeId(), atISO: atISO ?? new Date().toISOString(), celsius, method };
        dispatch({ type: 'ADD_TEMP', payload: entry });
        insertTemp(entry).catch(() => {});
      },
      updateTemp: (id, celsius, method, atISO) => {
        const entry: TempReading = { id, atISO, celsius, method };
        dispatch({ type: 'UPDATE_TEMP', payload: entry });
        updateTempRow(entry).catch(() => {});
      },
      removeTemp: (id) => {
        dispatch({ type: 'REMOVE_TEMP', payload: { id } });
        deleteTemp(id).catch(() => {});
      },
      addReport: (report) => {
        const entry: BloodReport = {
          id: makeId(),
          atISO: report.atISO ?? new Date().toISOString(),
          plateletCount: report.plateletCount,
          haematocritPct: report.haematocritPct,
          wbcCount: report.wbcCount,
          note: report.note,
          photoUri: report.photoUri,
        };
        dispatch({ type: 'ADD_REPORT', payload: entry });
        insertReport(entry).catch(() => {});
      },
      updateReport: (id, report) => {
        const entry: BloodReport = {
          id,
          atISO: report.atISO,
          plateletCount: report.plateletCount,
          haematocritPct: report.haematocritPct,
          wbcCount: report.wbcCount,
          note: report.note,
          photoUri: report.photoUri,
        };
        dispatch({ type: 'UPDATE_REPORT', payload: entry });
        updateReportRow(entry).catch(() => {});
      },
      removeReport: (id) => {
        dispatch({ type: 'REMOVE_REPORT', payload: { id } });
        deleteReport(id).catch(() => {});
      },
      addMedicationDose: (doseMg, atISO) => {
        const entry: MedicationDose = {
          id: makeId(),
          atISO: atISO ?? new Date().toISOString(),
          doseMg,
          medication: 'paracetamol',
        };
        dispatch({ type: 'ADD_MEDICATION_DOSE', payload: entry });
        insertMedicationDose(entry).catch(() => {});
      },
      removeMedicationDose: (id) => {
        dispatch({ type: 'REMOVE_MEDICATION_DOSE', payload: { id } });
        deleteMedicationDose(id).catch(() => {});
      },
      addIvFluid: (volumeMl, rateMlPerHr, fluidType, note, atISO) => {
        const entry: IvFluidEntry = {
          id: makeId(),
          atISO: atISO ?? new Date().toISOString(),
          volumeMl,
          rateMlPerHr,
          fluidType,
          note,
        };
        dispatch({ type: 'ADD_IV_FLUID', payload: entry });
        insertIvFluid(entry).catch(() => {});
      },
      updateIvFluid: (id, volumeMl, rateMlPerHr, fluidType, note, atISO) => {
        const entry: IvFluidEntry = { id, atISO, volumeMl, rateMlPerHr, fluidType, note };
        dispatch({ type: 'UPDATE_IV_FLUID', payload: entry });
        updateIvFluidRow(entry).catch(() => {});
      },
      removeIvFluid: (id) => {
        dispatch({ type: 'REMOVE_IV_FLUID', payload: { id } });
        deleteIvFluid(id).catch(() => {});
      },
      setWarningSign: (key, value) => dispatch({ type: 'SET_WARNING_SIGN', payload: { key, value } }),
      clearWarningSigns: () => dispatch({ type: 'CLEAR_WARNING_SIGNS' }),
    }),
    []
  );

  const value = useMemo(() => ({ state, actions }), [state, actions]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within a StoreProvider');
  return ctx;
}
