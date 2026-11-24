import { useCallback, useEffect, useRef, useState } from 'react';
import BodyMap from '../components/BodyMap';
import MuscleChips from '../components/MuscleChips';
import NextWorkoutCard from '../components/NextWorkoutCard';
import { SetBox, SetStepper } from '../components/SetInput';
import * as repo from '../data/repo';
import { EXERCISES } from '../domain/catalog';
import { formatDay, localDateKey } from '../domain/dates';
import { finishStats, planMuscles, plannedSessionMuscles, sessionMuscles } from '../domain/muscles';
import { buildLadder, clampLevel, nextDay, planExercises, repRange, setsFor } from '../domain/program';
import { chooseLevel, createSession, finishSession, hasAnySet, setRep, type FinishResult } from '../domain/session';
import type { DayKey, ExerciseState, Session, SessionExercise, Settings, WorkoutMode } from '../domain/types';

interface Props {
  settings: Settings;
  /** Bugün ekranındaki "Başla"dan gelindiyse oturumu hemen başlat (true = evde). */
  autoStart?: boolean | WorkoutMode;
  /** Oturum başladı/bitti/silindi; üst bileşen gerekirse yenilenir. */
  onSessionChange?: () => void;
}

type Idle = { states: Record<string, ExerciseState>; next: DayKey; recent: Session[] };
type View =
  | { kind: 'loading' }
  | { kind: 'idle'; data: Idle }
  | { kind: 'active' }
  | { kind: 'summary'; results: FinishResult[]; session: Session };

const nameOf = (id: string) => EXERCISES.find((e) => e.id === id)?.name ?? id;

export default function Workout({ settings, autoStart, onSessionChange }: Props) {
  const [view, setView] = useState<View>({ kind: 'loading' });
  const [session, setSession] = useState<Session | null>(null);
  const sessionRef = useRef<Session | null>(null);
  const started = useRef(false);
  // Başla/Bitir/Vazgeç sürerken ikinci dokunuşu yok say (çift dokunuş = çift oturum ya da çift ilerleme).
  const busyRef = useRef(false);
  const [busy, setBusy] = useState(false);
  const guard = async (fn: () => Promise<void>) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try { await fn(); } finally { busyRef.current = false; setBusy(false); }
  };

  const loadIdle = useCallback(async (): Promise<Idle> => {
    const [states, last, done] = await Promise.all([repo.getExerciseStates(), repo.lastFinishedDay(), repo.listSessions()]);
    return { states, next: nextDay(last), recent: done.slice(0, 5) };
  }, []);

  const showSession = (s: Session) => {
    sessionRef.current = s;
    setSession(s);
    setView({ kind: 'active' });
  };

  const start = useCallback((mode: WorkoutMode = 'home') => guard(async () => {
    const data = await loadIdle();
    const s = await repo.startSession(() => createSession(data.next, localDateKey(new Date()), settings, data.states, mode));
    showSession(s);
    onSessionChange?.();
  }), [loadIdle, settings, onSessionChange]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const activeSession = await repo.getActiveSession();
      if (cancelled) return;
      if (activeSession) return showSession(activeSession);
      if (autoStart && !started.current) {
        started.current = true;
        return start(autoStart === 'travel' ? 'travel' : 'home');
      }
      setView({ kind: 'idle', data: await loadIdle() });
    })();
    return () => { cancelled = true; };
    // Yalnızca açılışta çalışır.
  }, []);

  /** Oturumu değiştirir ve anında kaydeder (uygulama kapansa da kaybolmaz). */
  const apply = (fn: (s: Session) => Session) => {
    const cur = sessionRef.current;
    if (!cur) return;
    const next = fn(cur);
    sessionRef.current = next;
    setSession(next);
    void repo.saveSession(next);
  };

  const finish = () => guard(async () => {
    const s = sessionRef.current;
    if (!s?.id) return;
    const hasGaps = s.exercises.some((e) => e.level >= 0 && e.sets.some((v) => v === null));
    if (hasGaps && !window.confirm('Bazı setler boş. Boş setler yapılmadı sayılacak. Antrenman bitirilsin mi?')) return;
    await repo.saveSession(s); // son dokunuş da kayıtlı olsun
    // İlerleme ve "bitti" bilgisi tek işlemde yazılır; oturum zaten bittiyse null döner.
    const done = await repo.completeSession(s.id, (fresh, states) => {
      const r = finishSession(fresh, settings, states);
      return { states: r.states, result: { results: r.results, session: fresh } };
    });
    sessionRef.current = null;
    setSession(null);
    setView(done ? { kind: 'summary', ...done } : { kind: 'idle', data: await loadIdle() });
    onSessionChange?.();
  });

  const cancel = () => guard(async () => {
    const s = sessionRef.current;
    if (!s?.id) return;
    if (!window.confirm('Bu antrenman silinsin mi? Girdiğin setler kaybolur.')) return;
    await repo.deleteSession(s.id);
    sessionRef.current = null;
    setSession(null);
    setView({ kind: 'idle', data: await loadIdle() });
    onSessionChange?.();
  });

  if (view.kind === 'loading') return <main className="screen" aria-busy="true" />;

  if (view.kind === 'summary') {
    return (
      <main className="screen">
        <header className="screen-header"><h1>Antrenman bitti 💪</h1></header>
        <SummaryHero session={view.session} results={view.results} />
        <section className="card">
          <ul className="list">
            {view.results.map((r) => (
              <li key={r.exerciseId} className="list-row result-row">
                <span className="grow">{nameOf(r.exerciseId)}</span>
                <span className={`result ${r.event}`}>{r.message}</span>
              </li>
            ))}
          </ul>
        </section>
        <div className="actions">
          <button type="button" className="btn btn-primary btn-block" onClick={async () => setView({ kind: 'idle', data: await loadIdle() })}>Tamam</button>
        </div>
      </main>
    );
  }

  if (view.kind === 'active' && session) {
    return (
      <main className="screen">
        <header className="screen-header">
          <h1>{`Antrenman ${session.day}${session.mode === 'travel' ? ' · Seyahat' : ''}`}</h1>
          <button type="button" className="btn btn-primary" disabled={busy || !hasAnySet(session)} onClick={finish}>Bitir</button>
        </header>
        <section className="card hero">
          <h2>Bugün çalışacak kasların 🔥</h2>
          <p className="hero-sub">{`${session.exercises.length} hareket · tüm vücut`}</p>
          <BodyMap muscles={plannedSessionMuscles(session)} size={190} tone="onDark" />
          <MuscleChips muscles={plannedSessionMuscles(session)} showSecondary={false} />
        </section>
        {session.exercises.map((e) => (
          <ExerciseCard key={e.exerciseId} entry={e} settings={settings}
            onPick={(level) => apply((s) => chooseLevel(s, e.exerciseId, level, settings))}
            onSet={(i, v) => apply((s) => setRep(s, e.exerciseId, i, v))} />
        ))}
        <div className="actions">
          <button type="button" className="btn btn-danger" disabled={busy} onClick={cancel}>Vazgeç</button>
        </div>
      </main>
    );
  }

  const data = view.kind === 'idle' ? view.data : null;
  if (!data) return null;
  const homePlan = { mode: 'home' as const, hasPullupBar: settings.hasPullupBar };
  return (
    <main className="screen">
      <header className="screen-header"><h1>Antrenman</h1></header>
      <NextWorkoutCard muscles={planMuscles(data.next, homePlan)} title={`Sıradaki: Antrenman ${data.next}`}
        subtitle={`${planExercises(data.next, homePlan).length} hareket · yaklaşık 50–55 dakika`}
        actionLabel="Başla" onAction={() => start('home')}
        secondary={{ label: 'Seyahatte başla', onAction: () => start('travel') }} disabled={busy} />
      {(['A', 'B'] as const).map((day) => (
        <section key={day} className="card">
          <h3 className="group-title">{day} günü</h3>
          <ul className="list">
            {planExercises(day, homePlan).map((ex) => {
              const st = data.states[ex.id];
              const ladder = buildLadder(ex, settings.equipment);
              const sets = setsFor(ex, settings.daysPerWeek, settings.overrides[ex.id]);
              return (
                <li key={ex.id} className="list-row level-row">
                  <span className="grow">{ex.name}</span>
                  {st ? (
                    <span className="right level-info">
                      <span className="muted small">{ladder[clampLevel(st.level, ladder.length)]}</span>
                      <strong className="small">{`${sets} × ${st.targetReps}`}</strong>
                    </span>
                  ) : (
                    <span className="muted small right">Seviye seçilmedi</span>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      <section className="card">
        <h3 className="group-title">Son antrenmanlar</h3>
        {data.recent.length === 0 ? (
          <p className="muted">Henüz bitmiş antrenman yok.</p>
        ) : (
          <ul className="list">
            {data.recent.map((s) => (
              <li key={s.id} className="list-row">
                <span className="grow">{formatDay(s.date)}</span>
                <span className="muted">Antrenman {s.day}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

interface CardProps {
  entry: SessionExercise;
  settings: Settings;
  onPick: (level: number) => void;
  onSet: (index: number, value: number | null) => void;
}

function ExerciseCard({ entry, settings, onPick, onSet }: CardProps) {
  const ex = EXERCISES.find((x) => x.id === entry.exerciseId)!;
  const ladder = buildLadder(ex, settings.equipment);
  const { repMin, repMax } = repRange(ex, settings.overrides[ex.id]);
  const [showHow, setShowHow] = useState(false);
  const [picking, setPicking] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const unset = entry.level < 0;

  const pick = (i: number) => { onPick(i); setPicking(false); };
  // Kısa merdivende çipler; uzun merdivende iPhone'un kendi kaydırmalı seçicisi.
  const picker = (title: string) => ladder.length > 6 ? (
    <label className="field level-picker">
      <span className="picker-title">{title}</span>
      <select value={entry.level} onChange={(e) => pick(Number(e.target.value))}>
        {entry.level < 0 && <option value={-1} disabled>Seç…</option>}
        {ladder.map((label, i) => <option key={i} value={i}>{label}</option>)}
      </select>
    </label>
  ) : (
    <div className="level-picker">
      <p className="picker-title">{title}</p>
      <div className="picker-list">
        {ladder.map((label, i) => (
          <button key={i} type="button" className={i === entry.level ? 'chip active' : 'chip'} onClick={() => pick(i)}>{label}</button>
        ))}
      </div>
    </div>
  );

  return (
    <section className="card ex-card">
      <div className="ex-head">
        <h2>{ex.name}</h2>
        <button type="button" className="icon-btn" aria-label={`${ex.name} nasıl yapılır`} aria-expanded={showHow}
          onClick={() => setShowHow(!showHow)}>ⓘ</button>
      </div>
      <MuscleChips muscles={ex.muscles} />
      {showHow && <p className="howto">{ex.howTo}</p>}
      {unset ? picker('Başlangıç seviyeni seç') : (
        <>
          <div className="ex-level">
            <span className="level-label">{entry.levelLabel}</span>
            <button type="button" className="link-btn" onClick={() => setPicking(!picking)}>
              {picking ? 'Kapat' : 'Seviyeyi değiştir'}
            </button>
          </div>
          {picking && picker('Seviye seç')}
          <p className="muted small">
            Hedef: {entry.sets.length} × {entry.targetReps}{ex.perSide ? ' (her taraf)' : ''} · aralık {repMin}–{repMax}
          </p>
          <div className="set-row">
            {entry.sets.map((v, i) => (
              <SetBox key={i} label={`${ex.name} set ${i + 1}`} value={v} target={entry.targetReps} active={editing === i}
                onTap={() => (v === null ? onSet(i, entry.targetReps) : setEditing(i))} />
            ))}
          </div>
          {editing !== null && entry.sets[editing] !== null && (
            <SetStepper value={entry.sets[editing]!} onChange={(v) => onSet(editing, v)} onDone={() => setEditing(null)} />
          )}
        </>
      )}
    </section>
  );
}

function SummaryHero({ session, results }: { session: Session; results: FinishResult[] }) {
  const { sets, progressed, regressed } = finishStats(session, results);
  // Seviye geri düşen varsa "aynı hedefler" demek yanlış olur; o durumda sadece set sayısı.
  const detail = progressed > 0 ? ` · ${progressed} hareket ilerledi` : regressed > 0 ? '' : ' · Aynı hedeflerle devam';
  return (
    <section className="card hero">
      <h2>Bugün çalıştırdığın kaslar</h2>
      <BodyMap muscles={sessionMuscles(session)} size={150} tone="onDark" />
      <p className="hero-sub center">{`${sets} set${detail}`}</p>
    </section>
  );
}
