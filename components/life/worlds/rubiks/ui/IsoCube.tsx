/**
 * The cube as a flat isometric riso print (pure SVG, real text). Used by the
 * reduced-motion Static composition and as the no-WebGL fallback. Shows the
 * U, F and R faces of any cube state.
 */

import { RISO, alpha } from "@/components/life/multiverse/palette";
import { facelets, type CubeState, type FaceId } from "../lib/cube";
import { PRINTS, type StickerPrint } from "../lib/script";
import { STICKER, STICKER_RADIUS, TYPE_SIZE, CAP_FALLBACK, patternInk } from "../lib/print";

const C30 = Math.cos(Math.PI / 6);
/** Isometric projection of cube coords (x = R, y = U, z = F), unit = one cubie. */
const P = (x: number, y: number, z: number): [number, number] => [(x - z) * C30, (x + z) * 0.5 - y];

type FaceGeo = { origin: [number, number, number]; right: [number, number, number]; down: [number, number, number] };
const GEO: Partial<Record<FaceId, FaceGeo>> = {
  U: { origin: [-1.5, 1.5, -1.5], right: [1, 0, 0], down: [0, 0, 1] },
  F: { origin: [-1.5, 1.5, 1.5], right: [1, 0, 0], down: [0, -1, 0] },
  R: { origin: [1.5, 1.5, 1.5], right: [0, 0, -1], down: [0, -1, 0] },
};

function Pattern({ print, id }: { print: StickerPrint; id: string }) {
  const c = patternInk(print.ink);
  switch (print.ink.pattern) {
    case "grid":
      return (
        <pattern id={id} width={1 / 6} height={1 / 6} patternUnits="userSpaceOnUse">
          <path d={`M${1 / 6} 0 V${1 / 6} M0 ${1 / 6} H${1 / 6}`} stroke={c} strokeWidth={0.006} fill="none" />
        </pattern>
      );
    case "dots":
      return (
        <pattern id={id} width={1 / 9} height={1 / 9} patternUnits="userSpaceOnUse">
          <circle cx={1 / 18} cy={1 / 18} r={0.018} fill={c} />
        </pattern>
      );
    case "pinstripe":
      return (
        <pattern id={id} width={1 / 9} height={1 / 9} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width={0.011} height={1 / 9} fill={c} />
        </pattern>
      );
    case "checker":
      return (
        <pattern id={id} width={1 / 4} height={1 / 4} patternUnits="userSpaceOnUse">
          <rect width={1 / 8} height={1 / 8} fill={c} />
          <rect x={1 / 8} y={1 / 8} width={1 / 8} height={1 / 8} fill={c} />
        </pattern>
      );
    case "zigzag":
      return (
        <pattern id={id} width={0.2} height={1 / 7} patternUnits="userSpaceOnUse">
          <path d={`M0 ${1 / 14} L0.1 ${1 / 14 - 0.03} L0.2 ${1 / 14}`} stroke={c} strokeWidth={0.013} fill="none" />
        </pattern>
      );
    case "grain":
      return (
        <pattern id={id} width={0.23} height={0.19} patternUnits="userSpaceOnUse">
          <circle cx={0.05} cy={0.06} r={0.009} fill={c} />
          <circle cx={0.16} cy={0.03} r={0.007} fill={c} />
          <circle cx={0.12} cy={0.14} r={0.01} fill={c} />
        </pattern>
      );
  }
}

export function IsoCube({ state, size, cap = CAP_FALLBACK, idPrefix = "iso", title }: { state: CubeState; size: number; cap?: number; idPrefix?: string; title?: string }) {
  const f = facelets(state);
  const S = size / 5.6; // px per cubie
  const fs = TYPE_SIZE * STICKER;
  const pad = (1 - STICKER) / 2;
  // silhouette hexagon
  const hex = [P(-1.5, 1.5, -1.5), P(1.5, 1.5, -1.5), P(1.5, -1.5, -1.5), P(1.5, -1.5, 1.5), P(-1.5, -1.5, 1.5), P(-1.5, 1.5, 1.5)];
  const minX = -3 * C30 - 0.1;
  const minY = -3 - 0.1;
  const vb = `${minX} ${minY} ${6 * C30 + 0.5} ${6 + 0.5}`;
  return (
    <svg viewBox={vb} width={S * (6 * C30 + 0.5)} height={S * 6.5} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <polygon points={hex.map(([x, y]) => `${x + 0.16},${y + 0.2}`).join(" ")} fill={alpha(RISO.ink, 0.18)} />
      <polygon points={hex.map(([x, y]) => `${x},${y}`).join(" ")} fill={RISO.ink} stroke={RISO.ink} strokeWidth={0.06} strokeLinejoin="round" />
      {(Object.keys(GEO) as FaceId[]).map((face) => {
        const g = GEO[face]!;
        const o = P(...g.origin);
        const r = P(g.origin[0] + g.right[0], g.origin[1] + g.right[1], g.origin[2] + g.right[2]);
        const d = P(g.origin[0] + g.down[0], g.origin[1] + g.down[1], g.origin[2] + g.down[2]);
        const m = [r[0] - o[0], r[1] - o[1], d[0] - o[0], d[1] - o[1], o[0], o[1]].map((v) => +v.toFixed(5)).join(" ");
        return (
          <g key={face} transform={`matrix(${m})`}>
            {f[face].map((fl, i) => {
              const col = i % 3;
              const row = Math.floor(i / 3);
              const pr = PRINTS[fl.sticker];
              const pid = `${idPrefix}-${face}-${i}`;
              return (
                <g key={i} transform={`translate(${col + pad} ${row + pad})`}>
                  <defs>
                    <Pattern print={pr} id={pid} />
                  </defs>
                  <rect width={STICKER} height={STICKER} rx={STICKER * STICKER_RADIUS} fill={pr.ink.bg} />
                  <rect width={STICKER} height={STICKER} rx={STICKER * STICKER_RADIUS} fill={`url(#${pid})`} />
                  {pr.mark ? (
                    <circle cx={STICKER / 2} cy={STICKER / 2} r={0.07} fill={alpha(pr.ink.fg, 0.85)} />
                  ) : (
                    <text
                      transform={`rotate(${fl.turn * 90} ${STICKER / 2} ${STICKER / 2})`}
                      x={STICKER / 2}
                      y={STICKER / 2 + (cap * fs) / 2}
                      textAnchor="middle"
                      fontSize={fs}
                      fill={pr.ink.fg}
                      xmlSpace="preserve"
                      style={{ fontFamily: "var(--f-rubik-mono)", whiteSpace: "pre" }}
                    >
                      {pr.text}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}
