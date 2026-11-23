import type { ReactNode } from 'react';
import { BACK_MUSCLES, FRONT_MUSCLES, MUSCLE_NAMES } from '../domain/muscles';
import type { Muscle, MuscleSet } from '../domain/types';

// Sade ön/arka vücut figürü (viewBox 0 0 100 210). Uygulama içinde çizilir: internetsiz çalışır.
const BASE = (
  <>
    <circle cx="50" cy="15" r="10" />
    <rect x="45.5" y="23" width="9" height="8" rx="3" />
    <path d="M29 33 Q50 26 71 33 L73 58 Q69 80 67 92 L33 92 Q31 80 27 58 Z" />
    <path d="M33 90 L67 90 L65 105 Q50 113 35 105 Z" />
    <ellipse cx="23" cy="51" rx="6.5" ry="16" transform="rotate(10 23 51)" />
    <ellipse cx="77" cy="51" rx="6.5" ry="16" transform="rotate(-10 77 51)" />
    <ellipse cx="19" cy="77" rx="5" ry="13" transform="rotate(8 19 77)" />
    <ellipse cx="81" cy="77" rx="5" ry="13" transform="rotate(-8 81 77)" />
    <circle cx="16.5" cy="93" r="4" /><circle cx="83.5" cy="93" r="4" />
    <ellipse cx="42" cy="127" rx="9" ry="24" /><ellipse cx="58" cy="127" rx="9" ry="24" />
    <ellipse cx="42" cy="170" rx="6" ry="18" /><ellipse cx="58" cy="170" rx="6" ry="18" />
    <ellipse cx="41" cy="193" rx="6" ry="3" /><ellipse cx="59" cy="193" rx="6" ry="3" />
  </>
);

const DELTS = <><ellipse cx="29" cy="38" rx="7" ry="6.5" /><ellipse cx="71" cy="38" rx="7" ry="6.5" /></>;
const UPPER_ARMS = (
  <>
    <ellipse cx="23.5" cy="52" rx="4.5" ry="9" transform="rotate(10 23.5 52)" />
    <ellipse cx="76.5" cy="52" rx="4.5" ry="9" transform="rotate(-10 76.5 52)" />
  </>
);
const FOREARMS = (
  <>
    <ellipse cx="19.5" cy="76" rx="4" ry="11" transform="rotate(8 19.5 76)" />
    <ellipse cx="80.5" cy="76" rx="4" ry="11" transform="rotate(-8 80.5 76)" />
  </>
);

const SHAPES: Record<'front' | 'back', Partial<Record<Muscle, ReactNode>>> = {
  front: {
    shoulders: DELTS,
    chest: (
      <>
        <path d="M49.3 34 L49.3 50 Q42 53 35 48 Q33 40 36 35 Q43 32 49.3 34 Z" />
        <path d="M50.7 34 L50.7 50 Q58 53 65 48 Q67 40 64 35 Q57 32 50.7 34 Z" />
      </>
    ),
    biceps: UPPER_ARMS,
    forearms: FOREARMS,
    abs: <rect x="43" y="54" width="14" height="32" rx="4" />,
    obliques: (
      <>
        <path d="M36 56 L41.5 56 L41.5 86 L37 86 Q35 70 36 56 Z" />
        <path d="M64 56 L58.5 56 L58.5 86 L63 86 Q65 70 64 56 Z" />
      </>
    ),
    quads: <><ellipse cx="42" cy="124" rx="7.5" ry="20" /><ellipse cx="58" cy="124" rx="7.5" ry="20" /></>,
  },
  back: {
    traps: <path d="M50 24 L62 33 L56 40 L50 55 L44 40 L38 33 Z" />,
    rearDelts: DELTS,
    upperBack: (
      <>
        <path d="M37.5 36 L43.5 40 L48 52 L40.5 54 L36 44 Z" />
        <path d="M62.5 36 L56.5 40 L52 52 L59.5 54 L64 44 Z" />
      </>
    ),
    lats: (
      <>
        <path d="M35.5 47 L40 56 L48.5 58 L46.5 75 Q40 71 35 63 Q33 55 35.5 47 Z" />
        <path d="M64.5 47 L60 56 L51.5 58 L53.5 75 Q60 71 65 63 Q67 55 64.5 47 Z" />
      </>
    ),
    lowerBack: <><rect x="44" y="64" width="5.2" height="24" rx="2.5" /><rect x="50.8" y="64" width="5.2" height="24" rx="2.5" /></>,
    triceps: UPPER_ARMS,
    forearms: FOREARMS,
    glutes: <><ellipse cx="43" cy="100" rx="8" ry="8" /><ellipse cx="57" cy="100" rx="8" ry="8" /></>,
    hamstrings: <><ellipse cx="42" cy="129" rx="7.5" ry="18" /><ellipse cx="58" cy="129" rx="7.5" ry="18" /></>,
    calves: <><ellipse cx="42" cy="165" rx="5.5" ry="13" /><ellipse cx="58" cy="165" rx="5.5" ry="13" /></>,
  },
};

interface Props {
  muscles: MuscleSet;
  /** Figür yüksekliği (px). 120 ve üstünde ÖN/ARKA yazar. */
  size: number;
  /** Degrade (koyu) kart üstünde mi, normal kart üstünde mi? */
  tone?: 'onDark' | 'onLight';
}

function Figure({ view, muscles, size }: { view: 'front' | 'back'; muscles: MuscleSet; size: number }) {
  const visible = view === 'front' ? FRONT_MUSCLES : BACK_MUSCLES;
  const worked = [...muscles.primary, ...muscles.secondary].filter((m) => visible.includes(m));
  const title = view === 'front' ? 'Ön' : 'Arka';
  const label = `${title}: ${worked.length ? worked.map((m) => MUSCLE_NAMES[m]).join(', ') : 'çalışan kas yok'}`;
  const state = (m: Muscle) => (muscles.primary.includes(m) ? 'primary' : muscles.secondary.includes(m) ? 'secondary' : 'idle');
  return (
    <figure className="bodymap-fig">
      <svg role="img" aria-label={label} width={Math.round((size * 100) / 210)} height={size} viewBox="0 0 100 210">
        <g className="bm-base">{BASE}</g>
        {visible.map((m) => (
          <g key={m} data-muscle={m} data-state={state(m)}>{SHAPES[view][m]}</g>
        ))}
      </svg>
      {size >= 120 && <figcaption>{view === 'front' ? 'ÖN' : 'ARKA'}</figcaption>}
    </figure>
  );
}

/** Ön ve arka vücut figürü: ana kaslar turuncu, yardımcılar açık turuncu. */
export default function BodyMap({ muscles, size, tone = 'onLight' }: Props) {
  return (
    <div className={`bodymap ${tone}`}>
      <Figure view="front" muscles={muscles} size={size} />
      <Figure view="back" muscles={muscles} size={size} />
    </div>
  );
}
