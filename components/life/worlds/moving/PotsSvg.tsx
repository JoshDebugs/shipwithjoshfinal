"use client";

/**
 * Repotted — the glazed house pots (cutaway), shards, the split, the empty
 * frame of the in-between, and the sprout. Static markup in plant units; the
 * world's ticker only rewrites a handful of transforms per frame.
 */

import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import { POTS, offsetPolygon, polyPath, rng, shardsOf, type Pot, type Pt } from "./geometry";
import { GLAZE, INK, LEAF, LEAF_LIT, LEAF_SHADE, PAPER, STEM, alpha, mix } from "./colors";
import { LEAF_PATH, LEAF_RIB, LEAVES } from "./plant";

export type PotsHandle = {
  root: SVGSVGElement | null;
  pots: (SVGGElement | null)[];
  shards: (SVGGElement | null)[];
  shardGroup: SVGGElement | null;
  halves: (SVGGElement | null)[];
  crack: SVGGElement | null;
  crack2: SVGGElement | null;
  ghost: SVGGElement | null;
  plant: SVGGElement | null;
  stem: SVGPathElement | null;
  buried: SVGPathElement | null;
  leaves: (SVGGElement | null)[];
  falling: (SVGGElement | null)[];
  leafStops: (SVGStopElement | null)[];
  stemPaint: (c: string) => void;
};

export const SHARDS = shardsOf(POTS[1], 24, rng(0x5a));

/** Left side + roof of the outer wall, inset: the glossy highlight streak. */
function shinePath(pot: Pot): string {
  const o = offsetPolygon(pot.inner, pot.wall * 0.5);
  // from bottom-left up the left wall, then along the roof to just past the first peak
  const pts: Pt[] = [];
  const n = o.length;
  pts.push([o[0][0], o[0][1] - (o[0][1] - o[1][1]) * 0.12]);
  pts.push(o[1]);
  const second = o[2];
  const k = pot.kind === "flat" ? 0.4 : 0.82;
  pts.push([o[1][0] + (second[0] - o[1][0]) * k, o[1][1] + (second[1] - o[1][1]) * k]);
  void n;
  return polyPath(pts, false);
}

function PotArt({ pot }: { pot: Pot }) {
  const g = GLAZE[pot.index];
  const band = `${polyPath(pot.outer)} ${polyPath(pot.inner)}`;
  const [cx0, cy0, cx1, cy1] = pot.chimney;
  const w = pot.wall;
  return (
    <>
      <rect x={cx0} y={cy0} width={cx1 - cx0} height={cy1 - cy0} fill={`url(#mv-glaze-${pot.index})`} />
      <rect x={cx0 - w * 0.25} y={cy0 - w * 0.4} width={cx1 - cx0 + w * 0.5} height={w * 0.55} rx={w * 0.12} fill={g.light} />
      <rect x={cx0 + (cx1 - cx0) * 0.18} y={cy0 + w * 0.3} width={(cx1 - cx0) * 0.16} height={(cy1 - cy0) * 0.55} rx={w * 0.05} fill={g.shine} opacity={0.6} />
      <path d={band} fill={`url(#mv-glaze-${pot.index})`} fillRule="evenodd" />
      {/* cut face rim: dark inner edge gives the cutaway its depth */}
      <path d={polyPath(pot.inner)} fill="none" stroke={g.rim} strokeWidth={w * 0.2} strokeLinejoin="round" />
      <path d={polyPath(offsetPolygon(pot.inner, w * 0.16))} fill="none" stroke={alpha(INK, 0.22)} strokeWidth={w * 0.08} strokeLinejoin="round" />
      <path d={polyPath(pot.outer)} fill="none" stroke={alpha(INK, 0.35)} strokeWidth={w * 0.07} strokeLinejoin="round" />
      <path d={shinePath(pot)} fill="none" stroke={g.shine} strokeWidth={w * 0.2} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${w * 6} ${w * 0.9} ${w * 1.4} ${w * 0.9}`} />
      <circle cx={pot.outer[1][0] + w * 0.75} cy={pot.outer[1][1] + w * 2.2} r={w * 0.16} fill={g.shine} />
    </>
  );
}

export const PotsSvg = forwardRef<PotsHandle, { width: number; height: number }>(function PotsSvg({ width, height }, ref) {
  const root = useRef<SVGSVGElement>(null);
  const pots = useRef<(SVGGElement | null)[]>([]);
  const shards = useRef<(SVGGElement | null)[]>([]);
  const shardGroup = useRef<SVGGElement>(null);
  const halves = useRef<(SVGGElement | null)[]>([]);
  const crack = useRef<SVGGElement>(null);
  const crack2 = useRef<SVGGElement>(null);
  const ghost = useRef<SVGGElement>(null);
  const plant = useRef<SVGGElement>(null);
  const stem = useRef<SVGPathElement>(null);
  const buried = useRef<SVGPathElement>(null);
  const leaves = useRef<(SVGGElement | null)[]>([]);
  const falling = useRef<(SVGGElement | null)[]>([]);
  const leafStops = useRef<(SVGStopElement | null)[]>([]);

  useImperativeHandle(ref, () => ({
    get root() {
      return root.current;
    },
    pots: pots.current,
    shards: shards.current,
    get shardGroup() {
      return shardGroup.current;
    },
    halves: halves.current,
    get crack() {
      return crack.current;
    },
    get crack2() {
      return crack2.current;
    },
    get ghost() {
      return ghost.current;
    },
    get plant() {
      return plant.current;
    },
    get stem() {
      return stem.current;
    },
    get buried() {
      return buried.current;
    },
    leaves: leaves.current,
    falling: falling.current,
    leafStops: leafStops.current,
    stemPaint: (c: string) => {
      stem.current?.setAttribute("stroke", c);
    },
  }));

  const ghostD = useMemo(() => polyPath(POTS[3].outer), []);
  const p5 = POTS[4];

  return (
    <svg ref={root} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" viewBox={`0 0 ${Math.max(1, width)} ${Math.max(1, height)}`} preserveAspectRatio="none">
      <defs>
        {GLAZE.map((g, i) => (
          <linearGradient key={i} id={`mv-glaze-${i}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={g.light} />
            <stop offset="0.38" stopColor={g.base} />
            <stop offset="0.8" stopColor={mix(g.base, g.dark, 0.6)} />
            <stop offset="1" stopColor={g.dark} />
          </linearGradient>
        ))}
        <linearGradient id="mv-leaf" x1="0" y1="0" x2="0" y2="1">
          <stop ref={(el) => void (leafStops.current[0] = el)} offset="0" stopColor={LEAF_LIT} />
          <stop ref={(el) => void (leafStops.current[1] = el)} offset="0.55" stopColor={LEAF} />
          <stop ref={(el) => void (leafStops.current[2] = el)} offset="1" stopColor={LEAF_SHADE} />
        </linearGradient>
        <clipPath id="mv-half-l">
          <rect x={-10} y={-10} width={10} height={20} />
        </clipPath>
        <clipPath id="mv-half-r">
          <rect x={0} y={-10} width={10} height={20} />
        </clipPath>
      </defs>

      {/* the in-between: an empty frame where the next home will be */}
      <g ref={ghost} opacity={0}>
        <path d={ghostD} fill="none" stroke={alpha(PAPER, 0.42)} strokeWidth={0.018} strokeDasharray="0.06 0.07" strokeLinejoin="round" />
      </g>

      {POTS.map((pot, k) =>
        k === 4 ? null : (
          <g key={k} ref={(el) => void (pots.current[k] = el)} style={{ display: "none" }}>
            <PotArt pot={pot} />
          </g>
        ),
      )}

      <g ref={crack2} style={{ display: "none" }}>
        {SHARDS.map((sh, i) => {
          const a = sh.poly[0];
          const j = sh.poly[sh.poly.length - 1];
          const o = sh.poly[sh.poly.length - 2];
          return <path key={i} d={`M${a[0]} ${a[1]} L${j[0]} ${j[1]} L${o[0]} ${o[1]}`} fill="none" stroke={alpha(INK, 0.85)} strokeWidth={0.012} strokeLinecap="round" strokeLinejoin="round" />;
        })}
      </g>
      <g ref={shardGroup} style={{ display: "none" }}>
        {SHARDS.map((s, i) => (
          <g key={i} ref={(el) => void (shards.current[i] = el)}>
            <path d={polyPath(s.poly)} fill={`url(#mv-glaze-1)`} stroke={alpha(INK, 0.3)} strokeWidth={0.008} strokeLinejoin="round" />
          </g>
        ))}
      </g>

      {/* pot 05: whole until it splits, then two halves */}
      <g ref={(el) => void (pots.current[4] = el)} style={{ display: "none" }}>
        <PotArt pot={p5} />
      </g>
      {[0, 1].map((h) => (
        <g key={h} ref={(el) => void (halves.current[h] = el)} style={{ display: "none" }}>
          <g clipPath={`url(#mv-half-${h ? "r" : "l"})`}>
            <PotArt pot={p5} />
          </g>
        </g>
      ))}
      <g ref={crack} style={{ display: "none" }}>
        <path
          d={`M0 ${p5.top - p5.wall - 0.02} l0.03 0.05 l-0.04 0.05 l0.03 0.06 M0 ${p5.bottom + p5.wall + 0.02} l-0.03 -0.05 l0.04 -0.05 l-0.03 -0.06`}
          fill="none"
          stroke={INK}
          strokeWidth={0.016}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      {/* the sprout */}
      <g ref={plant}>
        <path ref={buried} fill="none" stroke={alpha(mix(STEM, INK, 0.3), 0.9)} strokeLinecap="round" />
        <path ref={stem} fill="none" stroke={STEM} strokeLinecap="round" strokeLinejoin="round" />
        {LEAVES.map((_, i) => (
          <g key={i} ref={(el) => void (leaves.current[i] = el)} style={{ display: "none" }}>
            <path d={LEAF_PATH} fill="url(#mv-leaf)" />
            <path d={LEAF_RIB} fill="none" stroke={alpha(INK, 0.28)} strokeWidth={0.035} strokeLinecap="round" />
          </g>
        ))}
      </g>
      {[0, 1, 2, 3].map((i) => (
        <g key={i} ref={(el) => void (falling.current[i] = el)} style={{ display: "none" }}>
          <path d={LEAF_PATH} fill="url(#mv-leaf)" />
          <path d={LEAF_RIB} fill="none" stroke={alpha(INK, 0.28)} strokeWidth={0.035} strokeLinecap="round" />
        </g>
      ))}
    </svg>
  );
});
