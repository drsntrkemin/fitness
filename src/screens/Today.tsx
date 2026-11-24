import { useCallback, useEffect, useState } from 'react';
import MealForm from '../components/MealForm';
import MeasurementForm from '../components/MeasurementForm';
import NextWorkoutCard from '../components/NextWorkoutCard';
import ProgressBar from '../components/ProgressBar';
import * as repo from '../data/repo';
import { daysBetween, formatDay, localDateKey, weekStart } from '../domain/dates';
import { dayTotals } from '../domain/nutrition';
import { nextDay, planExercises } from '../domain/program';
import { planMuscles, plannedSessionMuscles } from '../domain/muscles';
import { buildClaudeSummary } from '../domain/summary';
import type { DayKey, Macros, Session, Settings } from '../domain/types';
import { copyText, isStandalone } from '../platform/ios';
import { useToday } from '../hooks/useToday';

interface Props {
  settings: Settings;
  onOpenSettings: () => void;
  onStartWorkout: () => void;
  onStartTravelWorkout: () => void;
  onContinueWorkout: () => void;
}

interface Data {
  /** Açık antrenman; yoksa null. */
  active: Session | null;
  next: DayKey;
  weekCount: number;
  totals: Macros;
  needsMeasurement: boolean;
  hasAnyRecord: boolean;
  summary: string;
}

const HINT_KEY = 'ev-fitness:install-hint-dismissed';
const readHintDismissed = () => { try { return localStorage.getItem(HINT_KEY) === '1'; } catch { return false; } };

export default function Today({ settings, onOpenSettings, onStartWorkout, onStartTravelWorkout, onContinueWorkout }: Props) {
  const today = useToday();
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
      active: active ?? null,
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
  const homePlan = { mode: 'home' as const, hasPullupBar: settings.hasPullupBar };
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

      {data.active ? (
        <NextWorkoutCard muscles={activeMuscles(data.active, settings.hasPullupBar)} title="Antrenman devam ediyor"
          subtitle={`Antrenman ${data.active.day}${data.active.mode === 'travel' ? ' · Seyahat' : ''}`}
          actionLabel="Devam et" onAction={onContinueWorkout}>
          <p className="small week-count">{`Bu hafta ${data.weekCount} / ${settings.daysPerWeek} antrenman`}</p>
        </NextWorkoutCard>
      ) : (
        <NextWorkoutCard muscles={planMuscles(data.next, homePlan)}
          title={`Sıradaki: Antrenman ${data.next} (${planExercises(data.next, homePlan).length} hareket)`}
          actionLabel="Başla" onAction={onStartWorkout}
          secondary={{ label: 'Seyahatte başla', onAction: onStartTravelWorkout }}>
          <p className="small week-count">{`Bu hafta ${data.weekCount} / ${settings.daysPerWeek} antrenman`}</p>
        </NextWorkoutCard>
      )}

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

      {data.needsMeasurement && <MeasurementCard onSaved={load} />}

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

function MeasurementCard({ onSaved }: { onSaved: () => void }) {
  return (
    <section className="card">
      <h2>Haftalık ölçüm</h2>
      <p className="muted small">Haftada bir, tercihen sabah aç karnına. Bel ölçüsü göbek hizasından.</p>
      <MeasurementForm submitLabel="Ölçümü kaydet" onSubmit={async (weight, waist) => {
        // Tarih kaydetme anında alınır (kart gece yarısından önce açılmış olabilir).
        await repo.putMeasurement({ date: localDateKey(new Date()), weight, waist });
        onSaved();
      }} />
    </section>
  );
}

/** Açık antrenmanın kasları; oturumdan çıkarılamazsa (hareketsiz eski kayıt) o günün planı. */
function activeMuscles(s: Session, hasPullupBar: boolean) {
  const m = plannedSessionMuscles(s);
  return m.primary.length ? m : planMuscles(s.day, { mode: s.mode ?? 'home', hasPullupBar });
}
