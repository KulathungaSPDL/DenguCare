import * as Localization from 'expo-localization';
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import si from './locales/si.json';
import ta from './locales/ta.json';

// Translations here cover only strings introduced after this scaffold was
// added (Care Mode, IV fluids, hyponatremia/dark-fluid advisories, the
// paracetamol guard, the plasma-leakage alert, the doctor summary, and the
// AppTopBar page topics/patient descriptors). Existing screens keep their
// original English copy — see the app-wide "needs clinical/native-speaker
// review" disclaimer already used in src/state/calculations.ts; these
// translations need the same pass before real patients rely on them.
const SUPPORTED_LANGUAGES = ['en', 'si', 'ta'] as const;

function detectInitialLanguage(): string {
  const deviceLanguage = Localization.getLocales()[0]?.languageCode;
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(deviceLanguage ?? '') ? (deviceLanguage as string) : 'en';
}

i18next.use(initReactI18next).init({
  compatibilityJSON: 'v4',
  resources: {
    en: { translation: en },
    si: { translation: si },
    ta: { translation: ta },
  },
  lng: detectInitialLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18next;
