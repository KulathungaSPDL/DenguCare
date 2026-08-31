import { WarningSignKey, WARNING_SIGN_KEYS } from './types';

// Values are i18n keys (under the "warningSigns" namespace), not display
// text — translate them with t(WARNING_SIGN_LABELS[key]) at render time.
export const WARNING_SIGN_LABELS: Record<WarningSignKey, string> = {
  abdominal_pain: 'warningSigns.abdominal_pain',
  persistent_vomiting: 'warningSigns.persistent_vomiting',
  bleeding: 'warningSigns.bleeding',
  confused_restless: 'warningSigns.confused_restless',
  dizzy_faint: 'warningSigns.dizzy_faint',
  cold_clammy: 'warningSigns.cold_clammy',
  no_urine_6h: 'warningSigns.no_urine_6h',
  breathless_swelling: 'warningSigns.breathless_swelling',
  fever_settled_worse: 'warningSigns.fever_settled_worse',
};

export const ORDERED_WARNING_SIGN_KEYS = WARNING_SIGN_KEYS;
