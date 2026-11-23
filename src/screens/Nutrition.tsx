import { useCallback, useEffect, useState } from 'react';
import MealForm from '../components/MealForm';
import ProgressBar from '../components/ProgressBar';
import { listMeals } from '../data/repo';
import { addDays, formatDay, localDateKey } from '../domain/dates';
import { num } from '../domain/format';
import { dayTotals } from '../domain/nutrition';
import type { Meal, Settings } from '../domain/types';

export default function Nutrition({ settings }: { settings: Settings }) {
  const today = localDateKey(new Date());
  const [date, setDate] = useState(today);
  const [meals, setMeals] = useState<Meal[] | null>(null);
  const [form, setForm] = useState<null | { meal?: Meal }>(null);

  const load = useCallback(async () => setMeals(await listMeals(date, date)), [date]);
  useEffect(() => { load(); }, [load]);

  const dayLabel = date === today ? 'Bugün' : date === addDays(today, -1) ? 'Dün' : formatDay(date);
  const t = dayTotals(meals ?? []);
  const tg = settings.targets;

  return (
    <main className="screen">
      <header className="screen-header"><h1>Beslenme</h1></header>

      <div className="day-nav">
        <button type="button" className="icon-btn" aria-label="Önceki gün" onClick={() => { setForm(null); setDate(addDays(date, -1)); }}>◀</button>
        <span className="day-label">{dayLabel}</span>
        <button type="button" className="icon-btn" aria-label="Sonraki gün" disabled={date >= today}
          onClick={() => { setForm(null); setDate(addDays(date, 1)); }}>▶</button>
      </div>

      <section className="card">
        <ProgressBar label="Kalori" value={t.kcal} target={tg?.kcal ?? null} unit="kcal" />
        <ProgressBar label="Protein" value={t.protein} target={tg?.protein ?? null} unit="g" overIsGood />
        <div className="macro-row">
          <ProgressBar label="Karbonhidrat" value={t.carbs} target={tg?.carbs ?? null} unit="g" size="small" />
          <ProgressBar label="Yağ" value={t.fat} target={tg?.fat ?? null} unit="g" size="small" />
        </div>
      </section>

      {form ? (
        <MealForm key={form.meal?.id ?? 'new'} initial={form.meal} date={date}
          onSaved={() => { setForm(null); load(); }} onCancel={() => setForm(null)} />
      ) : (
        <button type="button" className="btn btn-primary btn-block add-meal" onClick={() => setForm({})}>+ Öğün ekle</button>
      )}

      <section className="card">
        <h3 className="group-title">Öğünler</h3>
        {meals && meals.length === 0 ? (
          <p className="muted">Bu gün için öğün yok.</p>
        ) : (
          <ul className="list" aria-label="Öğünler">
            {(meals ?? []).map((m) => (
              <li key={m.id}>
                <button type="button" className="meal-row" onClick={() => setForm({ meal: m })}>
                  <span className="meal-time">{m.time}</span>
                  <span className="grow meal-main">
                    <span className="meal-name">{m.name || 'Öğün'}</span>
                    <span className="muted small">P {num(m.protein)} · K {num(m.carbs)} · Y {num(m.fat)}</span>
                  </span>
                  <span className="meal-kcal">{num(m.kcal)}<small> kcal</small></span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
