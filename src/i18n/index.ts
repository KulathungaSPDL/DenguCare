import * as Localization from 'expo-localization';
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import si from './locales/si.json';
import ta from './locales/ta.json';

// All user-facing screens and components are routed through these bundles.
// The Sinhala and Tamil copy was machine-translated for full app coverage —
// see the app-wide "needs clinical/native-speaker review" disclaimer already
// used in src/state/calculations.ts; these translations need the same pass
// (accuracy of medical terms especially) before real patients rely on them.
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
