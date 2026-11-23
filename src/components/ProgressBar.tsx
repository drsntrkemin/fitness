import { num } from '../domain/format';

interface Props {
  label: string;
  value: number;
  target: number | null;
  unit: string;
  /** Hedefi aşmak iyi mi (protein) yoksa dikkat mi (kalori)? */
  overIsGood?: boolean;
  size?: 'large' | 'small';
}

export default function ProgressBar({ label, value, target, unit, overIsGood = false, size = 'large' }: Props) {
  const pct = target ? Math.min(100, (value / target) * 100) : 0;
  const over = target !== null && value > target;
  return (
    <div className={`pbar ${size}`}>
      <div className="pbar-head">
        <span className="pbar-label">{label}</span>
        <span className="pbar-value">{target === null ? `${num(value)} ${unit}` : `${num(value)} / ${num(target)} ${unit}`}</span>
      </div>
      {target !== null && (
        <div className="pbar-track" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={target} aria-valuenow={value}>
          <div className={`pbar-fill${over ? (overIsGood ? ' good' : ' over') : ''}`} style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}
