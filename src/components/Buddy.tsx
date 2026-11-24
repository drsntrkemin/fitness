import { buddyPhase, buddyShape } from '../domain/buddy';

const SKIN = '#f5c6a0';
const SKIN_D = '#e2a37a';
const LINE = '#c98258';
const SHORTS = '#0f766e';
const BAND = '#ef4444';
const INK = '#1f2937';

/** Kaslı dost: seviyeye göre tombul → fit → kaslı. İki kolunu kasar ve gülümser. Uygulama içi SVG. */
export default function Buddy({ level, size }: { level: number; size: number }) {
  const s = buddyShape(level);
  const lx = 60 - s.shoulder;
  const rx = 60 + s.shoulder;
  const elL = lx - 12 - 4 * s.muscle;
  const elR = rx + 12 + 4 * s.muscle;
  const bicRx = 5 + 1.5 * s.belly + 3.5 * s.muscle;
  const headRx = 21 + 2.5 * s.belly;
  return (
    <svg role="img" aria-label={`Kaslı dostun, seviye ${level}, ${buddyPhase(level)}`}
      width={Math.round((size * 130) / 140)} height={size} viewBox="0 0 130 140" className="buddy">
      {s.sparkles && (
        <g data-part="sparkles" fontSize="12">
          <text x={elR + 2} y="30">✨</text>
          <text x={elL - 16} y="26" fontSize="10">✨</text>
        </g>
      )}
      {/* bacaklar */}
      <g stroke={SKIN} strokeWidth={s.leg} strokeLinecap="round">
        <path d="M53 108 L51 128" /><path d="M67 108 L69 128" />
      </g>
      <ellipse cx="49" cy="131" rx="7" ry="3.5" fill="#334155" />
      <ellipse cx="71" cy="131" rx="7" ry="3.5" fill="#334155" />
      {/* gövde */}
      <path d={`M${lx} 66 Q60 ${60 - 3 * s.muscle} ${rx} 66 L${60 + s.waist} 100 L${60 - s.waist} 100 Z`} fill={SKIN} />
      {s.chestLines && (
        <path data-part="chest" d={`M${60 - s.shoulder * 0.72} 72 Q${60 - s.shoulder * 0.35} 81 60 75 Q${60 + s.shoulder * 0.35} 81 ${60 + s.shoulder * 0.72} 72`}
          fill="none" stroke={LINE} strokeWidth="2.4" strokeLinecap="round" />
      )}
      {s.abs && (
        <g data-part="abs" stroke={LINE} strokeWidth="2" strokeLinecap="round">
          <path d="M60 80 V94" /><path d="M55 84 H65" /><path d="M55.5 89 H64.5" />
        </g>
      )}
      <rect x={60 - s.waist - 2} y="96" width={2 * s.waist + 4} height="14" rx="4" fill={SHORTS} />
      {s.belly > 0 && (
        <g data-part="belly">
          <ellipse cx="60" cy={89 - 2 * s.belly} rx={s.waist + 1} ry={7 + 7 * s.belly} fill={SKIN} stroke={SKIN_D} strokeWidth="1" />
          <circle cx="60" cy={91 - s.belly} r="1.1" fill={SKIN_D} />
        </g>
      )}
      {/* kollar: yukarı kasıyor */}
      <g stroke={SKIN} strokeWidth={s.arm} strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d={`M${lx + 2} 67 L${elL} 68 L${elL + 1} 46`} /><path d={`M${rx - 2} 67 L${elR} 68 L${elR - 1} 46`} />
      </g>
      {/* pazı: kolun üstünde şişkinlik */}
      <g fill={SKIN}>
        <ellipse cx={(lx + elL) / 2} cy={66 - s.biceps * 0.55} rx={bicRx + 1} ry={s.biceps * 0.85} />
        <ellipse cx={(rx + elR) / 2} cy={66 - s.biceps * 0.55} rx={bicRx + 1} ry={s.biceps * 0.85} />
      </g>
      <circle cx={elL + 1} cy="43" r={s.arm * 0.62} fill={SKIN} />
      <circle cx={elR - 1} cy="43" r={s.arm * 0.62} fill={SKIN} />
      {/* baş */}
      <ellipse cx="60" cy="40" rx={headRx} ry="21" fill={SKIN} />
      <path d={`M${60 - headRx} 34 Q60 22 ${60 + headRx} 34 L${60 + headRx} 38 Q60 27 ${60 - headRx} 38 Z`} fill={BAND} />
      <path d={`M${60 + headRx} 35 l8 -4 l-2 7 z`} fill={BAND} />
      <ellipse cx="52.5" cy="44" rx="2.6" ry="3.3" fill={INK} /><ellipse cx="67.5" cy="44" rx="2.6" ry="3.3" fill={INK} />
      <circle cx="53.3" cy="42.8" r="0.9" fill="#fff" /><circle cx="68.3" cy="42.8" r="0.9" fill="#fff" />
      <circle cx={47 - 1.5 * s.belly} cy="50" r={3.2 + 1.2 * s.belly} fill="#fda4af" opacity="0.7" />
      <circle cx={73 + 1.5 * s.belly} cy="50" r={3.2 + 1.2 * s.belly} fill="#fda4af" opacity="0.7" />
      <path d="M55 52 Q60 57 65 52" fill="none" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
