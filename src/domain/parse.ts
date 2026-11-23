/**
 * Kullanıcı girdisini sayıya çevirir. Türkçe klavyenin ondalık virgülünü kabul eder.
 * Boş, geçersiz ya da negatif girişte null döner.
 */
export function parseDecimal(s: string): number | null {
  const t = s.trim().replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(t)) return null;
  return Number(t);
}
