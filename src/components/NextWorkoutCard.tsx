import type { ReactNode } from 'react';
import BodyMap from './BodyMap';
import type { MuscleSet } from '../domain/types';

interface Props {
  muscles: MuscleSet;
  title: string;
  subtitle?: string;
  actionLabel: string;
  onAction: () => void;
  /** İkinci düğme (ör. "Seyahatte başla"). */
  secondary?: { label: string; onAction: () => void };
  disabled?: boolean;
  children?: ReactNode;
}

/** Yeşil degrade "sıradaki antrenman" kartı: yazı solda, o günün kas figürü sağda. */
export default function NextWorkoutCard({ muscles, title, subtitle, actionLabel, onAction, secondary, disabled, children }: Props) {
  return (
    <section className="card hero next-workout">
      <div className="next-row">
        <div className="grow">
          <h2>{title}</h2>
          {subtitle && <p className="hero-sub">{subtitle}</p>}
        </div>
        <BodyMap muscles={muscles} size={90} tone="onDark" />
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
