"use client";

/**
 * 06 · Moving homes — "Repotted".
 *
 * A sprout is lifted out of five house-shaped pots. Every move it droops
 * (and so does the headline), then regrows to fill the new shape. When the
 * last pot splits and the soil falls away, the root ball holds all five homes
 * nested inside it like tree rings. Then the rings pixelate into blocks that
 * build the next world's floating island — the portal is born from it.
 *
 * Layers (back → front): ground + vignette · back canvas (glow, specks, rain,
 * headline roots) · DOM title/headline · main canvas (soil, roots, falling
 * soil, blocks) · SVG (pots, sprout) · DOM tag, captions, quote, ring labels.
 */

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { usePointer, usePortalOrigin, useStage, useTicker, useWorld } from "@/components/life/multiverse/runtime";
import { backOut, bell, clamp, easeInOutCubic, easeOutCubic, lerp, range, smoothstep } from "@/components/life/multiverse/ease";
import type { WorldProps } from "@/components/life/multiverse/types";
import { POTS, nearestOnOutline } from "./geometry";
import { getRoots, makeGrit, peekRoots } from "./roots";
import { BEAT, SceneBuilder, makeLayout, toScreen, type Scene } from "./timeline";
import { Painter } from "./painter";
import { PotsSvg, SHARDS, type PotsHandle } from "./PotsSvg";
import { fallingLeaves, plantPose, stemPath } from "./plant";
import { buildHeadRoots, type GlyphBox } from "./headRoots";
import { HOME_INK, INK, LEAF, LEAF_LIT, LEAF_SHADE, LEAF_SICK, LEAF_SICK_LIT, PAPER, RISO, STEM, STEM_SICK, VOID, alpha, mix } from "./colors";
import { FRAUNCES, MONO, HAND, HEAD_LINES, QUOTE } from "./copy";

const RAD = 180 / Math.PI;

/** Letters per headline line (for the slump curve). */
const LINE_COUNTS = {
  desktop: HEAD_LINES.desktop.map((ln) => ln.join("").length),
  mobile: HEAD_LINES.mobile.map((ln) => ln.join("").length),
};

export default function MovingWorld({ progress }: WorldProps) {
  const stage = useStage();
  const { meta } = useWorld();
  const origin = usePortalOrigin();
  const ptr = usePointer();
  const { width: W, height: H, isMobile: mobile, lowPower } = stage;
  const tier = lowPower ? "lo" : "hi";

  const layout = useMemo(() => makeLayout(Math.max(1, W), Math.max(1, H), mobile), [W, H, mobile]);
  const builder = useMemo(() => new SceneBuilder(layout), [layout]);

  const backRef = useRef<HTMLCanvasElement>(null);
  const mainRef = useRef<HTMLCanvasElement>(null);
  const painterRef = useRef<Painter | null>(null);
  const svgRef = useRef<PotsHandle>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const letters = useRef<(HTMLSpanElement | null)[]>([]);
  const cap1 = useRef<HTMLParagraphElement>(null);
  const cap2 = useRef<HTMLParagraphElement>(null);
  const tagWrap = useRef<HTMLDivElement>(null);
  const tag = useRef<HTMLDivElement>(null);
  const tagHome = useRef<HTMLSpanElement>(null);
  const tagNote = useRef<HTMLParagraphElement>(null);
  const tagTally = useRef<HTMLSpanElement>(null);
  const quoteA = useRef<HTMLParagraphElement>(null);
  const quoteB = useRef<HTMLParagraphElement>(null);
  const words = useRef<(HTMLSpanElement | null)[]>([]);
  const markers = useRef<(HTMLButtonElement | null)[]>([]);
  const markerLabels = useRef<(HTMLSpanElement | null)[]>([]);
  const grain = useRef<HTMLDivElement>(null);

  // interaction + per-frame state (never React state)
  const live = useRef({
    focus: [1, 1, 1, 1, 1],
    forced: -1,
    hover: -1,
    tagRot: 0,
    tagVel: 0,
    lastHome: -2,
    pop: 0,
    lastTally: -1,
    lastFrame: 0,
    letterW: [] as number[],
    letterKey: "",
    lastWght: [] as number[],
    plantCells: null as { x: number; y: number; c: string }[] | null,
    plantCellsKey: "",
    grainStep: 0,
  });
  const [ready, setReady] = useState(false);

  /* ------------------------------------------------------------ painter */
  useEffect(() => {
    const m = mainRef.current?.getContext("2d");
    const b = backRef.current?.getContext("2d");
    if (!m || !b) return;
    painterRef.current = new Painter(m, b, lowPower);
    setReady(true);
    return () => {
      painterRef.current = null;
    };
  }, [lowPower]);

  useEffect(() => {
    const pt = painterRef.current;
    if (!pt || !W || !H) return;
    const dpr = Math.min(typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1, lowPower ? 1.25 : 2);
    pt.resize(W, H, dpr, layout);
    live.current.plantCells = null;
  }, [ready, W, H, layout, lowPower]);

  // grow the roots once (fixed seed), off the critical path
  useEffect(() => {
    if (!ready) return;
    const pt = painterRef.current;
    if (!pt) return;
    const cached = peekRoots(tier);
    if (cached) {
      pt.roots = cached;
      pt.grit = makeGrit(tier);
      return;
    }
    const run = () => {
      if (!painterRef.current) return;
      painterRef.current.roots = getRoots(tier);
      painterRef.current.grit = makeGrit(tier);
    };
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(run, { timeout: 600 });
      return () => w.cancelIdleCallback?.(id);
    }
    const id = window.setTimeout(run, 30);
    return () => window.clearTimeout(id);
  }, [ready, tier]);

  /* ------------------------------------------- headline: fixed-width letters + roots */
  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    const head = headRef.current;
    const els = letters.current.filter(Boolean) as HTMLSpanElement[];
    if (!head || !els.length) return;
    const measure = async () => {
      const fam = getComputedStyle(els[0]).fontFamily;
      const size = parseFloat(getComputedStyle(els[0]).fontSize);
      try {
        await document.fonts.load(`900 ${size}px ${fam}`, "5 homes in 3 years.");
        await document.fonts.ready;
      } catch {
        /* fall through with whatever font is there */
      }
      if (cancelled) return;
      // measure every letter at full weight, then lock its width so slumping never reflows
      for (const el of els) {
        el.style.width = "";
        el.style.transform = "";
        el.style.fontVariationSettings = `"wght" 900, "SOFT" 100, "WONK" 1, "opsz" 144`;
      }
      const widths = els.map((el) => el.getBoundingClientRect().width);
      els.forEach((el, i) => (el.style.width = `${widths[i]}px`));
      live.current.letterW = widths;
      live.current.lastWght = els.map(() => -1);
      // glyph boxes in stage px (layout positions, ignoring transforms)
      const root = head.offsetParent as HTMLElement | null;
      const glyphs: GlyphBox[] = els.map((el) => {
        let x = 0;
        let y = 0;
        let n: HTMLElement | null = el;
        while (n && n !== root) {
          x += n.offsetLeft;
          y += n.offsetTop;
          n = n.offsetParent as HTMLElement | null;
        }
        const cs = getComputedStyle(el);
        return { ch: el.textContent ?? "", x, y, w: el.offsetWidth, h: el.offsetHeight, lineHeight: parseFloat(cs.lineHeight) || el.offsetHeight, size: parseFloat(cs.fontSize), family: cs.fontFamily, weight: 900 };
      });
      const build = () => {
        if (cancelled || !painterRef.current) return;
        painterRef.current.head = buildHeadRoots(glyphs, lowPower);
      };
      const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
      if (w.requestIdleCallback) w.requestIdleCallback(build, { timeout: 900 });
      else window.setTimeout(build, 40);
    };
    void measure();
    return () => {
      cancelled = true;
    };
  }, [ready, W, H, mobile, lowPower]);

  /* --------------------------------------------------------------- frame */
  const frame = (time: number, dt: number) => {
    const pt = painterRef.current;
    const svg = svgRef.current;
    if (!pt || !svg || !W || !H) return;
    const L = live.current;
    const p = clamp(progress.get());
    // the idle-time precompute normally lands long before this; never draw a pot without its roots
    if (!pt.roots && p > 0.05) {
      pt.roots = getRoots(tier);
      pt.grit = makeGrit(tier);
    }
    const s = builder.build(p, time);

    // ring hover / isolation (hero only)
    const heroOn = p >= BEAT.labels[0] - 0.01 && p < BEAT.voxel[0];
    let hover = -1;
    if (heroOn && ptr.inside.get() > 0.5 && ptr.type.current === "mouse") hover = ringAt(s, ptr.x.get(), ptr.y.get());
    L.hover = hover;
    const activeRing = heroOn ? (L.forced >= 0 ? L.forced : hover) : -1;
    const kf = 1 - Math.exp(-dt * 9);
    for (let k = 0; k < 5; k++) {
      const target = activeRing < 0 ? 1 : k === activeRing ? 1.15 : 0.13;
      L.focus[k] += (target - L.focus[k]) * kf;
    }

    // plant pose (also feeds the blocks of the exit)
    const pose = plantPose(p, time, s.vigor, s.scale, s.apex, s.sproutLen);
    if (p >= BEAT.voxel[0] - 0.01 && L.plantCellsKey !== `${W}x${H}`) {
      L.plantCells = plantCellsFor(builder, pt, BEAT.voxel[0]);
      L.plantCellsKey = `${W}x${H}`;
    }

    pt.paintBack(s, time);
    pt.paintMain({ scene: s, t: time, ringFocus: L.focus, plantCells: L.plantCells });
    applySvg(svg, s, pose, p, time);
    applyDom(s, p, time, dt, pose);
  };

  useTicker(frame);

  /* ------------------------------------------------------------- helpers */

  function ringAt(s: Scene, sx: number, sy: number): number {
    // screen → plant space (undo camera, then plant sway)
    const wx = (sx - s.cam.fx) / s.cam.S + s.cam.wx;
    const wy = (sy - s.cam.fy) / s.cam.S + s.cam.wy;
    const { tx, ty, rot, ox, oy } = s.plant;
    const c = Math.cos(-rot);
    const n = Math.sin(-rot);
    const x = c * (wx - tx - ox) - n * (wy - ty - oy) + ox;
    const y = n * (wx - tx - ox) + c * (wy - ty - oy) + oy;
    let best = -1;
    let bd = 18 / s.cam.S;
    for (let k = 0; k < 5; k++) {
      const d = nearestOnOutline(x, y, POTS[k].inner).d;
      if (d < bd) {
        bd = d;
        best = k;
      }
    }
    return best;
  }

  function applySvg(svg: PotsHandle, s: Scene, pose: ReturnType<typeof plantPose>, p: number, time: number) {
    const { S, wx, wy, fx, fy } = s.cam;
    const cam = `matrix(${S} 0 0 ${S} ${fx - wx * S} ${fy - wy * S})`;
    const exitFade = 1 - range(p, BEAT.voxel[0], BEAT.voxel[1] - 0.01);

    for (let k = 0; k < 5; k++) {
      const g = svg.pots[k];
      if (!g) continue;
      const pose5 = s.pots[k];
      if (!pose5.show) {
        if (g.style.display !== "none") g.style.display = "none";
        continue;
      }
      g.style.display = "";
      g.setAttribute("transform", `${cam} translate(${pose5.tx} ${pose5.ty}) rotate(${pose5.rot * RAD} ${pose5.ox} ${pose5.oy})`);
      g.setAttribute("opacity", String(pose5.alpha));
    }

    // pot 02 cracks, then shatters into glazed shards
    if (svg.crack2) {
      const on = s.shatter >= 0 && s.shatter <= 0.12;
      svg.crack2.style.display = on ? "" : "none";
      if (on) {
        svg.crack2.setAttribute("transform", cam);
        svg.crack2.setAttribute("opacity", String(range(s.shatter, 0, 0.08)));
      }
    }
    if (svg.shardGroup) {
      if (s.shatter >= 0 && s.shatter > 0.12) {
        svg.shardGroup.style.display = "";
        svg.shardGroup.setAttribute("transform", cam);
        const u = range(s.shatter, 0.12, 1);
        const tau = u * 1.5;
        SHARDS.forEach((sh, i) => {
          const el = svg.shards[i];
          if (!el) return;
          const r1 = Math.sin(i * 12.9898) * 43758.5453;
          const rnd = r1 - Math.floor(r1);
          const r2 = Math.sin(i * 78.233) * 12543.123;
          const rnd2 = r2 - Math.floor(r2);
          // burst outward from the pot's middle, then fall
          const vx = sh.cx * (0.55 + rnd * 0.6) + (rnd2 - 0.5) * 0.35;
          const vy = (sh.cy - 0.1) * (0.35 + rnd2 * 0.3) - 0.55 - rnd * 0.45;
          const x = vx * tau;
          const y = vy * tau + 2.4 * tau * tau;
          const rot = (rnd - 0.5) * 300 * tau;
          el.setAttribute("transform", `translate(${x} ${y}) rotate(${rot} ${sh.cx} ${sh.cy})`);
          el.setAttribute("opacity", String(1 - range(u, 0.6, 1)));
        });
      } else if (svg.shardGroup.style.display !== "none") svg.shardGroup.style.display = "none";
    }

    // pot 05 splits along its seam
    for (let h = 0; h < 2; h++) {
      const g = svg.halves[h];
      if (!g) continue;
      const hp = s.halves[h];
      if (!hp.show) {
        if (g.style.display !== "none") g.style.display = "none";
        continue;
      }
      g.style.display = "";
      g.setAttribute("transform", `${cam} translate(${hp.tx} ${hp.ty}) rotate(${hp.rot * RAD} ${hp.ox} ${hp.oy})`);
      g.setAttribute("opacity", String(hp.alpha));
    }
    if (svg.crack) {
      const on = s.crack > 0 && s.halves[0].show && s.crack < 1.01 && p < BEAT.leave[4][0] + 0.02;
      svg.crack.style.display = on ? "" : "none";
      if (on) {
        svg.crack.setAttribute("transform", cam);
        svg.crack.setAttribute("opacity", String(s.crack));
      }
    }

    // the empty frame of the in-between
    if (svg.ghost) {
      svg.ghost.setAttribute("opacity", String(s.ghost));
      if (s.ghost > 0) svg.ghost.setAttribute("transform", cam);
    }

    // sprout
    if (svg.plant) {
      const { tx, ty, rot, ox, oy } = s.plant;
      svg.plant.setAttribute("transform", `${cam} translate(${tx} ${ty}) rotate(${rot * RAD} ${ox} ${oy})`);
      svg.plant.setAttribute("opacity", String(exitFade));
    }
    const sick = 1 - s.vigor;
    if (svg.stem) {
      svg.stem.setAttribute("d", stemPath(pose.stem));
      svg.stem.setAttribute("stroke-width", String(Math.max(pose.width, 2 / S)));
      svg.stem.setAttribute("stroke", mix(STEM, STEM_SICK, sick));
    }
    if (svg.buried) {
      const [x0, y0, x1, y1] = pose.buried;
      svg.buried.setAttribute("d", y1 < y0 - 0.01 ? `M${x0} ${y0} L${x1} ${y1}` : "");
      svg.buried.setAttribute("stroke-width", String(Math.max(pose.width * 0.8, 1.5 / S)));
      svg.buried.setAttribute("opacity", String(s.soilAlpha * 0.85 + 0.15));
    }
    svg.leafStops[0]?.setAttribute("stop-color", mix(LEAF_LIT, LEAF_SICK_LIT, sick));
    svg.leafStops[1]?.setAttribute("stop-color", mix(LEAF, LEAF_SICK, sick));
    svg.leafStops[2]?.setAttribute("stop-color", mix(LEAF_SHADE, mix(LEAF_SICK, INK, 0.3), sick));
    pose.leaves.forEach((lf, i) => {
      const el = svg.leaves[i];
      if (!el) return;
      if (lf.s <= 0.0005) {
        if (el.style.display !== "none") el.style.display = "none";
        return;
      }
      el.style.display = "";
      el.setAttribute("transform", `translate(${lf.x} ${lf.y}) rotate(${lf.rot}) scale(${lf.s})`);
    });

    // one leaf drops at every move
    const falls = fallingLeaves(p);
    for (let i = 0; i < 4; i++) {
      const el = svg.falling[i];
      if (!el) continue;
      const f = falls.find((q) => q.k === i);
      if (!f) {
        if (el.style.display !== "none") el.style.display = "none";
        continue;
      }
      el.style.display = "";
      const pot = POTS[i];
      const sx = (i % 2 ? 1 : -1) * 0.22 * s.scale;
      const startY = pot.top - s.sproutLen * 0.45;
      const x = sx + Math.sin(f.u * 9 + i) * 0.18 * s.scale + (i % 2 ? 1 : -1) * f.u * 0.5;
      const y = startY + f.u * f.u * ((H / S) * 0.9);
      const rot = (i % 2 ? 1 : -1) * (40 + f.u * 380) + Math.sin(time * 2 + i) * 10;
      el.setAttribute("transform", `${cam} translate(${x} ${y}) rotate(${rot}) scale(${0.26 * s.scale})`);
      el.setAttribute("opacity", String(1 - range(f.u, 0.55, 1)));
    }
  }

  function applyDom(s: Scene, p: number, time: number, dt: number, pose: ReturnType<typeof plantPose>) {
    const L = live.current;
    void pose;

    // title card
    const tOut = easeInOutCubic(range(p, BEAT.titleOut[0], BEAT.titleOut[1]));
    if (titleRef.current) {
      titleRef.current.style.opacity = String(1 - tOut);
      titleRef.current.style.transform = `translate3d(0, ${-tOut * 28}px, 0)`;
      titleRef.current.style.visibility = tOut >= 1 ? "hidden" : "visible";
    }

    // headline: fades in over its roots, slumps with transplant shock, recovers
    const headIn = smoothstep(range(p, BEAT.headFill[0], BEAT.headFill[1]));
    const headOut = smoothstep(range(p, BEAT.headOut[0], BEAT.headOut[1]));
    if (headRef.current) {
      headRef.current.style.opacity = String(headIn * (1 - headOut));
      headRef.current.style.visibility = headIn * (1 - headOut) <= 0.001 ? "hidden" : "visible";
      headRef.current.style.transform = `translate3d(0, ${headOut * -20}px, 0)`;
    }
    if (ghostRef.current) {
      const gA = bell(p, BEAT.headRoots[0] - 0.006, BEAT.headRoots[0] + 0.012, BEAT.headFill[0], BEAT.headFill[1]);
      ghostRef.current.style.opacity = String(gA);
      ghostRef.current.style.visibility = gA <= 0.001 ? "hidden" : "visible";
    }
    const sag = (1 - s.vigor) * (1 - headOut);
    const els = letters.current;
    const sizePx = headRef.current ? parseFloat(headRef.current.style.fontSize || "0") || 100 : 100;
    let li = 0;
    const lines = HEAD_LINES[mobile ? "mobile" : "desktop"];
    for (let line = 0; line < lines.length; line++) {
      const ln = lines[line];
      const count = LINE_COUNTS[mobile ? "mobile" : "desktop"][line];
      let j = 0;
      for (const word of ln) {
        for (let c = 0; c < word.length; c++) {
          const el = els[li];
          if (el) {
            const u = count > 1 ? j / (count - 1) : 0;
            const jitter = Math.sin(li * 2.3) * 0.5 + 0.5;
            const dy = sag * sizePx * (0.06 + 0.26 * Math.pow(u, 1.5)) * (0.8 + jitter * 0.4);
            const rot = sag * (3 + 15 * u) * (0.75 + jitter * 0.5);
            el.style.transform = sag > 0.001 ? `translate3d(0, ${dy.toFixed(2)}px, 0) rotate(${rot.toFixed(2)}deg)` : "";
            const wght = Math.round(900 - 380 * Math.pow(sag, 0.85));
            if (wght !== L.lastWght[li]) {
              el.style.fontVariationSettings = `"wght" ${wght}, "SOFT" 100, "WONK" 1, "opsz" 144`;
              L.lastWght[li] = wght;
            }
          }
          li++;
          j++;
        }
      }
    }

    // captions
    const c1 = Math.min(range(p, BEAT.cap1[0], BEAT.cap1[1]), 1 - range(p, BEAT.cap1[2], BEAT.cap1[3]));
    const c2 = Math.min(range(p, BEAT.cap2[0], BEAT.cap2[1]), 1 - range(p, BEAT.cap2[2], BEAT.cap2[3]));
    for (const [el, v] of [
      [cap1.current, c1],
      [cap2.current, c2],
    ] as const) {
      if (!el) continue;
      const e = easeOutCubic(clamp(v));
      el.style.opacity = String(e);
      el.style.transform = `translate3d(0, ${(1 - e) * 14}px, 0)`;
      el.style.visibility = e <= 0.001 ? "hidden" : "visible";
    }

    // plant tag: pokes up on the title card, springs up, follows the pot, wobbles
    if (tagWrap.current && tag.current) {
      const up = backOut(range(p, 0.004, 0.064), 1.6);
      const out = smoothstep(range(p, 0.71, 0.75));
      const hwScreen = s.cam.S * frameHalfWidth(p);
      let x: number;
      let y: number;
      const tagW = mobile ? 120 : 172;
      if (mobile) {
        const titleX = s.cam.fx + hwScreen + 10;
        const lateX = W - tagW - 14;
        const k = smoothstep(range(p, 0.03, 0.1));
        x = lerp(Math.min(titleX, W - tagW - 6), lateX, k);
        y = lerp(H * 0.58, H * 0.205, k);
      } else {
        x = s.cam.fx + hwScreen + 34;
        x = Math.min(x, W - tagW - 40);
        // beside the pot body on the title card (clear of the type), level with the plant later
        y = lerp(H * 0.555, H * 0.36, smoothstep(range(p, 0.03, 0.11)));
      }
      tagWrap.current.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      tagWrap.current.style.opacity = String(1 - out);
      tagWrap.current.style.visibility = out >= 1 ? "hidden" : "visible";
      // home readout pops when it changes
      if (s.home !== L.lastHome) {
        if (L.lastHome !== -2) L.pop = 1;
        L.lastHome = s.home;
        if (tagHome.current) tagHome.current.textContent = s.home < 0 ? "HOME —" : `HOME 0${s.home + 1}`;
      }
      L.pop = Math.max(0, L.pop - dt * 2.4);
      // pointer wobble (soft spring)
      const target = ptr.inside.get() > 0.5 ? ptr.nx.get() * 7 : 0;
      L.tagVel += (target - L.tagRot) * 26 * dt;
      L.tagVel *= Math.exp(-dt * 5.5);
      L.tagRot += L.tagVel * dt;
      const sway = Math.sin(time * 0.9) * 0.8;
      const popS = 1 + Math.sin(L.pop * Math.PI) * 0.05;
      tag.current.style.transform = `translate3d(0, ${((1 - up) * 30).toFixed(2)}px, 0) rotate(${(-3 + (1 - up) * 5 + L.tagRot + sway + s.hang * 2).toFixed(2)}deg) scale(${popS.toFixed(3)})`;
      // handwritten notes: one "Drooped. Adjusted." per move survived
      let tally = 0;
      for (let k = 1; k < 5; k++) if (p >= BEAT.grow[k][0] + (BEAT.grow[k][1] - BEAT.grow[k][0]) * 0.8) tally = k;
      if (tally !== L.lastTally) {
        L.lastTally = tally;
        if (tagTally.current) tagTally.current.textContent = tally > 1 ? ` ×${tally}` : "";
      }
      if (tagNote.current) {
        const firstNote = range(p, BEAT.grow[1][0] + (BEAT.grow[1][1] - BEAT.grow[1][0]) * 0.7, BEAT.grow[1][1]);
        tagNote.current.style.opacity = String(easeOutCubic(firstNote));
        tagNote.current.style.clipPath = `inset(0 ${(1 - firstNote) * 100}% 0 0)`;
      }
    }

    // quote: one line at a time, word by word
    const qOut = smoothstep(range(p, BEAT.quoteOut[0], BEAT.quoteOut[1]));
    const qa = QUOTE[0].split(" ").length;
    words.current.forEach((el, i) => {
      if (!el) return;
      const first = i < qa;
      const [a, b] = first ? BEAT.quote1 : BEAT.quote2;
      const n = first ? qa : QUOTE[1].split(" ").length;
      const j = first ? i : i - qa;
      const u = range(p, a + ((b - a) * j) / (n + 2), a + ((b - a) * (j + 3)) / (n + 2));
      const e = easeOutCubic(u);
      el.style.opacity = String(e * (1 - qOut));
      el.style.transform = `translate3d(0, ${((1 - e) * 0.35).toFixed(3)}em, 0)`;
    });
    for (const el of [quoteA.current, quoteB.current]) if (el) el.style.visibility = p < BEAT.quote1[0] - 0.005 || qOut >= 1 ? "hidden" : "visible";

    // ring labels at the bottom of each ring
    const labIn = range(p, BEAT.labels[0], BEAT.labels[1]);
    const labOut = range(p, BEAT.voxel[0], BEAT.voxel[0] + 0.02);
    const pt = painterRef.current;
    for (let k = 0; k < 5; k++) {
      const el = markers.current[k];
      if (!el || !pt) continue;
      const lit = range(p, BEAT.labels[0] + k * 0.006, BEAT.labels[1] + k * 0.006);
      const a = easeOutCubic(lit) * (1 - labOut);
      if (a <= 0.001) {
        if (el.style.visibility !== "hidden") el.style.visibility = "hidden";
        continue;
      }
      el.style.visibility = "visible";
      const [x, y] = pt.plantToScreen(s, 0, POTS[k].bottom);
      const f = live.current.focus[k];
      const sel = live.current.forced === k || live.current.hover === k;
      el.style.opacity = String(a * clamp(0.35 + f * 0.65));
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${(y - (mobile ? 9 : 11)).toFixed(1)}px, 0) translate(-50%, -50%) scale(${sel ? 1.08 : 1})`;
      const lab = markerLabels.current[k];
      if (lab) lab.style.maxWidth = sel ? "4.6em" : "0px";
    }
    void labIn;

    // grain (stepped, like printed film)
    L.grainStep += dt;
    if (grain.current && L.grainStep > 0.09) {
      L.grainStep = 0;
      const gx = Math.floor(Math.random() * 6) * 7;
      const gy = Math.floor(Math.random() * 6) * 7;
      grain.current.style.transform = `translate3d(${-gx}px, ${-gy}px, 0)`;
    }
  }

  /** Half-width (plant units) of whatever the camera is framing — the tag sits just outside it. */
  function frameHalfWidth(p: number): number {
    const hw = POTS.map((pot) => pot.hw + pot.wall);
    const keys: [number, number][] = [
      [0.04, hw[0]],
      [0.118, hw[0]],
      [0.212, hw[0]],
      [0.262, hw[1]],
      [0.356, hw[1]],
      [0.4, hw[2]],
      [0.482, hw[2]],
      [0.53, hw[3]],
      [0.616, hw[3]],
      [0.656, hw[4]],
    ];
    if (p <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) if (p <= keys[i][0]) return lerp(keys[i - 1][1], keys[i][1], easeInOutCubic(range(p, keys[i - 1][0], keys[i][0])));
    return keys[keys.length - 1][1];
  }

  /* -------------------------------------------------------------- markup */

  const headLines = HEAD_LINES[mobile ? "mobile" : "desktop"];
  let letterIndex = 0;
  let wordIndex = 0;
  const headSize = mobile ? Math.min(W * 0.17, 74) : Math.min(W * 0.07, H * 0.122, 118);
  const titleSize = mobile ? Math.min(W * 0.205, 92) : Math.min(W * 0.112, H * 0.178, 176);
  const island = layout.island;

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ background: INK, color: PAPER }}
      onClick={(e) => {
        // tap a ring (or anywhere on the ball) to isolate it; tap again to release
        const p = progress.get();
        if (p < BEAT.labels[0] - 0.01 || p >= BEAT.voxel[0]) return;
        const r = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
        const s = builder.build(p, 0);
        const k = ringAt(s, e.clientX - r.left, e.clientY - r.top);
        live.current.forced = k === live.current.forced ? -1 : k;
      }}
    >
      {/* ground: ink with a warm lift in the middle and a soft vignette */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: `radial-gradient(90% 75% at 50% 46%, ${mix(INK, RISO.sun, 0.035)} 0%, ${INK} 55%, ${mix(INK, VOID, 0.55)} 100%)`,
        }}
      />
      <canvas ref={backRef} aria-hidden className="absolute inset-0 h-full w-full" />

      {/* title card */}
      <div ref={titleRef} className="absolute inset-x-0 flex flex-col items-center" style={{ top: mobile ? H * 0.2 : H * 0.17 }}>
        <p className="mb-3 uppercase" style={{ fontFamily: MONO, fontSize: mobile ? 10 : 11, letterSpacing: "0.32em", color: alpha(PAPER, 0.62) }}>
          World {meta.number} · {meta.title}
        </p>
        <h2
          className="text-center uppercase"
          style={{
            fontFamily: FRAUNCES,
            fontSize: titleSize,
            lineHeight: 0.84,
            letterSpacing: "-0.015em",
            fontVariationSettings: `"wght" 900, "SOFT" 100, "WONK" 1, "opsz" 144`,
            color: PAPER,
          }}
        >
          Moving{" "}
          <br />
          Homes
        </h2>
      </div>

      {/* faint outline of the headline while its roots grow */}
      <div
        ref={ghostRef}
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          left: mobile ? 18 : W * 0.06,
          top: mobile ? Math.max(96, H * 0.118) : H * 0.2,
          fontFamily: FRAUNCES,
          fontSize: `${headSize}px`,
          lineHeight: 0.92,
          color: "transparent",
          WebkitTextStroke: `1px ${alpha(PAPER, 0.2)}`,
          fontVariationSettings: `"wght" 900, "SOFT" 100, "WONK" 1, "opsz" 144`,
          opacity: 0,
          visibility: "hidden",
        }}
      >
        {headLines.map((ln, i) => (
          <div key={i} className="whitespace-nowrap">
            {ln.map((word, wi) => (
              <span key={wi} className="inline-block" style={{ marginRight: wi < ln.length - 1 ? "0.24em" : 0 }}>
                {word.split("").map((ch, ci) => (
                  <span key={ci} className="inline-block text-center" style={{ lineHeight: `${headSize * 0.92}px`, height: headSize * 0.92, whiteSpace: "pre" }}>
                    {ch}
                  </span>
                ))}
              </span>
            ))}
          </div>
        ))}
      </div>

      {/* headline (roots grow into it on the back canvas first) */}
      <div
        ref={headRef}
        role="heading"
        aria-level={3}
        aria-label="5 homes in 3 years."
        className="absolute"
        style={{
          left: mobile ? 18 : W * 0.06,
          top: mobile ? Math.max(96, H * 0.118) : H * 0.2,
          fontFamily: FRAUNCES,
          fontSize: `${headSize}px`,
          lineHeight: 0.92,
          color: PAPER,
          opacity: 0,
          visibility: "hidden",
        }}
      >
        {headLines.map((ln, i) => (
          <div key={i} aria-hidden className="whitespace-nowrap">
            {ln.map((word, wi) => (
              <span key={wi} className="inline-block" style={{ marginRight: wi < ln.length - 1 ? "0.24em" : 0 }}>
                {word.split("").map((ch) => {
                  const idx = letterIndex++;
                  return (
                    <span
                      key={idx}
                      ref={(el) => void (letters.current[idx] = el)}
                      className="inline-block text-center"
                      style={{
                        fontVariationSettings: `"wght" 900, "SOFT" 100, "WONK" 1, "opsz" 144`,
                        transformOrigin: "10% 88%",
                        lineHeight: `${headSize * 0.92}px`,
                        height: headSize * 0.92,
                        whiteSpace: "pre",
                      }}
                    >
                      {ch}
                    </span>
                  );
                })}
              </span>
            ))}
          </div>
        ))}
      </div>

      <canvas ref={mainRef} aria-hidden className="absolute inset-0 h-full w-full" />
      <PotsSvg ref={svgRef} width={W} height={H} />

      {/* captions */}
      <p
        ref={cap1}
        className="absolute"
        style={{
          ...captionStyle(mobile, W, H),
          visibility: "hidden",
        }}
      >
        Roots remember the shape of every pot.
      </p>
      <p ref={cap2} className="absolute" style={{ ...captionStyle(mobile, W, H), visibility: "hidden" }}>
        Droops after every move. Adjusts anyway.
      </p>

      {/* plant tag (the diegetic readout) */}
      <div ref={tagWrap} className="pointer-events-none absolute left-0 top-0" style={{ width: mobile ? 120 : 172 }}>
        <div ref={tag} className="absolute inset-x-0 top-0" style={{ transformOrigin: "50% 100%" }}>
          <div
            className="relative"
            style={{
              background: PAPER,
              color: INK,
              borderRadius: mobile ? "9px 9px 3px 3px" : "12px 12px 4px 4px",
              padding: mobile ? "15px 11px 10px" : "19px 14px 13px",
              boxShadow: `0 10px 30px ${alpha(VOID, 0.5)}`,
            }}
          >
            <span aria-hidden className="absolute left-1/2 top-[7px] h-[5px] w-[5px] -translate-x-1/2 rounded-full" style={{ background: INK, opacity: 0.85 }} />
            <p className="whitespace-nowrap" style={{ fontFamily: MONO, fontWeight: 500, fontSize: mobile ? 10 : 11.5, letterSpacing: "0.12em", lineHeight: 1.25 }}>JOSHMANN SINGH</p>
            <p style={{ fontFamily: MONO, fontSize: mobile ? 9 : 10, letterSpacing: "0.12em", marginTop: 2, color: alpha(INK, 0.75) }}>AGE 15</p>
            <div style={{ height: 1, background: alpha(INK, 0.25), margin: mobile ? "8px 0 7px" : "10px 0 9px" }} />
            <p style={{ fontFamily: MONO, fontSize: mobile ? 9 : 10.5, lineHeight: 1.35, color: alpha(INK, 0.85) }}>
              Hardy.
              <br />
              Tolerates relocation.
            </p>
            <div style={{ height: 1, background: alpha(INK, 0.25), margin: mobile ? "8px 0 6px" : "10px 0 8px" }} />
            <p style={{ fontFamily: MONO, fontWeight: 500, fontSize: mobile ? 11 : 13, letterSpacing: "0.08em" }}>
              <span ref={tagHome}>HOME 01</span>
              <span style={{ color: alpha(INK, 0.5) }}> / 05</span>
            </p>
            <p ref={tagNote} style={{ fontFamily: HAND, fontSize: mobile ? 16 : 19, lineHeight: 1.05, color: RISO.cobalt, marginTop: 4, transform: "rotate(-3deg)", opacity: 0 }}>
              Drooped. Adjusted.<span ref={tagTally} />
            </p>
          </div>
          <div
            aria-hidden
            className="mx-auto"
            style={{
              width: mobile ? 20 : 26,
              height: mobile ? 46 : 62,
              marginTop: -1,
              background: `linear-gradient(to bottom, ${PAPER} 0%, ${mix(PAPER, INK, 0.12)} 100%)`,
              clipPath: "polygon(0 0, 100% 0, 100% 64%, 50% 100%, 0 64%)",
            }}
          />
        </div>
      </div>

      {/* quote: sets one line at a time beside the rings */}
      {[0, 1].map((qi) => (
        <p
          key={qi}
          ref={qi ? quoteB : quoteA}
          className="absolute"
          style={{ ...quoteStyle(mobile, W, H, qi), visibility: "hidden" }}
        >
          {QUOTE[qi].split(" ").map((w, i, arr) => {
            const idx = wordIndex++;
            return (
              <Fragment key={i}>
                <span ref={(el) => void (words.current[idx] = el)} className="inline-block" style={{ opacity: 0 }}>
                  {w}
                </span>
                {i < arr.length - 1 ? " " : null}
              </Fragment>
            );
          })}
        </p>
      ))}

      {/* ring labels: focusable, isolate a ring */}
      <ul className="absolute left-0 top-0" aria-label="Five homes, one ring each">
        {POTS.map((_, k) => (
          <li key={k} className="absolute left-0 top-0">
            <button
              ref={(el) => void (markers.current[k] = el)}
              type="button"
              aria-label={`Home 0${k + 1}`}
              className="absolute left-0 top-0 flex items-center whitespace-nowrap rounded-full"
              style={{
                visibility: "hidden",
                fontFamily: MONO,
                fontSize: mobile ? 9 : 10,
                letterSpacing: "0.14em",
                padding: mobile ? "2px 6px" : "3px 8px",
                color: HOME_INK[k],
                background: alpha(INK, 0.86),
                border: `1px solid ${alpha(HOME_INK[k], 0.75)}`,
                lineHeight: 1.2,
              }}
              onPointerEnter={(e) => {
                if (e.pointerType === "mouse") live.current.forced = k;
              }}
              onPointerLeave={(e) => {
                if (e.pointerType === "mouse") live.current.forced = -1;
              }}
              onFocus={() => (live.current.forced = k)}
              onBlur={() => (live.current.forced = -1)}
              onClick={(e) => {
                e.stopPropagation();
                live.current.forced = live.current.forced === k ? -1 : k;
              }}
            >
              <span ref={(el) => void (markerLabels.current[k] = el)} className="inline-block overflow-hidden" style={{ maxWidth: 0, transition: "max-width .35s cubic-bezier(.16,1,.3,1)" }}>
                HOME&nbsp;
              </span>
              0{k + 1}
            </button>
          </li>
        ))}
      </ul>

      {/* the next portal (a floating voxel island) is born here */}
      <div ref={origin} aria-hidden className="pointer-events-none absolute" style={{ left: island.x, top: island.y, width: island.size, height: island.size }} />

      {/* printed grain (paper fibres glowing faintly on the dark) */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          ref={grain}
          className="absolute"
          style={{
            inset: "-48px",
            opacity: 0.07,
            mixBlendMode: "screen",
            backgroundImage: GRAIN,
          }}
        />
      </div>
    </div>
  );
}

const GRAIN = `url("data:image/svg+xml;utf8,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.945  0 0 0 0 0.918  0 0 0 0 0.859  0 0 0 1.4 -0.35'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>",
).replace(/%2523/g, "%23")}")`;

function captionStyle(mobile: boolean, W: number, H: number): React.CSSProperties {
  return mobile
    ? {
        // under the pot, clear of the headline and the tag (ends above the HUD band)
        left: 28,
        right: 28,
        top: H * 0.853,
        textAlign: "center",
        textWrap: "balance",
        fontFamily: FRAUNCES,
        fontStyle: "italic",
        fontSize: 18,
        lineHeight: 1.16,
        fontVariationSettings: `"wght" 380, "SOFT" 100, "opsz" 24`,
        color: alpha(PAPER, 0.92),
      }
    : {
        left: W * 0.06,
        top: H * 0.62,
        maxWidth: Math.min(W * 0.3, 430),
        fontFamily: FRAUNCES,
        fontStyle: "italic",
        fontSize: Math.min(32, W * 0.022),
        lineHeight: 1.14,
        fontVariationSettings: `"wght" 360, "SOFT" 100, "opsz" 36`,
        color: alpha(PAPER, 0.92),
      };
}

function quoteStyle(mobile: boolean, W: number, H: number, qi: number): React.CSSProperties {
  const base: React.CSSProperties = {
    fontFamily: FRAUNCES,
    fontStyle: "italic",
    fontVariationSettings: `"wght" 420, "SOFT" 100, "opsz" 72`,
    color: PAPER,
  };
  if (mobile)
    return {
      ...base,
      left: 22,
      right: 22,
      top: H * (qi ? 0.765 : 0.655),
      fontSize: Math.min(W * 0.064, 26),
      lineHeight: 1.12,
      textAlign: "center",
    };
  const col = W * 0.33 - W * 0.06 - 30;
  return {
    ...base,
    width: col,
    left: qi ? W * 0.67 + 30 : W * 0.06,
    top: H * (qi ? 0.5 : 0.3),
    fontSize: Math.min(W * 0.03, 46),
    lineHeight: 1.08,
    textAlign: qi ? "left" : "right",
  };
}

/** Screen cells for the sprout at the start of the exit (they become the island's tree). */
function plantCellsFor(builder: SceneBuilder, pt: Painter, p: number) {
  const s = builder.build(p, 0);
  const pose = plantPose(p, 0, s.vigor, s.scale, s.apex, s.sproutLen);
  const out: { x: number; y: number; c: string }[] = [];
  const st = pose.stem;
  for (let i = 0; i < st.length / 2 - 1; i++) {
    for (let q = 0; q < 4; q++) {
      const x = lerp(st[i * 2], st[i * 2 + 2], q / 4);
      const y = lerp(st[i * 2 + 1], st[i * 2 + 3], q / 4);
      const [sx, sy] = pt.plantToScreen(s, x, y);
      out.push({ x: sx, y: sy, c: STEM });
    }
  }
  for (const lf of pose.leaves) {
    if (lf.s <= 0) continue;
    const r = (lf.rot * Math.PI) / 180;
    const c = Math.cos(r);
    const n = Math.sin(r);
    for (let u = 0.08; u <= 0.95; u += 0.09) {
      for (const v of [-0.12, 0, 0.12]) {
        const half = Math.sin(Math.PI * u) * 0.22;
        if (Math.abs(v) > half) continue;
        const lx = u * lf.s;
        const ly = v * lf.s;
        const [sx, sy] = pt.plantToScreen(s, lf.x + c * lx - n * ly, lf.y + n * lx + c * ly);
        out.push({ x: sx, y: sy, c: v < 0 ? LEAF_LIT : LEAF });
      }
    }
  }
  void toScreen;
  void bell;
  return out;
}
