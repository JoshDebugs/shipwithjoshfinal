"use client";

/**
 * The chromatic flood, riso-style: instead of a solid colour, each face that
 * looks at the camera prints its ink as a halftone screen (its own screen
 * angle, overprinted with multiply). Turn speed swells the dots; every lock
 * sends a halftone shockwave out from the cube in that band's ink. Paper is
 * knocked out behind the captions so type always sits on clean stock.
 */

import { useEffect, useRef } from "react";
import type { MotionValue } from "framer-motion";
import { useStage, useTicker } from "@/components/life/multiverse/runtime";
import { clamp, expoOut, range, smoothstep } from "@/components/life/multiverse/ease";
import { FACE_INK } from "../lib/script";
import { K, faceWeights, layout, movePos, rig, screenRadius } from "../lib/rig";
import { frame } from "../lib/frame";
import type { Store } from "../lib/store";
import type { FaceId } from "../lib/cube";

const SCREEN_ANGLE: Record<FaceId, number> = { U: 0, F: 15, R: 0, B: 45, L: 75, D: 30 };
const FLOOD_FACES: FaceId[] = ["F", "R", "B", "L", "D"];
const RING_LIFE = 1.9;

export function Halftone({ progress, store }: { progress: MotionValue<number>; store: Store }) {
  const stage = useStage();
  const ref = useRef<HTMLCanvasElement>(null);
  const last = useRef({ p: -1, speed: -1, w: 0, h: 0, m: 0 });

  const dpr = typeof window === "undefined" ? 1 : Math.min(window.devicePixelRatio || 1, stage.lowPower ? 1 : 1.5);
  const W = stage.width;
  const H = stage.height;

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    c.width = Math.round(W * dpr);
    c.height = Math.round(H * dpr);
    last.current.w = 0;
  }, [W, H, dpr]);

  useTicker((time, dt) => {
    const c = ref.current;
    if (!c || !W || !H) return;
    const p = progress.get();
    const now = performance.now() / 1000;

    // turn speed (moves / s), smoothed
    const m = movePos(p);
    const raw = dt > 0 ? Math.abs(m - last.current.m) / dt : 0;
    last.current.m = m;
    store.speed += (Math.min(raw, 40) - store.speed) * (1 - Math.exp(-dt * 5));

    store.rings = store.rings.filter((r) => now - r.t0 < RING_LIFE);
    const ringsLive = store.rings.length > 0;
    const L = last.current;
    if (!ringsLive && Math.abs(p - L.p) < 1e-5 && Math.abs(store.speed - L.speed) < 0.02 && L.w === W && L.h === H) return;
    L.p = p;
    L.speed = store.speed;
    L.w = W;
    L.h = H;

    const ctx = c.getContext("2d");
    if (!ctx) return;
    const lay = layout(W, H);
    const r = rig(p, W, H, lay);
    const fr = frame(W, H);
    const wts = faceWeights(r);
    const R0 = screenRadius(r, H);
    const diag = Math.hypot(W, H);
    const pitch = (stage.isMobile ? 11 : 15) * dpr;

    const intro = smoothstep(range(p, 0.05, 0.17));
    const endFade = 1 - smoothstep(range(p, K.playEnd, K.poster2));
    const exit = smoothstep(range(p, K.poster2, 0.97));
    const swell = clamp(store.speed / 14) * 0.16;
    const base = (0.3 + swell) * intro * endFade;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.globalCompositeOperation = "multiply";

    const cx = r.cx * dpr;
    const cy = r.cy * dpr;
    const ko = fr.knockout;
    const kx0 = ko.x * dpr;
    const kx1 = (ko.x + ko.w) * dpr;
    const ky0 = ko.y * dpr;
    const ky1 = (ko.y + ko.h) * dpr;
    const koOn = (1 - smoothstep(range(p, K.playEnd, 0.9))) * smoothstep(range(p, 0.2, 0.26));
    const feather = (stage.isMobile ? 30 : 56) * dpr;
    const r0 = R0 * 0.75 * dpr;
    const maxD = diag * 0.62 * dpr;

    const spatial = (x: number, y: number) => {
      const d = Math.hypot(x - cx, y - cy);
      let s = 0.28 + 0.72 * smoothstep(clamp((d - r0) / (maxD - r0)));
      if (koOn > 0) {
        const inside = Math.min(x - kx0, kx1 - x, y - ky0, ky1 - y);
        if (inside > 0) s *= 1 - koOn * smoothstep(clamp(inside / feather));
      }
      return s;
    };

    const screen = (color: string, angleDeg: number, cov: (x: number, y: number) => number) => {
      const a = (angleDeg * Math.PI) / 180;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      const n = Math.ceil(diag * dpr / pitch / 2) + 2;
      const ox = c.width / 2;
      const oy = c.height / 2;
      ctx.beginPath();
      for (let i = -n; i <= n; i++) {
        for (let j = -n; j <= n; j++) {
          const x = ox + (i * ca - j * sa) * pitch;
          const y = oy + (i * sa + j * ca) * pitch;
          if (x < -pitch || y < -pitch || x > c.width + pitch || y > c.height + pitch) continue;
          const v = cov(x, y);
          if (v < 0.012) continue;
          const rad = pitch * 0.56 * Math.sqrt(Math.min(1, v));
          ctx.moveTo(x + rad, y);
          ctx.arc(x, y, rad, 0, Math.PI * 2);
        }
      }
      ctx.fillStyle = color;
      ctx.fill();
    };

    const solo = smoothstep(range(p, K.flipEnd - 0.02, K.flipEnd + 0.008));

    // face floods
    if (base > 0.004) {
      for (const f of FLOOD_FACES) {
        const wt = wts[f];
        // once the punchline is up the room settles on its one ink (three faces at once read as confetti)
        const k = base * Math.pow(wt, 2.2) * 1.35 * (f === "D" ? 1 + 0.5 * solo : 1 - solo);
        if (k < 0.01) continue;
        screen(FACE_INK[f].bg, SCREEN_ANGLE[f], (x, y) => k * spatial(x, y));
      }
    }

    // the exit: the punchline face floods pink as the cube cracks open
    if (exit > 0.002) {
      const k = 0.62 * exit;
      screen(FACE_INK.D.bg, SCREEN_ANGLE.D, (x, y) => k * (0.35 + 0.65 * smoothstep(clamp(Math.hypot(x - cx, y - cy) / maxD))));
    }

    // shockwaves
    for (const ring of store.rings) {
      const age = now - ring.t0;
      const t = age / RING_LIFE;
      const radius = r0 * 0.9 + diag * dpr * 0.75 * expoOut(Math.min(1, t * 1.1));
      const width = (90 + 260 * t) * dpr;
      const amp = 0.85 * Math.pow(1 - t, 1.6);
      screen(ring.color, 45, (x, y) => {
        const d = Math.hypot(x - cx, y - cy) - radius;
        return amp * Math.exp(-(d * d) / (width * width));
      });
    }
    ctx.globalCompositeOperation = "source-over";
    void time;
  });

  return <canvas ref={ref} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" style={{ zIndex: 0 }} />;
}
