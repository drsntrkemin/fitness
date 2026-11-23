import { useState } from 'react';
import BandEditor from '../components/BandEditor';
import TargetsFields, { draftFrom, parseTargets, type TargetsDraft } from '../components/TargetsFields';
import { DEFAULT_SETTINGS, saveSettings } from '../data/repo';
import type { Band, Targets } from '../domain/types';

export const parseRungs = (s: string): number | null => {
  const n = Number(s);
  return Number.isInteger(n) && n >= 1 && n <= 30 ? n : null;
};

/** İlk açılış: bantlar → merdiven → günlük hedefler (spec §6.1). */
export default function Setup({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [bands, setBands] = useState<Band[]>([]);
  const [rungs, setRungs] = useState('10');
  const [targets, setTargets] = useState<TargetsDraft>(draftFrom(null));
  const [saving, setSaving] = useState(false);

  const finish = async (t: Targets | null) => {
    setSaving(true);
    await saveSettings({
      ...structuredClone(DEFAULT_SETTINGS),
      equipment: { bands, ladderRungs: parseRungs(rungs) ?? 10 },
      targets: t,
      setupDone: true,
    });
    onDone();
  };

  const parsedTargets = parseTargets(targets);

  return (
    <div className="app">
      <main className="screen setup">
        <p className="eyebrow">Kurulum · {step}/3</p>
        {step === 1 && (
          <>
            <h1>Bantların</h1>
            <p className="muted">Direnç bantlarını <strong>hafiften ağıra</strong> sırayla ekle. Koç zorluğu bu sıraya göre artırır.</p>
            <BandEditor bands={bands} onChange={setBands} />
            <div className="actions">
              <button type="button" className="btn btn-primary" onClick={() => setStep(2)}>İleri</button>
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <h1>İsveç merdiveni</h1>
            <p className="muted">Merdiveninde kaç kademe var? En alttaki kademe 1 sayılır.</p>
            <label className="field">
              <span>Kademe sayısı</span>
              <input type="number" inputMode="numeric" min={1} max={30} value={rungs} onChange={(e) => setRungs(e.target.value)} />
            </label>
            {parseRungs(rungs) === null && <p className="error">1 ile 30 arasında bir sayı gir.</p>}
            <div className="actions">
              <button type="button" className="btn" onClick={() => setStep(1)}>Geri</button>
              <button type="button" className="btn btn-primary" disabled={parseRungs(rungs) === null} onClick={() => setStep(3)}>İleri</button>
            </div>
          </>
        )}
        {step === 3 && (
          <>
            <h1>Günlük hedefler</h1>
            <p className="muted">Kalori ve makro hedeflerini gir. Bilmiyorsan atlayıp sonra Ayarlar'dan girebilirsin.</p>
            <TargetsFields draft={targets} onChange={setTargets} />
            <div className="actions">
              <button type="button" className="btn" onClick={() => setStep(2)}>Geri</button>
              <button type="button" className="btn" disabled={saving} onClick={() => finish(null)}>Atla</button>
              <button type="button" className="btn btn-primary" disabled={saving || parsedTargets === null} onClick={() => finish(parsedTargets)}>Bitir</button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
