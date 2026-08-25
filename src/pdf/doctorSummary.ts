import { sumMl } from '../state/calculations';
import { ageYears, formatDatePretty, formatTime24, illnessDayNumber, localDateKey } from '../state/dateUtils';
import { filterByDateKey } from '../state/selectors';
import { AppState } from '../state/types';

function esc(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Builds the single-page HTML handed to expo-print for the "Show my doctor"
 * summary — patient info, 24h fluid balance, temperature/paracetamol log,
 * and the serial FBC table, all pulled from state already on-device. */
export function buildDoctorSummaryHtml(state: AppState, now: Date): string {
  const illness = state.illness;
  const dateKey = localDateKey(now);
  const { profile } = state;

  const dayNumber = illness ? illnessDayNumber(illness.feverStartISO, now) : null;
  const age = profile.dobISO ? ageYears(profile.dobISO, now) : null;

  const todayDrinks = filterByDateKey(state.drinks, dateKey);
  const todayIv = filterByDateKey(state.ivFluids, dateKey);
  const todayUrine = filterByDateKey(state.urine, dateKey);
  const oralInMl = sumMl(todayDrinks);
  const ivInMl = sumMl(todayIv.map((f) => ({ amountMl: f.volumeMl })));
  const urineOutMl = sumMl(todayUrine);

  const temps = [...state.temps].sort((a, b) => new Date(b.atISO).getTime() - new Date(a.atISO).getTime());
  const doses = [...state.medicationDoses].sort((a, b) => new Date(b.atISO).getTime() - new Date(a.atISO).getTime());
  const reports = [...state.reports].sort((a, b) => new Date(a.atISO).getTime() - new Date(b.atISO).getTime());

  const tempRows = temps
    .map(
      (t) =>
        `<tr><td>${formatDatePretty(new Date(t.atISO))} ${formatTime24(new Date(t.atISO))}</td><td>${t.celsius.toFixed(1)} °C</td></tr>`
    )
    .join('');
  const doseRows = doses
    .map(
      (d) =>
        `<tr><td>${formatDatePretty(new Date(d.atISO))} ${formatTime24(new Date(d.atISO))}</td><td>${d.doseMg} mg</td></tr>`
    )
    .join('');
  const reportRows = reports
    .map(
      (r) =>
        `<tr><td>${formatDatePretty(new Date(r.atISO))} ${formatTime24(new Date(r.atISO))}</td><td>${r.plateletCount ?? '—'}</td><td>${r.haematocritPct ?? '—'}</td><td>${r.wbcCount ?? '—'}</td></tr>`
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #20393A; padding: 24px; }
  h1 { font-size: 20px; margin-bottom: 4px; }
  h2 { font-size: 14px; margin-top: 20px; margin-bottom: 6px; color: #115C5C; text-transform: uppercase; letter-spacing: 0.5px; }
  .meta { color: #5C7373; font-size: 12px; margin-bottom: 12px; }
  .balance { display: flex; gap: 16px; margin-bottom: 8px; }
  .balance div { flex: 1; border: 1px solid #DCE6E6; border-radius: 8px; padding: 10px; }
  .balance .label { font-size: 11px; color: #5C7373; text-transform: uppercase; }
  .balance .value { font-size: 18px; font-weight: 700; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { text-align: left; padding: 4px 6px; border-bottom: 1px solid #E4EDED; }
  .empty { color: #8FA3A3; font-size: 12px; }
</style>
</head>
<body>
  <h1>${esc(profile.name || 'Patient')} — DenguCare summary</h1>
  <div class="meta">
    ${age != null ? `Age ${age}` : ''} ${profile.weightKg ? `· ${profile.weightKg} kg` : ''}
    ${dayNumber != null ? `· Illness day ${dayNumber}` : ''} · Generated ${formatDatePretty(now)} ${formatTime24(now)}
  </div>

  <h2>24-hour fluid balance</h2>
  <div class="balance">
    <div><div class="label">Fluid in (oral${ivInMl > 0 ? ' + IV' : ''})</div><div class="value">${oralInMl + ivInMl} ml</div></div>
    <div><div class="label">Urine out</div><div class="value">${urineOutMl} ml</div></div>
  </div>

  <h2>Temperature history</h2>
  ${temps.length ? `<table><tr><th>When</th><th>Reading</th></tr>${tempRows}</table>` : '<div class="empty">No readings logged.</div>'}

  <h2>Paracetamol doses</h2>
  ${doses.length ? `<table><tr><th>When</th><th>Dose</th></tr>${doseRows}</table>` : '<div class="empty">No doses logged.</div>'}

  <h2>Blood report trend (FBC)</h2>
  ${
    reports.length
      ? `<table><tr><th>When</th><th>Platelets (x10³/µL)</th><th>HCT (%)</th><th>WBC (x10³/µL)</th></tr>${reportRows}</table>`
      : '<div class="empty">No blood reports logged.</div>'
  }
</body>
</html>`;
}
