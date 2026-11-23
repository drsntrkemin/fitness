interface BoxProps {
  label: string;
  value: number | null;
  target: number;
  active: boolean;
  onTap: () => void;
}

/** Bir set kutusu. Boşken hedefi soluk gösterir; dokununca hedefi yazar (ekran karar verir). */
export function SetBox({ label, value, target, active, onTap }: BoxProps) {
  const state = value === null ? 'empty' : value >= target ? 'hit' : 'miss';
  return (
    <button
      type="button"
      aria-label={label}
      data-empty={value === null}
      className={`set-box ${state}${active ? ' editing' : ''}`}
      onClick={onTap}
    >
      {value ?? target}
      {value !== null && <span className="set-check" aria-hidden="true">{value >= target ? '✓' : ''}</span>}
    </button>
  );
}

interface StepperProps {
  value: number;
  onChange: (v: number | null) => void;
  onDone: () => void;
}

/** Dolu bir seti düzeltmek için +/− paneli. */
export function SetStepper({ value, onChange, onDone }: StepperProps) {
  return (
    <div className="set-stepper" role="group" aria-label="Seti düzelt">
      <button type="button" className="btn" aria-label="Temizle" onClick={() => { onChange(null); onDone(); }}>✕</button>
      <button type="button" className="btn step" aria-label="Bir azalt" disabled={value <= 0} onClick={() => onChange(value - 1)}>−</button>
      <span className="step-value" aria-live="polite">{value}</span>
      <button type="button" className="btn step" aria-label="Bir artır" onClick={() => onChange(value + 1)}>+</button>
      <button type="button" className="btn btn-primary" aria-label="Tamam" onClick={onDone}>✓</button>
    </div>
  );
}
