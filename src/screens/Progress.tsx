import { useEffect, useState } from 'react';
import LineChart from '../components/LineChart';
import * as repo from '../data/repo';
import { EXERCISES } from '../domain/catalog';
import { addDays, formatDay } from '../domain/dates';
import { num, signed } from '../domain/format';
import { averages } from '../domain/nutrition';
import type { Meal, Measurement, Session, Settings } from '../domain/types';
import { useToday } from '../hooks/useToday';

interface Data { meals: Meal[]; measurements: Measurement[]; sessions: Session[] }

export default function Progress({ settings }: { settings: Settings }) {
  const today = useToday();
  const [data, setData] = useState<Data | null>(null);
  const [period, setPeriod] = useState<7 | 30>(7);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.all([repo.allMeals(), repo.listMeasurements(), repo.listSessions()]).then(([meals, measurements, sessions]) => {
      if (alive) setData({ meals, measurements, sessions });
    });
    return () => { alive = false; };
  }, []);

  if (!data) return <main className="screen" aria-busy="true" />;

  const series = (key: 'weight' | 'waist') => data.measurements
    .filter((m) => m[key] !== null)
    .map((m) => ({ date: m.date, value: m[key] as number }));

  const { avg, loggedDays } = averages(data.meals, addDays(today, -(period - 1)), today);
  const tg = settings.targets;
  const row = (label: string, value: number, target: number | undefined, unit: string) => (
    <li className="list-row stat-row" key={label}>
      <span className="grow">{label}</span>
      <span className="stat-value">{target === undefined ? `${num(value)} ${unit}` : `${num(value)} / ${num(target)} ${unit}`}</span>
    </li>
  );

  return (
    <main className="screen">
      <header className="screen-header"><h1>İlerleme</h1></header>

      <MeasureCard title="Kilo" unit="kg" points={series('weight')} />
      <MeasureCard title="Bel" unit="cm" points={series('waist')} />

      <section className="card">
        <h2>Beslenme ortalaması</h2>
        <div className="segmented" role="radiogroup" aria-label="Dönem">
          {([7, 30] as const).map((p) => (
            <label key={p} className={period === p ? 'seg active' : 'seg'}>
              <input type="radio" name="period" checked={period === p} onChange={() => setPeriod(p)} aria-label={`${p} gün`} />
              {p} gün
            </label>
          ))}
        </div>
        {loggedDays === 0 ? (
          <p className="muted">Bu dönemde kayıt yok.</p>
        ) : (
          <>
            <ul className="list stats">
              {row('Kalori', avg.kcal, tg?.kcal, 'kcal')}
              {row('Protein', avg.protein, tg?.protein, 'g')}
              {row('Karbonhidrat', avg.carbs, tg?.carbs, 'g')}
              {row('Yağ', avg.fat, tg?.fat, 'g')}
            </ul>
            <p className="muted small">{`Son ${period} günde ${loggedDays} gün kayıt`}</p>
          </>
        )}
      </section>

      <section className="card">
        <h2>Hareket geçmişi</h2>
        <ul className="list">
          {EXERCISES.map((ex) => {
            const history = data.sessions
              .flatMap((s) => s.exercises
                .filter((e) => e.exerciseId === ex.id && e.sets.some((v) => v !== null))
                .map((e) => ({ date: s.date, id: s.id, label: e.levelLabel, sets: e.sets })))
              .slice(0, 20);
            const isOpen = open === ex.id;
            return (
              <li key={ex.id} className="history-item">
                <button type="button" className="history-toggle" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : ex.id)}>
                  <span className="grow">{ex.name}</span>
                  <span aria-hidden="true">{isOpen ? '▾' : '▸'}</span>
                </button>
                {isOpen && (history.length === 0 ? (
                  <p className="muted small">Bu hareket henüz kaydedilmedi.</p>
                ) : (
                  <ul className="history-list" aria-label={`${ex.name} geçmişi`}>
                    {history.map((h) => (
                      <li key={`${h.id}-${h.date}`} className="history-row">
                        <span className="muted small">{formatDay(h.date)}</span>
                        <span className="grow">{h.label}</span>
                        <span className="history-sets">{h.sets.map((v) => (v === null ? '–' : String(v))).join(', ')}</span>
                      </li>
                    ))}
                  </ul>
                ))}
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}

function MeasureCard({ title, unit, points }: { title: string; unit: string; points: { date: string; value: number }[] }) {
  const first = points[0];
  const last = points[points.length - 1];
  return (
    <section className="card">
      <h2>{title}</h2>
      {points.length === 0 ? (
        <p className="muted">Henüz ölçüm yok.</p>
      ) : (
        <>
          {points.length >= 2 && (
            <p className="measure-summary">
              <span>{`${num(first.value)} → ${num(last.value)} ${unit}`}</span>
              <span className={`diff ${last.value < first.value ? 'down' : last.value > first.value ? 'up' : ''}`}>{`${signed(last.value - first.value)} ${unit}`}</span>
            </p>
          )}
          {points.length === 1 && <p className="measure-summary"><span>{`${num(first.value)} ${unit}`}</span></p>}
          <LineChart title={title} points={points} unit={unit} />
        </>
      )}
    </section>
  );
}
