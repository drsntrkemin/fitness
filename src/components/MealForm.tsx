import { useEffect, useState } from 'react';
import { addMeal, allMeals, deleteMeal, updateMeal } from '../data/repo';
import { num, nowTime } from '../domain/format';
import { frequentMeals } from '../domain/nutrition';
import { parseDecimal } from '../domain/parse';
import type { DateKey, Macros, Meal } from '../domain/types';

interface Props {
  /** Verilirse düzenleme modu. */
  initial?: Meal;
  date: DateKey;
  onSaved: () => void;
  onCancel: () => void;
}

type Draft = { name: string; kcal: string; protein: string; carbs: string; fat: string };
const MACROS: { key: keyof Macros; label: string }[] = [
  { key: 'kcal', label: 'Kalori (kcal)' },
  { key: 'protein', label: 'Protein (g)' },
  { key: 'carbs', label: 'Karbonhidrat (g)' },
  { key: 'fat', label: 'Yağ (g)' },
];

const toDraft = (m?: Meal): Draft => m
  ? { name: m.name, kcal: num(m.kcal), protein: num(m.protein), carbs: num(m.carbs), fat: num(m.fat) }
  : { name: '', kcal: '', protein: '', carbs: '', fat: '' };

/** Boş makro alanı 0 sayılır; kalori zorunlu. Geçersizse null. */
function parseDraft(d: Draft): Macros | null {
  const kcal = parseDecimal(d.kcal);
  const opt = (s: string) => (s.trim() === '' ? 0 : parseDecimal(s));
  const protein = opt(d.protein);
  const carbs = opt(d.carbs);
  const fat = opt(d.fat);
  if (kcal === null || protein === null || carbs === null || fat === null) return null;
  return { kcal, protein, carbs, fat };
}

export default function MealForm({ initial, date, onSaved, onCancel }: Props) {
  const [d, setD] = useState<Draft>(() => toDraft(initial));
  const [frequent, setFrequent] = useState<(Macros & { name: string })[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (initial) return;
    let alive = true;
    allMeals().then((m) => { if (alive) setFrequent(frequentMeals(m)); });
    return () => { alive = false; };
  }, [initial]);

  const parsed = parseDraft(d);

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try { await fn(); onSaved(); } finally { setBusy(false); }
  };

  const save = () => parsed && run(() => initial?.id !== undefined
    ? updateMeal({ ...initial, name: d.name.trim(), ...parsed })
    : addMeal({ date, time: nowTime(), name: d.name.trim(), ...parsed }));

  const quickAdd = (f: Macros & { name: string }) => run(() => addMeal({ date, time: nowTime(), ...f }));

  const remove = () => {
    if (initial?.id === undefined || !window.confirm('Bu öğün silinsin mi?')) return;
    const id = initial.id;
    run(() => deleteMeal(id));
  };

  return (
    <section className="card meal-form" aria-label={initial ? 'Öğünü düzenle' : 'Öğün ekle'}>
      <h2>{initial ? 'Öğünü düzenle' : 'Öğün ekle'}</h2>
      {!initial && frequent.length > 0 && (
        <div className="quick">
          <p className="muted small">Sık yediklerin (dokun, eklensin)</p>
          <div className="picker-list">
            {frequent.map((f) => (
              <button key={`${f.name}|${f.kcal}|${f.protein}|${f.carbs}|${f.fat}`} type="button" className="chip" disabled={busy}
                onClick={() => quickAdd(f)}>{`${f.name} · ${num(f.kcal)} kcal`}</button>
            ))}
          </div>
        </div>
      )}
      <form onSubmit={(e) => { e.preventDefault(); save(); }}>
        <label className="field">
          <span>Ad (isteğe bağlı)</span>
          <input value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} placeholder="ör. Kahvaltı" autoComplete="off" />
        </label>
        <div className="grid-2">
          {MACROS.map((m) => {
            const v = d[m.key];
            const invalid = v.trim() !== '' && parseDecimal(v) === null;
            return (
              <label key={m.key} className="field">
                <span>{m.label}</span>
                <input inputMode="decimal" value={v} aria-invalid={invalid || undefined}
                  onChange={(e) => setD({ ...d, [m.key]: e.target.value })} />
              </label>
            );
          })}
        </div>
        <div className="actions">
          {initial && <button type="button" className="btn btn-danger" disabled={busy} onClick={remove}>Sil</button>}
          <button type="button" className="btn" onClick={onCancel}>Vazgeç</button>
          <button type="submit" className="btn btn-primary" disabled={busy || parsed === null}>Kaydet</button>
        </div>
      </form>
    </section>
  );
}
