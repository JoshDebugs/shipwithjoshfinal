/**
 * The room as flat, pre-composed SVG: the same three shadows the live scene
 * casts (JEE, IIT, the laptop), for the reduced-motion page and the no-WebGL
 * fallback. Glyph outlines match the shader's distance fields exactly.
 */

import { useId } from "react";
import { hash } from "@/components/life/multiverse/ease";
import { RISO, alpha, mix, overprint } from "@/components/life/multiverse/palette";
import { PORTAL_ICONS } from "@/components/life/multiverse/portalIcons";

export const WARM = mix(RISO.paper, RISO.sun, 0.1);
const AMBER = mix(RISO.ink, RISO.sun, 0.62);

/** Cap-height units (y up) → SVG path helpers for a glyph run placed at (x, base). */
function mapper(x: number, base: number, sx: number, sy: number) {
  const X = (u: number) => (x + u * sx).toFixed(2);
  const Y = (v: number) => (base - v * sy).toFixed(2);
  const poly = (pts: [number, number][]) => `M${pts.map(([u, v]) => `${X(u)} ${Y(v)}`).join("L")}Z`;
  return { X, Y, poly };
}

export function jeePath(x: number, base: number, sx: number, sy: number): string {
  const { X, Y, poly } = mapper(x, base, sx, sy);
  const j =
    `M${X(0.3081)} ${Y(1)}L${X(0.5097)} ${Y(1)}L${X(0.5097)} ${Y(0.2229)}` +
    `A${(0.2442 * sx).toFixed(2)} ${(0.2326 * sy).toFixed(2)} 0 0 1 ${X(0.0213)} ${Y(0.2229)}` +
    `L${X(0.0213)} ${Y(0.4709)}L${X(0.219)} ${Y(0.4709)}L${X(0.219)} ${Y(0.2229)}` +
    `A${(0.0445 * sx).toFixed(2)} ${(0.0485 * sy).toFixed(2)} 0 0 0 ${X(0.3081)} ${Y(0.2229)}Z`;
  const e = (o: number) =>
    poly([
      [o + 0.0446, 0],
      [o + 0.4574, 0],
      [o + 0.4574, 0.1957],
      [o + 0.2481, 0.1957],
      [o + 0.2481, 0.4225],
      [o + 0.436, 0.4225],
      [o + 0.436, 0.6124],
      [o + 0.2481, 0.6124],
      [o + 0.2481, 0.8062],
      [o + 0.4438, 0.8062],
      [o + 0.4438, 1],
      [o + 0.0446, 1],
    ]);
  return j + e(0.5422) + e(1.0208);
}

export function iitPath(x: number, base: number, sx: number, sy: number): string {
  const { poly } = mapper(x, base, sx, sy);
  const bar = (a: number, b: number) =>
    poly([
      [a, 0],
      [b, 0],
      [b, 1],
      [a, 1],
    ]);
  return (
    bar(0.0349, 0.2287) +
    bar(0.2983, 0.4921) +
    poly([
      [0.6566, 0],
      [0.8563, 0],
      [0.8563, 0.8062],
      [0.9745, 0.8062],
      [0.9745, 1],
      [0.5384, 1],
      [0.5384, 0.8062],
      [0.6566, 0.8062],
    ])
  );
}

/** PORTAL_ICONS.laptop in its 100×100 box, placed at (x, y) with side `size`. */
export function LaptopShadow({ x, y, size, fill = RISO.ink }: { x: number; y: number; size: number; fill?: string }) {
  return <g transform={`translate(${x} ${y}) scale(${size / 100})`} fill={fill} dangerouslySetInnerHTML={{ __html: PORTAL_ICONS.laptop.svg }} />;
}

/** The desk lamp, facing left, in the same silhouette as the portal it came through. */
export function LampSilhouette({ x, y, size }: { x: number; y: number; size: number }) {
  return (
    <g
      transform={`translate(${x + size} ${y}) scale(${-size / 100} ${size / 100})`}
      fill={mix(RISO.ink, RISO.paper, 0.04)}
      stroke={alpha(RISO.sun, 0.55)}
      strokeWidth={0.7}
      dangerouslySetInnerHTML={{ __html: PORTAL_ICONS.lamp.svg }}
    />
  );
}

/** A warm pool of lamplight on dark plaster. */
export function LightPool({ cx, cy, rx, ry, core = 0.62 }: { cx: number; cy: number; rx: number; ry: number; core?: number }) {
  const id = useId();
  return (
    <>
      <defs>
        <radialGradient id={id}>
          <stop offset="0" stopColor={WARM} />
          <stop offset={core} stopColor={WARM} />
          <stop offset={core + (1 - core) * 0.47} stopColor={AMBER} />
          <stop offset="1" stopColor={RISO.ink} stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={`url(#${id})`} />
    </>
  );
}

/** The desk: lit amber under the pile, falling to ink at the edges. */
export function Desk({ width, top, bottom, cx }: { width: number; top: number; bottom: number; cx: number }) {
  const id = useId();
  return (
    <>
      <defs>
        <radialGradient id={id} gradientUnits="userSpaceOnUse" cx={cx} cy={top} r={Math.max(width * 0.5, bottom - top)}>
          <stop offset="0" stopColor={mix(RISO.ink, RISO.sun, 0.5)} />
          <stop offset="0.7" stopColor={mix(RISO.ink, RISO.sun, 0.16)} />
          <stop offset="1" stopColor={RISO.ink} />
        </radialGradient>
      </defs>
      <rect x={0} y={top} width={width} height={bottom - top} fill={`url(#${id})`} />
      <rect x={0} y={top - 1} width={width} height={2} fill={alpha(RISO.ink, 0.55)} />
    </>
  );
}

const COVERS = [RISO.pink, RISO.cobalt, RISO.sun, RISO.teal, RISO.paper, RISO.pink, RISO.cobalt, overprint(RISO.pink, RISO.sun), RISO.teal, overprint(RISO.cobalt, RISO.teal)];

type BookRect = { x: number; y: number; w: number; h: number; cover: string; spine: boolean };

function layout(cx: number, base: number, width: number, height: number, columns: number, seed: number): BookRect[] {
  let n = seed;
  const rand = () => hash(n++ * 1.37 + 0.11);
  const gap = columns > 1 ? width / columns : width;
  const out: BookRect[] = [];
  // outside columns first, so the tall middle overlaps them
  const order = Array.from({ length: columns }, (_, i) => i - (columns - 1) / 2).sort((a, b) => Math.abs(b) - Math.abs(a));
  for (const j of order) {
    const edge = columns > 1 ? Math.abs(j) / ((columns - 1) / 2 || 1) : 0;
    const top = height * (1 - edge * edge * 0.72) * (0.92 + rand() * 0.08);
    const colX = cx + j * gap * 0.82;
    let y = 0;
    while (y < top) {
      const h = Math.max(5, height * (0.05 + rand() * 0.05));
      const w = (columns > 1 ? gap * 1.18 : width) * (0.74 + rand() * 0.26);
      const x = colX - w / 2 + (rand() - 0.5) * w * 0.12;
      y += h;
      out.push({ x, y: base - y, w, h: h - 0.6, cover: COVERS[Math.floor(rand() * COVERS.length)], spine: rand() > 0.5 });
    }
  }
  return out;
}

/** A pile of study books drawn flat: page edges with coloured boards, and the odd spine. */
export function BookPile({ cx, base, width, height, columns, seed = 3 }: { cx: number; base: number; width: number; height: number; columns: number; seed?: number }) {
  const books = layout(cx, base, width, height, columns, seed);
  return (
    <g>
      {books.map((b, i) => (
        <g key={i}>
          <rect x={b.x} y={b.y} width={b.w} height={b.h} fill={b.cover} />
          {b.spine ? (
            <>
              <rect x={b.x + b.w * 0.14} y={b.y} width={b.w * 0.05} height={b.h} fill={alpha(RISO.paper, 0.72)} />
              <rect x={b.x + b.w * 0.8} y={b.y} width={b.w * 0.05} height={b.h} fill={alpha(RISO.paper, 0.72)} />
            </>
          ) : (
            <>
              <rect x={b.x + 1.5} y={b.y + 1.4} width={b.w - 1.5} height={Math.max(1, b.h - 2.8)} fill={RISO.paper} />
              <rect x={b.x + 1.5} y={b.y + b.h * 0.42} width={b.w - 1.5} height={0.7} fill={alpha(RISO.ink, 0.28)} />
              <rect x={b.x + 1.5} y={b.y + b.h * 0.68} width={b.w - 1.5} height={0.7} fill={alpha(RISO.ink, 0.2)} />
            </>
          )}
        </g>
      ))}
    </g>
  );
}
