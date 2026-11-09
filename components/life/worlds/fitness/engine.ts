/**
 * One object owns the whole world's clock: every frame it computes the Frame,
 * feeds the renderer (WebGL2, or the CPU fallback), runs the live layer
 * (handprints, trails, mode switch, NUC click) and writes the HUD straight to
 * the DOM. No React state changes per frame.
 */
import { bell, clamp, easeInOutSine, hash, range } from "@/components/life/multiverse/ease";
import { CAPTIONS, readingWord } from "./copy";
import { C, MODES, VISIBLE, hexRgb01, stopsToFloats, type ModeId } from "./colors";
import { createFrame, computeFrame, type Frame } from "./frame";
import type { Geo } from "./geometry";
import { ThermalGL, type Live, type Look } from "./ThermalGL";
import { J } from "./rig";
import { SETS, phaseAt, thrusterReps } from "./timeline";
import type { WordMasks } from "./words";

export type HudRefs = {
  host: HTMLElement | null;
  group: HTMLElement | null;
  jitter: HTMLElement | null;
  reticle: HTMLElement | null;
  reading: HTMLElement | null;
  needle: HTMLElement | null;
  set: HTMLElement | null;
  nuc: HTMLElement | null;
  mode: HTMLElement | null;
  modeBar: HTMLElement | null;
  captions: (HTMLElement | null)[];
  again: (HTMLElement | null)[];
  note: HTMLElement | null;
  scale: HTMLElement | null;
};

export const emptyHud = (): HudRefs => ({
  host: null,
  group: null,
  jitter: null,
  reticle: null,
  reading: null,
  needle: null,
  set: null,
  nuc: null,
  mode: null,
  modeBar: null,
  captions: [],
  again: [],
  note: null,
  scale: null,
});

export interface Renderer {
  resize(w: number, h: number, dpr: number, fieldDiv: number): void;
  setWords(a: Uint8Array, b: Uint8Array, w: number, h: number): void;
  render(F: Frame, live: Live, look: Look): void;
  dispose(): void;
}

type Stamp = { x: number; y: number; has: boolean; n: number };

export class Engine {
  readonly F: Frame = createFrame();
  private renderer: Renderer | null = null;
  private g: Geo | null = null;
  private lowPower = false;
  private p = 0;
  private t = 0;
  private prevJoints = new Float32Array(this.F.joints.length);
  private hasPrev = false;
  private motionAvg = 0;

  private readonly live: Live = {
    decayPrints: 1,
    decayTrails: 1,
    diffuse: 0.3,
    deposit: 0,
    stamp: [0, 0, 0, 0],
    stampM: [1, 0, 1, 0.82],
    trail: [0, 0, 0, 0],
  };
  private readonly look: Look = {
    stopsA: stopsToFloats(MODES[0].stops, new Float32Array(18)),
    stopsB: stopsToFloats(MODES[0].stops, new Float32Array(18)),
    modeMix: 0,
    visible: 0,
    vis: new Float32Array(12),
    exposure: 1,
    noise: 0.038,
  };

  private readonly stamp: Stamp = { x: 0, y: 0, has: false, n: 0 };
  private trailMove = 0;
  private lastX = 0;
  private lastY = 0;
  private lastInside = false;

  private modeIdx = 0;
  private visibleTarget = 0;
  private nuc = 0;
  private nucExp = 0;
  private lastPhase = -2;
  private lastSetText = "";
  private lastReading = "";
  private lastHot = -1;
  private jitterAcc = 0;

  constructor(private readonly hud: HudRefs) {
    const vis = [VISIBLE.wall, VISIBLE.floor, VISIBLE.body, VISIBLE.bar];
    vis.forEach((c, i) => {
      const [r, g, b] = hexRgb01(c);
      this.look.vis[i * 3] = r;
      this.look.vis[i * 3 + 1] = g;
      this.look.vis[i * 3 + 2] = b;
    });
  }

  useRenderer(r: Renderer | null) {
    this.renderer = r;
  }

  setGeo(g: Geo, lowPower: boolean, dpr: number) {
    this.g = g;
    this.lowPower = lowPower;
    this.renderer?.resize(g.W, g.H, dpr, g.fieldDiv);
  }

  setWords(masks: WordMasks) {
    this.renderer?.setWords(masks.a, masks.b, masks.w, masks.h);
  }

  setProgress(p: number) {
    this.p = p;
  }

  /** Tap the HUD. */
  cycleMode(): ModeId {
    this.modeIdx = (this.modeIdx + 1) % MODES.length;
    const mode = MODES[this.modeIdx];
    this.look.stopsA.set(this.currentStops());
    stopsToFloats(mode.stops, this.look.stopsB);
    this.look.modeMix = 0.0001;
    this.visibleTarget = mode.id === "VISIBLE" ? 1 : 0;
    if (this.hud.mode) this.hud.mode.textContent = mode.id;
    if (this.hud.modeBar) this.hud.modeBar.style.background = modeGradient(mode.stops);
    return mode.id;
  }

  private currentStops() {
    const { stopsA: a, stopsB: b, modeMix: m } = this.look;
    const out = new Float32Array(18);
    for (let i = 0; i < 18; i++) out[i] = a[i] + (b[i] - a[i]) * m;
    return out;
  }

  /** Heat a hand onto the wall (pointer: stage px). */
  private handprint(px: number, py: number, g: Geo) {
    const n = this.stamp.n++;
    const tilt = (hash(n * 3 + 1) - 0.5) * 0.9;
    this.live.stamp[0] = px;
    this.live.stamp[1] = py + g.hand * 0.04;
    this.live.stamp[2] = g.hand;
    this.live.stamp[3] = 1;
    this.live.stampM[0] = Math.cos(tilt);
    this.live.stampM[1] = Math.sin(tilt);
    this.live.stampM[2] = n % 2 === 0 ? 1 : -1;
    this.live.stampM[3] = 0.84;
    this.stamp.x = px;
    this.stamp.y = py;
    this.stamp.has = true;
  }

  frame(time: number, dt: number, px: number, py: number, inside: boolean) {
    const g = this.g;
    if (!g) return;
    const { F, live, look } = this;
    const p = this.p;

    // the NUC click: the sensor holds a frame, then the exposure settles
    if (this.nuc > 0) this.nuc = Math.max(0, this.nuc - dt);
    else this.t += dt;
    this.nucExp = Math.max(0, this.nucExp - dt / 0.5);

    computeFrame(F, p, this.t, g, { lowPower: this.lowPower });

    // scroll-driven motion deposits a short trail
    let move = 0;
    if (this.hasPrev) {
      for (let i = 0; i < F.joints.length; i++) move += Math.abs(F.joints[i] - this.prevJoints[i]);
    }
    this.prevJoints.set(F.joints);
    this.hasPrev = true;
    this.motionAvg += (Math.min(1, move * 7) - this.motionAvg) * (1 - Math.pow(0.002, dt));

    live.decayPrints = Math.pow(0.5, dt / 1.5);
    live.decayTrails = Math.pow(0.5, dt / 0.34);
    live.diffuse = 1 - Math.pow(0.62, dt * 60);
    live.deposit = this.motionAvg * 0.32 * clamp(dt * 60, 0, 2);

    // handprints
    live.stamp[3] = 0;
    live.trail[3] = 0;
    const justIn = inside && !this.lastInside;
    if (inside) {
      const dx = px - this.lastX;
      const dy = py - this.lastY;
      const speed = Math.hypot(dx, dy);
      this.trailMove += (Math.min(1, speed / 14) - this.trailMove) * (1 - Math.pow(0.01, dt));
      if (this.trailMove > 0.05 || justIn) {
        live.trail[0] = px;
        live.trail[1] = py;
        live.trail[2] = g.hand * 0.1;
        live.trail[3] = 0.36 * this.trailMove;
      }
      const away = !this.stamp.has || Math.hypot(px - this.stamp.x, py - this.stamp.y) > g.hand * 1.15;
      if (away && (speed > 0.5 || justIn)) this.handprint(px, py, g);
    }
    this.lastX = px;
    this.lastY = py;
    this.lastInside = inside;

    // the look
    if (look.modeMix > 0) {
      look.modeMix = Math.min(1, look.modeMix + dt / 0.32);
      if (look.modeMix >= 1) {
        look.stopsA.set(look.stopsB);
        look.modeMix = 0;
      }
    }
    look.visible += (this.visibleTarget - look.visible) * (1 - Math.pow(0.0005, dt));
    if (Math.abs(look.visible - this.visibleTarget) < 0.002) look.visible = this.visibleTarget;
    look.exposure = 1 + 0.05 * this.nucExp * this.nucExp;

    this.renderer?.render(F, live, look);
    this.writeHud(F, p, g, dt, time);
  }

  private writeHud(F: Frame, p: number, g: Geo, dt: number, time: number) {
    const h = this.hud;
    // the last rep locks out: a settle, not a shake
    if (h.host) {
      const settle = bell(p, 0.828, 0.846, 0.846, 0.9);
      h.host.style.transform = settle > 0.001 ? `scale(${(1 + 0.016 * easeInOutSine(settle)).toFixed(4)})` : "";
    }
    const fade = 1 - range(p, 0.94, 0.968);
    if (h.group) h.group.style.opacity = String(fade);

    // HUD text carries a 1px sensor jitter, a few times a second
    this.jitterAcc += dt;
    if (this.jitterAcc > 0.11 && h.jitter) {
      this.jitterAcc = 0;
      const jx = hash(time * 31.7) > 0.86 ? (hash(time * 13.1) > 0.5 ? 1 : -1) : 0;
      const jy = hash(time * 53.3) > 0.9 ? 1 : 0;
      h.jitter.style.transform = `translate(${jx}px, ${jy}px)`;
    }

    // the reticle locks on the chest joint
    if (h.reticle) {
      const x = g.cx + F.joints[J.chest * 2] * g.fh;
      const y = g.floorY - F.joints[J.chest * 2 + 1] * g.fh;
      h.reticle.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      // on a white-hot chest the marks flip to ink, or they vanish
      const hot = F.chestT > 0.74 ? 1 : 0;
      if (hot !== this.lastHot) {
        h.reticle.style.color = hot ? C.ink : C.paper;
        this.lastHot = hot;
      }
    }
    const word = readingWord(F.chestT);
    if (word !== this.lastReading && h.reading) {
      h.reading.textContent = word;
      this.lastReading = word;
    }

    // COUCH ←→ BUILT
    if (h.needle) {
      const n = clamp(F.needle);
      h.needle.style.transform = g.scale.vertical
        ? `translate3d(0, ${((1 - n) * g.scale.len).toFixed(1)}px, 0)`
        : `translate3d(${(n * g.scale.len).toFixed(1)}px, 0, 0)`;
    }

    const phase = phaseAt(p);
    const text = phase.set >= 0 && phase.set < SETS.length ? `SET ${SETS[phase.set].n}/04 · ${phase.label}` : phase.label;
    if (text !== this.lastSetText && h.set) {
      h.set.textContent = text;
      this.lastSetText = text;
    }
    if (phase.set !== this.lastPhase) {
      if (this.lastPhase !== -2 && phase.set >= 0) {
        this.nuc = 0.12;
        this.nucExp = 1;
      }
      this.lastPhase = phase.set;
    }
    if (h.nuc) h.nuc.style.opacity = String(this.nucExp * this.nucExp > 0.1 ? 1 : 0);

    CAPTIONS.forEach((c, i) => {
      const el = h.captions[i];
      if (!el) return;
      const o = bell(p, c.at[0], c.at[1], c.at[2], c.at[3]);
      el.style.opacity = String(easeInOutSine(o));
      el.style.visibility = o > 0.001 ? "visible" : "hidden";
      el.style.transform = `translate3d(0, ${((1 - easeInOutSine(o)) * 12 * g.u).toFixed(1)}px, 0)`;
    });

    const reps = thrusterReps(p);
    h.again.forEach((el, i) => {
      if (!el) return;
      const on = range(reps, i + 1, i + 1.5) * (1 - range(p, 0.838, 0.852));
      el.style.opacity = String(on);
    });
    if (h.note) h.note.style.opacity = String(this.look.visible * (1 - range(p, 0.9, 0.94)));
  }

  dispose() {
    this.renderer?.dispose();
    this.renderer = null;
  }
}

function modeGradient(stops: readonly string[]) {
  return `linear-gradient(to right, ${stops.join(", ")})`;
}

export { ThermalGL };
