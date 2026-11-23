import { clampLevel } from './program';
import type { ExerciseState, ProgressEvent } from './types';

type Range = { repMin: number; repMax: number };

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(n, hi));

export function initialState(level: number, repMin: number): ExerciseState {
  return { level, targetReps: repMin, failStreak: 0 };
}

/**
 * Çift aşamalı ilerleme (spec §6.3). Saf fonksiyon: önceki durum + oturumun setleri → yeni durum.
 * `null` set = yapılmadı.
 */
export function progress(
  state: ExerciseState,
  sets: (number | null)[],
  range: Range,
  ladderLength: number,
): { state: ExerciseState; event: ProgressEvent } {
  const done = sets.filter((s): s is number => s !== null);
  if (done.length === 0) return { state, event: 'skipped' };

  const { repMin, repMax } = range;
  const level = clampLevel(state.level, ladderLength);
  const target = clamp(state.targetReps, repMin, repMax);
  const top = ladderLength - 1;

  // Geri düşme: aynı seviyede üst üste 2 oturumda bir set alt sınırın altında.
  if (done.some((r) => r < repMin)) {
    const failStreak = state.failStreak + 1;
    if (failStreak < 2) return { state: { level, targetReps: target, failStreak }, event: 'none' };
    if (level === 0) return { state: { level, targetReps: target, failStreak: 0 }, event: 'none' };
    return {
      state: { level: level - 1, targetReps: Math.max(repMin, repMax - 2), failStreak: 0 },
      event: 'level-down',
    };
  }

  const hitAll = sets.every((s) => s !== null && s >= target);
  if (!hitAll) return { state: { level, targetReps: target, failStreak: 0 }, event: 'none' };

  if (target + 1 <= repMax) {
    return { state: { level, targetReps: target + 1, failStreak: 0 }, event: 'reps-up' };
  }
  if (level < top) {
    return { state: { level: level + 1, targetReps: repMin, failStreak: 0 }, event: 'level-up' };
  }
  return { state: { level, targetReps: repMax, failStreak: 0 }, event: 'max-level' };
}
