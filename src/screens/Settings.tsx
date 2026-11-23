import { useEffect, useState } from 'react';
import BandEditor from '../components/BandEditor';
import TargetsFields, { draftFrom, parseTargets, type TargetsDraft } from '../components/TargetsFields';
import { BackupError, exportAll, importAll } from '../data/backup';
import { resetAll, saveSettings, updateEquipment } from '../data/repo';
import { EXERCISES } from '../domain/catalog';
import { localDateKey } from '../domain/dates';
import { setsFor } from '../domain/program';
import type { Equipment, ExerciseOverride, Settings } from '../domain/types';
import * as ios from '../platform/ios';
import { parseRungs } from './Setup';

interface Props {
  settings: Settings;
  /** Ayarlar ya da veriler değişti; uygulama durumu veritabanından yeniden okunmalı. */
  onChange: () => void;
  onClose: () => void;
}

type RowDraft = { sets: string; repMin: string; repMax: string };

const intIn = (s: string, lo: number, hi: number): number | null => {
  const n = Number(s);
  return s.trim() !== '' && Number.isInteger(n) && n >= lo && n <= hi ? n : null;
};

function rowDrafts(s: Settings): Record<string, RowDraft> {
  return Object.fromEntries(EXERCISES.map((ex) => {
    const o = s.overrides[ex.id] ?? {};
    return [ex.id, {
      sets: String(setsFor(ex, s.daysPerWeek, o)),
      repMin: String(o.repMin ?? ex.repMin),
      repMax: String(o.repMax ?? ex.repMax),
    }];
  }));
}

/** Satırın hata mesajı; geçerliyse null. */
function rowError(name: string, d: RowDraft): string | null {
  const sets = intIn(d.sets, 1, 10);
  const min = intIn(d.repMin, 1, 50);
  const max = intIn(d.repMax, 1, 50);
  if (sets === null || min === null || max === null) return `${name}: geçerli bir sayı gir (set 1–10, tekrar 1–50).`;
  if (min >= max) return `${name}: en az tekrar, en çok tekrardan küçük olmalı.`;
  return null;
}

export default function SettingsScreen({ settings, onChange, onClose }: Props) {
  const [s, setS] = useState(settings);
  const [targets, setTargets] = useState<TargetsDraft>(draftFrom(settings.targets));
  const [rows, setRows] = useState(() => rowDrafts(settings));
  const [rungs, setRungs] = useState(String(settings.equipment.ladderRungs));
  const [notice, setNotice] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  // Yedek metni önceden hazırlanır: iOS paylaşım sayfasını yalnızca dokunuşun hemen ardından açar.
  const [backupText, setBackupText] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    setBackupText(null);
    exportAll().then((d) => { if (alive) setBackupText(JSON.stringify(d)); });
    return () => { alive = false; };
  }, [settings]);

  useEffect(() => {
    setS(settings);
    setTargets(draftFrom(settings.targets));
    setRows(rowDrafts(settings));
    setRungs(String(settings.equipment.ladderRungs));
  }, [settings]);

  const persist = async (next: Settings, message?: string) => {
    setS(next);
    await saveSettings(next);
    if (message) setNotice({ kind: 'ok', text: message });
    onChange();
  };

  /** Ekipman değişikliği: kayıtlı seviyeler yeni merdivene taşınır. */
  const changeEquipment = async (equipment: Equipment, message?: string) => {
    const next = { ...s, equipment };
    const prev = s;
    setS(next);
    await updateEquipment(prev, next);
    if (message) setNotice({ kind: 'ok', text: message });
    onChange();
  };

  const parsedTargets = parseTargets(targets);
  const parsedRungs = parseRungs(rungs);
  const errors = EXERCISES.map((ex) => rowError(ex.name, rows[ex.id])).filter((e): e is string => e !== null);

  const saveOverrides = () => {
    const overrides: Record<string, ExerciseOverride> = {};
    for (const ex of EXERCISES) {
      const d = rows[ex.id];
      const o: ExerciseOverride = {};
      const min = Number(d.repMin);
      const max = Number(d.repMax);
      const sets = Number(d.sets);
      if (min !== ex.repMin || max !== ex.repMax) { o.repMin = min; o.repMax = max; }
      if (sets !== setsFor(ex, s.daysPerWeek)) o.sets = sets;
      if (Object.keys(o).length) overrides[ex.id] = o;
    }
    persist({ ...s, overrides }, 'Hareket ayarları kaydedildi.');
  };

  const backup = async () => {
    if (!backupText) return;
    const today = localDateKey(new Date());
    // Paylaşım burada, hiçbir beklemeden önce çağrılır.
    const result = await ios.shareFile(`ev-fitness-${today}.json`, backupText);
    if (result === 'cancelled') return;
    if (result === 'downloaded' && !window.confirm('Yedek dosyası telefonuna (Dosyalar / iCloud Drive) kaydedildi mi?')) {
      setNotice({ kind: 'error', text: 'Yedek kaydedilmedi. Tekrar dene; paylaşım sayfasında "Dosyalara Kaydet"i seç.' });
      return;
    }
    await persist({ ...s, lastBackup: today }, result === 'shared'
      ? 'Yedek paylaşıldı. "Dosyalara Kaydet" ile iCloud\'a kaydettiysen tamam.'
      : 'Yedek kaydedildi.');
  };

  const restore = async (file: File | undefined) => {
    if (!file) return;
    if (!window.confirm('Mevcut verilerin yerine yedek yüklensin mi?')) return;
    try {
      await importAll(await file.text());
      setNotice({ kind: 'ok', text: 'Yedek yüklendi.' });
      onChange();
    } catch (e) {
      setNotice({ kind: 'error', text: e instanceof BackupError ? e.message : 'Yedek yüklenemedi.' });
    }
  };

  const reset = async () => {
    if (!window.confirm('Tüm antrenman, beslenme ve ölçüm kayıtların silinecek. Emin misin?')) return;
    if (!window.confirm('Bu işlem geri alınamaz. Son kez soruyorum: her şey silinsin mi?')) return;
    await resetAll();
    onChange();
  };

  return (
    <div className="app">
      <main className="screen">
        <header className="screen-header">
          <h1>Ayarlar</h1>
          <button type="button" className="btn" onClick={onClose}>Kapat</button>
        </header>

        {notice && <p role="status" className={notice.kind === 'error' ? 'notice error' : 'notice ok'}>{notice.text}</p>}

        <section className="card">
          <h2>Günlük hedefler</h2>
          <TargetsFields draft={targets} onChange={setTargets} />
          <div className="actions">
            <button type="button" className="btn btn-primary" disabled={parsedTargets === null}
              onClick={() => persist({ ...s, targets: parsedTargets }, 'Hedefler kaydedildi.')}>Hedefleri kaydet</button>
          </div>
        </section>

        <section className="card">
          <h2>Program</h2>
          <div className="segmented" role="radiogroup" aria-label="Haftalık antrenman günü">
            {([3, 2] as const).map((n) => (
              <label key={n} className={s.daysPerWeek === n ? 'seg active' : 'seg'}>
                <input type="radio" name="days" checked={s.daysPerWeek === n}
                  onChange={() => persist({ ...s, daysPerWeek: n })} aria-label={`Haftada ${n} gün`} />
                Haftada {n} gün
              </label>
            ))}
          </div>
          <p className="muted small">Haftada 2 günde ana hareketler 4 set olur.</p>
        </section>

        <section className="card">
          <h2>Ekipman</h2>
          <p className="muted small">Bantlar hafiften ağıra sıralı olmalı.</p>
          <BandEditor confirmDelete bands={s.equipment.bands} onChange={(bands) => changeEquipment({ ...s.equipment, bands })} />
          <div className="inline-form">
            <label className="field grow">
              <span>Kademe sayısı</span>
              <input type="number" inputMode="numeric" min={1} max={30} value={rungs} onChange={(e) => setRungs(e.target.value)} />
            </label>
            <button type="button" className="btn" aria-label="Kademeyi kaydet"
              disabled={parsedRungs === null || parsedRungs === s.equipment.ladderRungs}
              onClick={() => parsedRungs !== null && changeEquipment({ ...s.equipment, ladderRungs: parsedRungs }, 'Kademe sayısı kaydedildi.')}>Kaydet</button>
          </div>
          {parsedRungs === null && <p className="error">1 ile 30 arasında bir sayı gir.</p>}
        </section>

        <section className="card">
          <h2>Hareketler</h2>
          <p className="muted small">Set sayısı ve tekrar aralığı. Koç bu aralığa göre ilerletir.</p>
          <div className="override-table">
            <div className="override-row override-head" aria-hidden="true">
              <span className="grow" />
              <span className="mini-head">Set</span>
              <span className="mini-head">En az</span>
              <span className="mini-head">En çok</span>
            </div>
            {EXERCISES.map((ex) => (
              <div key={ex.id} className="override-row">
                <span className="grow">{ex.name}</span>
                {(['sets', 'repMin', 'repMax'] as const).map((k) => (
                  <input key={k} className="mini" type="number" inputMode="numeric"
                    aria-label={`${ex.name} ${k === 'sets' ? 'set sayısı' : k === 'repMin' ? 'en az tekrar' : 'en çok tekrar'}`}
                    value={rows[ex.id][k]}
                    onChange={(e) => setRows({ ...rows, [ex.id]: { ...rows[ex.id], [k]: e.target.value } })} />
                ))}
              </div>
            ))}
          </div>
          {errors.map((e) => <p key={e} className="error">{e}</p>)}
          <div className="actions">
            <button type="button" className="btn btn-primary" disabled={errors.length > 0} onClick={saveOverrides}>Hareket ayarlarını kaydet</button>
          </div>
        </section>

        <section className="card">
          <h2>Yedekleme</h2>
          <p className="muted small">
            Veriler sadece bu telefonda saklanır. Ayda bir yedek alıp iCloud Drive'a kaydet.
            {' '}{s.lastBackup ? `Son yedek: ${s.lastBackup.split('-').reverse().join('.')}` : 'Henüz yedek alınmadı.'}
          </p>
          <div className="actions">
            <button type="button" className="btn btn-primary" disabled={backupText === null} onClick={backup}>Yedekle</button>
            <label className="btn file-btn">
              Geri yükle
              <input type="file" accept=".json,application/json" aria-label="Yedek dosyası seç"
                onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; restore(f); }} />
            </label>
          </div>
        </section>

        <section className="card danger-zone">
          <h2>Tehlikeli bölge</h2>
          <button type="button" className="btn btn-danger" onClick={reset}>Verileri sıfırla</button>
        </section>
      </main>
    </div>
  );
}
