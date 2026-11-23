import { MUSCLE_NAMES } from '../domain/muscles';
import type { MuscleSet } from '../domain/types';

/** Kas etiketleri: ana kaslar turuncu, yardımcılar gri. */
export default function MuscleChips({ muscles, showSecondary = true }: { muscles: MuscleSet; showSecondary?: boolean }) {
  return (
    <ul className="muscle-chips" aria-label="Çalışan kaslar">
      {muscles.primary.map((m) => <li key={m} className="chip-p">{MUSCLE_NAMES[m]}</li>)}
      {showSecondary && muscles.secondary.map((m) => <li key={m} className="chip-s">{MUSCLE_NAMES[m]}</li>)}
    </ul>
  );
}
