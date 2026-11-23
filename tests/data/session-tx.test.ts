import * as repo from '../../src/data/repo';
import { db } from '../../src/data/db';
import type { Session } from '../../src/domain/types';

beforeEach(async () => { await repo.resetAll(); });

const make = (): Session => ({ date: '2026-11-23', day: 'A', status: 'active', exercises: [] });

test('startSession aynı anda iki kez çağrılsa da tek aktif oturum açar', async () => {
  const [a, b] = await Promise.all([repo.startSession(make), repo.startSession(make)]);
  expect(a.id).toBeDefined();
  expect(b.id).toBe(a.id);
  expect(await db.sessions.where('status').equals('active').count()).toBe(1);
});

test('startSession aktif oturum varsa onu döndürür', async () => {
  const id = await repo.saveSession({ ...make(), day: 'B' });
  const s = await repo.startSession(make);
  expect(s).toMatchObject({ id, day: 'B' });
});

test('completeSession durumları ve oturumu birlikte yazar; ikinci çağrı hiçbir şey yapmaz', async () => {
  const id = await repo.saveSession(make());
  const compute = vi.fn((_s: Session) => ({ states: { pullup: { level: 1, targetReps: 5, failStreak: 0 } }, result: 'ok' }));
  const [first, second] = await Promise.all([repo.completeSession(id, compute), repo.completeSession(id, compute)]);
  expect([first, second].sort()).toEqual(['ok', null].sort());
  expect(compute).toHaveBeenCalledTimes(1);
  expect((await repo.getExerciseStates()).pullup).toEqual({ level: 1, targetReps: 5, failStreak: 0 });
  expect(await repo.getActiveSession()).toBeUndefined();
});

test('completeSession güncel kaydı okur', async () => {
  const id = await repo.saveSession(make());
  await repo.saveSession({ ...make(), id, exercises: [{ exerciseId: 'pullup', level: 0, levelLabel: 'x', targetReps: 4, sets: [4, 4, 4] }] });
  const seen = await repo.completeSession(id, (s) => ({ states: {}, result: s.exercises.length }));
  expect(seen).toBe(1);
});
