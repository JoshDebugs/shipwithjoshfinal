"use client";

/**
 * 01 · Anchoring — "Up To Eleven".
 *
 * Age 11, volume 11: the scroll is a volume knob wired to every pixel. Type
 * swells from a whisper to a shout, ink floods blank paper one riso pass at a
 * time (cobalt → teal → sun), the knob grinds against the printed 10, then
 * snaps past it into the hand-scrawled 11: the pink pass floods, "MIC ON." is
 * sliced flat by the CLIP rails, the trace squares off, the plates jolt out of
 * register and four feedback rings leave the mic. Then the emcee hands over —
 * "Please welcome our next act…" — and a skate rolls on stage. The Sports
 * portal is born from it.
 *
 * One Canvas 2D (paper, halftone passes, trace) + SVG/DOM for everything with
 * edges or words. Everything is a pure function of `progress`; the shared
 * ticker only adds ambient life (pump, breath, flicker, buzz).
 */

import { useCallback, useEffect, useId, useMemo, useRef } from "react";
import { gsap } from "gsap";
import { useIsoLayoutEffect, usePortalOrigin, useStage, useTicker } from "@/components/life/multiverse/runtime";
import { RISO, mix } from "@/components/life/multiverse/palette";
import { backOut, bell, clamp, easeInOutCubic, easeOutCubic, expoOut, hash, lerp, range, smoothstep } from "@/components/life/multiverse/ease";
import type { WorldProps } from "@/components/life/multiverse/types";
import { COPY } from "./copy";
import { computeLayout } from "./layout";
import { DEEP_PINK, PASSES, T, VU_SEGMENTS, dbLabel, knobAngle, passLevel, volAt, vuLit, windowEnv } from "./timeline";
import { PrintCanvas, type PrintFrame } from "./print";
import { makeWaveState, smoothPath } from "./wave";
import { Knob } from "./Knob";
import { Mic } from "./Mic";
import { Cone } from "./Cones";
import { RegMark, Slug, Vu } from "./Console";
import { ClipBand } from "./ClipBand";
import { WaveText } from "./WaveText";
import { Skate } from "./Skate";
import { Line, MONO, Sub } from "./Line";
import { attr, css, fade, px } from "./dom";

const RING_INKS = [RISO.cobalt, RISO.teal, RISO.sun, DEEP_PINK];
/** Misregistration directions per plate (cobalt, teal, sun, pink). */
const PLATE_DIRS = [
  [-1, -0.6],
  [0.9, -0.8],
  [-0.5, 1],
  [0.35, 0.25],
] as const;

const tapEnv = (p: number, t0: number) => bell(p, t0 - 0.0005, t0 + 0.0025, t0 + 0.005, t0 + 0.028);

function text(el: HTMLElement | null, s: string) {
  if (el && el.textContent !== s) el.textContent = s;
}

export default function AnchoringWorld({ progress }: WorldProps) {
  const stage = useStage();
  const origin = usePortalOrigin();
  const L = useMemo(() => computeLayout(stage.width, stage.height, stage.isMobile), [stage.width, stage.height, stage.isMobile]);
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");

  /* ------------------------------------------------------------ refs */
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pressRef = useRef<PrintCanvas | null>(null);
  const knob = {
    root: useRef<HTMLDivElement>(null),
    knurl: useRef<SVGGElement>(null),
    pointer: useRef<SVGGElement>(null),
    circle: useRef<SVGPathElement>(null),
    marker: useRef<SVGGElement>(null),
  };
  const mic = { root: useRef<HTMLDivElement>(null), arc1: useRef<SVGPathElement>(null), arc2: useRef<SVGPathElement>(null) };
  const cone0 = { root: useRef<HTMLDivElement>(null), pump: useRef<SVGGElement>(null) };
  const cone1 = { root: useRef<HTMLDivElement>(null), pump: useRef<SVGGElement>(null) };
  const vu = { root: useRef<HTMLDivElement>(null), segs: useRef<(HTMLDivElement | null)[]>([]) };
  const slug = {
    root: useRef<HTMLDivElement>(null),
    swatches: useRef<(HTMLSpanElement | null)[]>([]),
    ink: useRef<HTMLSpanElement>(null),
    vol: useRef<HTMLSpanElement>(null),
    db: useRef<HTMLSpanElement>(null),
  };
  const band = {
    root: useRef<SVGSVGElement>(null),
    clips: useRef<(SVGRectElement | null)[]>([]),
    rows: useRef<(SVGGElement | null)[]>([]),
    texts: useRef<(SVGTextElement | null)[][]>([]),
    rails: useRef<(SVGGElement | null)[]>([]),
  };
  const opener = { root: useRef<SVGSVGElement>(null), paths: useRef<(SVGPathElement | null)[]>([]), text: useRef<SVGGElement>(null), reveal: useRef<SVGCircleElement>(null) };
  const welcome = { root: useRef<SVGSVGElement>(null), paths: useRef<(SVGPathElement | null)[]>([]), text: useRef<SVGGElement>(null), reveal: useRef<SVGCircleElement>(null) };
  const rings = useRef<(SVGCircleElement | null)[]>([]);
  const skateEl = useRef<HTMLDivElement | null>(null);
  const skate = { plate: useRef<HTMLDivElement>(null), spokes: useRef<(SVGGElement | null)[]>([]), spokeLayer: useRef<SVGSVGElement>(null) };
  const label = useRef<HTMLDivElement>(null);
  const whisper = useRef<HTMLDivElement>(null);
  const tap1 = useRef<HTMLDivElement>(null);
  const tap2 = useRef<HTMLDivElement>(null);
  const grade6 = useRef<HTMLDivElement>(null);
  const grade7 = useRef<HTMLDivElement>(null);
  const inside = useRef<HTMLDivElement>(null);
  const age = useRef<HTMLDivElement>(null);
  const ageTyped = useRef<HTMLSpanElement>(null);
  const ageRest = useRef<HTMLSpanElement>(null);
  const ageCaret = useRef<HTMLSpanElement>(null);
  const buzz = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const thumpAt = useRef(-100);
  const wave = useRef(makeWaveState());
  const quant = useRef({ opener: -1 });
  const frame = useRef<PrintFrame>({
    levels: [0, 0, 0, 0],
    fuse: 0,
    t: 0,
    pump: 0,
    sources: [
      { x: 0, y: 0, reach: 1, gain: 0 },
      { x: 0, y: 0, reach: 1, gain: 0 },
      { x: 0, y: 0, reach: 1, gain: 0 },
    ],
    offsets: [0, 0, 0, 0, 0, 0, 0, 0],
    wave: wave.current,
    waveWidth: 1.2,
    waveAlpha: 1,
    ghostAlpha: 0,
    ghostInk: RISO.cobalt,
    ghostDx: 0,
    ghostDy: 0,
  });

  const setSkate = useCallback(
    (el: HTMLDivElement | null) => {
      skateEl.current = el;
      origin(el);
    },
    [origin],
  );

  const onTap = useCallback(() => {
    thumpAt.current = gsap.ticker.time;
  }, []);

  /* ------------------------------------------------------- the frame */
  const draw = (p: number, time: number) => {
    const { W, H } = L;
    const [R0, R1, R2, R3] = L.band.rails;
    const vol = volAt(p);
    const v = vol / 11;
    const clipIn = range(p, T.clip - 0.001, T.clip + 0.006);
    const rel = easeInOutCubic(range(p, T.release[0], T.release[1]));
    const clipM = clipIn * (1 - rel);
    const grind = bell(p, T.grind[0], T.grind[0] + 0.02, T.grind[1] - 0.006, T.grind[1] + 0.002);
    const thumpAge = time - thumpAt.current;
    const thump = thumpAge >= 0 && thumpAge < 2.5 ? Math.exp(-thumpAge * 4.5) : 0;
    const jStep = Math.floor(time * 30);
    const jit = (hash(jStep) - 0.5) * 2;
    const jit2 = (hash(jStep + 71.3) - 0.5) * 2;
    const beat = (time * 116) / 60;
    const kick0 = Math.exp(-(beat % 1) * 7);
    const kick1 = Math.exp(-((beat + 0.5) % 1) * 7);
    const fuse = smoothstep(range(p, T.flood[0], T.flood[1]));
    const hum = smoothstep(range(p, T.hum[0], T.hum[1]));
    const jolt = bell(p, T.clip, T.clip + 0.004, T.clip + 0.009, T.clip + 0.045);

    /* knob: title → console → home, grinding on 10, snapping to 11 */
    const toConsole = easeInOutCubic(range(p, T.knobToConsole[0], T.knobToConsole[1]));
    const toExit = easeInOutCubic(range(p, T.knobHome[0], T.knobHome[1]));
    const { title: kt, console: kc, exit: ke } = L.knob;
    let kx = lerp(kt.x, kc.x, toConsole);
    let ky = lerp(kt.y, kc.y, toConsole) - Math.sin(toConsole * Math.PI) * H * 0.05;
    let ks = lerp(kt.s, kc.s, toConsole);
    kx = lerp(kx, ke.x, toExit);
    ky = lerp(ky, ke.y, toExit) - Math.sin(toExit * Math.PI) * H * 0.04;
    ks = lerp(ks, ke.s, toExit);
    const kShake = grind * 1.3 + thump * 1.5;
    css(knob.root.current, "transform", `translate3d(${px(kx - 150 + jit * kShake)}, ${px(ky - 150 + jit2 * kShake * 0.6)}, 0) scale(${ks.toFixed(4)})`);
    const ang = knobAngle(vol) + grind * jit * 2.6 + thump * Math.sin(thumpAge * 36) * 5;
    const rot = `rotate(${ang.toFixed(2)} 150 150)`;
    attr(knob.knurl.current, "transform", rot);
    attr(knob.pointer.current, "transform", rot);
    attr(knob.circle.current, "stroke-dashoffset", (1 - easeInOutCubic(range(p, T.circle[0], T.circle[1]))).toFixed(4));
    // pink marker on pink paper would vanish: once the flood lands, the scrawl is inked over
    css(knob.marker.current, "color", fuse <= 0 ? RISO.pink : fuse >= 1 ? RISO.ink : mix(RISO.pink, RISO.ink, fuse));

    /* the trace's baseline: title → mid → the channel between MIC / ON. → the stage floor */
    const waveC = (R1 + R2) / 2;
    let lineY = lerp(L.line.title, L.line.mid, easeInOutCubic(range(p, 0.1, 0.24)));
    lineY = lerp(lineY, waveC, easeInOutCubic(range(p, T.lineRise[0], T.lineRise[1])));
    lineY = lerp(lineY, L.line.exit, easeInOutCubic(range(p, T.lineDrop[0], T.lineDrop[1])));

    /* mic: stands on the line; in the clip it stands in the channel; then steps aside for the next act */
    const micOut = easeInOutCubic(range(p, T.micOut[0], T.micOut[1]));
    const micX = lerp(W / 2, L.mic.exitX, micOut);
    const micH = lerp(L.mic.h, L.mic.hClip, clipM);
    const micBase = lerp(lineY, R2 - 1, clipM);
    const B = micH / 0.83;
    const micLeft = micX - 0.44 * B;
    const micTop = micBase - 0.96 * B;
    const headY = micTop + 0.3 * B;
    css(mic.root.current, "transform", `translate3d(${px(micLeft)}, ${px(micTop)}, 0) scale(${(B / 100).toFixed(4)})`);
    attr(mic.arc1.current, "opacity", clamp(range(vol, 0.3, 1.1) + thump).toFixed(3));
    attr(mic.arc2.current, "opacity", clamp(range(vol, 1.3, 2.1) + thump * 0.8).toFixed(3));

    /* skate: rolls on along the floor, overshoots a hair, settles dead centre */
    const S = L.skate.S;
    const sk = range(p, T.skate[0], T.skate[1]);
    const sx = lerp(-S - 40, L.skate.x, backOut(sk, 0.9));
    const sy = lineY - 0.96 * S;
    css(skateEl.current, "transform", `translate3d(${px(sx)}, ${px(sy)}, 0)`);
    fade(skateEl.current, sk > 0 ? 1 : 0);
    const wheelDeg = ((sx - L.skate.x) / (0.1 * S)) * 57.29578;
    skate.spokes.current.forEach((g, i) => attr(g, "transform", `rotate(${wheelDeg.toFixed(1)} ${i === 0 ? 30 : 72} 86)`));
    fade(skate.spokeLayer.current, 1 - range(p, 0.972, 0.994));
    fade(skate.plate.current, 1 - range(p, 0.965, 0.992));

    /* the waveform */
    const w = wave.current;
    w.W = W;
    w.H = H;
    w.base = lineY;
    w.t = time;
    w.micX = micX;
    w.k = L.waveK * (1 + 0.3 * clipM);
    const ampVoice = L.amp.rest + L.amp.max * Math.pow(v, 1.3) * (1 + grind * 0.35);
    w.amp = lerp(lerp(ampVoice, L.band.waveH * 9, clipM), L.amp.hum, rel);
    w.square = clipM;
    w.tap = (tapEnv(p, T.tap1) + tapEnv(p, T.tap2) * 1.15) * H * 0.11 + thump * H * 0.08;
    if (clipM > 0.001) {
      w.railTop = R1 + 2.5 - (1 - clipM) * H;
      w.railBot = R2 - 2.5 + (1 - clipM) * H;
    } else {
      w.railTop = -Infinity;
      w.railBot = Infinity;
    }
    w.quiet = smoothstep(range(p, 0.935, 0.982));
    w.quietX = sx + 0.535 * S;
    w.quietW = 0.62 * S;
    w.quiet2 = smoothstep(range(p, T.micOut[0], T.micOut[1]));
    w.quiet2X = micX;
    w.quiet2W = L.mic.h * 0.8;

    /* cones: slide in, pump with the beat (amplitude = volume), punch at the clip */
    const punch = bell(p, T.clip, T.clip + 0.006, T.clip + 0.014, T.clip + 0.07);
    const f = frame.current;
    [cone0, cone1].forEach((c, i) => {
      const cl = L.cones[i];
      const slide = expoOut(range(p, T.cones[0] + i * 0.025, T.cones[1] + i * 0.025));
      const cx = cl.x + cl.dx * (1 - slide);
      const cy = cl.y + cl.dy * (1 - slide);
      css(c.root.current, "transform", `translate3d(${px(cx - cl.r)}, ${px(cy - cl.r)}, 0)`);
      fade(c.root.current, slide > 0.001 ? 1 : 0);
      const k = i === 0 ? kick0 : kick1;
      const sc = 1 + v * 0.05 * k * slide + punch * 0.13 + thump * 0.06;
      attr(c.pump.current, "transform", `scale(${sc.toFixed(4)})`);
      const src = f.sources[i];
      src.x = cx;
      src.y = cy;
      src.reach = cl.r * (0.95 + 2.6 * v) * (1 - 0.42 * hum);
      src.gain = slide;
    });
    const coneIn = expoOut(range(p, T.cones[0], T.cones[1]));
    const ms = f.sources[2];
    ms.x = micX;
    ms.y = headY;
    ms.reach = (L.mobile ? 46 : 70) + (L.mobile ? 210 : 360) * v;
    ms.gain = vol > 0.05 ? 1 - 0.55 * coneIn : 0;

    /* the press */
    for (let k = 0; k < 4; k++) {
      // earlier passes are swallowed by the flood; cobalt comes back as the hum (overprinting violet on pink)
      f.levels[k] = k === 3 ? passLevel(vol, 3) : passLevel(vol, k) * (1 - fuse) + (k === 0 ? hum * 0.72 : 0);
      const d = PLATE_DIRS[k];
      const m = 0.9 + 8 * jolt + thump * 3;
      f.offsets[k * 2] = d[0] * m;
      f.offsets[k * 2 + 1] = d[1] * m;
    }
    f.fuse = fuse;
    f.t = time;
    f.pump = Math.min(1, v * 1.1);
    f.waveWidth = lerp(1.15, 3, v) + clipM * 1.3 - rel * 0.9;
    f.waveAlpha = 1;
    f.ghostAlpha = Math.max(jolt * 0.9, clipM * 0.5, thump * 0.6);
    f.ghostDx = -2 - 6 * jolt;
    f.ghostDy = 2 + 3 * jolt;
    pressRef.current?.draw(f);

    /* console: meter bridge + slug */
    const consoleIn = easeOutCubic(range(p, T.consoleIn[0], T.consoleIn[1]));
    // phones dock the console at the top, where the knob lands at the exit: clear it first
    const consoleOut = L.mobile ? range(p, 0.84, 0.868) : 0;
    css(vu.root.current, "transform", `translate3d(${px(L.vu.x - (1 - consoleIn) * 24)}, ${px(L.vu.y - consoleOut * 16)}, 0)`);
    fade(vu.root.current, consoleIn * (1 - consoleOut));
    css(panel.current, "transform", `translate3d(${px(-(1 - consoleIn) * 24)}, ${px(-consoleOut * 16)}, 0)`);
    fade(panel.current, consoleIn * (1 - consoleOut));
    fade(slug.root.current, L.mobile ? consoleIn * (1 - consoleOut) : 1);
    if (L.slug.titleX !== null) {
      // centred under the whisper on the title card, then it slides over to dock in the panel
      const away = 1 - easeInOutCubic(range(p, T.slugDock[0], T.slugDock[1]));
      css(slug.root.current, "transform", `translateX(${px(away * (L.slug.titleX - L.slug.x))}) translateX(${(away * -50).toFixed(2)}%)`);
    }
    let level = vuLit(vol) + v * (1.1 * kick0 - 0.55) + grind * (hash(Math.floor(time * 17)) > 0.45 ? 1.3 : -0.4) + thump * 3;
    if (p >= T.clip) level = lerp(12, 10.2 + 1.1 * kick0, hum);
    const lit = clamp(Math.round(level), 0, 12);
    const peak = p >= T.clip;
    vu.segs.current.forEach((seg, i) => css(seg, "background-color", i < lit || (i === 11 && peak) ? VU_SEGMENTS[i].ink : "transparent"));
    let inks = 0;
    for (let k = 0; k < 4; k++) if (passLevel(vol, k) > 0.03) inks++;
    text(slug.ink.current, String(inks));
    text(slug.vol.current, vol.toFixed(1).padStart(4, "0"));
    text(slug.db.current, dbLabel(vol));
    slug.swatches.current.forEach((s, i) => css(s, "background-color", i < inks ? PASSES[i].ink : "transparent"));

    /* rings: four feedback rings leave the mic at the clip (one per ink), plus a tap echo */
    const ringMax = Math.hypot(W, H) * 0.72;
    for (let i = 0; i < 8; i++) {
      const el = rings.current[i];
      const e = i < 4 ? range(p, T.clip + i * 0.0075, T.rings[1] + i * 0.006) : thumpAge >= 0 ? clamp((thumpAge - (i - 4) * 0.09) / 1.4) : 0;
      if (e <= 0 || e >= 1) {
        fade(el, 0);
        continue;
      }
      attr(el, "cx", micX.toFixed(1));
      attr(el, "cy", headY.toFixed(1));
      attr(el, "r", (8 + (1 - (1 - e) * (1 - e)) * (i < 4 ? ringMax : ringMax * 0.5)).toFixed(1));
      attr(el, "stroke-width", lerp(L.mobile ? 9 : 15, 1.5, e).toFixed(2));
      fade(el, Math.pow(1 - e, 0.75));
    }

    /* the band: MIC / ON. sliced by the CLIP rails */
    const slam = expoOut(range(p, T.clip, T.clip + 0.022));
    const unclip = easeInOutCubic(range(p, T.release[0], T.release[0] + 0.02));
    const wordsOut = range(p, T.release[0] + 0.012, T.release[1]);
    fade(band.root.current, clipIn * (1 - wordsOut));
    if (clipIn > 0) {
      const rowH = L.band.rowH;
      [R0, R2].forEach((top, r) => {
        const clipEl = band.clips.current[r];
        attr(clipEl, "y", (top - rowH * 0.3 * unclip).toFixed(1));
        attr(clipEl, "height", (rowH * (1 + 0.6 * unclip)).toFixed(1));
        const cy = top + rowH / 2;
        const sy = lerp(0.3, 1, slam) * lerp(1, 0.9, wordsOut);
        attr(band.rows.current[r], "transform", `translate(0 ${(cy - wordsOut * 24).toFixed(1)}) scale(1 ${sy.toFixed(4)}) translate(0 ${(-cy).toFixed(1)})`);
        const texts = band.texts.current[r];
        if (texts) {
          for (let k = 0; k < 3; k++) {
            const d = PLATE_DIRS[k];
            const m = 1.6 + 8 * jolt + thump * 3;
            attr(texts[k], "transform", `translate(${(d[0] * m).toFixed(2)} ${(d[1] * m).toFixed(2)})`);
          }
        }
      });
      const railShift = [-1, -0.35, 0.35, 1];
      band.rails.current.forEach((g, i) => {
        attr(g, "transform", `translate(0 ${(railShift[i] * rowH * 0.3 * unclip).toFixed(1)})`);
        css(g, "opacity", (1 - range(p, T.release[0], T.release[0] + 0.016)).toFixed(3));
      });
    }

    /* type */
    const anim = (el: HTMLElement | null, env: { i: number; o: number; on: number }, dx = 0) => {
      if (env.on <= 0) {
        fade(el, 0);
        return;
      }
      const sy = lerp(0.18, 1, expoOut(env.i));
      css(el, "transform", `translate(-50%, -50%) translate(${px(dx)}, ${px(-env.o * 26)}) scaleY(${sy.toFixed(4)})`);
      fade(el, env.on);
    };
    const titleOut = range(p, 0.095, 0.125);
    css(label.current, "transform", `translate(-50%, -50%) translateY(${px(-titleOut * 18)})`);
    fade(label.current, 1 - titleOut);
    css(whisper.current, "transform", `translate(-50%, -50%) translateY(${px(titleOut * 14)})`);
    fade(whisper.current, 1 - titleOut);
    anim(tap1.current, windowEnv(p, T.tap1, 0.165, 0.012, 0.025));
    anim(tap2.current, windowEnv(p, T.tap2, 0.165, 0.012, 0.025));
    anim(grade6.current, windowEnv(p, T.grade6[0], T.grade6[1]));
    anim(grade7.current, windowEnv(p, T.grade7[0], T.grade7[1]), L.loudDx);
    anim(inside.current, windowEnv(p, T.inside[0], T.inside[1], 0.022, 0.012), L.loudDx + jit * grind * 2.2);

    /* Age 11. Volume 11. — typed after the hold */
    const ageOn = range(p, T.age[0] - 0.003, T.age[0]) * (1 - range(p, T.release[0], T.release[0] + 0.02));
    fade(age.current, ageOn);
    if (ageOn > 0) {
      const n = Math.round(range(p, T.age[0], T.age[1]) * COPY.age.length);
      text(ageTyped.current, COPY.age.slice(0, n));
      text(ageRest.current, COPY.age.slice(n));
      css(ageCaret.current, "opacity", n < COPY.age.length || Math.floor(time * 1.8) % 2 === 0 ? "1" : "0");
    }

    /* the opener rides the swelling waveform, revealed out of the mic */
    const oEnv = windowEnv(p, T.opener[0], T.opener[1], 0.008, 0.022);
    fade(opener.root.current, oEnv.on);
    if (oEnv.on > 0) {
      attr(opener.reveal.current, "cx", micX.toFixed(1));
      attr(opener.reveal.current, "cy", headY.toFixed(1));
      attr(opener.reveal.current, "r", (expoOut(range(p, T.opener[0], T.opener[0] + 0.075)) * Math.hypot(W, H)).toFixed(1));
      const steps = L.mobile ? 6 : 12;
      const q = Math.round(range(p, T.opener[0], T.opener[1] - 0.03) * steps);
      if (q !== quant.current.opener) {
        quant.current.opener = q;
        const t = q / steps;
        css(opener.text.current, "font-variation-settings", `"wdth" ${lerp(68, 118, t).toFixed(0)}, "wght" ${lerp(300, 650, t).toFixed(0)}`);
      }
      const rows = L.rows.opener.length;
      const step = L.mobile ? 10 : 18;
      opener.paths.current.forEach((path, r) => {
        const off = -(L.mic.h + L.openerGap) - (rows - 1 - r) * L.type.openerLead;
        attr(path, "d", smoothPath(w, off, step));
      });
    }

    /* the hand-over */
    const wOn = range(p, T.welcome[0], T.welcome[0] + 0.012);
    fade(welcome.root.current, wOn);
    if (wOn > 0) {
      attr(welcome.reveal.current, "cx", (W / 2).toFixed(1));
      attr(welcome.reveal.current, "cy", lineY.toFixed(1));
      attr(welcome.reveal.current, "r", (expoOut(range(p, T.welcome[0], T.welcome[1])) * Math.hypot(W, H) * 0.75).toFixed(1));
      const step = L.mobile ? 10 : 18;
      welcome.paths.current.forEach((path, r) => {
        attr(path, "d", smoothPath(w, L.welcomeGap + r * L.type.welcomeLead, step));
      });
    }

    /* the frame buzz (inside the stage — we never touch the site frame) */
    const bz = Math.min(1, range(vol, 8.8, 9.3) * (1 - rel) + thump * 0.6);
    fade(buzz.current, bz);
    if (bz > 0) {
      const bAmp = (vol > 10.9 ? 2 : 1) * bz * (1 - hum * 0.5);
      const bs = Math.floor(time * 24);
      css(buzz.current, "transform", `translate(${px((hash(bs * 1.37) - 0.5) * 2 * bAmp)}, ${px((hash(bs * 2.71 + 3) - 0.5) * 2 * bAmp)})`);
      css(buzz.current, "border-color", clipIn > 0.5 ? RISO.ink : RISO.pink);
    }
  };

  const drawRef = useRef(draw);
  drawRef.current = draw;

  /* ------------------------------------------------- lifecycle */
  useIsoLayoutEffect(() => {
    const c = canvasRef.current;
    if (!c || !L.W || !L.H) return;
    const dpr = Math.min(window.devicePixelRatio || 1, stage.lowPower ? 1.25 : 1.6);
    pressRef.current = new PrintCanvas(c, L.W, L.H, dpr, L.cells, L.mobile ? 4 : 3);
    quant.current.opener = -1;
    drawRef.current(progress.get(), gsap.ticker.time);
    return () => {
      pressRef.current = null;
    };
  }, [L, stage.lowPower, progress]);

  useTicker((time) => drawRef.current(progress.get(), time));

  // size loud lines to the stage once the faces have loaded; keep MIC / ON. inside the sheet
  const fitAll = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    root.querySelectorAll<HTMLElement>("[data-fit]").forEach((el) => {
      const frac = Number(el.dataset.fit);
      const max = Number(el.dataset.fitMax) || Infinity;
      el.style.fontSize = "100px";
      const wd = el.offsetWidth;
      if (wd > 0) el.style.fontSize = `${Math.min(max, (100 * frac * L.W) / wd).toFixed(2)}px`;
    });
    band.texts.current.forEach((row) => {
      if (!row || !row[3]) return;
      row.forEach((t) => {
        t?.removeAttribute("textLength");
        t?.removeAttribute("lengthAdjust");
      });
      let n = 0;
      try {
        n = row[3].getComputedTextLength();
      } catch {
        n = 0;
      }
      if (n > L.band.maxTextW) {
        row.forEach((t) => {
          t?.setAttribute("textLength", String(L.band.maxTextW));
          t?.setAttribute("lengthAdjust", "spacingAndGlyphs");
        });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [L]);

  useIsoLayoutEffect(() => {
    fitAll();
  }, [fitAll]);

  useEffect(() => {
    const fonts = typeof document !== "undefined" ? document.fonts : undefined;
    if (!fonts) return;
    let alive = true;
    const on = () => {
      if (alive) fitAll();
    };
    fonts.ready.then(on).catch(() => {});
    fonts.addEventListener?.("loadingdone", on);
    return () => {
      alive = false;
      fonts.removeEventListener?.("loadingdone", on);
    };
  }, [fitAll]);

  /* ------------------------------------------------------ markup */
  const { W, H } = L;
  const inset = L.marks.inset;
  const whisperAxes = '"wdth" 58, "wght" 150';

  return (
    <div ref={rootRef} className="absolute inset-0 overflow-hidden" style={{ background: RISO.paper, color: RISO.ink }}>
      <canvas ref={canvasRef} aria-hidden className="absolute left-0 top-0" />

      <Cone refs={cone0} size={L.cones[0].r * 2} />
      <Cone refs={cone1} size={L.cones[1].r * 2} plate={RISO.teal} />

      {/* the sheet: registration marks */}
      <RegMark x={inset} y={inset} />
      <RegMark x={W - inset} y={inset} />
      <RegMark x={inset} y={H - inset} />

      <div
        ref={panel}
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          left: L.panel.x,
          top: L.panel.y,
          width: L.panel.w,
          height: L.panel.h,
          background: RISO.paper,
          border: `1px solid ${RISO.ink}`,
          borderRadius: 6,
          boxShadow: `3px 3px 0 ${RISO.ink}`,
          opacity: 0,
          visibility: "hidden",
        }}
      />
      <Vu refs={vu} segW={L.vu.segW} segH={L.vu.segH} gap={L.vu.gap} labelEvery={L.vu.labelEvery} fontSize={L.type.mono - 1} />
      <div className="pointer-events-none absolute" style={{ left: L.slug.x, top: L.slug.y }}>
        <Slug refs={slug} fontSize={L.type.mono} compact={L.mobile} />
      </div>

      <svg aria-hidden className="pointer-events-none absolute inset-0" width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        {Array.from({ length: 8 }, (_, i) => (
          <circle
            key={i}
            ref={(el) => {
              rings.current[i] = el;
            }}
            r={0}
            fill="none"
            stroke={RING_INKS[i % 4]}
            style={{ opacity: 0, visibility: "hidden", mixBlendMode: "multiply" }}
          />
        ))}
      </svg>

      {/* title card */}
      <div
        ref={label}
        className="pointer-events-none absolute left-1/2 whitespace-nowrap uppercase"
        style={{ top: L.labelY, transform: "translate(-50%, -50%)", fontFamily: MONO, fontSize: L.mobile ? 10 : 11, letterSpacing: "0.32em", color: RISO.ink }}
      >
        {COPY.label}
      </div>
      <Line elRef={whisper} y={L.whisperY} rows={[COPY.whisper]} fontSize={L.type.whisper} axes={whisperAxes} tracking="0.01em" style={{ opacity: 1, visibility: "inherit" }} />
      <Line elRef={tap1} y={L.tap.y} rows={[COPY.tap]} fontSize={L.type.tap} axes={'"wdth" 70, "wght" 280'} shadow={RISO.cobalt} style={{ left: W / 2 - L.tap.dx }} />
      <Line elRef={tap2} y={L.tap.y} rows={[COPY.tap]} fontSize={L.type.tap * 1.18} axes={'"wdth" 92, "wght" 420'} shadow={RISO.cobalt} style={{ left: W / 2 + L.tap.dx }} />

      {/* the voice, getting louder */}
      <Line
        elRef={grade6}
        y={L.ys.grade6}
        rows={L.rows.grade6}
        fit={L.fit.grade6}
        fitMax={L.fit.max}
        axes={'"wdth" 62, "wght" 240'}
        lineHeight={0.98}
        shadow={RISO.cobalt}
        sub={<Sub dot={RISO.cobalt}>{COPY.grade6Sub}</Sub>}
      />
      <WaveText refs={opener} rows={L.rows.opener} idBase={`${uid}o`} W={W} H={H} fontSize={L.type.opener} axes={'"wdth" 68, "wght" 300'} label={COPY.opener} shadow={RISO.teal} />
      <Line
        elRef={grade7}
        y={L.ys.grade7}
        rows={L.rows.grade7}
        fit={L.fit.grade7}
        fitMax={L.fit.max * 1.3}
        axes={'"wdth" 118, "wght" 720'}
        lineHeight={0.9}
        shadow={RISO.sun}
        tracking="-0.02em"
        sub={<Sub dot={RISO.teal}>{COPY.grade7Sub}</Sub>}
      />
      <Line
        elRef={inside}
        y={L.ys.inside}
        rows={L.rows.inside}
        fit={L.fit.inside}
        perRow={L.mobile}
        fitMax={L.fit.max * 1.6}
        axes={'"wdth" 146, "wght" 880'}
        lineHeight={0.86}
        shadow={RISO.sun}
        upper
        tracking="-0.02em"
      />

      {/* THE CLIP */}
      <ClipBand L={L} refs={band} idBase={`${uid}b`} />
      <div
        ref={age}
        className="pointer-events-none absolute left-1/2 whitespace-nowrap"
        style={{ top: L.ys.age, transform: "translate(-50%, -50%)", opacity: 0, visibility: "hidden" }}
      >
        <div
          className="inline-flex items-center"
          style={{
            fontFamily: MONO,
            fontSize: L.type.age,
            letterSpacing: "0.06em",
            background: RISO.paper,
            color: RISO.ink,
            padding: L.mobile ? "7px 10px" : "8px 14px",
            border: `1px solid ${RISO.ink}`,
            boxShadow: `3px 3px 0 ${RISO.ink}`,
          }}
          aria-label={COPY.age}
        >
          <span ref={ageTyped} aria-hidden />
          <span ref={ageCaret} aria-hidden className="inline-block" style={{ width: "0.6em", height: "1.05em", background: RISO.ink, marginLeft: 2 }} />
          <span ref={ageRest} aria-hidden style={{ color: "transparent" }}>
            {COPY.age}
          </span>
        </div>
      </div>

      <WaveText refs={welcome} rows={L.rows.welcome} idBase={`${uid}w`} W={W} H={H} fontSize={L.type.welcome} axes={'"wdth" 108, "wght" 560'} label={COPY.welcome} shadow={RISO.cobalt} />

      <Mic refs={mic} onTap={onTap} />
      <Knob refs={knob} />
      <Skate rootRef={setSkate} refs={skate} size={L.skate.S} />

      {/* the frame buzz, kept inside our own stage */}
      <div
        ref={buzz}
        aria-hidden
        className="pointer-events-none absolute"
        style={{ inset: L.mobile ? 5 : 7, border: `2px solid ${RISO.pink}`, borderRadius: L.mobile ? 14 : 18, opacity: 0, visibility: "hidden" }}
      />
      <div aria-hidden className="riso-grain" style={{ opacity: 0.13 }} />
    </div>
  );
}
