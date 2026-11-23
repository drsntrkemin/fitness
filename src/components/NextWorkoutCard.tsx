import type { ReactNode } from 'react';
import BodyMap from './BodyMap';
import { dayMuscles } from '../domain/muscles';
import type { DayKey } from '../domain/types';

interface Props {
  day: DayKey;
  title: string;
  subtitle?: string;
  actionLabel: string;
  onAction: () => void;
  disabled?: boolean;
  children?: ReactNode;
}

/** Yeşil degrade "sıradaki antrenman" kartı: yazı solda, o günün kas figürü sağda. */
export default function NextWorkoutCard({ day, title, subtitle, actionLabel, onAction, disabled, children }: Props) {
  return (
    <section className="card hero next-workout">
      <div className="next-row">
        <div className="grow">
          <h2>{title}</h2>
          {subtitle && <p className="hero-sub">{subtitle}</p>}
        </div>
        <BodyMap muscles={dayMuscles(day)} size={90} tone="onDark" />
      </div>
      <button type="button" className="btn btn-hero btn-block" disabled={disabled} onClick={onAction}>{actionLabel}</button>
      {children}
    </section>
  );
}
