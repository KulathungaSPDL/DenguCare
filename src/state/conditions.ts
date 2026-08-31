import { Condition } from './types';

// `label` holds an i18n key (under the "conditions" namespace), not display
// text — translate it with t(c.label) at render time.
export const CONDITIONS: { key: Condition; label: string; sexOnly?: 'female' }[] = [
  { key: 'pregnant', label: 'conditions.pregnant', sexOnly: 'female' },
  { key: 'diabetes', label: 'conditions.diabetes' },
  { key: 'heart_kidney', label: 'conditions.heart_kidney' },
  { key: 'blood_thinners', label: 'conditions.blood_thinners' },
];
