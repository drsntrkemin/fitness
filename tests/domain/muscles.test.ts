import { EXERCISES } from '../../src/domain/catalog';
import {
  MUSCLE_NAMES, FRONT_MUSCLES, BACK_MUSCLES, mergeMuscles, dayMuscles, sessionMuscles, finishStats,
} from '../../src/domain/muscles';
import type { Session } from '../../src/domain/types';

test('her hareketin en az bir ana kası var ve tüm kaslar bilinen adlardan', () => {
  for (const ex of EXERCISES) {
    expect(ex.muscles.primary.length).toBeGreaterThan(0);
    for (const m of [...ex.muscles.primary, ...ex.muscles.secondary]) expect(MUSCLE_NAMES).toHaveProperty(m);
  }
});

test('tasarım tablosundaki eşleşmeler', () => {
  const m = (id: string) => EXERCISES.find((e) => e.id === id)!.muscles;
  expect(m('pullup')).toEqual({ primary: ['lats', 'biceps'], secondary: ['upperBack', 'rearDelts', 'forearms'] });
  expect(m('pushup')).toEqual({ primary: ['chest', 'triceps'], secondary: ['shoulders', 'abs'] });
  expect(m('band-pallof')).toEqual({ primary: ['obliques', 'abs'], secondary: [] });
  expect(m('band-lunge')).toEqual({ primary: ['quads', 'glutes'], secondary: ['hamstrings', 'calves'] });
  expect(m('band-pushdown')).toEqual({ primary: ['triceps'], secondary: [] });
});

test('Türkçe adlar', () => {
  expect(MUSCLE_NAMES.lats).toBe('Kanat');
  expect(MUSCLE_NAMES.calves).toBe('Baldır');
  expect(Object.keys(MUSCLE_NAMES)).toHaveLength(16);
});

test('baldır yalnız arka görünümde; ön kol iki görünümde', () => {
  expect(FRONT_MUSCLES).not.toContain('calves');
  expect(BACK_MUSCLES).toContain('calves');
  expect(FRONT_MUSCLES).toContain('forearms');
  expect(BACK_MUSCLES).toContain('forearms');
  expect(new Set([...FRONT_MUSCLES, ...BACK_MUSCLES]).size).toBe(16);
});

test('mergeMuscles birleştirir; yardımcıdan ana kası çıkarır; ilk geçiş sırasını korur', () => {
  expect(mergeMuscles([
    { primary: ['chest'], secondary: ['shoulders', 'triceps'] },
    { primary: ['triceps'], secondary: ['shoulders'] },
  ])).toEqual({ primary: ['chest', 'triceps'], secondary: ['shoulders'] });
});

test('A gününün kasları', () => {
  const a = dayMuscles('A');
  expect(a.primary).toEqual(['lats', 'biceps', 'chest', 'triceps', 'quads', 'glutes', 'hamstrings', 'abs', 'shoulders']);
  for (const m of a.secondary) expect(a.primary).not.toContain(m);
});

const sess = (exercises: Session['exercises']): Session => ({ date: '2026-11-23', day: 'A', status: 'done', exercises });

test('sessionMuscles yalnız set girilen hareketleri sayar; bilinmeyen hareketi yok sayar', () => {
  const s = sess([
    { exerciseId: 'pullup', level: 1, levelLabel: 'x', targetReps: 6, sets: [6, null, null] },
    { exerciseId: 'pushup', level: 1, levelLabel: 'x', targetReps: 10, sets: [10, 10, 10] },
    { exerciseId: 'band-squat', level: 0, levelLabel: 'x', targetReps: 8, sets: [null, null, null] },
    { exerciseId: 'eski-hareket', level: 0, levelLabel: 'x', targetReps: 8, sets: [8, 8, 8] },
  ]);
  expect(sessionMuscles(s).primary).toEqual(['lats', 'biceps', 'chest', 'triceps']);
});

test('finishStats girilen setleri ve ilerleyen hareketleri sayar', () => {
  const s = sess([
    { exerciseId: 'pullup', level: 1, levelLabel: 'x', targetReps: 6, sets: [6, 6, null] },
    { exerciseId: 'pushup', level: 1, levelLabel: 'x', targetReps: 10, sets: [10, null, null] },
  ]);
  expect(finishStats(s, [{ event: 'reps-up' }, { event: 'level-up' }, { event: 'max-level' }, { event: 'none' }]))
    .toEqual({ sets: 3, progressed: 2, regressed: 0 });
  expect(finishStats(s, [{ event: 'level-down' }, { event: 'none' }]).regressed).toBe(1);
});
