/**
 * A static vinyl-sticker eye (SVG, no motion): almond in paper, chunky ink
 * outline, hard ink offset shadow, round iris. Used by the reduced-motion
 * composition. `look` is a unit-ish direction the iris points to.
 */

import { RISO } from "@/components/life/multiverse/palette";

const ALMOND = "M-38 0 Q0 -48 38 0 Q0 48 -38 0 Z";

export function StickerEye({
  x,
  y,
  size,
  look,
  iris = RISO.cobalt,
  closed = false,
}: {
  x: number;
  y: number;
  /** rendered width in the parent SVG's units */
  size: number;
  look: [number, number];
  iris?: string;
  closed?: boolean;
}) {
  const k = size / 84;
  const [lx, ly] = look;
  const ix = Math.max(-1, Math.min(1, lx)) * 11;
  const iy = Math.max(-1, Math.min(1, ly)) * 5;
  return (
    <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${k.toFixed(4)})`}>
      {closed ? (
        <>
          <path d="M-34 -2 Q0 26 34 -2" transform="translate(3 3.6)" fill="none" stroke={RISO.ink} strokeWidth={6} strokeLinecap="round" />
          <path d="M-34 -2 Q0 26 34 -2" fill="none" stroke={RISO.ink} strokeWidth={6} strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d={ALMOND} transform="translate(3 3.6)" fill={RISO.ink} />
          <path d={ALMOND} fill={RISO.paper} stroke={RISO.ink} strokeWidth={3.8} strokeLinejoin="round" />
          <circle cx={ix} cy={iy} r={15.2} fill={iris} />
          <circle cx={ix} cy={iy} r={6.8} fill={RISO.ink} />
          <circle cx={ix - 5} cy={iy - 5} r={3.4} fill={RISO.paper} />
        </>
      )}
    </g>
  );
}
