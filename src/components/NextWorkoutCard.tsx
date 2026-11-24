import type { ReactNode } from 'react';
import Buddy from './Buddy';
import { buddyLevel } from '../domain/buddy';

interface Props {
  /** Tamamlanan antrenman sayısı: kaslı dostun seviyesini belirler. */
  completed: number;
  title: string;
  subtitle?: string;
  actionLabel: string;
  onAction: () => void;
  /** İkinci düğme (ör. "Seyahatte başla"). */
  secondary?: { label: string; onAction: () => void };
  disabled?: boolean;
  children?: ReactNode;
}

/** Yeşil degrade "sıradaki antrenman" kartı: solda kaslı dost, sağda seviye ve ilerleme. */
export default function NextWorkoutCard({ completed, title, subtitle, actionLabel, onAction, secondary, disabled, children }: Props) {
  const b = buddyLevel(completed);
  return (
    <section className="card hero next-workout">
      <h2>{title}</h2>
      {subtitle && <p className="hero-sub">{subtitle}</p>}
      <div className="buddy-row">
        <Buddy level={b.level} size={104} />
        <div className="grow buddy-info">
          <p className="buddy-title">{`Kaslı dostun · Seviye ${b.level}`}</p>
          <p className="hero-sub">{`${completed} antrenman tamamladın 💪`}</p>
          <div className="buddy-bar" role="progressbar" aria-label="Sonraki seviye" aria-valuemin={0} aria-valuemax={100}
            aria-valuenow={Math.round(b.progress * 100)}>
            <div style={{ width: `${b.progress * 100}%` }} />
          </div>
          <p className="hero-sub">{b.toNext === null ? 'En üst seviye! 🏆' : `Sonraki seviyeye ${b.toNext} antrenman`}</p>
        </div>
      </div>
      <button type="button" className="btn btn-hero btn-block" disabled={disabled} onClick={onAction}>{actionLabel}</button>
      {secondary && (
        <button type="button" className="btn btn-hero-outline btn-block" disabled={disabled} onClick={secondary.onAction}>
          <span aria-hidden="true">🧳 </span>{secondary.label}
        </button>
      )}
      {children}
    </section>
  );
}
