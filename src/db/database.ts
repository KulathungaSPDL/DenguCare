import * as SQLite from 'expo-sqlite';

const DB_NAME = 'dengucare.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

const SCHEMA_V1 = `
CREATE TABLE IF NOT EXISTS drinks (
  id TEXT PRIMARY KEY NOT NULL,
  atISO TEXT NOT NULL,
  amountMl REAL NOT NULL,
  kind TEXT NOT NULL,
  label TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS urine_entries (
  id TEXT PRIMARY KEY NOT NULL,
  atISO TEXT NOT NULL,
  amountMl REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS temp_readings (
  id TEXT PRIMARY KEY NOT NULL,
  atISO TEXT NOT NULL,
  celsius REAL NOT NULL,
  method TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS blood_reports (
  id TEXT PRIMARY KEY NOT NULL,
  atISO TEXT NOT NULL,
  plateletCount REAL,
  haematocritPct REAL,
  wbcCount REAL,
  note TEXT NOT NULL,
  photoUri TEXT
);
CREATE TABLE IF NOT EXISTS medication_doses (
  id TEXT PRIMARY KEY NOT NULL,
  atISO TEXT NOT NULL,
  doseMg REAL NOT NULL,
  medication TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS iv_fluid_entries (
  id TEXT PRIMARY KEY NOT NULL,
  atISO TEXT NOT NULL,
  volumeMl REAL NOT NULL,
  rateMlPerHr REAL,
  fluidType TEXT NOT NULL,
  note TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS kv_store (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_drinks_atISO ON drinks(atISO);
CREATE INDEX IF NOT EXISTS idx_urine_atISO ON urine_entries(atISO);
CREATE INDEX IF NOT EXISTS idx_temps_atISO ON temp_readings(atISO);
CREATE INDEX IF NOT EXISTS idx_reports_atISO ON blood_reports(atISO);
CREATE INDEX IF NOT EXISTS idx_meds_atISO ON medication_doses(atISO);
CREATE INDEX IF NOT EXISTS idx_iv_atISO ON iv_fluid_entries(atISO);
`;

async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const version = row?.user_version ?? 0;

  if (version < 1) {
    await db.execAsync(SCHEMA_V1);
    await db.execAsync('PRAGMA user_version = 1');
  }
}

/** Opens (once) and migrates the local SQLite database. Every screen goes
 * through this same connection via src/db/repo.ts — never open a second
 * connection to DB_NAME elsewhere. */
export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME).then(async (db) => {
      await migrate(db);
      return db;
    });
  }
  return dbPromise;
}
