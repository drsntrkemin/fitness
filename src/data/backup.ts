import { db } from './db';
import { getExerciseStates, getSettings } from './repo';
import type { BackupFile } from '../domain/types';

export class BackupError extends Error {
  constructor(message = 'Geçersiz yedek dosyası') {
    super(message);
    this.name = 'BackupError';
  }
}

export async function exportAll(): Promise<BackupFile> {
  return {
    app: 'ev-fitness',
    version: 1,
    exportedAt: new Date().toISOString(),
    settings: await getSettings(),
    exerciseStates: await getExerciseStates(),
    sessions: await db.sessions.toArray(),
    meals: await db.meals.toArray(),
    measurements: await db.measurements.toArray(),
  };
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isDate = (v: unknown) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
const isNum = (v: unknown) => typeof v === 'number' && Number.isFinite(v);
const isNumOrNull = (v: unknown) => v === null || isNum(v);

function validate(data: unknown): BackupFile {
  if (typeof data === 'string') {
    try { data = JSON.parse(data); } catch { throw new BackupError(); }
  }
  if (!isObj(data) || data.app !== 'ev-fitness' || data.version !== 1) throw new BackupError();
  const { settings, exerciseStates, sessions, meals, measurements } = data;
  const ok =
    isObj(settings) && isObj(settings.equipment) && Array.isArray(settings.equipment.bands) &&
    isObj(exerciseStates) &&
    Object.values(exerciseStates).every((s) => isObj(s) && isNum(s.level) && isNum(s.targetReps)) &&
    Array.isArray(sessions) &&
    sessions.every((s) => isObj(s) && isDate(s.date) && (s.day === 'A' || s.day === 'B') && Array.isArray(s.exercises)) &&
    Array.isArray(meals) &&
    meals.every((m) => isObj(m) && isDate(m.date) && isNum(m.kcal) && isNum(m.protein) && isNum(m.carbs) && isNum(m.fat)) &&
    Array.isArray(measurements) &&
    measurements.every((m) => isObj(m) && isDate(m.date) && isNumOrNull(m.weight) && isNumOrNull(m.waist));
  if (!ok) throw new BackupError();
  return data as unknown as BackupFile;
}

/** Yedeği doğrular; geçerliyse tek işlemde mevcut verinin yerine yazar. Geçersizse hiçbir şeye dokunmaz. */
export async function importAll(data: unknown): Promise<void> {
  const b = validate(data);
  await db.transaction('rw', [db.settings, db.exerciseStates, db.sessions, db.meals, db.measurements], async () => {
    await Promise.all([db.settings.clear(), db.exerciseStates.clear(), db.sessions.clear(), db.meals.clear(), db.measurements.clear()]);
    await db.settings.put({ key: 'main', value: b.settings });
    await db.exerciseStates.bulkPut(Object.entries(b.exerciseStates).map(([id, s]) => ({ id, ...s })));
    await db.sessions.bulkPut(b.sessions);
    await db.meals.bulkPut(b.meals);
    await db.measurements.bulkPut(b.measurements);
  });
}
