// "Kaslı dost": tamamlanan antrenmanlarla seviye atlayan karakter (bkz. 2026-11-24-buddy-design.md).

export const WORKOUTS_PER_LEVEL = 3;
export const MAX_LEVEL = 10;

export type BuddyPhase = 'tombul' | 'fit' | 'kaslı';

/** Seviye = 1 + ⌊tamamlanan / 3⌋ (en fazla 10). Antrenman kaçırınca düşmez. */
export function buddyLevel(completed: number): { level: number; completed: number; toNext: number | null; progress: number } {
  const level = Math.min(MAX_LEVEL, 1 + Math.floor(completed / WORKOUTS_PER_LEVEL));
  if (level === MAX_LEVEL) return { level, completed, toNext: null, progress: 1 };
  const into = completed % WORKOUTS_PER_LEVEL;
  return { level, completed, toNext: WORKOUTS_PER_LEVEL - into, progress: into / WORKOUTS_PER_LEVEL };
}

export function buddyPhase(level: number): BuddyPhase {
  return level <= 3 ? 'tombul' : level <= 5 ? 'fit' : 'kaslı';
}

export interface BuddyShape {
  /** 0–1: göbek (1. seviye en büyük, 4+ yok). */
  belly: number;
  /** 0–1: kas (6. seviyede başlar, 10'da 1). */
  muscle: number;
  shoulder: number;
  waist: number;
  arm: number;
  biceps: number;
  leg: number;
  chestLines: boolean;
  abs: boolean;
  sparkles: boolean;
}

/** Çizim parametreleri (SVG birimleri). */
export function buddyShape(level: number): BuddyShape {
  const l = Math.max(1, Math.min(MAX_LEVEL, level));
  const belly = l <= 3 ? (4 - l) / 3 : 0;          // 1, 0.67, 0.33, 0…
  const muscle = l <= 5 ? 0 : (l - 5) / 5;         // 6 → 0.2 … 10 → 1
  return {
    belly,
    muscle,
    shoulder: 14 + 2 * belly + 10 * muscle,
    waist: 10 + 8 * belly + 1 * muscle,
    arm: 6.5 + 1.5 * belly + 4 * muscle,
    biceps: 3.5 + 1 * belly + 6 * muscle,
    leg: 7 + 3 * belly + 2 * muscle,
    chestLines: l >= 7,
    abs: l >= 8,
    sparkles: l >= MAX_LEVEL,
  };
}
