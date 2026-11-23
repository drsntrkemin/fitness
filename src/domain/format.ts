/** Türkçe sayı: ondalık virgül, binlik ayıracı yok, en fazla 1 ondalık ("1950", "32,5"). */
export function num(n: number): string {
  return n.toLocaleString('tr-TR', { maximumFractionDigits: 1, useGrouping: false });
}

/** Cihazın yerel saatiyle 'HH:MM'. */
export function nowTime(d: Date = new Date()): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Farkı işaretiyle yazar: "−1,2", "+2", "±0" (0,1'den küçük fark sıfır sayılır). */
export function signed(n: number): string {
  const r = Math.round(n * 10) / 10;
  if (r === 0) return '±0';
  return r < 0 ? `−${num(-r)}` : `+${num(r)}`;
}
