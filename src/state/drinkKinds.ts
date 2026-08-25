import { DrinkKind } from './types';
import { colors } from '../theme/colors';

interface DrinkKindDef {
  key: DrinkKind;
  label: string;
  color: string;
}

// Centralized so the "Log a drink" chips, the balance gauge's stacked
// segments, and each entry-list row all agree on the same colour per kind.
export const DRINK_KINDS: DrinkKindDef[] = [
  { key: 'water', label: 'Water', color: colors.water },
  { key: 'ors', label: 'ORS / Jeevani', color: colors.primary },
  { key: 'king_coconut', label: 'King Coconut', color: colors.kingCoconut },
  { key: 'juice', label: 'Juice', color: colors.juice },
  { key: 'soup', label: 'Soup', color: colors.soup },
  { key: 'other', label: 'Other', color: colors.other },
];

export function drinkKindColor(kind: DrinkKind): string {
  return DRINK_KINDS.find((k) => k.key === kind)?.color ?? DRINK_KINDS[0].color;
}
