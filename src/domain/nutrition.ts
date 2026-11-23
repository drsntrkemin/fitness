import type { DateKey, Macros, Meal } from './types';

const ZERO: Macros = { kcal: 0, protein: 0, carbs: 0, fat: 0 };
const KEYS = ['kcal', 'protein', 'carbs', 'fat'] as const;

/** Kayan nokta artıklarını (42.70000001) temizler. */
const round1 = (n: number) => Math.round(n * 10) / 10;

export function dayTotals(meals: Meal[]): Macros {
  const t = { ...ZERO };
  for (const m of meals) for (const k of KEYS) t[k] += m[k];
  for (const k of KEYS) t[k] = round1(t[k]);
  return t;
}

/** Daha önce girilmiş öğünler; tek dokunuşla tekrar eklemek için. */
export function frequentMeals(meals: Meal[], limit = 8): (Macros & { name: string })[] {
  const groups = new Map<string, { count: number; last: string; entry: Macros & { name: string } }>();
  for (const m of meals) {
    const name = m.name.trim();
    if (!name) continue;
    const key = [name.toLocaleLowerCase('tr'), m.kcal, m.protein, m.carbs, m.fat].join('|');
    const stamp = `${m.date} ${m.time}`;
    const entry = { name, kcal: m.kcal, protein: m.protein, carbs: m.carbs, fat: m.fat };
    const g = groups.get(key);
    if (!g) groups.set(key, { count: 1, last: stamp, entry });
    else {
      g.count += 1;
      if (stamp >= g.last) { g.last = stamp; g.entry = entry; }
    }
  }
  return [...groups.values()]
    .sort((a, b) => b.count - a.count || (a.last < b.last ? 1 : a.last > b.last ? -1 : 0))
    .slice(0, limit)
    .map((g) => g.entry);
}

/** from..to (dahil) aralığında, en az bir öğün girilmiş günlerin günlük ortalaması (tam sayı). */
export function averages(meals: Meal[], from: DateKey, to: DateKey): { avg: Macros; loggedDays: number } {
  const days = new Map<DateKey, Meal[]>();
  for (const m of meals) {
    if (m.date < from || m.date > to) continue;
    days.set(m.date, [...(days.get(m.date) ?? []), m]);
  }
  if (days.size === 0) return { avg: { ...ZERO }, loggedDays: 0 };
  const sum = { ...ZERO };
  for (const dayMeals of days.values()) {
    const t = dayTotals(dayMeals);
    for (const k of KEYS) sum[k] += t[k];
  }
  const avg = { ...ZERO };
  for (const k of KEYS) avg[k] = Math.round(sum[k] / days.size);
  return { avg, loggedDays: days.size };
}
