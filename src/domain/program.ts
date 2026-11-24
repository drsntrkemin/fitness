import { EXERCISES } from './catalog';
import type { DayKey, Equipment, ExerciseDef, ExerciseOverride, WorkoutMode } from './types';

const range = (from: number, to: number) => {
  const out: number[] = [];
  const step = from <= to ? 1 : -1;
  for (let i = from; step > 0 ? i <= to : i >= to; i += step) out.push(i);
  return out;
};

/**
 * Merdivenin seviyeleri: etiket + ekipmandan bağımsız kimlik (aşama + bant id / kademe).
 * Kimlik, ekipman değişince seviyeyi yeni merdivende bulmak için kullanılır.
 */
export function ladderEntries(ex: ExerciseDef, eq: Equipment): { key: string; label: string }[] {
  const levels: { key: string; label: string }[] = [];
  ex.stages.forEach((stage, si) => {
    if (stage.kind === 'fixed') {
      levels.push({ key: `${si}:fixed`, label: stage.label });
    } else if (stage.kind === 'bands') {
      const bands = stage.reversed ? [...eq.bands].reverse() : eq.bands;
      for (const b of bands) levels.push({ key: `${si}:band:${b.id}`, label: stage.label.replace('{band}', b.name) });
    } else {
      const top = Math.min(eq.ladderRungs, stage.max ?? eq.ladderRungs);
      if (top < 1) return;
      const rungs = stage.order === 'desc' ? range(top, 1) : range(1, top);
      for (const r of rungs) levels.push({ key: `${si}:rung:${r}`, label: stage.label.replace('{rung}', String(r)) });
    }
  });
  return levels.length > 0 ? levels : [{ key: 'bodyweight', label: 'Vücut ağırlığı' }];
}

/** Hareketin aşamalarını kullanıcının ekipmanına göre seviye etiketlerine açar (kolaydan zora). */
export function buildLadder(ex: ExerciseDef, eq: Equipment): string[] {
  return ladderEntries(ex, eq).map((l) => l.label);
}

export function clampLevel(level: number, ladderLength: number): number {
  return Math.max(0, Math.min(level, ladderLength - 1));
}

export function setsFor(ex: ExerciseDef, daysPerWeek: 2 | 3, override?: ExerciseOverride): number {
  if (override?.sets) return override.sets;
  return daysPerWeek === 2 && !ex.core && !ex.accessory ? 4 : 3;
}

export function repRange(ex: ExerciseDef, override?: ExerciseOverride): { repMin: number; repMax: number } {
  return { repMin: override?.repMin ?? ex.repMin, repMax: override?.repMax ?? ex.repMax };
}

/** Günün ana hareketleri (yedekler hariç). */
export function exercisesFor(day: DayKey): ExerciseDef[] {
  return EXERCISES.filter((e) => e.day === day && !e.substitute);
}

/** Seyahatte (yalnız bantlar, yukarı bağlantı yok) ana hareket → yedek. */
export const TRAVEL_SUBSTITUTES: Record<string, string> = {
  pullup: 'band-bent-row',
  'inverted-row': 'band-seated-row',
  pushup: 'travel-pushup',
  'hanging-raise': 'floor-leg-raise',
  'band-pallof': 'dead-bug',
  'band-fly': 'band-fly-back',
  'band-pushdown': 'band-overhead-triceps',
};

/** O gün gerçekten yapılacak hareketler: moda ve barfiks barına göre yedekler yerleşir. */
export function planExercises(day: DayKey, opts: { mode: WorkoutMode; hasPullupBar: boolean }): ExerciseDef[] {
  return exercisesFor(day).map((ex) => {
    const subId = opts.mode === 'travel' ? TRAVEL_SUBSTITUTES[ex.id]
      : ex.id === 'pullup' && !opts.hasPullupBar ? 'band-bent-row' : undefined;
    return (subId && EXERCISES.find((e) => e.id === subId)) || ex;
  });
}

export function nextDay(lastFinished: DayKey | null): DayKey {
  return lastFinished === 'A' ? 'B' : 'A';
}
