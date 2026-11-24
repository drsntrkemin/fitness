import { EXERCISES } from '../../src/domain/catalog';
import { exercisesFor, planExercises } from '../../src/domain/program';
import { planMuscles } from '../../src/domain/muscles';
import { createSession } from '../../src/domain/session';
import { DEFAULT_SETTINGS } from '../../src/data/repo';
import type { Settings } from '../../src/domain/types';

const ids = (xs: { id: string }[]) => xs.map((x) => x.id);
const A_HOME = ['pullup', 'pushup', 'band-squat', 'band-rdl', 'hanging-raise', 'band-lateral-raise', 'band-curl'];

test('barfiks barı varken ev programı değişmez', () => {
  expect(ids(planExercises('A', { mode: 'home', hasPullupBar: true }))).toEqual(A_HOME);
});

test('bar yoksa evde barfiksin yerine bantlı eğilerek row gelir', () => {
  expect(ids(planExercises('A', { mode: 'home', hasPullupBar: false })))
    .toEqual(['band-bent-row', ...A_HOME.slice(1)]);
});

test('seyahatte merdiven/yukarı bağlantı gerektirenler yedekleriyle değişir', () => {
  const opts = { mode: 'travel' as const, hasPullupBar: true };
  expect(ids(planExercises('A', opts))).toEqual(
    ['band-bent-row', 'travel-pushup', 'band-squat', 'band-rdl', 'floor-leg-raise', 'band-lateral-raise', 'band-curl']);
  expect(ids(planExercises('B', opts))).toEqual(
    ['band-seated-row', 'band-press', 'band-lunge', 'band-hip-thrust', 'dead-bug', 'band-fly-back', 'band-overhead-triceps']);
});

test('yedekler A/B gün listelerinde ayrıca görünmez', () => {
  expect(ids(exercisesFor('A'))).toEqual(A_HOME);
  expect(exercisesFor('B')).toHaveLength(7);
});

test('yedeklerin kasları ve türü tasarım tablosundaki gibi', () => {
  const ex = (id: string) => EXERCISES.find((e) => e.id === id)!;
  expect(ex('band-bent-row').muscles).toEqual({ primary: ['lats', 'upperBack'], secondary: ['biceps', 'rearDelts'] });
  expect(ex('band-seated-row').muscles).toEqual({ primary: ['upperBack', 'lats'], secondary: ['biceps', 'rearDelts'] });
  expect(ex('travel-pushup').muscles).toEqual({ primary: ['chest', 'triceps'], secondary: ['shoulders', 'abs'] });
  expect(ex('floor-leg-raise').muscles).toEqual({ primary: ['abs'], secondary: ['obliques'] });
  expect(ex('dead-bug').muscles).toEqual({ primary: ['obliques', 'abs'], secondary: [] });
  expect(ex('band-fly-back').muscles).toEqual({ primary: ['chest'], secondary: ['shoulders'] });
  expect(ex('band-overhead-triceps').muscles).toEqual({ primary: ['triceps'], secondary: [] });
  expect([ex('floor-leg-raise').core, ex('dead-bug').core, ex('dead-bug').perSide]).toEqual([true, true, true]);
  expect([ex('band-fly-back').accessory, ex('band-overhead-triceps').accessory]).toEqual([true, true]);
  expect([ex('band-bent-row').repMin, ex('band-bent-row').repMax]).toEqual([8, 12]);
});

test('seyahat şınavı dizüstüden bantlıya ilerler', async () => {
  const { buildLadder } = await import('../../src/domain/program');
  const ex = EXERCISES.find((e) => e.id === 'travel-pushup')!;
  expect(buildLadder(ex, { bands: [{ id: 'b1', name: 'Sarı' }], ladderRungs: 10 }))
    .toEqual(['Dizüstü şınav', 'Yer şınavı', 'Bantlı şınav (Sarı)']);
});

test('varsayılan ayarda barfiks barı yok', () => {
  expect(DEFAULT_SETTINGS.hasPullupBar).toBe(false);
});

test('oturum modu ve hareketleri plana göre kurulur', () => {
  const settings: Settings = { ...structuredClone(DEFAULT_SETTINGS), setupDone: true, hasPullupBar: true };
  const s = createSession('B', '2026-11-24', settings, {}, 'travel');
  expect(s.mode).toBe('travel');
  expect(s.exercises.map((e) => e.exerciseId)[0]).toBe('band-seated-row');
  expect(createSession('A', '2026-11-24', settings, {}).mode).toBe('home');
});

test('planın kasları gerçek hareketlerden gelir', () => {
  const m = planMuscles('A', { mode: 'travel', hasPullupBar: false });
  expect(m.primary).toContain('lats');
  expect(m.primary).toContain('upperBack');
});
