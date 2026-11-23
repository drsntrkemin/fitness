import { useCallback, useEffect, useState } from 'react';
import MealForm from '../components/MealForm';
import ProgressBar from '../components/ProgressBar';
import * as repo from '../data/repo';
import { daysBetween, formatDay, localDateKey, weekStart } from '../domain/dates';
import { dayTotals } from '../domain/nutrition';
import { parseDecimal } from '../domain/parse';
import { exercisesFor, nextDay } from '../domain/program';
import { buildClaudeSummary } from '../domain/summary';
import type { DayKey, Macros, Settings } from '../domain/types';
import { copyText, isStandalone } from '../platform/ios';

interface Props {
  settings: Settings;
  onOpenSettings: () => void;
  onStartWorkout: () => void;
  onContinueWorkout: () => void;
}

interface Data {
  hasActive: boolean;
  next: DayKey;
  weekCount: number;
  totals: Macros;
  needsMeasurement: boolean;
  hasAnyRecord: boolean;
  summary: string;
}

const HINT_KEY = 'ev-fitness:install-hint-dismissed';
const readHintDismissed = () => { try { return localStorage.getItem(HINT_KEY) === '1'; } catch { return false; } };

export default function Today({ settings, onOpenSettings, onStartWorkout, onContinueWorkout }: Props) {
  const today = localDateKey(new Date());
  const [data, setData] = useState<Data | null>(null);
  const [adding, setAdding] = useState(false);
  const [copied, setCopied] = useState<null | 'ok' | 'failed'>(null);
  const [hintHidden, setHintHidden] = useState(() => isStandalone() || readHintDismissed());

  const load = useCallback(async () => {
    const [active, last, sessions, meals, measurements, states] = await Promise.all([
      repo.getActiveSession(), repo.lastFinishedDay(), repo.listSessions(), repo.allMeals(),
      repo.listMeasurements(), repo.getExerciseStates(),
    ]);
    const lastM = measurements.at(-1);
    setData({
      hasActive: !!active,
      next: nextDay(last),
      weekCount: sessions.filter((s) => s.date >= weekStart(today)).length,
      totals: dayTotals(meals.filter((m) => m.date === today)),
      needsMeasurement: !lastM || daysBetween(lastM.date, today) >= 7,
      hasAnyRecord: sessions.length > 0 || meals.length > 0 || measurements.length > 0,
      // Önceden hazırlanır: iOS panoya yazmaya yalnızca dokunuşun hemen ardından izin verir.
      summary: buildClaudeSummary({ today, settings, states, sessions, meals, measurements }),
    });
  }, [today, settings]);

  useEffect(() => { load(); }, [load]);

  if (!data) return <main className="screen" aria-busy="true" />;

  const tg = settings.targets;
  const backupDue = settings.lastBackup === null ? data.hasAnyRecord : daysBetween(settings.lastBackup, today) >= 30;

  const ask = async () => {
    const ok = await copyText(data.summary);
    setCopied(ok ? 'ok' : 'failed');
  };

  const hideHint = () => {
    setHintHidden(true);
    try { localStorage.setItem(HINT_KEY, '1'); } catch { /* özel modda yazılamayabilir */ }
  };

  return (
    <main className="screen">
      {!hintHidden && (
        <div className="install-hint" role="note">
          <span>Uygulama gibi kullanmak için Safari'de <strong>Paylaş ⬆︎ → Ana Ekrana Ekle</strong>. Veriler ana ekran uygulamasında ayrı saklanır.</span>
          <button type="button" className="icon-btn" aria-label="İpucunu kapat" onClick={hideHint}>✕</button>
        </div>
      )}

      <header className="screen-header">
        <h1 className="date-title">{formatDay(today, { long: true })}</h1>
        <button type="button" className="icon-btn" aria-label="Ayarlar" onClick={onOpenSettings}>⚙</button>
      </header>

      <section className="card workout-card">
        {data.hasActive ? (
          <>
            <h2>Antrenman devam ediyor</h2>
            <button type="button" className="btn btn-primary btn-block" onClick={onContinueWorkout}>Devam et</button>
          </>
        ) : (
          <>
            <h2>{`Sıradaki: Antrenman ${data.next} (${exercisesFor(data.next).length} hareket)`}</h2>
            <button type="button" className="btn btn-primary btn-block" onClick={onStartWorkout}>Başla</button>
          </>
        )}
        <p className="muted small week-count">{`Bu hafta ${data.weekCount} / ${settings.daysPerWeek} antrenman`}</p>
      </section>

      <section className="card">
        <ProgressBar label="Kalori" value={data.totals.kcal} target={tg?.kcal ?? null} unit="kcal" />
        <ProgressBar label="Protein" value={data.totals.protein} target={tg?.protein ?? null} unit="g" overIsGood />
        <div className="macro-row">
          <ProgressBar label="Karbonhidrat" value={data.totals.carbs} target={tg?.carbs ?? null} unit="g" size="small" />
          <ProgressBar label="Yağ" value={data.totals.fat} target={tg?.fat ?? null} unit="g" size="small" />
        </div>
        {!tg && <p className="muted small">Hedef girmek için ⚙ Ayarlar.</p>}
      </section>

      {adding ? (
        <MealForm date={today} onSaved={() => { setAdding(false); load(); }} onCancel={() => setAdding(false)} />
      ) : (
        <button type="button" className="btn btn-primary btn-block add-meal" onClick={() => setAdding(true)}>+ Öğün ekle</button>
      )}

      {data.needsMeasurement && <MeasurementCard today={today} onSaved={load} />}

      {backupDue && (
        <button type="button" className="backup-nudge" onClick={onOpenSettings}>
          💾 Yedek alma zamanı → Ayarlar
        </button>
      )}

      <section className="card ask-card">
        <button type="button" className="btn btn-block" onClick={ask}>Claude'a sor</button>
        <p className="muted small">Son 2 haftanın özeti panoya kopyalanır; claude.ai'ye yapıştırıp tavsiye iste.</p>
        {copied === 'ok' && (
          <p className="notice ok">
            Kopyalandı ✓ —{' '}
            <a href="https://claude.ai/new" target="_blank" rel="noopener noreferrer">claude.ai'yi aç</a>
          </p>
        )}
        {copied === 'failed' && (
          <div className="notice error">
            <p>Kopyalanamadı. Metni elle seçip kopyala:</p>
            <textarea className="summary-box" readOnly value={data.summary} rows={8} />
          </div>
        )}
      </section>
    </main>
  );
}

function MeasurementCard({ today, onSaved }: { today: string; onSaved: () => void }) {
  const [weight, setWeight] = useState('');
  const [waist, setWaist] = useState('');
  const w = weight.trim() === '' ? null : parseDecimal(weight);
  const b = waist.trim() === '' ? null : parseDecimal(waist);
  const wBad = weight.trim() !== '' && w === null;
  const bBad = waist.trim() !== '' && b === null;
  const canSave = !wBad && !bBad && (w !== null || b !== null);

  return (
    <section className="card">
      <h2>Haftalık ölçüm</h2>
      <p className="muted small">Haftada bir, tercihen sabah aç karnına. Bel ölçüsü göbek hizasından.</p>
      <div className="grid-2">
        <label className="field">
          <span>Kilo (kg)</span>
          <input inputMode="decimal" value={weight} aria-invalid={wBad || undefined} onChange={(e) => setWeight(e.target.value)} />
        </label>
        <label className="field">
          <span>Bel (cm)</span>
          <input inputMode="decimal" value={waist} aria-invalid={bBad || undefined} onChange={(e) => setWaist(e.target.value)} />
        </label>
      </div>
      <div className="actions">
        <button type="button" className="btn btn-primary" disabled={!canSave}
          onClick={async () => { await repo.putMeasurement({ date: today, weight: w, waist: b }); onSaved(); }}>
          Ölçümü kaydet
        </button>
      </div>
    </section>
  );
}
