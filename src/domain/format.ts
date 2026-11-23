/** Türkçe sayı: ondalık virgül, binlik ayıracı yok, en fazla 1 ondalık ("1950", "32,5"). */
export function num(n: number): string {
  return n.toLocaleString('tr-TR', { maximumFractionDigits: 1, useGrouping: false });
}

/** Cihazın yerel saatiyle 'HH:MM'. */
export function nowTime(d: Date = new Date()): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
