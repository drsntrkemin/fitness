// Tüm kalıcı veri erişimi bu modülden geçer (spec §4: ileride bulut senkronuna geçişi kolaylaştırır).
import { db } from './db';
import { remapSession, remapStates } from '../domain/remap';
import type { DateKey, DayKey, ExerciseState, Meal, Measurement, Session, Settings } from '../domain/types';

export const DEFAULT_SETTINGS: Settings = Object.freeze({
  targets: null,
  daysPerWeek: 3,
  equipment: { bands: [], ladderRungs: 10 },
  overrides: {},
  lastBackup: null,
  setupDone: false,
}) as Settings;

const fresh = <T>(v: T): T => structuredClone(v);

export async function getSettings(): Promise<Settings> {
  const row = await db.settings.get('main');
  // Varsayılanlarla birleştir: ileride eklenen alanlar eski kayıtlarda da dolu olur.
  return { ...fresh(DEFAULT_SETTINGS), ...(row?.value ?? {}) };
}

export async function saveSettings(s: Settings): Promise<void> {
  await db.settings.put({ key: 'main', value: s });
}

/**
 * Ekipmanı değiştirir ve kayıtlı seviyeleri (hareket durumları + açık antrenman) yeni merdivene taşır — tek işlemde.
 * Böylece bant eklemek/silmek ya da kademe sayısını değiştirmek koçun önerdiği bandı sessizce değiştirmez.
 */
export async function updateEquipment(prev: Settings, next: Settings): Promise<void> {
  await db.transaction('rw', [db.settings, db.exerciseStates, db.sessions], async () => {
    const rows = await db.exerciseStates.toArray();
    const states = Object.fromEntries(rows.map(({ id, ...st }) => [id, st]));
    const moved = remapStates(states, prev.equipment, next.equipment);
    await db.exerciseStates.bulkPut(Object.entries(moved).map(([id, st]) => ({ id, ...st })));
    const active = await db.sessions.where('status').equals('active').toArray();
    for (const s of active) await db.sessions.put(remapSession(s, prev.equipment, next.equipment));
    await db.settings.put({ key: 'main', value: next });
  });
}

export async function getExerciseStates(): Promise<Record<string, ExerciseState>> {
  const rows = await db.exerciseStates.toArray();
  return Object.fromEntries(rows.map(({ id, ...state }) => [id, state]));
}

export async function putExerciseStates(states: Record<string, ExerciseState>): Promise<void> {
  await db.exerciseStates.bulkPut(Object.entries(states).map(([id, s]) => ({ id, ...s })));
}

const byNewest = (a: Session, b: Session) =>
  a.date !== b.date ? (a.date < b.date ? 1 : -1) : (b.id ?? 0) - (a.id ?? 0);

export async function getActiveSession(): Promise<Session | undefined> {
  const active = await db.sessions.where('status').equals('active').toArray();
  return active.sort(byNewest)[0];
}

export async function saveSession(s: Session): Promise<number> {
  return (await db.sessions.put(s)) as number;
}

/** Aktif oturum varsa onu döndürür, yoksa build() ile yenisini ekler — tek işlemde (çift dokunuşa karşı). */
export async function startSession(build: () => Session): Promise<Session> {
  return db.transaction('rw', db.sessions, async () => {
    const existing = (await db.sessions.where('status').equals('active').toArray()).sort(byNewest)[0];
    if (existing) return existing;
    const s = build();
    const id = (await db.sessions.add(s)) as number;
    return { ...s, id };
  });
}

/**
 * Aktif oturumu tek işlemde bitirir: güncel kaydı ve durumları okur, compute ile yeni durumları hesaplar,
 * durumları ve "bitti" bilgisini birlikte yazar. Oturum yoksa ya da zaten bittiyse hiçbir şey yapmaz ve null döner.
 */
export async function completeSession<T>(
  id: number,
  compute: (s: Session, states: Record<string, ExerciseState>) => { states: Record<string, ExerciseState>; result: T },
): Promise<T | null> {
  return db.transaction('rw', [db.sessions, db.exerciseStates], async () => {
    const s = await db.sessions.get(id);
    if (!s || s.status !== 'active') return null;
    const rows = await db.exerciseStates.toArray();
    const states = Object.fromEntries(rows.map(({ id: exId, ...st }) => [exId, st]));
    const r = compute(s, states);
    await db.exerciseStates.bulkPut(Object.entries(r.states).map(([exId, st]) => ({ id: exId, ...st })));
    await db.sessions.put({ ...s, status: 'done' });
    return r.result;
  });
}

export async function deleteSession(id: number): Promise<void> {
  await db.sessions.delete(id);
}

/** Bitmiş oturumlar, en yeniden eskiye. */
export async function listSessions(fromDate?: DateKey): Promise<Session[]> {
  const done = await db.sessions.where('status').equals('done').toArray();
  return done.filter((s) => !fromDate || s.date >= fromDate).sort(byNewest);
}

export async function lastFinishedDay(): Promise<DayKey | null> {
  return (await listSessions())[0]?.day ?? null;
}

export async function addMeal(m: Meal): Promise<number> {
  return (await db.meals.add(m)) as number;
}

export async function updateMeal(m: Meal): Promise<void> {
  if (m.id === undefined) throw new Error('updateMeal: id yok');
  await db.meals.put(m);
}

export async function deleteMeal(id: number): Promise<void> {
  await db.meals.delete(id);
}

export async function listMeals(from: DateKey, to: DateKey): Promise<Meal[]> {
  return db.meals.where('date').between(from, to, true, true).sortBy('time');
}

export async function allMeals(): Promise<Meal[]> {
  return db.meals.toArray();
}

export async function putMeasurement(m: Measurement): Promise<void> {
  await db.measurements.put(m);
}

export async function deleteMeasurement(date: DateKey): Promise<void> {
  await db.measurements.delete(date);
}

export async function listMeasurements(): Promise<Measurement[]> {
  return db.measurements.orderBy('date').toArray();
}

export async function resetAll(): Promise<void> {
  await db.transaction('rw', [db.settings, db.exerciseStates, db.sessions, db.meals, db.measurements], async () => {
    await Promise.all([db.settings.clear(), db.exerciseStates.clear(), db.sessions.clear(), db.meals.clear(), db.measurements.clear()]);
  });
}
