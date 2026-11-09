"use client";

/**
 * 04 · Social — "Eyes On Me".
 *
 * Attention, made literal. "LOOK AT ME." looks back; one giant eye opens;
 * powers of ten pop rings of eyes until 10M+ are staring at the post (your
 * cursor). Then everyone blinks — a lid wave rolls out from the post, the
 * sea closes and sinks — and only the followers (sun irises) open again.
 * They follow you around, then stream into the gavel: the next portal.
 *
 * Layers (bottom → top): pink ground · gavel (next portal) · eye canvas
 * (WebGL field + instanced followers, or a 2D fallback) · copy · post · grain.
 */

import { useCallback, useEffect, useMemo, useRef } from "react";
import { LazyCanvas } from "@/components/life/multiverse/LazyCanvas";
import {
  useIsoLayoutEffect,
  usePointer,
  usePortalOrigin,
  useProgress,
  useStage,
  useTicker,
  useWorld,
} from "@/components/life/multiverse/runtime";
import { RISO } from "@/components/life/multiverse/palette";
import { backOut, bell, clamp, easeOutCubic, lerp, range } from "@/components/life/multiverse/ease";
import type { WorldProps } from "@/components/life/multiverse/types";
import { Copy, GavelMark, emptyHandles, sizes } from "./Copy";
import EyeScene from "./EyeScene";
import Field2D from "./Field2D";
import { setOEye } from "./OEye";
import { POST, PostCard } from "./PostCard";
import { LidRegistry, axes } from "./lids";
import { SocialSim, type PointerSample } from "./sim";
import { formatViews, makeLayout } from "./timeline";

export default function SocialWorld({ progress }: WorldProps) {
  const stage = useStage();
  const { active } = useWorld();
  const origin = usePortalOrigin();
  const pointer = usePointer();

  const L = useMemo(() => makeLayout(stage.width, stage.height, stage.isMobile), [stage.width, stage.height, stage.isMobile]);
  const nFollowers = L.followers.n;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const sim = useMemo(() => new SocialSim(L), [nFollowers]);
  const reg = useMemo(() => new LidRegistry(), []);
  const h = useMemo(() => emptyHandles(), []);

  const rootRef = useRef<HTMLDivElement>(null);
  const postRef = useRef<HTMLDivElement>(null);
  const pRef = useRef(progress.get());
  const lastViews = useRef("");
  const eyeGaze = useRef(new Float32Array(8));
  const eyeCenters = useRef<[number, number][]>([
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
  ]);
  const ptr = useRef<PointerSample & { seen: boolean; x0: number; y0: number; init: boolean }>({
    x: 0,
    y: 0,
    live: false,
    seen: false,
    x0: 0,
    y0: 0,
    init: false,
  });
  const look = useRef({
    gx: 0,
    gy: 0,
    tx: 0,
    ty: 0,
    nextSacc: 0,
    blinkAt: -10,
    blinkDur: 0.16,
    nextBlink: 2,
    slow: true,
    lastX: 0,
    tilt: 0,
  });

  /* ------------------------------------------------------------ measuring */
  const measure = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    const rr = root.getBoundingClientRect();
    const k = rr.width / (root.offsetWidth || 1) || 1;
    h.eyes.forEach((e, i) => {
      const r = e?.root?.getBoundingClientRect();
      if (r && r.width > 0) eyeCenters.current[i] = [(r.left + r.width / 2 - rr.left) / k, (r.top + r.height / 2 - rr.top) / k];
    });
    const rectOf = (el: HTMLElement | null): [number, number, number, number] | null => {
      const r = el?.getBoundingClientRect();
      return r && r.width > 0 ? [(r.left - rr.left) / k - 10, (r.top - rr.top) / k - 6, (r.right - rr.left) / k + 10, (r.bottom - rr.top) / k + 10] : null;
    };
    sim.clearF = rectOf(h.followBlock) ?? sim.clearF;
    sim.clearC = rectOf(h.blinkBlock) ?? sim.clearC;
  }, [h, sim]);

  /* -------------------------------------------- progress-driven DOM writes */
  const paint = useCallback(
    (p: number) => {
      const f = sim.frame;
      const s = sizes(L);

      // views counter: digits, label, attention-inflated axes, the slam to centre
      const num = h.viewsNum;
      const wrap = h.viewsWrap;
      if (num && wrap) {
        const str = formatViews(f.views);
        if (str !== lastViews.current) {
          lastViews.current = str;
          num.textContent = str;
          if (h.viewsLabel) h.viewsLabel.textContent = f.views < 1.5 ? "View" : "Views";
        }
        const a = f.attention;
        num.style.fontVariationSettings = axes(72 + 78 * a, 520 + 380 * a);
        const k = clamp(f.slam, 0, 1);
        const sc = lerp(1, s.stareScale, f.slam);
        const hx = L.mobile ? L.pad : L.W - L.pad;
        const hax = L.mobile ? 0 : -100;
        const x = lerp(hx, L.W / 2, k);
        const y = lerp(s.viewsTop, s.stareY, k);
        const ax = lerp(hax, -50, k);
        const ay = lerp(0, -50, k);
        wrap.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(${ax.toFixed(2)}%, ${ay.toFixed(2)}%) scale(${sc.toFixed(4)})`;
        if (f.clearB > 0) {
          const w = wrap.offsetWidth;
          const hh = wrap.offsetHeight;
          const x0 = L.mobile ? L.pad : L.W - L.pad - w;
          sim.field.clearB = [x0 - 8, s.viewsTop - 6, x0 + w + 8, s.viewsTop + hh + 6];
        }
      }

      // the headline swells with attention; the eyes make room for its real width
      if (h.headline) h.headline.style.fontVariationSettings = axes(80 + 24 * f.attention, 380 + 470 * f.attention);
      const hb = h.headBlock;
      if (hb && f.clearA > 0) {
        let w = h.kicker?.offsetWidth ?? 0;
        for (const ln of h.headLines) if (ln) w = Math.max(w, ln.offsetWidth);
        const x0 = hb.offsetLeft;
        sim.field.clearA = [x0 - 8, hb.offsetTop - 6, x0 + w + 10, hb.offsetTop + hb.offsetHeight + 6];
      }

      // the next portal's silhouette fills in as the followers arrive
      if (h.gavel) {
        const g = backOut(range(p, 0.9, 0.962), 1.5);
        h.gavel.style.transform = `scale(${g.toFixed(4)})`;
        h.gavel.style.visibility = g <= 0.001 ? "hidden" : "visible";
      }
    },
    [L, h, sim],
  );

  /* ------------------------------------------------------------ lifecycle */
  useIsoLayoutEffect(() => {
    sim.layout(L);
    lastViews.current = "";
    measure();
    sim.setProgress(pRef.current);
    paint(pRef.current);
    reg.snap(pRef.current);
  }, [L, sim, measure, paint, reg]);

  useEffect(() => {
    let alive = true;
    document.fonts?.ready.then(() => {
      if (!alive) return;
      measure();
      paint(pRef.current);
    });
    return () => {
      alive = false;
    };
  }, [measure, paint]);

  useEffect(() => {
    if (!active) return;
    look.current.slow = true;
    const id = window.setTimeout(measure, 60);
    return () => window.clearTimeout(id);
  }, [active, measure]);

  useProgress(progress, (p) => {
    pRef.current = p;
    sim.setProgress(p);
    paint(p);
  });

  /* ------------------------------------------------------------ the clock */
  useTicker((t, dt) => {
    const p = pRef.current;
    const P = ptr.current;
    const x = pointer.x.get();
    const y = pointer.y.get();
    if (!P.init) {
      P.init = true;
      P.x0 = x;
      P.y0 = y;
    }
    if (!P.seen && (x !== P.x0 || y !== P.y0)) P.seen = true;
    P.x = x;
    P.y = y;
    P.live = P.seen && (pointer.type.current !== "mouse" || pointer.inside.get() > 0.5);

    sim.tick(t, dt, P);
    reg.step(p, dt);

    // "LOOK AT ME." — the O's find you (or wander), blink, and blink slowly once on arrival
    const lk = look.current;
    if (lk.slow) {
      lk.slow = false;
      lk.blinkAt = t + 0.45;
      lk.blinkDur = 0.62;
      lk.nextBlink = t + 3.4;
    }
    if (t >= lk.nextBlink) {
      lk.blinkAt = t;
      lk.blinkDur = 0.17;
      lk.nextBlink = t + 2.4 + Math.random() * 3.2;
    }
    if (P.live) {
      lk.tx = P.x;
      lk.ty = P.y;
    } else if (t >= lk.nextSacc) {
      lk.nextSacc = t + 0.5 + Math.random() * 1.3;
      lk.tx = L.W * (0.15 + Math.random() * 0.7);
      lk.ty = L.H * (0.2 + Math.random() * 0.7);
    }
    const bt = (t - lk.blinkAt) / lk.blinkDur;
    const open = bt < 0 || bt > 1 ? 1 : 1 - Math.sin(Math.PI * bt);
    const dart = 1 - Math.exp(-dt / 0.03);
    for (let i = 0; i < 4; i++) {
      const parts = h.eyes[i];
      if (!parts) continue;
      const [ex, ey] = eyeCenters.current[i];
      const dx = lk.tx - ex;
      const dy = lk.ty - ey;
      const d = Math.hypot(dx, dy) || 1;
      const m = Math.min(d / (i < 2 ? 260 : 120), 1);
      const G = eyeGaze.current;
      G[i * 2] += ((dx / d) * m - G[i * 2]) * dart;
      G[i * 2 + 1] += ((dy / d) * m - G[i * 2 + 1]) * dart;
      setOEye(parts, G[i * 2], G[i * 2 + 1], open);
    }

    // the post card
    const el = postRef.current;
    if (el) {
      const F = sim.field;
      const vis = bell(p, 0.118, 0.15, 0.875, 0.915);
      const vx = (F.postX - lk.lastX) / Math.max(dt, 1 / 240);
      lk.lastX = F.postX;
      lk.tilt += (clamp(vx * 0.012, -14, 14) - lk.tilt) * (1 - Math.exp(-dt * 10));
      const sc = POST.w * (L.mobile ? 0.95 : 1);
      const s = 0.55 + 0.45 * easeOutCubic(vis);
      el.style.opacity = vis.toFixed(3);
      el.style.transform = `translate(${(F.postX - sc / 2).toFixed(1)}px, ${(F.postY - (sc * POST.h) / POST.w / 2).toFixed(1)}px) rotate(${(-7 + lk.tilt).toFixed(2)}deg) scale(${s.toFixed(3)})`;
    }
  });

  const onPointerDown = useCallback(() => {
    sim.poke();
    const lk = look.current;
    lk.blinkAt = -1;
    lk.nextBlink = 0;
  }, [sim]);

  return (
    <div
      ref={rootRef}
      className="absolute inset-0 overflow-hidden"
      style={{ background: RISO.pink }}
      data-site-cursor="hide"
      onPointerDown={onPointerDown}
    >
      <GavelMark L={L} h={h} originRef={origin} />
      <LazyCanvas
        orthographic
        camera={{ position: [0, 0, 10], near: 0.1, far: 100 }}
        style={{ zIndex: 2, pointerEvents: "none" }}
        fallback={
          <div className="pointer-events-none absolute inset-0" style={{ zIndex: 2 }}>
            <Field2D sim={sim} />
          </div>
        }
      >
        <EyeScene sim={sim} />
      </LazyCanvas>
      <Copy L={L} reg={reg} h={h} />
      <PostCard ref={postRef} scale={L.mobile ? 0.95 : 1} />
      <div className="riso-grain" aria-hidden style={{ zIndex: 6, opacity: 0.16 }} />
    </div>
  );
}
