/**
 * The Receipts' frame engine. One function lays out the whole world for a
 * progress value; the ticker adds paper physics (billow) on top.
 *
 * The paper is a chain of rows hinged at the slot. Each row's angle =
 * the resting curl (old rows roll back over the top) + a damped spring
 * driven by how fast the paper is feeding (scroll velocity → billow, a flick
 * whips the free end). Rows are painted in DOM order inside a flat
 * perspective container, so overlays (stamps, ribbon, tags) always sit on top.
 */
import { backOut, bell, clamp, easeInCubic, easeInOutCubic, easeOutCubic, lerp, range, smoothstep } from "@/components/life/multiverse/ease";
import type { Geo } from "./geometry";
import { cumAt } from "./geometry";
import { B, cursor, jolt, slam, slotY } from "./timeline";
import { DOTO, IDX, PRINTS, ROWS } from "./rows";

const N = ROWS.length;
const HIST = 96;

export type OverlayRef = { el: HTMLDivElement | null; row: number };

export type Refs = {
  rows: (HTMLDivElement | null)[];
  inks: (HTMLDivElement | null)[];
  shades: (HTMLDivElement | null)[];
  overlays: OverlayRef[];
  stampS: HTMLDivElement | null;
  stampSShadow: HTMLDivElement | null;
  stampSSpatter: HTMLDivElement | null;
  stampF: HTMLDivElement | null;
  stampFShadow: HTMLDivElement | null;
  stampFSpatter: HTMLDivElement | null;
  ribbon: HTMLDivElement | null;
  bow: HTMLDivElement | null;
  giftTag: HTMLDivElement | null;
  bar: HTMLDivElement | null;
  swing: HTMLDivElement | null;
  swingWrap: HTMLDivElement | null;
  laser: HTMLDivElement | null;
  beep: HTMLDivElement | null;
  band: HTMLDivElement | null;
  hot: HTMLDivElement | null;
  head: HTMLDivElement | null;
  lcd: HTMLSpanElement | null;
  led: HTMLSpanElement | null;
  stub: HTMLDivElement | null;
  spec: HTMLDivElement | null;
  wallGlow: HTMLDivElement | null;
  paperGlow: HTMLDivElement | null;
  shadow: HTMLDivElement | null;
  speed: (HTMLDivElement | null)[];
  words: (HTMLDivElement | null)[];
  sticker: HTMLDivElement | null;
  halftoneWrap: HTMLDivElement | null;
};

export function emptyRefs(): Refs {
  return {
    rows: [],
    inks: [],
    shades: [],
    overlays: [],
    stampS: null,
    stampSShadow: null,
    stampSSpatter: null,
    stampF: null,
    stampFShadow: null,
    stampFSpatter: null,
    ribbon: null,
    bow: null,
    giftTag: null,
    bar: null,
    swing: null,
    swingWrap: null,
    laser: null,
    beep: null,
    band: null,
    hot: null,
    head: null,
    lcd: null,
    led: null,
    stub: null,
    spec: null,
    wallGlow: null,
    paperGlow: null,
    shadow: null,
    speed: [],
    words: [],
    sticker: null,
    halftoneWrap: null,
  };
}

/** Overprint words: [enter at, leave at). Index 0 is the title card's line. */
export const WORDS: { lines: string[]; a: number; b: number }[] = [
  { lines: ["YOU WANTED", "RECEIPTS?"], a: -1, b: B.sStampHit },
  { lines: ["SHIPPED."], a: B.sStampHit, b: B.fStampHit },
  { lines: ["SOLD IRL."], a: B.fStampHit, b: B.tagHit },
  { lines: ["FOR SALE."], a: B.tagHit, b: B.flyA },
  { lines: ["VISIT AGAIN."], a: B.flyA + 0.02, b: 2 },
];

/** Ink alpha over a row tilted by `th` degrees (away from us = darker). */
function shadeOf(th: number): number {
  return th > 0 ? 0.42 * clamp(th / 75) : 0.18 * clamp(-th / 30);
}

/** Resting font-stretch of overprint word k (phones keep words narrower so they can be bigger). */
export function wordRest(g: Geo, k: number): number {
  if (k === 0) return g.mobile ? 78 : 136;
  return g.mobile ? 100 : 150;
}

function lcdText(p: number): string {
  if (p < B.panA + 0.01) return "READY";
  if (p < B.sStampA) return "PRINTING 1/3";
  if (p < 0.2) return "STAMPED";
  if (p < B.ribbonA) return "PRINTING 2/3";
  if (p < 0.342) return "GIFT WRAP";
  if (p < B.barA) return "PRICE HIDDEN";
  if (p < B.fStampA) return "KIDDING";
  if (p < 0.51) return "STAMPED";
  if (p < B.turboB + 0.002) return "TURBO";
  if (p < 0.62) return "FOR SALE";
  if (p < B.laserA) return "ITEMS 3";
  if (p < B.beepA) return "SCANNING";
  if (p < B.tearA) return "BEEP";
  if (p < B.flyB) return "TEAR HERE";
  return "PAPER OUT";
}

type Cache = { tf: string[]; vis: boolean[]; clip: string[]; op: number[]; rond: number[]; shade: number[]; trail: boolean[] };

export class Engine {
  g: Geo | null = null;
  p = 0;
  private psi = new Float32Array(N);
  private vel = new Float32Array(N);
  private hist = new Float32Array(HIST);
  private hi = 0;
  private vSmooth = 0;
  private lastL: number | null = null;
  private swingA = 0;
  private swingV = 0;
  private time = 0;
  private lastLcd = "";
  private lastWord: { op: number; st: number; sx: number }[] = WORDS.map(() => ({ op: -1, st: -1, sx: -1 }));
  private cache: Cache = { tf: [], vis: [], clip: [], op: [], rond: [], shade: [], trail: [] };
  private ovVis: boolean[] = [];
  private torn: boolean | null = null;
  /** Resting font-stretch per overprint word (the title line sits narrower on phones). */
  private wordRest: number[] = WORDS.map(() => 150);

  constructor(public refs: Refs) {}

  setGeo(g: Geo) {
    this.g = g;
    this.cache = { tf: [], vis: [], clip: [], op: [], rond: [], shade: [], trail: [] };
    this.ovVis = [];
    this.lastWord = WORDS.map(() => ({ op: -1, st: -1, sx: -1 }));
    this.lastLcd = "";
    this.torn = null;
    this.wordRest = WORDS.map((_, k) => wordRest(g, k));
  }

  /** Physics + ambient step (ticker). */
  tick(dt: number) {
    const g = this.g;
    if (!g || dt <= 0) return;
    this.time += dt;
    const L = cumAt(g, cursor(this.p)) + g.lead;
    if (this.lastL === null) this.lastL = L;
    const v = clamp((L - this.lastL) / dt, -5000, 5000);
    this.lastL = L;
    this.vSmooth += (v - this.vSmooth) * (1 - Math.exp(-dt / 0.05));
    this.hi = (this.hi + 1) % HIST;
    this.hist[this.hi] = this.vSmooth;

    const w = Math.PI * 2 * 1.55;
    const zeta = 0.26;
    const K = 30 / 1500; // deg per px/s
    const amp0 = 40 * g.u;
    const amp1 = g.H * 0.5;
    let moving = Math.abs(this.vSmooth) > 1;
    for (let i = 0; i < N; i++) {
      const sMid = L - g.top[i] - g.h[i] / 2;
      if (sMid < -g.h[i]) {
        this.psi[i] = 0;
        this.vel[i] = 0;
        continue;
      }
      const delay = Math.min(HIST - 1, Math.round((Math.max(0, sMid) / (2600 * g.u)) * 60));
      const vd = this.hist[(this.hi - delay + HIST) % HIST];
      const amp = smoothstep(range(sMid, amp0, amp1));
      const target = clamp(vd * K, -28, 28) * amp;
      const a = w * w * (target - this.psi[i]) - 2 * zeta * w * this.vel[i];
      this.vel[i] += a * dt;
      this.psi[i] = clamp(this.psi[i] + this.vel[i] * dt, -28, 28);
      if (Math.abs(this.vel[i]) > 0.05 || Math.abs(this.psi[i]) > 0.05) moving = true;
    }

    // FOR SALE tag: a pendulum nudged by the paper's own motion
    const wt = Math.PI * 2 * 0.9;
    const ta = wt * wt * (clamp(-this.vSmooth * 0.012, -16, 16) - this.swingA) - 2 * 0.12 * wt * this.swingV;
    this.swingV += ta * dt;
    this.swingA += this.swingV * dt;
    if (Math.abs(this.swingV) > 0.02) moving = true;

    // ambient: the slot breathes
    const breathe = 0.5 + 0.5 * Math.sin(this.time * 1.6);
    const r = this.refs;
    if (r.wallGlow) r.wallGlow.style.opacity = String(0.78 + 0.22 * breathe);
    if (r.led) r.led.style.opacity = String(0.45 + 0.55 * breathe);
    if (r.halftoneWrap) {
      const t = this.time;
      r.halftoneWrap.style.transform = `translate3d(${(Math.sin(t * 0.21) * 5).toFixed(2)}px, ${(Math.cos(t * 0.17) * 4).toFixed(2)}px, 0) rotate(${(Math.sin(t * 0.11) * 0.35).toFixed(3)}deg)`;
    }

    if (moving) this.frame(this.p);
  }

  /** Lay out everything for progress p. */
  frame(p: number) {
    this.p = p;
    const g = this.g;
    const r = this.refs;
    if (!g) return;
    const { u, H, rw, rx } = g;

    const sy = slotY(g, p);
    const c = cursor(p);
    const L = cumAt(g, c) + g.lead;

    // ----------------------------------------------------------- exit motion
    const taut = 1 - easeInOutCubic(range(p, B.springA, B.springB));
    const spring = backOut(range(p, B.springA, B.springB), 1.9);
    const flyT = range(p, B.flyA, B.flyB);
    const fly = easeInCubic(flyT);
    const gone = p >= B.flyB;
    const gy = -30 * u * spring - H * 1.45 * fly;
    const gz = 240 * u * easeInOutCubic(flyT);
    const gphi = -16 * easeInOutCubic(flyT);
    const grz = -7 * easeInOutCubic(flyT);
    const shake = jolt(p, B.sStampHit) + jolt(p, B.fStampHit, -1.4) + jolt(p, B.tagHit, 1.2) + jolt(p, B.tearA + 0.004, 1.8);
    const exiting = p >= B.springA;
    const prefix = exiting
      ? `translate3d(${shake.toFixed(2)}px, ${(sy + gy).toFixed(2)}px, ${gz.toFixed(2)}px) rotateX(${gphi.toFixed(3)}deg) rotateZ(${grz.toFixed(3)}deg) translate3d(0, ${(-sy).toFixed(2)}px, 0) `
      : "";

    // -------------------------------------------------------- the paper chain
    const S0 = sy - g.curlY;
    const curlOn = smoothstep(range(p, 0.05, 0.2));
    let sCur = 0;
    let hy = sy;
    let hz = 0;
    let prevTh = 0;
    const cache = this.cache;
    for (let i = N - 1; i >= 0; i--) {
      const el = r.rows[i];
      if (!el) continue;
      const h = g.h[i];
      const sBot = L - g.top[i] - h;
      const sTop = sBot + h;
      let show = sTop > 0 && !gone;
      let by = 0;
      let bz = 0;
      let th = 0;
      if (show) {
        if (sBot < 0) {
          by = sy - sBot;
          bz = 0;
          th = 0;
          hy = sy - sTop;
          hz = 0;
          sCur = sTop;
        } else {
          if (sBot > sCur) {
            hy -= sBot - sCur;
            sCur = sBot;
          }
          const sMid = sBot + h / 2;
          th = taut * (curlOn * g.curlMax * smoothstep(range(sMid, S0, S0 + g.curlLen)) + this.psi[i]);
          by = hy;
          bz = hz;
          const rad = (th * Math.PI) / 180;
          hy = by - h * Math.cos(rad);
          hz = bz - h * Math.sin(rad);
          sCur = sTop;
        }
        // cull rows projected entirely above the stage (only while the paper is at rest in the slot)
        if (!exiting) {
          const k = g.persp / (g.persp - bz);
          const py = g.perspY + (by - g.perspY) * k;
          if (py < -30) show = false;
        }
      }

      if (cache.vis[i] !== show) {
        el.style.visibility = show ? "visible" : "hidden";
        cache.vis[i] = show;
      }
      if (!show) continue;

      const tf = `${prefix}translate3d(${exiting ? 0 : shake.toFixed(2)}px, ${by.toFixed(2)}px, ${bz.toFixed(2)}px) rotateX(${th.toFixed(3)}deg)`;
      if (cache.tf[i] !== tf) {
        el.style.transform = tf;
        cache.tf[i] = tf;
      }

      // shading: rows rolling away darken, rows tipping toward us catch a little light.
      // Shade is blended across each hinge (bottom → top) so the facets read as one curve.
      const shBot = shadeOf((th + prevTh) / 2);
      prevTh = th;
      const sh = r.shades[i];
      const nextTh = i > 0 ? this.angleAt(g, L, S0, curlOn, taut, i - 1) : th;
      const shTop = shadeOf((th + nextTh) / 2);
      const key = Math.round(shBot * 100) * 1000 + Math.round(shTop * 100);
      if (sh && cache.shade[i] !== key) {
        sh.style.background = shBot < 0.005 && shTop < 0.005 ? "transparent" : `linear-gradient(to top, rgba(27,26,23,${shBot.toFixed(2)}), rgba(27,26,23,${shTop.toFixed(2)}))`;
        cache.shade[i] = key;
      }

      // print sweep + thermal development
      const ink = r.inks[i];
      if (ink && PRINTS(ROWS[i].kind)) {
        const age = c - i;
        const f = clamp(age);
        const clip = f >= 1 ? "none" : f <= 0 ? "inset(-30% 100% -30% 0)" : `inset(-30% ${((1 - f) * 100).toFixed(2)}% -30% 0)`;
        if (cache.clip[i] !== clip) {
          ink.style.clipPath = clip;
          cache.clip[i] = clip;
        }
        const op = Math.round((0.32 + 0.68 * smoothstep(clamp(age / 2.4))) * 100) / 100;
        if (cache.op[i] !== op) {
          ink.style.opacity = String(op);
          cache.op[i] = op;
        }
        if (DOTO(ROWS[i].kind)) {
          const rond = Math.round(100 * smoothstep(clamp((age - 0.15) / 1.6)) / 5) * 5;
          if (cache.rond[i] !== rond) {
            ink.style.setProperty("--rond", String(rond));
            cache.rond[i] = rond;
          }
        }
        // TURBO rows trail ghost copies while they whip out of the slot
        const trail = i >= IDX["l-no"] && i <= IDX["l-amt"] && p > B.turboA - 0.002 && p < B.turboB + 0.012;
        if (cache.trail[i] !== trail) {
          ink.style.textShadow = trail ? `0 ${(5 * u).toFixed(1)}px 0 rgba(27,26,23,.28), 0 ${(10 * u).toFixed(1)}px 0 rgba(27,26,23,.12)` : "none";
          cache.trail[i] = trail;
        }
      }
    }

    // ------------------------------------------------------------- overlays
    r.overlays.forEach((o, k) => {
      if (!o.el) return;
      const vis = !!cache.vis[o.row] && !gone;
      if (this.ovVis[k] !== vis) {
        o.el.style.visibility = vis ? "visible" : "hidden";
        this.ovVis[k] = vis;
      }
      if (vis) o.el.style.transform = cache.tf[o.row];
    });

    // ------------------------------------------------------- 001 · SHIPPED
    this.stamp(p, r.stampS, r.stampSShadow, r.stampSSpatter, B.sStampA, B.sStampHit, -7);
    // ---------------------------------------------- 002 · gift receipt gag
    if (r.ribbon) {
      const w = easeInOutCubic(range(p, B.ribbonA, B.ribbonB));
      r.ribbon.style.clipPath = `inset(-40% ${((1 - w) * 100).toFixed(2)}% -40% 0)`;
    }
    if (r.bow) {
      const t = range(p, B.bowA, B.bowB);
      const s = t <= 0 ? 0 : backOut(t, 2.2);
      r.bow.style.transform = `translate(-50%, -50%) rotate(${lerp(-24, -4, easeOutCubic(t)).toFixed(2)}deg) scale(${s.toFixed(3)})`;
    }
    if (r.giftTag) {
      const t = range(p, B.giftA, B.giftB);
      const sx = t <= 0 ? 0 : Math.cos(Math.PI * (1 - easeInOutCubic(t)));
      r.giftTag.style.transform = `translate(-50%, -50%) rotate(-5deg) scaleX(${sx.toFixed(3)})`;
      r.giftTag.style.opacity = t <= 0 ? "0" : "1";
      r.giftTag.style.setProperty("--face", sx > 0 ? "1" : "0");
    }
    if (r.bar) {
      const t = range(p, B.barA, B.barB);
      const e = easeInCubic(t);
      r.bar.style.transform = `translate(${(e * 240 * u).toFixed(1)}px, ${(-e * 18 * u).toFixed(1)}px) rotate(${(e * 14).toFixed(2)}deg)`;
      r.bar.style.opacity = String(1 - range(t, 0.55, 1));
    }
    this.stamp(p, r.stampF, r.stampFShadow, r.stampFSpatter, B.fStampA, B.fStampHit, 5);

    // ------------------------------------------------- 003 · FOR SALE tag
    if (r.swingWrap) {
      const t = range(p, B.tagA, B.tagHit);
      const fall = -168 * (1 - easeInCubic(t));
      const after = p - B.tagHit;
      const ring = after > 0 ? 24 * Math.exp(-after / 0.022) * Math.sin((after / 0.022) * 3.6) : 0;
      const ang = fall + ring + (p > B.tagA ? this.swingA : 0);
      r.swingWrap.style.transform = `rotate(${ang.toFixed(2)}deg)`;
      r.swingWrap.style.opacity = t <= 0 ? "0" : String(clamp(t * 4));
    }

    // speed lines (TURBO)
    const turbo = bell(p, B.turboA - 0.004, B.turboA + 0.003, B.turboB, B.turboB + 0.012);
    r.speed.forEach((el, k) => {
      if (!el) return;
      if (turbo <= 0) {
        el.style.opacity = "0";
        return;
      }
      const span = H + 300 * u;
      const y = ((((k * 0.37 + 0.11) % 1) * span - (p - B.turboA) * 26000 * u) % span + span) % span - 150 * u;
      el.style.opacity = String(turbo * (0.25 + 0.35 * ((k * 7) % 3) / 2));
      el.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`;
    });

    // ------------------------------------------------- barcode, laser, BEEP
    if (r.laser) {
      const t = range(p, B.laserA, B.laserB);
      const y = 0.5 - 0.5 * Math.cos(t * Math.PI * 2);
      r.laser.style.top = `${(y * 100).toFixed(2)}%`;
      r.laser.style.opacity = String(bell(p, B.laserA, B.laserA + 0.004, B.laserB - 0.004, B.laserB));
    }
    if (r.beep) {
      const t = range(p, B.beepA, B.beepB);
      const s = t <= 0 ? 0 : backOut(t, 2.6);
      r.beep.style.transform = `translate(-50%, -50%) rotate(-9deg) scale(${s.toFixed(3)})`;
      r.beep.style.opacity = t <= 0 ? "0" : String(clamp(t * 5));
    }

    // ------------------------------------------------------------- printer
    const dSlot = `translate3d(0, ${(sy - g.slot0).toFixed(2)}px, 0)`;
    if (r.band) r.band.style.transform = dSlot;
    if (r.wallGlow) r.wallGlow.style.transform = dSlot;
    const ci = Math.floor(c);
    const f = c - ci;
    const printing = ci < N && f > 0.002 && f < 0.998 && PRINTS(ROWS[ci].kind);
    if (r.hot) {
      r.hot.style.opacity = printing ? String(Math.pow(Math.sin(Math.PI * f), 0.35)) : "0";
      r.hot.style.transform = `translate3d(${(rx + f * rw).toFixed(1)}px, 0, 0)`;
    }
    if (r.head) r.head.style.opacity = String(printing ? 1 : 0.55);
    const lcd = lcdText(p);
    if (r.lcd && lcd !== this.lastLcd) {
      r.lcd.textContent = lcd;
      this.lastLcd = lcd;
    }
    if (r.stub) r.stub.style.opacity = p >= B.tearA ? "1" : "0";
    if (r.spec) r.spec.style.opacity = String(1 - range(p, B.panA, B.panB));
    const bottom = r.rows[IDX.bottom];
    const torn = p >= B.tearA;
    if (bottom && this.torn !== torn) {
      bottom.style.clipPath = torn ? tearPolygon(rw, g.h[IDX.bottom], 12 * u, 6 * u, "above") : "none";
      this.torn = torn;
    }

    // glows + contact shadow follow the paper at the slot
    const atSlot = 1 - range(p, B.springA, B.flyA + 0.02);
    if (r.paperGlow) {
      r.paperGlow.style.transform = `translate3d(0, ${(sy - g.slot0).toFixed(2)}px, 0)`;
      r.paperGlow.style.opacity = String(atSlot);
    }
    if (r.shadow) {
      const topY = Math.max(g.curlY, sy - L);
      r.shadow.style.transform = `translate3d(0, ${topY.toFixed(1)}px, 0)`;
      r.shadow.style.height = `${Math.max(0, sy - topY).toFixed(1)}px`;
      r.shadow.style.opacity = String(0.6 * atSlot);
    }

    // ------------------------------------------------------ overprint words
    WORDS.forEach((w, k) => {
      const el = r.words[k];
      if (!el) return;
      const inT = w.a < 0 ? 1 : range(p, w.a - 0.002, w.a + 0.014);
      const outT = range(p, w.b - 0.002, w.b + 0.012);
      const op = Math.round(inT * (1 - outT) * 100) / 100;
      const rest = this.wordRest[k];
      const st = Math.round(w.a < 0 ? lerp(rest, 50, outT) : lerp(50, rest, easeOutCubic(inT)) - (rest - 50) * outT);
      const sx = Math.round((1 + 0.07 * bell(inT, 0.35, 0.7, 0.75, 1)) * 1000) / 1000;
      const last = this.lastWord[k];
      if (last.op !== op) {
        el.style.opacity = String(op);
        el.style.visibility = op <= 0 ? "hidden" : "visible";
        last.op = op;
      }
      if (op > 0 && last.st !== st) {
        el.style.fontStretch = `${clamp(st, 50, 150)}%`;
        last.st = st;
      }
      if (op > 0 && last.sx !== sx) {
        el.style.transform = `translate(-50%, -50%) scaleX(${sx})`;
        last.sx = sx;
      }
    });

    // ---------------------------------------------- the last shot: a bicep
    if (r.sticker) {
      const t = range(p, B.gunA, B.gunHit);
      const e = easeInOutCubic(t);
      const settle = range(p, B.gunHit, B.gunHit + 0.022);
      const sc = p < B.gunHit ? lerp(1.9, 1.05, e) : lerp(0.9, 1, backOut(settle, 2.6));
      const x = lerp(g.W * 0.42, 0, e);
      const y = lerp(-g.H * 0.62, 0, easeOutCubic(t));
      const rot = lerp(48, -6, easeOutCubic(t));
      r.sticker.style.opacity = t <= 0 ? "0" : String(clamp(t * 6));
      r.sticker.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${rot.toFixed(2)}deg) scale(${sc.toFixed(3)})`;
    }
  }

  /** Resting + dynamic angle of row i (used to blend shading across hinges). */
  private angleAt(g: Geo, L: number, S0: number, curlOn: number, taut: number, i: number): number {
    const sBot = L - g.top[i] - g.h[i];
    if (sBot < 0) return 0;
    const sMid = sBot + g.h[i] / 2;
    return taut * (curlOn * g.curlMax * smoothstep(range(sMid, S0, S0 + g.curlLen)) + this.psi[i]);
  }

  private stamp(p: number, el: HTMLDivElement | null, shadow: HTMLDivElement | null, spatter: HTMLDivElement | null, a: number, hit: number, tilt: number) {
    if (!el) return;
    const s = slam(p, a, hit);
    const lift = (1 - s.approach) * 26 * (this.g?.u ?? 1);
    el.style.opacity = String(s.opacity);
    el.style.transform = `translate(-50%, calc(-50% - ${lift.toFixed(1)}px)) rotate(${(tilt + (1 - s.approach) * 7).toFixed(2)}deg) scale(${s.scale.toFixed(3)})`;
    if (shadow) {
      shadow.style.opacity = s.landed ? "0" : String(0.32 * s.approach * s.opacity);
      shadow.style.transform = `translate(-50%, -50%) rotate(${tilt}deg) scale(${(1.25 - 0.25 * s.approach).toFixed(3)})`;
    }
    if (spatter) {
      const k = s.landed ? backOut(clamp(s.after * 1.4), 2) : 0;
      spatter.style.transform = `translate(-50%, -50%) rotate(${tilt}deg) scale(${k.toFixed(3)})`;
      spatter.style.opacity = k > 0 ? "1" : "0";
    }
  }
}

/**
 * Zigzag tear line as a CSS polygon (x in px across `w`, line at y = `y`).
 * "above" keeps the paper above the line (the receipt), "below" the stub.
 */
export function tearPolygon(w: number, y: number, tooth: number, depth: number, keep: "above" | "below"): string {
  const n = Math.max(2, Math.round(w / tooth));
  const pts: string[] = [];
  for (let k = 0; k <= n; k++) {
    const x = (k / n) * w;
    const yy = y + (k % 2 === 0 ? depth / 2 : -depth / 2);
    pts.push(`${x.toFixed(1)}px ${yy.toFixed(1)}px`);
  }
  if (keep === "above") return `polygon(0 -2000px, ${w}px -2000px, ${pts.reverse().join(", ")})`;
  return `polygon(${pts.join(", ")}, ${w}px 4000px, 0 4000px)`;
}
