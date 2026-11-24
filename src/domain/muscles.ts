import { EXERCISES } from './catalog';
import type { Muscle, MuscleSet, ProgressEvent, Session } from './types';

export const MUSCLE_NAMES: Record<Muscle, string> = {
  shoulders: 'Omuz', chest: 'Göğüs', biceps: 'Biceps', forearms: 'Ön kol', abs: 'Karın', obliques: 'Yan karın',
  quads: 'Ön bacak', traps: 'Trapez', rearDelts: 'Arka omuz', upperBack: 'Üst sırt', lats: 'Kanat',
  lowerBack: 'Bel', triceps: 'Triceps', glutes: 'Kalça', hamstrings: 'Arka bacak', calves: 'Baldır',
};

/** Ön görünümde çizilen kaslar (baldır yalnız arkada). */
export const FRONT_MUSCLES: Muscle[] = ['shoulders', 'chest', 'biceps', 'forearms', 'abs', 'obliques', 'quads'];
/** Arka görünümde çizilen kaslar. */
// Sıra çizim sırasıdır: bel, kanadın altında kalsın diye kanattan önce çizilir.
export const BACK_MUSCLES: Muscle[] = [
  'traps', 'rearDelts', 'upperBack', 'lowerBack', 'lats', 'triceps', 'forearms', 'glutes', 'hamstrings', 'calves',
];

/** Kas kümelerini birleştirir: ana = ana kasların birleşimi, yardımcı = yardımcılar − ana. İlk geçiş sırası korunur. */
export function mergeMuscles(sets: MuscleSet[]): MuscleSet {
  const primary: Muscle[] = [];
  const secondary: Muscle[] = [];
  for (const s of sets) for (const m of s.primary) if (!primary.includes(m)) primary.push(m);
  for (const s of sets) for (const m of s.secondary) if (!primary.includes(m) && !secondary.includes(m)) secondary.push(m);
  return { primary, secondary };
}

/** Oturumda en az bir seti girilen (ve katalogda bulunan) hareketlerin kasları. */
export function sessionMuscles(s: Session): MuscleSet {
  return mergeMuscles(s.exercises
    .filter((e) => e.sets.some((v) => v !== null))
    .flatMap((e) => {
      const def = EXERCISES.find((x) => x.id === e.exerciseId);
      return def ? [def.muscles] : [];
    }));
}

/** Bitiş özeti: girilen set sayısı, tekrarı artan ya da seviye atlayan ve seviye geri düşen hareket sayısı. */
export function finishStats(s: Session, results: { event: ProgressEvent }[]): { sets: number; progressed: number; regressed: number } {
  const sets = s.exercises.reduce((n, e) => n + e.sets.filter((v) => v !== null).length, 0);
  const progressed = results.filter((r) => r.event === 'reps-up' || r.event === 'level-up').length;
  const regressed = results.filter((r) => r.event === 'level-down').length;
  return { sets, progressed, regressed };
}
