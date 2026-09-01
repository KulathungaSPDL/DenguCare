import { getDb } from './database';
import { BloodReport, DengueTestRecord, DrinkEntry, IvFluidEntry, MedicationDose, TempReading, UrineEntry } from '../state/types';

// Every insert/delete here is awaited by the calling reducer-effect in
// store.tsx immediately after the in-memory state updates, so each logged
// entry is durably on disk before the action is considered "done" — the
// local-first guarantee this table layer exists for.

export async function listDrinks(): Promise<DrinkEntry[]> {
  const db = await getDb();
  return db.getAllAsync<DrinkEntry>('SELECT * FROM drinks ORDER BY atISO DESC');
}
export async function insertDrink(e: DrinkEntry): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO drinks (id, atISO, amountMl, kind, label) VALUES (?, ?, ?, ?, ?)',
    e.id, e.atISO, e.amountMl, e.kind, e.label
  );
}
export async function updateDrink(e: DrinkEntry): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE drinks SET atISO = ?, amountMl = ?, kind = ?, label = ? WHERE id = ?',
    e.atISO, e.amountMl, e.kind, e.label, e.id
  );
}
export async function deleteDrink(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM drinks WHERE id = ?', id);
}

export async function listUrine(): Promise<UrineEntry[]> {
  const db = await getDb();
  return db.getAllAsync<UrineEntry>('SELECT * FROM urine_entries ORDER BY atISO DESC');
}
export async function insertUrine(e: UrineEntry): Promise<void> {
  const db = await getDb();
  await db.runAsync('INSERT INTO urine_entries (id, atISO, amountMl) VALUES (?, ?, ?)', e.id, e.atISO, e.amountMl);
}
export async function updateUrine(e: UrineEntry): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE urine_entries SET atISO = ?, amountMl = ? WHERE id = ?', e.atISO, e.amountMl, e.id);
}
export async function deleteUrine(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM urine_entries WHERE id = ?', id);
}

export async function listTemps(): Promise<TempReading[]> {
  const db = await getDb();
  return db.getAllAsync<TempReading>('SELECT * FROM temp_readings ORDER BY atISO DESC');
}
export async function insertTemp(e: TempReading): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO temp_readings (id, atISO, celsius, method) VALUES (?, ?, ?, ?)',
    e.id, e.atISO, e.celsius, e.method
  );
}
export async function updateTemp(e: TempReading): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE temp_readings SET atISO = ?, celsius = ?, method = ? WHERE id = ?',
    e.atISO, e.celsius, e.method, e.id
  );
}
export async function deleteTemp(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM temp_readings WHERE id = ?', id);
}

export async function listReports(): Promise<BloodReport[]> {
  const db = await getDb();
  return db.getAllAsync<BloodReport>(
    'SELECT id, atISO, plateletCount, haematocritPct, wbcCount, neutrophilsCount, lymphocytesCount, monocytesCount, mpv, hgb, note, photoUri FROM blood_reports ORDER BY atISO DESC'
  );
}
export async function insertReport(e: BloodReport): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO blood_reports (id, atISO, plateletCount, haematocritPct, wbcCount, neutrophilsCount, lymphocytesCount, monocytesCount, mpv, hgb, note, photoUri) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    e.id, e.atISO, e.plateletCount, e.haematocritPct, e.wbcCount, e.neutrophilsCount, e.lymphocytesCount, e.monocytesCount, e.mpv, e.hgb, e.note, e.photoUri
  );
}
export async function updateReport(e: BloodReport): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE blood_reports SET atISO = ?, plateletCount = ?, haematocritPct = ?, wbcCount = ?, neutrophilsCount = ?, lymphocytesCount = ?, monocytesCount = ?, mpv = ?, hgb = ?, note = ?, photoUri = ? WHERE id = ?',
    e.atISO, e.plateletCount, e.haematocritPct, e.wbcCount, e.neutrophilsCount, e.lymphocytesCount, e.monocytesCount, e.mpv, e.hgb, e.note, e.photoUri, e.id
  );
}
export async function deleteReport(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM blood_reports WHERE id = ?', id);
}

export async function listDengueTests(): Promise<DengueTestRecord[]> {
  const db = await getDb();
  return db.getAllAsync<DengueTestRecord>('SELECT * FROM dengue_tests ORDER BY atISO DESC');
}
export async function insertDengueTest(e: DengueTestRecord): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO dengue_tests (id, atISO, type, result, photoUri) VALUES (?, ?, ?, ?, ?)',
    e.id, e.atISO, e.type, e.result, e.photoUri
  );
}
export async function updateDengueTest(e: DengueTestRecord): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE dengue_tests SET atISO = ?, type = ?, result = ?, photoUri = ? WHERE id = ?',
    e.atISO, e.type, e.result, e.photoUri, e.id
  );
}
export async function deleteDengueTest(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM dengue_tests WHERE id = ?', id);
}

export async function listMedicationDoses(): Promise<MedicationDose[]> {
  const db = await getDb();
  return db.getAllAsync<MedicationDose>('SELECT * FROM medication_doses ORDER BY atISO DESC');
}
export async function insertMedicationDose(e: MedicationDose): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO medication_doses (id, atISO, doseMg, medication) VALUES (?, ?, ?, ?)',
    e.id, e.atISO, e.doseMg, e.medication
  );
}
export async function deleteMedicationDose(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM medication_doses WHERE id = ?', id);
}

export async function listIvFluids(): Promise<IvFluidEntry[]> {
  const db = await getDb();
  return db.getAllAsync<IvFluidEntry>('SELECT * FROM iv_fluid_entries ORDER BY atISO DESC');
}
export async function insertIvFluid(e: IvFluidEntry): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO iv_fluid_entries (id, atISO, volumeMl, rateMlPerHr, fluidType, note) VALUES (?, ?, ?, ?, ?, ?)',
    e.id, e.atISO, e.volumeMl, e.rateMlPerHr, e.fluidType, e.note
  );
}
export async function updateIvFluid(e: IvFluidEntry): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE iv_fluid_entries SET atISO = ?, volumeMl = ?, rateMlPerHr = ?, fluidType = ?, note = ? WHERE id = ?',
    e.atISO, e.volumeMl, e.rateMlPerHr, e.fluidType, e.note, e.id
  );
}
export async function deleteIvFluid(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM iv_fluid_entries WHERE id = ?', id);
}

/** Singleton/low-volume state (profile, consent, auth, illness, careMode,
 * warningSigns) — normalizing these into columns buys nothing since they're
 * not logs, so they're kept as JSON blobs keyed by name. */
export async function getAllKv(): Promise<Record<string, string>> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ key: string; value: string }>('SELECT key, value FROM kv_store');
  const out: Record<string, string> = {};
  for (const row of rows) out[row.key] = row.value;
  return out;
}
export async function setKv(key: string, value: unknown): Promise<void> {
  const db = await getDb();
  await db.runAsync('INSERT OR REPLACE INTO kv_store (key, value) VALUES (?, ?)', key, JSON.stringify(value));
}

/** Wipes every logging table — used by RESET_ILLNESS. Singleton kv rows
 * (profile, careMode, etc.) are left alone; the reducer keeps those as-is. */
export async function clearAllLogs(): Promise<void> {
  const db = await getDb();
  await db.execAsync(`
    DELETE FROM drinks;
    DELETE FROM urine_entries;
    DELETE FROM temp_readings;
    DELETE FROM blood_reports;
    DELETE FROM dengue_tests;
    DELETE FROM medication_doses;
    DELETE FROM iv_fluid_entries;
  `);
}
