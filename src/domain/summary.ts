import { EXERCISES } from './catalog';
import { addDays } from './dates';
import { num } from './format';
import { averages } from './nutrition';
import { buildLadder, clampLevel, repRange, setsFor } from './program';
import type { DateKey, ExerciseState, Meal, Measurement, Session, Settings } from './types';

export interface SummaryInput {
  today: DateKey;
  settings: Settings;
  states: Record<string, ExerciseState>;
  sessions: Session[];
  meals: Meal[];
  measurements: Measurement[];
}

const NONE = 'Kayıt yok.';
const nameOf = (id: string) => EXERCISES.find((e) => e.id === id)?.name ?? id;

/** "Claude'a sor" için panoya kopyalanan düz metin özet (spec §6.5). */
export function buildClaudeSummary(input: SummaryInput): string {
  const { today, settings, states, sessions, meals, measurements } = input;
  const { equipment, daysPerWeek, targets, overrides } = settings;
  const from14 = addDays(today, -13);
  const lines: string[] = [];

  lines.push('Ev fitness uygulamamdaki son verilerim aşağıda.');
  lines.push('Hedefim: kas kazanmak, genel güç, yağ oranını azaltmak (rekompozisyon).');
  const bands = equipment.bands.length
    ? `direnç bantları (hafiften ağıra: ${equipment.bands.map((b) => b.name).join(', ')})`
    : 'direnç bandı tanımlanmadı';
  lines.push(`Ekipman: ${bands}, ${equipment.ladderRungs} kademeli İsveç merdiveni, barfiks barı.`);
  lines.push(`Haftada ${daysPerWeek} gün tüm vücut A/B programı.`);

  lines.push('', '## Son 14 günün antrenmanları');
  const recent = sessions
    .filter((s) => s.status === 'done' && s.date >= from14 && s.date <= today)
    .sort((a, b) => (a.date === b.date ? (a.id ?? 0) - (b.id ?? 0) : a.date < b.date ? -1 : 1));
  if (recent.length === 0) lines.push(NONE);
  for (const s of recent) {
    const parts = s.exercises
      .filter((e) => e.sets.some((r) => r !== null))
      .map((e) => `${nameOf(e.exerciseId)} – ${e.levelLabel}: ${e.sets.map((r) => (r === null ? '–' : String(r))).join(', ')}`);
    lines.push(`${s.date} (${s.day}): ${parts.length ? parts.join('; ') : 'hareket kaydedilmedi'}`);
  }

  lines.push('', '## Hareketlerin şu anki seviyesi');
  for (const ex of EXERCISES) {
    const st = states[ex.id];
    if (!st) {
      lines.push(`${ex.name}: başlangıç seviyesi seçilmedi`);
      continue;
    }
    const ladder = buildLadder(ex, equipment);
    const { repMin, repMax } = repRange(ex, overrides[ex.id]);
    const sets = setsFor(ex, daysPerWeek, overrides[ex.id]);
    const side = ex.perSide ? ' (her taraf)' : '';
    lines.push(`${ex.name}: ${ladder[clampLevel(st.level, ladder.length)]}, hedef ${sets} × ${st.targetReps}${side} (aralık ${repMin}–${repMax})`);
  }

  const { avg, loggedDays } = averages(meals, from14, today);
  if (loggedDays === 0) {
    lines.push('', '## Beslenme (son 14 gün)', NONE);
  } else {
    lines.push('', `## Beslenme (son 14 gün, kayıt girilen ${loggedDays} gün ortalaması)`);
    const row = (label: string, value: number, target: number | undefined, unit: string) =>
      target === undefined ? `${label} ${num(value)} ${unit} (hedef girilmedi)` : `${label} ${num(value)} / hedef ${num(target)} ${unit}`;
    lines.push(row('Kalori', avg.kcal, targets?.kcal, 'kcal'));
    lines.push(row('Protein', avg.protein, targets?.protein, 'g'));
    lines.push(row('Karbonhidrat', avg.carbs, targets?.carbs, 'g'));
    lines.push(row('Yağ', avg.fat, targets?.fat, 'g'));
  }

  lines.push('', '## Kilo ve bel (son 4 hafta)');
  const from28 = addDays(today, -27);
  const ms = measurements.filter((m) => m.date >= from28 && m.date <= today).sort((a, b) => (a.date < b.date ? -1 : 1));
  if (ms.length === 0) lines.push(NONE);
  for (const m of ms) {
    const parts = [m.weight !== null ? `${num(m.weight)} kg` : null, m.waist !== null ? `bel ${num(m.waist)} cm` : null]
      .filter(Boolean);
    lines.push(`${m.date}: ${parts.join(', ')}`);
  }

  lines.push('', 'Bu verilere bakarak programımı ve beslenmemi nasıl ayarlamalıyım?');
  return lines.join('\n');
}
