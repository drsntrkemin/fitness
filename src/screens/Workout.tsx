import { useCallback, useEffect, useRef, useState } from 'react';
import { SetBox, SetStepper } from '../components/SetInput';
import * as repo from '../data/repo';
import { EXERCISES } from '../domain/catalog';
import { formatDay, localDateKey } from '../domain/dates';
import { buildLadder, clampLevel, exercisesFor, nextDay, repRange, setsFor } from '../domain/program';
import { chooseLevel, createSession, finishSession, hasAnySet, setRep, type FinishResult } from '../domain/session';
import type { DayKey, ExerciseState, Session, SessionExercise, Settings } from '../domain/types';

interface Props {
  settings: Settings;
  /** Bugün ekranındaki "Başla"dan gelindiyse oturumu hemen başlat. */
  autoStart?: boolean;
  /** Oturum başladı/bitti/silindi; üst bileşen gerekirse yenilenir. */
  onSessionChange?: () => void;
}

type Idle = { states: Record<string, ExerciseState>; next: DayKey; recent: Session[] };
type View =
  | { kind: 'loading' }
  | { kind: 'idle'; data: Idle }
  | { kind: 'active' }
  | { kind: 'summary'; results: FinishResult[] };

const nameOf = (id: string) => EXERCISES.find((e) => e.id === id)?.name ?? id;

export default function Workout({ settings, autoStart, onSessionChange }: Props) {
  const [view, setView] = useState<View>({ kind: 'loading' });
  const [session, setSession] = useState<Session | null>(null);
  const sessionRef = useRef<Session | null>(null);
  const started = useRef(false);

  const loadIdle = useCallback(async (): Promise<Idle> => {
    const [states, last, done] = await Promise.all([repo.getExerciseStates(), repo.lastFinishedDay(), repo.listSessions()]);
    return { states, next: nextDay(last), recent: done.slice(0, 5) };
  }, []);

  const showSession = (s: Session) => {
    sessionRef.current = s;
    setSession(s);
    setView({ kind: 'active' });
  };

  const start = useCallback(async () => {
    const data = await loadIdle();
    const s = createSession(data.next, localDateKey(new Date()), settings, data.states);
    const id = await repo.saveSession(s);
    showSession({ ...s, id });
    onSessionChange?.();
  }, [loadIdle, settings, onSessionChange]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const activeSession = await repo.getActiveSession();
      if (cancelled) return;
      if (activeSession) return showSession(activeSession);
      if (autoStart && !started.current) {
        started.current = true;
        return start();
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

  const finish = async () => {
    const s = sessionRef.current;
    if (!s) return;
    const hasGaps = s.exercises.some((e) => e.level >= 0 && e.sets.some((v) => v === null));
    if (hasGaps && !window.confirm('Bazı setler boş. Boş setler yapılmadı sayılacak. Antrenman bitirilsin mi?')) return;
    const r = finishSession(s, settings, await repo.getExerciseStates());
    await repo.putExerciseStates(r.states);
    await repo.saveSession({ ...s, status: 'done' });
    sessionRef.current = null;
    setSession(null);
    setView({ kind: 'summary', results: r.results });
    onSessionChange?.();
  };

  const cancel = async () => {
    const s = sessionRef.current;
    if (!s?.id) return;
    if (!window.confirm('Bu antrenman silinsin mi? Girdiğin setler kaybolur.')) return;
    await repo.deleteSession(s.id);
    sessionRef.current = null;
    setSession(null);
    setView({ kind: 'idle', data: await loadIdle() });
    onSessionChange?.();
  };

  if (view.kind === 'loading') return <main className="screen" aria-busy="true" />;

  if (view.kind === 'summary') {
    return (
      <main className="screen">
        <header className="screen-header"><h1>Antrenman bitti 💪</h1></header>
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
          <h1>Antrenman {session.day}</h1>
          <button type="button" className="btn btn-primary" disabled={!hasAnySet(session)} onClick={finish}>Bitir</button>
        </header>
        {session.exercises.map((e) => (
          <ExerciseCard key={e.exerciseId} entry={e} settings={settings}
            onPick={(level) => apply((s) => chooseLevel(s, e.exerciseId, level, settings))}
            onSet={(i, v) => apply((s) => setRep(s, e.exerciseId, i, v))} />
        ))}
        <div className="actions">
          <button type="button" className="btn btn-danger" onClick={cancel}>Vazgeç</button>
        </div>
      </main>
    );
  }

  const data = view.kind === 'idle' ? view.data : null;
  if (!data) return null;
  return (
    <main className="screen">
      <header className="screen-header"><h1>Antrenman</h1></header>
      <section className="card next-card">
        <h2>Sıradaki: Antrenman {data.next}</h2>
        <p className="muted small">{exercisesFor(data.next).length} hareket · yaklaşık 45 dakika</p>
        <button type="button" className="btn btn-primary btn-block" onClick={start}>Başla</button>
      </section>
      {(['A', 'B'] as const).map((day) => (
        <section key={day} className="card">
          <h3 className="group-title">{day} günü</h3>
          <ul className="list">
            {exercisesFor(day).map((ex) => {
              const st = data.states[ex.id];
              const ladder = buildLadder(ex, settings.equipment);
              const sets = setsFor(ex, settings.daysPerWeek, settings.overrides[ex.id]);
              return (
                <li key={ex.id} className="list-row level-row">
                  <span className="grow">{ex.name}</span>
                  <span className="muted small right">
                    {st ? `${ladder[clampLevel(st.level, ladder.length)]} · ${sets} × ${st.targetReps}` : 'Seviye seçilmedi'}
                  </span>
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
