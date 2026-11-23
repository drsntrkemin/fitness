import { daysBetween, formatDay } from '../domain/dates';
import { num } from '../domain/format';
import type { DateKey } from '../domain/types';

interface Props {
  title: string;
  points: { date: DateKey; value: number }[];
  unit: string;
}

const W = 320;
const H = 150;
const PAD = { top: 12, right: 12, bottom: 24, left: 46 };

/** Basit çizgi grafik (SVG). Renkler CSS değişkenlerinden; açık/koyu temaya uyar. */
export default function LineChart({ title, points, unit }: Props) {
  if (points.length < 2) return <p className="muted small">Grafik için en az 2 ölçüm gerekli</p>;
  const first = points[0];
  const last = points[points.length - 1];
  const span = Math.max(1, daysBetween(first.date, last.date));
  const values = points.map((p) => p.value);
  let lo = Math.min(...values);
  let hi = Math.max(...values);
  if (hi - lo < 1) { lo -= 0.5; hi += 0.5; }
  const x = (d: DateKey) => PAD.left + (daysBetween(first.date, d) / span) * (W - PAD.left - PAD.right);
  const y = (v: number) => PAD.top + (1 - (v - lo) / (hi - lo)) * (H - PAD.top - PAD.bottom);
  const path = points.map((p) => `${x(p.date).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');

  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img"
      aria-label={`${title} grafiği: ${num(first.value)} ${unit} → ${num(last.value)} ${unit}`}>
      <line className="chart-grid" x1={PAD.left} x2={W - PAD.right} y1={y(hi)} y2={y(hi)} />
      <line className="chart-grid" x1={PAD.left} x2={W - PAD.right} y1={y(lo)} y2={y(lo)} />
      <text className="chart-label" x={PAD.left - 10} y={y(hi) + 4} textAnchor="end">{num(hi)}</text>
      <text className="chart-label" x={PAD.left - 10} y={y(lo) + 4} textAnchor="end">{num(lo)}</text>
      <polyline className="chart-line" points={path} fill="none" />
      {points.map((p) => <circle key={p.date} className="chart-dot" cx={x(p.date)} cy={y(p.value)} r={3.5} />)}
      <text className="chart-label" x={PAD.left} y={H - 6} textAnchor="start">{formatDay(first.date)}</text>
      <text className="chart-label" x={W - PAD.right} y={H - 6} textAnchor="end">{formatDay(last.date)}</text>
    </svg>
  );
}
