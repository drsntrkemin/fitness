import { useState } from 'react';
import { num } from '../domain/format';
import { validateMeasurement } from '../domain/measure';
import type { Measurement } from '../domain/types';

interface Props {
  initial?: Measurement;
  submitLabel: string;
  onSubmit: (weight: number | null, waist: number | null) => Promise<void> | void;
  onCancel?: () => void;
}

/** Kilo + bel alanları; doğrulama ve uyarı bir arada (Bugün kartı ve İlerleme'de düzeltme). */
export default function MeasurementForm({ initial, submitLabel, onSubmit, onCancel }: Props) {
  const [weight, setWeight] = useState(initial?.weight != null ? num(initial.weight) : '');
  const [waist, setWaist] = useState(initial?.waist != null ? num(initial.waist) : '');
  const [busy, setBusy] = useState(false);
  const check = validateMeasurement(weight, waist);

  return (
    <div className="measure-form">
      <div className="grid-2">
        <label className="field">
          <span>Kilo (kg)</span>
          <input inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} />
        </label>
        <label className="field">
          <span>Bel (cm)</span>
          <input inputMode="decimal" value={waist} onChange={(e) => setWaist(e.target.value)} />
        </label>
      </div>
      {!check.ok && check.error && <p className="error">{check.error}</p>}
      <div className="actions">
        {onCancel && <button type="button" className="btn" onClick={onCancel}>Vazgeç</button>}
        <button type="button" className="btn btn-primary" disabled={!check.ok || busy}
          onClick={async () => {
            if (!check.ok) return;
            setBusy(true);
            try { await onSubmit(check.weight, check.waist); } finally { setBusy(false); }
          }}>{submitLabel}</button>
      </div>
    </div>
  );
}
