import { EXERCISES } from './catalog';
import { clampLevel, ladderEntries } from './program';
import type { Equipment, ExerciseDef, ExerciseState, Session } from './types';

/**
 * Ekipman değişince bir seviyeyi yeni merdivende aynı şeye (aynı bant/kademe/aşama) taşır.
 * O seviye artık yoksa (bant silindi, kademe azaldı) eski merdivende bir kolay olan ve hâlâ var olan seviyeye iner.
 */
export function remapLevel(ex: ExerciseDef, oldEq: Equipment, newEq: Equipment, level: number): number {
  const oldKeys = ladderEntries(ex, oldEq).map((l) => l.key);
  const newKeys = ladderEntries(ex, newEq).map((l) => l.key);
  for (let i = clampLevel(level, oldKeys.length); i >= 0; i--) {
    const found = newKeys.indexOf(oldKeys[i]);
    if (found >= 0) return found;
  }
  return 0;
}

const defOf = (id: string) => EXERCISES.find((e) => e.id === id);

export function remapStates(states: Record<string, ExerciseState>, oldEq: Equipment, newEq: Equipment): Record<string, ExerciseState> {
  const out: Record<string, ExerciseState> = {};
  for (const [id, st] of Object.entries(states)) {
    const ex = defOf(id);
    if (!ex) { out[id] = st; continue; }
    const oldEntries = ladderEntries(ex, oldEq);
    const oldKey = oldEntries[clampLevel(st.level, oldEntries.length)].key;
    const level = remapLevel(ex, oldEq, newEq, st.level);
    const same = ladderEntries(ex, newEq)[level].key === oldKey;
    out[id] = { ...st, level, failStreak: same ? st.failStreak : 0 };
  }
  return out;
}

export function remapSession(s: Session, oldEq: Equipment, newEq: Equipment): Session {
  return {
    ...s,
    exercises: s.exercises.map((e) => {
      const ex = defOf(e.exerciseId);
      if (!ex || e.level < 0) return e;
      const level = remapLevel(ex, oldEq, newEq, e.level);
      return { ...e, level, levelLabel: ladderEntries(ex, newEq)[level].label };
    }),
  };
}
