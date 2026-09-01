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

const SCHEMA_V2 = `
ALTER TABLE blood_reports ADD COLUMN dengueTestType TEXT;
ALTER TABLE blood_reports ADD COLUMN dengueTestResult TEXT;
`;

// Superseded by dengueTestsJson (a report could carry more than one dengue
// test) — the V2 columns are left in place on already-migrated devices since
// SQLite can't cheaply drop columns, but nothing reads them anymore.
const SCHEMA_V3 = `
ALTER TABLE blood_reports ADD COLUMN dengueTestsJson TEXT;
`;

// Dengue tests (NS1/IgM/IgG/PCR) moved out to their own table — logged on
// their own card independently of the FBC blood_reports, since they're
// often done at a different time/lab. blood_reports.dengueTestsJson from V3
// is left in place unused, same reason as the V2 columns above.
const SCHEMA_V4 = `
CREATE TABLE IF NOT EXISTS dengue_tests (
  id TEXT PRIMARY KEY NOT NULL,
  atISO TEXT NOT NULL,
  type TEXT NOT NULL,
  result TEXT NOT NULL,
  photoUri TEXT
);
CREATE INDEX IF NOT EXISTS idx_dengue_tests_atISO ON dengue_tests(atISO);
`;

// Extra FBC differential fields a user can transcribe from a photographed
// lab slip alongside the original platelet/HCT/WBC trio.
const SCHEMA_V5 = `
ALTER TABLE blood_reports ADD COLUMN neutrophilsCount REAL;
ALTER TABLE blood_reports ADD COLUMN lymphocytesCount REAL;
ALTER TABLE blood_reports ADD COLUMN monocytesCount REAL;
ALTER TABLE blood_reports ADD COLUMN mpv REAL;
ALTER TABLE blood_reports ADD COLUMN hgb REAL;
`;

async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const version = row?.user_version ?? 0;

  if (version < 1) {
    await db.execAsync(SCHEMA_V1);
    await db.execAsync('PRAGMA user_version = 1');
  }
  if (version < 2) {
    await db.execAsync(SCHEMA_V2);
    await db.execAsync('PRAGMA user_version = 2');
  }
  if (version < 3) {
    await db.execAsync(SCHEMA_V3);
    await db.execAsync('PRAGMA user_version = 3');
  }
  if (version < 4) {
    await db.execAsync(SCHEMA_V4);
    await db.execAsync('PRAGMA user_version = 4');
  }
  if (version < 5) {
    await db.execAsync(SCHEMA_V5);
    await db.execAsync('PRAGMA user_version = 5');
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
