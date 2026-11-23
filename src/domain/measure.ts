import { parseDecimal } from './parse';

export const WEIGHT_RANGE = [25, 300] as const;
export const WAIST_RANGE = [40, 200] as const;

export type MeasurementCheck =
  | { ok: true; weight: number | null; waist: number | null }
  /** error null: henüz bir şey girilmedi (uyarı gösterme, sadece kaydetme). */
  | { ok: false; error: string | null };

/** Kilo/bel girişini doğrular; virgüllü sayı kabul eder, akla yatkın olmayan değerleri reddeder. */
export function validateMeasurement(weightStr: string, waistStr: string): MeasurementCheck {
  const empty = (s: string) => s.trim() === '';
  const weight = empty(weightStr) ? null : parseDecimal(weightStr);
  const waist = empty(waistStr) ? null : parseDecimal(waistStr);
  if ((!empty(weightStr) && weight === null) || (!empty(waistStr) && waist === null)) return { ok: false, error: 'Geçerli bir sayı gir.' };
  if (weight === null && waist === null) return { ok: false, error: null };
  if (weight !== null && (weight < WEIGHT_RANGE[0] || weight > WEIGHT_RANGE[1])) return { ok: false, error: `Kilo ${WEIGHT_RANGE[0]}–${WEIGHT_RANGE[1]} kg arasında olmalı.` };
  if (waist !== null && (waist < WAIST_RANGE[0] || waist > WAIST_RANGE[1])) return { ok: false, error: `Bel ${WAIST_RANGE[0]}–${WAIST_RANGE[1]} cm arasında olmalı.` };
  return { ok: true, weight, waist };
}
