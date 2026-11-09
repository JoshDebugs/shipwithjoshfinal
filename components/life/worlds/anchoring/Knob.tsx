/**
 * The volume knob — the scroll position, made physical. Generic amp-style:
 * ink skirt with a knurled edge, a machined cap (conic sheen in ink/paper
 * mixes), a paper pointer, a scale printed 0–10 in Geist Mono, and the
 * hand-scrawled pink "11 ← (me)" past the end of the scale.
 *
 * Design box: 300 × 300 px, centre (150, 150). The world moves/scales the
 * root and rotates the two pointer groups by writing to the refs.
 */
import type { RefObject } from "react";
import { RISO, alpha, mix } from "@/components/life/multiverse/palette";
import { COPY } from "./copy";
import { knobAngle } from "./timeline";

export type KnobRefs = {
  root?: RefObject<HTMLDivElement | null>;
  knurl?: RefObject<SVGGElement | null>;
  pointer?: RefObject<SVGGElement | null>;
  circle?: RefObject<SVGPathElement | null>;
  /** The marker layer (scale extension, "11 ← (me)", loop) — recoloured once the paper turns pink. */
  marker?: RefObject<SVGGElement | null>;
};

const C = 150;
const MONO = "var(--font-geist-mono), ui-monospace, monospace";
const MARKER = "var(--f-marker), var(--font-geist-sans), cursive";

const polar = (r: number, deg: number) => {
  const a = (deg * Math.PI) / 180;
  return [C + r * Math.sin(a), C - r * Math.cos(a)] as const;
};

function arcPath(r: number, a0: number, a1: number) {
  const [x0, y0] = polar(r, a0);
  const [x1, y1] = polar(r, a1);
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
  return `M${x0.toFixed(2)} ${y0.toFixed(2)} A${r} ${r} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
}

const CAP_SHEEN = `conic-gradient(from 200deg, ${RISO.ink} 0deg, ${mix(RISO.ink, RISO.paper, 0.26)} 38deg, ${RISO.ink} 92deg, ${mix(
  RISO.ink,
  RISO.paper,
  0.1,
)} 150deg, ${RISO.ink} 205deg, ${mix(RISO.ink, RISO.paper, 0.3)} 252deg, ${RISO.ink} 300deg, ${mix(RISO.ink, RISO.paper, 0.13)} 334deg, ${RISO.ink} 360deg)`;

/** Ticks + numerals are static; build them once. */
const TICKS = (() => {
  const major: string[] = [];
  const minor: string[] = [];
  for (let v = 0; v <= 10; v++) {
    const a = knobAngle(v);
    const [x0, y0] = polar(117, a);
    const [x1, y1] = polar(133, a);
    major.push(`M${x0.toFixed(2)} ${y0.toFixed(2)} L${x1.toFixed(2)} ${y1.toFixed(2)}`);
    if (v < 10) {
      const b = knobAngle(v + 0.5);
      const [m0, n0] = polar(124, b);
      const [m1, n1] = polar(133, b);
      minor.push(`M${m0.toFixed(2)} ${n0.toFixed(2)} L${m1.toFixed(2)} ${n1.toFixed(2)}`);
    }
  }
  const nums = Array.from({ length: 11 }, (_, v) => {
    const [x, y] = polar(148, knobAngle(v));
    return { v, x, y: y + 5 };
  });
  return { major: major.join(" "), minor: minor.join(" "), nums };
})();

const ELEVEN = polar(152, knobAngle(11.1));
/** A hand-drawn loop around the scrawled 11 (drawn on at the exit). */
const LOOP = `M${ELEVEN[0] - 24} ${ELEVEN[1] - 4} C${ELEVEN[0] - 26} ${ELEVEN[1] - 26}, ${ELEVEN[0] + 26} ${ELEVEN[1] - 30}, ${ELEVEN[0] + 27} ${
  ELEVEN[1] - 6
} C${ELEVEN[0] + 28} ${ELEVEN[1] + 18}, ${ELEVEN[0] - 20} ${ELEVEN[1] + 22}, ${ELEVEN[0] - 25} ${ELEVEN[1] + 2} C${ELEVEN[0] - 27} ${
  ELEVEN[1] - 8
}, ${ELEVEN[0] - 14} ${ELEVEN[1] - 22}, ${ELEVEN[0] + 2} ${ELEVEN[1] - 24}`;

export function Knob({
  refs,
  vol = 0,
  circled = 0,
  plate = RISO.cobalt,
  marker = RISO.pink,
}: {
  refs?: KnobRefs;
  vol?: number;
  circled?: number;
  plate?: string;
  marker?: string;
}) {
  const a = knobAngle(vol);
  const rot = `rotate(${a} ${C} ${C})`;
  const [tx0, ty0] = polar(30, 0);
  const [tx1, ty1] = polar(66, 0);
  return (
    <div ref={refs?.root} aria-hidden className="pointer-events-none absolute left-0 top-0" style={{ width: 300, height: 300, transformOrigin: "150px 150px", willChange: "transform" }}>
      <svg viewBox="0 0 300 300" width={300} height={300} overflow="visible" className="absolute inset-0">
        {/* misregistered colour plate under the knob */}
        <circle cx={C + 6} cy={C + 7} r={101} fill={plate} style={{ mixBlendMode: "multiply" }} />
        {/* printed scale */}
        <path d={arcPath(130, knobAngle(0), knobAngle(10))} fill="none" stroke={RISO.ink} strokeWidth={1.4} />
        <path d={TICKS.major} stroke={RISO.ink} strokeWidth={2.4} strokeLinecap="butt" />
        <path d={TICKS.minor} stroke={RISO.ink} strokeWidth={1.2} />
        {TICKS.nums.map((n) => (
          <text key={n.v} x={n.x} y={n.y} textAnchor="middle" fontSize={15} fill={RISO.ink} style={{ fontFamily: MONO, letterSpacing: "-0.02em" }}>
            {n.v}
          </text>
        ))}
        {/* the hand-drawn marker layer: scale extension, "11 ← (me)", the loop */}
        <g ref={refs?.marker} style={{ color: marker, mixBlendMode: "multiply" }}>
        <path
          d={`${arcPath(129, knobAngle(10) + 3, knobAngle(11) + 4)}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={3.4}
          strokeLinecap="round"
        />
        <path
          d={`M${polar(114, knobAngle(11)).join(" ")} L${polar(138, knobAngle(11) + 1.5).join(" ")}`}
          stroke="currentColor"
          strokeWidth={4.2}
          strokeLinecap="round"
        />
        <g aria-label={COPY.scrawl}>
          <text x={ELEVEN[0]} y={ELEVEN[1] + 13} textAnchor="middle" fontSize={40} fill="currentColor" transform={`rotate(-7 ${ELEVEN[0]} ${ELEVEN[1]})`} style={{ fontFamily: MARKER }}>
            11
          </text>
          {/* the arrow, drawn like a marker stroke (← isn't in the font) */}
          <path
            d={`M${ELEVEN[0] + 58} ${ELEVEN[1] + 1} C${ELEVEN[0] + 48} ${ELEVEN[1] + 3}, ${ELEVEN[0] + 38} ${ELEVEN[1] + 2}, ${ELEVEN[0] + 26} ${ELEVEN[1] + 3} M${ELEVEN[0] + 34} ${ELEVEN[1] - 5} L${ELEVEN[0] + 25} ${ELEVEN[1] + 3} L${ELEVEN[0] + 34} ${ELEVEN[1] + 10}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={3.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <text x={ELEVEN[0] + 64} y={ELEVEN[1] + 10} fontSize={22} fill="currentColor" transform={`rotate(-4 ${ELEVEN[0] + 64} ${ELEVEN[1]})`} style={{ fontFamily: MARKER }}>
            (me)
          </text>
        </g>
        <path
          ref={refs?.circle}
          d={LOOP}
          fill="none"
          stroke="currentColor"
          strokeWidth={3.4}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray="1 1"
          strokeDashoffset={1 - circled}
        />
        </g>
        {/* the knob: skirt + knurled edge */}
        <circle cx={C} cy={C} r={100} fill={RISO.ink} />
        <g ref={refs?.knurl} transform={rot}>
          <circle cx={C} cy={C} r={93} fill="none" stroke={mix(RISO.ink, RISO.paper, 0.32)} strokeWidth={9} strokeDasharray="4.06 4.06" />
          <rect x={C - 2.2} y={C - 99} width={4.4} height={15} rx={1.2} fill={RISO.paper} />
        </g>
      </svg>
      {/* machined cap — a fixed light, so the sheen does not rotate */}
      <div className="absolute rounded-full" style={{ left: C - 76, top: C - 76, width: 152, height: 152, background: CAP_SHEEN, boxShadow: `inset 0 0 0 1.5px ${alpha(RISO.paper, 0.14)}` }} />
      <svg viewBox="0 0 300 300" width={300} height={300} className="absolute inset-0">
        <circle cx={C} cy={C} r={46} fill="none" stroke={alpha(RISO.paper, 0.07)} strokeWidth={1} />
        <circle cx={C} cy={C} r={22} fill="none" stroke={alpha(RISO.paper, 0.09)} strokeWidth={1} />
        <g ref={refs?.pointer} transform={rot}>
          <path d={`M${tx0} ${ty0} L${tx1} ${ty1}`} stroke={RISO.paper} strokeWidth={7} strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
}
