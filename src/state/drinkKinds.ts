import { DrinkKind } from './types';
import { colors } from '../theme/colors';

interface DrinkKindDef {
  key: DrinkKind;
  label: string;
  color: string;
}

// Centralized so the "Log a drink" chips, the balance gauge's stacked
// segments, and each entry-list row all agree on the same colour per kind.
// `label` holds an i18n key (under the "drinkKinds" namespace), not display
// text — translate it with t(k.label) at render time.
export const DRINK_KINDS: DrinkKindDef[] = [
  { key: 'water', label: 'drinkKinds.water', color: colors.water },
  { key: 'ors', label: 'drinkKinds.ors', color: colors.primary },
  { key: 'king_coconut', label: 'drinkKinds.king_coconut', color: colors.kingCoconut },
  { key: 'juice', label: 'drinkKinds.juice', color: colors.juice },
  { key: 'soup', label: 'drinkKinds.soup', color: colors.soup },
  { key: 'other', label: 'drinkKinds.other', color: colors.other },
];

export function drinkKindColor(kind: DrinkKind): string {
  return DRINK_KINDS.find((k) => k.key === kind)?.color ?? DRINK_KINDS[0].color;
}
