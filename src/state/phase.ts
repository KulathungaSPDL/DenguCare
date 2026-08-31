/** Returns an i18n key (under the "phase" namespace), not display text —
 * translate it with t(phaseLabel(day)) at render time. */
export function phaseLabel(day: number): string {
  if (day <= 2) return 'phase.fever';
  if (day <= 7) return 'phase.critical';
  return 'phase.recovery';
}

export function isCriticalPhase(day: number): boolean {
  return day > 2 && day <= 7;
}
