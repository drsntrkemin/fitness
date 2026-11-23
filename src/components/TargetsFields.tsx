import { parseDecimal } from '../domain/parse';
import type { Targets } from '../domain/types';

export type TargetsDraft = Record<keyof Targets, string>;

const FIELDS: { key: keyof Targets; label: string }[] = [
  { key: 'kcal', label: 'Kalori (kcal)' },
  { key: 'protein', label: 'Protein (g)' },
  { key: 'carbs', label: 'Karbonhidrat (g)' },
  { key: 'fat', label: 'Yağ (g)' },
];

const fmt = (n: number) => String(n).replace('.', ',');

export function draftFrom(t: Targets | null): TargetsDraft {
  return t
    ? { kcal: fmt(t.kcal), protein: fmt(t.protein), carbs: fmt(t.carbs), fat: fmt(t.fat) }
    : { kcal: '', protein: '', carbs: '', fat: '' };
}

/** Dört alan da geçerliyse hedefleri, değilse null döner. */
export function parseTargets(d: TargetsDraft): Targets | null {
  const kcal = parseDecimal(d.kcal);
  const protein = parseDecimal(d.protein);
  const carbs = parseDecimal(d.carbs);
  const fat = parseDecimal(d.fat);
  if (kcal === null || protein === null || carbs === null || fat === null) return null;
  return { kcal, protein, carbs, fat };
}

export default function TargetsFields({ draft, onChange }: { draft: TargetsDraft; onChange: (d: TargetsDraft) => void }) {
  return (
    <div className="grid-2">
      {FIELDS.map((f) => {
        const invalid = draft[f.key].trim() !== '' && parseDecimal(draft[f.key]) === null;
        return (
          <label key={f.key} className="field">
            <span>{f.label}</span>
            <input
              inputMode="decimal"
              value={draft[f.key]}
              aria-invalid={invalid || undefined}
              onChange={(e) => onChange({ ...draft, [f.key]: e.target.value })}
            />
          </label>
        );
      })}
    </div>
  );
}
