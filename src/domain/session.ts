import { EXERCISES } from './catalog';
import { buildLadder, clampLevel, exercisesFor, repRange, setsFor } from './program';
import { progress } from './progression';
import type { DateKey, DayKey, ExerciseDef, ExerciseState, ProgressEvent, Session, SessionExercise, Settings } from './types';

export interface FinishResult {
  exerciseId: string;
  event: ProgressEvent;
  message: string;
}

const defOf = (id: string): ExerciseDef => {
  const ex = EXERCISES.find((e) => e.id === id);
  if (!ex) throw new Error(`Bilinmeyen hareket: ${id}`);
  return ex;
};

/** Sıradaki günün oturumunu kayıtlı durumlara göre kurar. Durumu olmayan harekette level = -1. */
export function createSession(day: DayKey, date: DateKey, settings: Settings, states: Record<string, ExerciseState>): Session {
  const exercises: SessionExercise[] = exercisesFor(day).map((ex) => {
    const ladder = buildLadder(ex, settings.equipment);
    const { repMin, repMax } = repRange(ex, settings.overrides[ex.id]);
    const sets = Array<number | null>(setsFor(ex, settings.daysPerWeek, settings.overrides[ex.id])).fill(null);
    const st = states[ex.id];
    if (!st) return { exerciseId: ex.id, level: -1, levelLabel: '', targetReps: repMin, sets };
    const level = clampLevel(st.level, ladder.length);
    const targetReps = Math.max(repMin, Math.min(st.targetReps, repMax));
    return { exerciseId: ex.id, level, levelLabel: ladder[level], targetReps, sets };
  });
  return { date, day, status: 'active', exercises };
}

const mapExercise = (s: Session, id: string, fn: (e: SessionExercise) => SessionExercise): Session => ({
  ...s,
  exercises: s.exercises.map((e) => (e.exerciseId === id ? fn(e) : e)),
});

/** Başlangıç seviyesi seçimi ya da elle seviye değişikliği: hedef alt sınıra döner. */
export function chooseLevel(s: Session, exerciseId: string, level: number, settings: Settings): Session {
  const ex = defOf(exerciseId);
  const ladder = buildLadder(ex, settings.equipment);
  const lv = clampLevel(level, ladder.length);
  const { repMin } = repRange(ex, settings.overrides[exerciseId]);
  return mapExercise(s, exerciseId, (e) => ({ ...e, level: lv, levelLabel: ladder[lv], targetReps: repMin }));
}

export function setRep(s: Session, exerciseId: string, setIndex: number, value: number | null): Session {
  return mapExercise(s, exerciseId, (e) => ({ ...e, sets: e.sets.map((v, i) => (i === setIndex ? value : v)) }));
}

export function hasAnySet(s: Session): boolean {
  return s.exercises.some((e) => e.sets.some((v) => v !== null));
}

/**
 * Oturumu ilerleme kuralından geçirir. "Önceki durum" oturum satırından alınır (seviye/hedef);
 * başarısızlık sayacı yalnızca kayıtlı seviye aynıysa taşınır.
 */
export function finishSession(
  session: Session,
  settings: Settings,
  states: Record<string, ExerciseState>,
): { states: Record<string, ExerciseState>; results: FinishResult[] } {
  const next = { ...states };
  const results: FinishResult[] = [];
  for (const e of session.exercises) {
    if (e.level < 0) {
      results.push({ exerciseId: e.exerciseId, event: 'skipped', message: 'Yapılmadı' });
      continue;
    }
    const ex = defOf(e.exerciseId);
    const ladder = buildLadder(ex, settings.equipment);
    const range = repRange(ex, settings.overrides[ex.id]);
    const stored = states[ex.id];
    const prev: ExerciseState = {
      level: e.level,
      targetReps: e.targetReps,
      failStreak: stored && stored.level === e.level ? stored.failStreak : 0,
    };
    const r = progress(prev, e.sets, range, ladder.length);
    next[ex.id] = r.state;
    const sets = setsFor(ex, settings.daysPerWeek, settings.overrides[ex.id]);
    const label = ladder[clampLevel(r.state.level, ladder.length)];
    const message = {
      'reps-up': `Sonraki sefer: ${sets}×${r.state.targetReps}`,
      'level-up': `Yeni seviye: ${label} 🎉`,
      'level-down': `Bir seviye geri: ${label}`,
      'max-level': 'En üst seviyedesin',
      none: 'Aynı hedefle devam',
      skipped: 'Yapılmadı',
    }[r.event];
    results.push({ exerciseId: ex.id, event: r.event, message });
  }
  return { states: next, results };
}
