export function phaseLabel(day: number): string {
  if (day <= 2) return 'Fever phase';
  if (day <= 7) return 'Critical phase';
  return 'Recovery phase';
}
