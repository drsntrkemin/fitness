import type { DateKey } from './types';

const pad = (n: number) => String(n).padStart(2, '0');

/** Cihazın yerel saatine göre gün anahtarı. toISOString (UTC) kullanılmaz. */
export function localDateKey(d: Date): DateKey {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Anahtarı yerel öğlen 12:00 olarak yorumlar; DST geçişlerinde gün kaymaz. */
function toNoon(key: DateKey): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

export function addDays(key: DateKey, n: number): DateKey {
  const d = toNoon(key);
  d.setDate(d.getDate() + n);
  return localDateKey(d);
}

/** b − a, gün olarak. */
export function daysBetween(a: DateKey, b: DateKey): number {
  return Math.round((toNoon(b).getTime() - toNoon(a).getTime()) / 86_400_000);
}

/** Gün anahtarını Türkçe yazar: kısa "20 Kas Cum", uzun "23 Kasım Pazartesi". */
export function formatDay(key: DateKey, opts: { long?: boolean } = {}): string {
  return toNoon(key).toLocaleDateString('tr-TR', opts.long
    ? { day: 'numeric', month: 'long', weekday: 'long' }
    : { day: 'numeric', month: 'short', weekday: 'short' });
}
