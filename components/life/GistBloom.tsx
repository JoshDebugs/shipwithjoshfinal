"use client";

/**
 * "here's the gist of it": the hero's last line, typed in a Times-style serif
 * while red roses and cobalt vines bloom through the letters. Each flower opens
 * as the letter under it is typed, all on the hero's scroll progress, so
 * scrolling back closes them again. Once open they sway a little.
 *
 * The composition is authored in the reference artwork's pixel space (text from
 * x=205 to x=1800 on a baseline at y=632) and mapped onto the real glyph
 * positions once the font has loaded. Everything is drawn in code.
 */

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useMotionValueEvent, type MotionValue } from "framer-motion";
import { Tinos } from "next/font/google";

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

const serif = Tinos({ subsets: ["latin"], weight: "400", display: "swap" });

const TEXT = "here's the gist of it";
const CHARS = [...TEXT];
const N = CHARS.length;
const FS = 100;

const RED = "#FF1A06";
const PETAL = "#FFA090";
const BLUE = "#3358FF";
const VEIN = "#0A0A0A";

/* ------------------------------------------------------------ composition */

/** Reference artwork space: where the text sits in it. */
const REF = { x0: 205, x1: 1800, base: 632 };

/**
 * Roses: centre x, centre y, width (reference px). Kept off the letters (the band
 * between the ascender line ~503 and the baseline 632) so the line stays readable:
 * they crown it from above and trail underneath.
 */
const ROSES: [number, number, number][] = [
  [300, 410, 64], [366, 422, 118], [158, 645, 56], [408, 668, 56], [506, 670, 60],
  [566, 460, 80], [790, 440, 120], [852, 458, 84], [720, 704, 72], [786, 724, 96],
  [892, 674, 62], [975, 482, 104], [1064, 446, 112], [1116, 392, 70], [1206, 452, 96],
  [1100, 724, 58], [1336, 444, 80], [1496, 462, 96], [1560, 456, 86], [1530, 682, 88],
  [1600, 696, 78], [1748, 466, 72], [1680, 668, 60], [1792, 672, 84],
];

/** The rose the first film portal grows out of (index into ROSES): the last big one, under "it". */
const ORIGIN_ROSE = 23;

/** Long vines (reference px), with leaf positions along them and an optional end curl. */
const TENDRILS: { pts: [number, number][]; leaves: number[]; curl?: 1 | -1 }[] = [
  { pts: [[80, 600], [128, 606], [168, 590], [196, 548], [232, 488], [284, 440]], leaves: [0.08, 0.16, 0.72] },
  { pts: [[1110, 420], [1180, 432], [1250, 472], [1300, 458], [1330, 446]], leaves: [0.28, 0.62] },
  { pts: [[1404, 650], [1418, 600], [1424, 548], [1440, 500], [1470, 470]], leaves: [0.85] },
  { pts: [[1612, 560], [1660, 520], [1722, 496], [1792, 504], [1838, 540]], leaves: [0.42], curl: 1 },
  { pts: [[1652, 646], [1626, 680], [1640, 716]], leaves: [], curl: -1 },
];

/* ---------------------------------------------------------------- helpers */

type P = [number, number];

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const q = (n: number) => Math.round(n * 10) / 10;
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeOutBack = (t: number) => {
  const c1 = 1.5;
  return 1 + (c1 + 1) * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
const smooth = (t: number) => t * t * (3 - 2 * t);

/** Scalloped, cloud-like rose silhouette centred on 0,0. */
function roseOutline(w: number, r: () => number) {
  const n = 7 + Math.floor(r() * 3);
  const rx = w / 2;
  const ry = w * 0.4;
  const phase = r() * Math.PI;
  const pts = Array.from({ length: n }, (_, k) => {
    const t = phase + (k / n) * Math.PI * 2;
    const j = 1 + (r() - 0.5) * 0.14;
    return [Math.cos(t) * rx * j, Math.sin(t) * ry * j, t] as const;
  });
  let d = `M${q(pts[0][0])} ${q(pts[0][1])}`;
  for (let k = 0; k < n; k++) {
    const b = pts[(k + 1) % n];
    const tm = pts[k][2] + Math.PI / n;
    const bulge = 1.2 + r() * 0.14;
    d += `Q${q(Math.cos(tm) * rx * bulge)} ${q(Math.sin(tm) * ry * bulge)} ${q(b[0])} ${q(b[1])}`;
  }
  return `${d}Z`;
}

/** The hand-drawn petal lines: a spiral bud, two cupping arcs and a scalloped lip. */
function roseLines(s: number, r: () => number) {
  const turns = 1.9 + r() * 0.7;
  const cx = (r() - 0.5) * 0.06 * s;
  const cy = -0.08 * s;
  const r0 = 0.012 * s;
  const r1 = 0.2 * s;
  const th0 = r() * Math.PI * 2;
  const dir = r() < 0.5 ? 1 : -1;
  let d = "";
  const steps = 34;
  for (let i = 0; i <= steps; i++) {
    const u = i / steps;
    const th = th0 + dir * u * turns * Math.PI * 2;
    const rr = r0 + (r1 - r0) * u;
    d += `${i ? "L" : "M"}${q(cx + Math.cos(th) * rr)} ${q(cy + Math.sin(th) * rr * 0.7)}`;
  }
  d += `M${q(-0.14 * s)} ${q(-0.25 * s)}Q${q(-0.37 * s)} ${q(-0.19 * s)} ${q(-0.33 * s)} ${q(0.05 * s)}`;
  d += `M${q(0.14 * s)} ${q(-0.25 * s)}Q${q(0.37 * s)} ${q(-0.19 * s)} ${q(0.33 * s)} ${q(0.05 * s)}`;
  const y0 = 0.16 * s;
  const x0 = -0.27 * s;
  const span = 0.54 * s;
  const humps = 3 + (r() < 0.4 ? 1 : 0);
  d += `M${q(x0)} ${q(y0)}`;
  for (let k = 0; k < humps; k++) {
    d += `Q${q(x0 + ((k + 0.5) / humps) * span)} ${q(y0 + 0.075 * s)} ${q(x0 + ((k + 1) / humps) * span)} ${q(y0)}`;
  }
  return d;
}

/** Almond leaf from its base (0,0) to its tip (0,-L). */
function leafPath(L: number) {
  const w = L * 0.34;
  return `M0 0C${q(w)} ${q(-L * 0.3)} ${q(w * 0.7)} ${q(-L * 0.82)} 0 ${q(-L)}C${q(-w * 0.7)} ${q(-L * 0.82)} ${q(-w)} ${q(-L * 0.3)} 0 0Z`;
}

/** Smooth Catmull-Rom curve through points, as cubic Béziers. */
function spline(pts: P[]) {
  let d = `M${q(pts[0][0])} ${q(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1: P = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: P = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${q(c1[0])} ${q(c1[1])} ${q(c2[0])} ${q(c2[1])} ${q(p2[0])} ${q(p2[1])}`;
  }
  return d;
}

/** Point and direction at fraction t along a polyline (by length). */
function along(pts: P[], t: number): { p: P; a: number } {
  const lens = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
  let target = lens.reduce((s, l) => s + l, 0) * t;
  for (let i = 0; i < lens.length; i++) {
    if (target <= lens[i] || i === lens.length - 1) {
      const k = lens[i] ? Math.min(1, target / lens[i]) : 0;
      const a = pts[i];
      const b = pts[i + 1];
      return { p: [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k], a: Math.atan2(b[1] - a[1], b[0] - a[0]) };
    }
    target -= lens[i];
  }
  return { p: pts[0], a: 0 };
}

/* ------------------------------------------------------------ layout build */

type Rose = { x: number; y: number; w: number; rot: number; outline: string; lines: string; lw: number; at: number; sway: number };
type Leaf = { x: number; y: number; a: number; d: string; vein: string; vw: number; at: number; sway: number };
type Vine = { d: string; at: number; to: number };

type Layout = {
  viewBox: [number, number, number, number];
  roses: Rose[];
  leaves: Leaf[];
  vines: Vine[];
  vineWidth: number;
  origin: P;
  /** start x and width of every character (user units) */
  chars: [number, number][];
};

function build(chars: [number, number][]): Layout {
  const x0 = chars[0][0];
  const x1 = chars[N - 1][0] + chars[N - 1][1];
  const s = (x1 - x0) / (REF.x1 - REF.x0);
  const X = (rx: number) => x0 + (rx - REF.x0) * s;
  const Y = (ry: number) => (ry - REF.base) * s;
  const M = ([rx, ry]: P): P => [X(rx), Y(ry)];

  // which character a horizontal position belongs to (for bloom timing)
  const centers = chars.map(([cx, w]) => cx + w / 2);
  const charAt = (x: number) => {
    let best = 0;
    for (let i = 1; i < N; i++) if (Math.abs(centers[i] - x) < Math.abs(centers[best] - x)) best = i;
    return best;
  };

  const r = rng(7);
  const roses: Rose[] = [];
  const leaves: Leaf[] = [];
  const vines: Vine[] = [];

  // the letters' band (x-height to baseline, across the line): leaves stay out of it
  const onText = ([x, y]: P) => x > X(195) && x < X(1810) && y > Y(540) && y < Y(640);
  const addLeaf = (p: P, angle: number, L: number, at: number) => {
    const rad = (angle * Math.PI) / 180;
    const tip: P = [p[0] + Math.sin(rad) * L, p[1] - Math.cos(rad) * L];
    const mid: P = [(p[0] + tip[0]) / 2, (p[1] + tip[1]) / 2];
    if (onText(p) || onText(mid) || onText(tip)) return;
    leaves.push({ x: p[0], y: p[1], a: angle, d: leafPath(L), vein: `M0 ${q(-L * 0.06)}L0 ${q(-L * 0.8)}`, vw: Math.max(0.6, L * 0.05), at, sway: r() });
  };

  // long vines
  for (const t of TENDRILS) {
    const pts = t.pts.map(M);
    let all = pts;
    if (t.curl) {
      const end = pts[pts.length - 1];
      const prev = pts[pts.length - 2];
      const a0 = Math.atan2(end[1] - prev[1], end[0] - prev[0]);
      const rad = 13 * s;
      const c: P = [end[0] + Math.cos(a0 + (t.curl * Math.PI) / 2) * rad, end[1] + Math.sin(a0 + (t.curl * Math.PI) / 2) * rad];
      const curl: P[] = [];
      for (let i = 1; i <= 9; i++) {
        const th = a0 - (t.curl * Math.PI) / 2 + t.curl * (i / 9) * Math.PI * 1.6;
        const rr = rad * (1 - i / 14);
        curl.push([c[0] + Math.cos(th) * rr, c[1] + Math.sin(th) * rr]);
      }
      all = [...pts, ...curl];
    }
    const at = charAt(Math.min(...pts.map((p) => p[0])));
    const to = charAt(Math.max(...pts.map((p) => p[0])));
    vines.push({ d: spline(all), at, to });
    for (const lt of t.leaves) {
      const { p, a } = along(pts, lt);
      const side = r() < 0.5 ? 1 : -1;
      const ang = (a * 180) / Math.PI + 90 + side * (40 + r() * 30);
      addLeaf(p, ang, (40 + r() * 22) * s, charAt(p[0]));
      if (r() < 0.45) addLeaf(p, ang - side * (70 + r() * 30), (32 + r() * 18) * s, charAt(p[0]));
    }
  }

  // roses, each on a short stem that just reaches the letters, with a leaf or two
  for (const [rx, ry, rw] of ROSES) {
    const w = rw * s;
    const [x, y] = M([rx, ry]);
    const at = charAt(x);
    const above = ry < 600;
    const start: P = [rx + (r() - 0.5) * rw * 0.3, ry + (above ? rw * 0.3 : -rw * 0.3)];
    const end: P = above ? [rx + (r() - 0.5) * 70, 548 + r() * 30] : [rx + (r() - 0.5) * 60, Math.max(636, ry - 50 - r() * 30)];
    const mid: P = [(start[0] + end[0]) / 2 + (r() - 0.5) * 50, (start[1] + end[1]) / 2];
    const stem = [start, mid, end].map(M);
    vines.push({ d: spline(stem), at, to: at });
    const nl = r() < 0.35 ? 2 : 1;
    for (let k = 0; k < nl; k++) {
      const { p, a } = along(stem, 0.25 + k * 0.3 + r() * 0.1);
      const side = k % 2 ? 1 : -1;
      addLeaf(p, (a * 180) / Math.PI + 90 + side * (45 + r() * 25), (34 + r() * 20) * s, at);
    }
    roses.push({ x, y, w, rot: (r() - 0.5) * 24, outline: roseOutline(w, r), lines: roseLines(w, r), lw: Math.max(0.7, 3 * s), at, sway: r() });
  }

  const left = X(60);
  const right = X(1860);
  const top = Y(330);
  const bottom = Y(790);
  return {
    viewBox: [left, top, right - left, bottom - top],
    roses,
    leaves,
    vines,
    vineWidth: Math.max(0.8, 4.8 * s),
    origin: M([ROSES[ORIGIN_ROSE][0], ROSES[ORIGIN_ROSE][1]]),
    chars,
  };
}

/** Close enough for the first frame, before the font has been measured. */
function estimateChars(): [number, number][] {
  let x = 0;
  return CHARS.map((c) => {
    const w = c === " " ? 25 : c === "'" ? 18 : c === "i" || c === "t" || c === "f" ? 30 : 46;
    const box: [number, number] = [x, w];
    x += w;
    return box;
  });
}

/* --------------------------------------------------------------- component */

export function GistBloom({
  progress,
  typeStart,
  typeEnd,
}: {
  progress: MotionValue<number>;
  typeStart: number;
  typeEnd: number;
}) {
  const textRef = useRef<SVGTextElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const charEls = useRef<(SVGTSpanElement | null)[]>([]);
  const roseEls = useRef<(SVGGElement | null)[]>([]);
  const roseLineEls = useRef<(SVGPathElement | null)[]>([]);
  const leafEls = useRef<(SVGGElement | null)[]>([]);
  const vineEls = useRef<(SVGPathElement | null)[]>([]);
  const [chars, setChars] = useState<[number, number][] | null>(null);
  const layout = useMemo(() => build(chars ?? estimateChars()), [chars]);

  // measure the real glyph positions once the serif has loaded
  useEffect(() => {
    let dead = false;
    const measure = () => {
      const t = textRef.current;
      if (!t || dead) return;
      try {
        const boxes = CHARS.map((_, i) => {
          const b = t.getExtentOfChar(i);
          return [b.x, b.width] as [number, number];
        });
        if (boxes[N - 1][0] + boxes[N - 1][1] - boxes[0][0] > 100) setChars(boxes);
      } catch {
        // not rendered yet: the estimate stands
      }
    };
    measure();
    document.fonts?.ready.then(measure);
    document.fonts?.addEventListener?.("loadingdone", measure);
    return () => {
      dead = true;
      document.fonts?.removeEventListener?.("loadingdone", measure);
    };
  }, []);

  const span = typeEnd - typeStart;
  const charTime = (i: number) => typeStart + (i / N) * span;
  // outside this window nothing moves, so repeat frames there are skipped
  const lo = typeStart - 0.02;
  const hi = typeEnd + 0.1;
  const last = useRef<number | null>(null);

  const apply = (p: number, force = false) => {
    const prev = last.current;
    last.current = p;
    if (!force && prev !== null && ((p < lo && prev < lo) || (p > hi && prev > hi))) return;
    for (let i = 0; i < N; i++) {
      const el = charEls.current[i];
      if (el) el.style.opacity = String(clamp01((p - charTime(i)) / 0.01));
    }
    layout.vines.forEach((v, i) => {
      const el = vineEls.current[i];
      if (!el) return;
      const a = charTime(v.at) - 0.012;
      const b = charTime(v.to) + 0.03;
      const g = clamp01((p - a) / (b - a));
      el.style.strokeDashoffset = String(1 - easeOut(g));
      // a zero-length dash still paints its round cap: hide until it grows
      el.style.opacity = g > 0 ? "1" : "0";
    });
    layout.leaves.forEach((l, i) => {
      const el = leafEls.current[i];
      if (!el) return;
      const e = easeOut(clamp01((p - charTime(l.at) - 0.012 - l.sway * 0.01) / 0.035));
      el.setAttribute("transform", `translate(${q(l.x)} ${q(l.y)}) rotate(${q(l.a - (1 - e) * 35)}) scale(${q(e * 100) / 100})`);
    });
    layout.roses.forEach((rs, i) => {
      const el = roseEls.current[i];
      if (!el) return;
      const b = clamp01((p - charTime(rs.at) - 0.006 - rs.sway * 0.012) / 0.05);
      const sc = b <= 0 ? 0 : easeOutBack(b);
      el.setAttribute("transform", `translate(${q(rs.x)} ${q(rs.y)}) rotate(${q(rs.rot - (1 - easeOut(b)) * 70)}) scale(${Math.round(sc * 1000) / 1000})`);
      const lines = roseLineEls.current[i];
      if (lines) {
        const d = clamp01((b - 0.3) / 0.7);
        lines.style.strokeDashoffset = String(1 - smooth(d));
        lines.style.opacity = d > 0 ? "1" : "0";
      }
    });
    // sway only once the line is out and on screen
    svgRef.current?.classList.toggle("gb-still", p < typeStart);
  };

  const applyRef = useRef(apply);
  applyRef.current = apply;
  // (re)apply before paint whenever the layout is rebuilt (first mount, font measured)
  useIsoLayoutEffect(() => {
    applyRef.current(progress.get(), true);
  }, [layout, progress]);
  useMotionValueEvent(progress, "change", (p) => applyRef.current(p));

  // pause the sway while the hero is off screen
  useEffect(() => {
    const el = svgRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => el.classList.toggle("gb-off", !e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const [vx, vy, vw, vh] = layout.viewBox;

  return (
    <h2 aria-label="Here's the gist of it." className="relative mx-auto w-full max-w-[1180px] select-none">
      <style>{`
        .gb-sway { transform-box: fill-box; animation: gb-sway var(--gb-d, 5s) ease-in-out var(--gb-dl, 0s) infinite alternate; }
        .gb-still .gb-sway, .gb-off .gb-sway { animation-play-state: paused; }
        @keyframes gb-sway { from { transform: rotate(calc(var(--gb-a, 3deg) * -1)); } to { transform: rotate(var(--gb-a, 3deg)); } }
        @media (prefers-reduced-motion: reduce) { .gb-sway { animation: none; } }
      `}</style>
      <svg
        ref={svgRef}
        viewBox={`${q(vx)} ${q(vy)} ${q(vw)} ${q(vh)}`}
        className="gb-still block h-auto w-full overflow-visible"
        aria-hidden
        focusable="false"
      >
        <text
          ref={textRef}
          x={0}
          y={0}
          fontSize={FS}
          fill="#fff"
          stroke="#fff"
          strokeWidth={1.5}
          strokeLinejoin="round"
          style={{ fontFamily: serif.style.fontFamily, paintOrder: "stroke" }}
        >
          {CHARS.map((c, i) => (
            <tspan
              key={i}
              ref={(el) => {
                charEls.current[i] = el;
              }}
              style={{ opacity: 0 }}
            >
              {c === " " ? " " : c}
            </tspan>
          ))}
        </text>

        <g fill="none" stroke={BLUE} strokeWidth={layout.vineWidth} strokeLinecap="round" strokeLinejoin="round">
          {layout.vines.map((v, i) => (
            <path
              key={i}
              ref={(el) => {
                vineEls.current[i] = el;
              }}
              d={v.d}
              pathLength={1}
              strokeDasharray="1 1"
              style={{ strokeDashoffset: 1, opacity: 0 }}
            />
          ))}
        </g>

        <g>
          {layout.leaves.map((l, i) => (
            <g
              key={i}
              ref={(el) => {
                leafEls.current[i] = el;
              }}
              transform={`translate(${q(l.x)} ${q(l.y)}) scale(0)`}
            >
              <g
                className="gb-sway"
                style={{ transformOrigin: "50% 100%", ["--gb-d" as string]: `${q(3.4 + l.sway * 2.6)}s`, ["--gb-dl" as string]: `${q(-l.sway * 4)}s`, ["--gb-a" as string]: `${q(4 + l.sway * 4)}deg` }}
              >
                <path d={l.d} fill={BLUE} />
                <path d={l.vein} stroke={VEIN} strokeWidth={l.vw} strokeLinecap="round" fill="none" />
              </g>
            </g>
          ))}
        </g>

        <g>
          {layout.roses.map((rs, i) => (
            <g
              key={i}
              ref={(el) => {
                roseEls.current[i] = el;
              }}
              transform={`translate(${q(rs.x)} ${q(rs.y)}) scale(0)`}
            >
              <g
                className="gb-sway"
                style={{ transformOrigin: "50% 85%", ["--gb-d" as string]: `${q(4.2 + rs.sway * 3)}s`, ["--gb-dl" as string]: `${q(-rs.sway * 5)}s`, ["--gb-a" as string]: `${q(2 + rs.sway * 2.5)}deg` }}
              >
                <path d={rs.outline} fill={RED} />
                <path
                  ref={(el) => {
                    roseLineEls.current[i] = el;
                  }}
                  d={rs.lines}
                  fill="none"
                  stroke={PETAL}
                  strokeWidth={rs.lw}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  pathLength={1}
                  strokeDasharray="1 1"
                  style={{ strokeDashoffset: 1, opacity: 0 }}
                />
              </g>
            </g>
          ))}
        </g>
      </svg>
      {/* where the life film's first portal (a mic) grows from: the last big rose */}
      <span
        data-gist-origin
        aria-hidden
        className="pointer-events-none absolute h-0 w-0"
        style={{ left: `${((layout.origin[0] - vx) / vw) * 100}%`, top: `${((layout.origin[1] - vy) / vh) * 100}%` }}
      />
    </h2>
  );
}
