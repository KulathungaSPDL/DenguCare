import { WarningSignKey, WARNING_SIGN_KEYS } from './types';

export const WARNING_SIGN_LABELS: Record<WarningSignKey, string> = {
  abdominal_pain: 'Bad tummy pain or tenderness',
  persistent_vomiting: 'Vomiting again and again',
  bleeding: 'Bleeding from gums, nose, gut, or heavy periods',
  confused_restless: 'Very drowsy, confused, or restless',
  dizzy_faint: 'Dizzy or faint when standing up',
  cold_clammy: 'Cold, clammy hands and feet',
  no_urine_6h: 'Passed no urine for 6 hours or more',
  breathless_swelling: 'Breathless, or puffy face, legs, or tummy',
  fever_settled_worse: 'Fever has settled but I feel worse, not better',
};

export const ORDERED_WARNING_SIGN_KEYS = WARNING_SIGN_KEYS;
