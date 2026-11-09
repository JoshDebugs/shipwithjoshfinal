/**
 * Hot Reload's renderer. `frame(p)` writes the whole DOM as a pure function of
 * the world's progress; `tick()` only layers ambient motion on top (carets,
 * the commit ticker, breathing, dust, the laser's tremor).
 */
import { backOut, bell, clamp, easeInOutCubic, easeOutCubic, expoOut, hash, lerp, range, smoothstep } from "@/components/life/multiverse/ease";
import { C, DEPTH, alpha } from "./colors";
import { COPY } from "./copy";
import type { Geo, PieceDef, Rect } from "./geometry";
import { BakeJob, restPose, samplePose, type Bake, type Pose } from "./heap";
import { B, R as RR, jolt, reveal, slam, story, typed, vhsAmount } from "./timeline";

type El = HTMLElement | null;

export type Refs = {
  root: El;
  shell: El;
  page: El;
  ground: El;
  raw: El;
  rawFade: El[];
  rawChars: El[];
  rawLinks: El[];
  rawBox: El;
  floodSvg: (SVGSVGElement | null)[];
  floodA: (SVGCircleElement | null)[];
  floodB: (SVGCircleElement | null)[];
  floodC: (SVGCircleElement | null)[];
  bucket: El;
  pieces: El[];
  glyphs: El[];
  tags: El[];
  cardInner: El[];
  chipFill: El[];
  rings: El[];
  spinners: (SVGSVGElement | null)[];
  toasts: El[];
  editor: El;
  editorTyped: El;
  editorCaret: El;
  editorStatus: El;
  editorDirty: El;
  editorKey: El;
  editorLineBg: El;
  sheet: El;
  vignette: El;
  reloadPill: El;
  dim: El;
  cone: SVGSVGElement | null;
  conePoly: SVGPolygonElement | null;
  dust: HTMLCanvasElement | null;
  projector: El;
  slides: El[];
  slideResult: El[];
  slideChars: El[];
  slideDim: El;
  slideNote: El;
  term: El;
  termTyped: El;
  termComment: El;
  termCaret: El;
  termOut: El;
  vhs: El;
  vhsBars: El[];
  vhsTime: El;
  crosshair: El;
  laser: El;
  grain: El;
  finalFlood: El;
  whorl: El;
  whorlFace: El;
  whorlX: SVGSVGElement | null;
  whorlRings: (SVGElement | null)[];
  motto: El;
  mottoWords: El[];
  gitLine: El;
  statusText: El;
  statusCaret: El;
  tickerTrack: El;
  tickerA: El;
};

export function emptyRefs(): Refs {
  return {
    root: null, shell: null, page: null, ground: null, raw: null, rawFade: [], rawChars: [], rawLinks: [], rawBox: null,
    floodSvg: [], floodA: [], floodB: [], floodC: [], bucket: null, pieces: [], glyphs: [], tags: [], cardInner: [], chipFill: [], rings: [], spinners: [],
    toasts: [], editor: null, editorTyped: null, editorCaret: null, editorStatus: null, editorDirty: null, editorKey: null, editorLineBg: null,
    sheet: null, vignette: null, reloadPill: null, dim: null, cone: null, conePoly: null, dust: null, projector: null, slides: [], slideResult: [], slideChars: [], slideDim: null, slideNote: null,
    term: null, termTyped: null, termComment: null, termCaret: null, termOut: null, vhs: null, vhsBars: [], vhsTime: null,
    crosshair: null, laser: null, grain: null, finalFlood: null, whorl: null, whorlFace: null, whorlX: null, whorlRings: [],
    motto: null, mottoWords: [], gitLine: null, statusText: null, statusCaret: null, tickerTrack: null, tickerA: null,
  };
}

export type PointerRead = { x: number; y: number; inside: boolean; mouse: boolean };

const vis = (el: Element | null, v: boolean) => {
  if (!el) return;
  const h = el as HTMLElement;
  const next = v ? "visible" : "hidden";
  if (h.style.visibility !== next) h.style.visibility = next;
};

const setText = (el: El, t: string) => {
  if (el && el.textContent !== t) el.textContent = t;
};

const COLORS_BY_CLICK = [C.pink, C.sun, C.cobalt];

/** Finished bakes, by stage size: remounting or resizing back costs nothing. */
const BAKES = new Map<string, Bake>();


export class Engine {
  g: Geo | null = null;
  bake: Bake | null = null;
  private job: BakeJob | null = null;
  private jobKey = "";
  private pump: ReturnType<typeof setTimeout> | null = null;
  private poseA: Pose = { x: 0, y: 0, rot: 0, impact: 0 };
  private poseB: Pose = { x: 0, y: 0, rot: 0, impact: 0 };
  private sheetH = 0;
  private tagW: number[] = [];
  lowPower = false;
  /** Measured from the raw page (stage px). */
  rawSeat: { letters: Rect[]; links: Rect[]; box: Rect | null } = { letters: [], links: [], box: null };

  private s = 0;
  private p = 0;
  private t = 0;
  private motion = 0;
  private spin = 0;
  private tickerX = 0;
  private fine = false;
  private dbg = -1;
  private split = -1;
  private cursorOwned = false;
  private crossAmt = 0;
  private laserAmt = 0;
  private laserTarget: [number, number] = [0, 0];
  private crossTarget: [number, number] = [0, 0];
  private laserAt: [number, number] | null = null;
  private dustCtx: CanvasRenderingContext2D | null = null;
  private dustData: { t: number; a: number; v: number; s: number }[] = [];
  private dustBox = { x: 0, y: 0, w: 0, h: 0 };
  private pitchAmt = 0;
  private corners: [number, number][] = [];

  constructor(private R: Refs) {}

  setGeo(g: Geo, lowPower: boolean, fine: boolean) {
    this.g = g;
    this.lowPower = lowPower;
    this.fine = fine;
    this.R.pieces.length = g.pieces.length;
    this.startBake();
    this.corners = this.projectedCorners();
    this.setupCone();
    this.setupDust();
  }

  /** Bake in small idle slices; `ensureBake()` finishes it on the spot if the crash is already here. */
  private startBake() {
    const g = this.g!;
    const key = `${g.W}x${g.H}`;
    this.stopPump();
    this.jobKey = key;
    const hit = BAKES.get(key);
    if (hit) {
      this.bake = hit;
      this.job = null;
      return;
    }
    this.bake = null;
    this.job = new BakeJob(g);
    const slice = () => {
      this.pump = null;
      const job = this.job;
      if (!job) return;
      if (job.run(5)) this.adoptBake();
      else this.pump = setTimeout(slice, 24);
    };
    this.pump = setTimeout(slice, 60);
  }

  private adoptBake() {
    const b = this.job?.result;
    if (!b) return;
    BAKES.set(this.jobKey, b);
    if (BAKES.size > 6) BAKES.delete(BAKES.keys().next().value as string);
    this.bake = b;
    this.job = null;
  }

  private ensureBake() {
    if (this.bake || !this.job) return;
    this.stopPump();
    while (!this.job.run(1000));
    this.adoptBake();
  }

  private stopPump() {
    if (this.pump !== null) clearTimeout(this.pump);
    this.pump = null;
  }

  dispose() {
    this.stopPump();
    this.job = null;
  }

  /** Where the keystoned page's corners land on screen. */
  private projectedCorners(): [number, number][] {
    const g = this.g!;
    const { scale, cy, tilt, persp } = g.proj;
    const a = (tilt * Math.PI) / 180;
    const W2 = g.W / 2;
    const H2 = g.H / 2;
    return [
      [-W2, -H2],
      [W2, -H2],
      [W2, H2],
      [-W2, H2],
    ].map(([x, y]) => {
      const sx = x * scale;
      const sy = y * scale;
      const yr = sy * Math.cos(a);
      const zr = sy * Math.sin(a);
      const f = persp / (persp - zr);
      return [W2 + sx * f, cy + yr * f] as [number, number];
    });
  }

  private setupCone() {
    const g = this.g!;
    const poly = this.R.conePoly;
    if (!poly) return;
    const [lx, ly] = g.proj.lens;
    const c = this.corners;
    const half = 10 * g.u;
    // the beam leaves the lens and fills the far wall corners
    poly.setAttribute(
      "points",
      `${lx - half},${ly} ${c[3][0]},${c[3][1]} ${c[0][0]},${c[0][1]} ${c[1][0]},${c[1][1]} ${c[2][0]},${c[2][1]} ${lx + half},${ly}`,
    );
  }

  private setupDust() {
    const g = this.g!;
    const cv = this.R.dust;
    if (!cv) return;
    const c = this.corners;
    const [lx, ly] = g.proj.lens;
    const x0 = Math.min(c[0][0], c[3][0], lx) - 12;
    const x1 = Math.max(c[1][0], c[2][0], lx) + 12;
    const y0 = Math.min(c[0][1], c[1][1]) - 12;
    const y1 = ly;
    this.dustBox = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
    const dpr = Math.min(window.devicePixelRatio || 1, this.lowPower ? 1 : 1.5);
    cv.width = Math.round(this.dustBox.w * dpr);
    cv.height = Math.round(this.dustBox.h * dpr);
    cv.style.left = `${x0}px`;
    cv.style.top = `${y0}px`;
    cv.style.width = `${this.dustBox.w}px`;
    cv.style.height = `${this.dustBox.h}px`;
    this.dustCtx = cv.getContext("2d");
    this.dustCtx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = this.lowPower ? 40 : 120;
    this.dustData = Array.from({ length: n }, (_, k) => ({
      t: hash(k * 3.1 + 1),
      a: hash(k * 5.7 + 2),
      v: 0.012 + hash(k * 9.3 + 3) * 0.03,
      s: 0.5 + hash(k * 2.9 + 4) * 1.6,
    }));
  }

  /** Read the raw page's real text boxes (the only DOM measuring in this world). */
  measure() {
    const g = this.g;
    const R = this.R;
    const root = R.root;
    if (!g || !root) return;
    const page = R.page;
    const saved = page?.style.transform ?? "";
    if (page) page.style.transform = "none";
    const rr = root.getBoundingClientRect();
    const k = rr.width / (root.offsetWidth || 1) || 1;
    const local = (r: DOMRect): Rect => ({ x: (r.left - rr.left) / k, y: (r.top - rr.top) / k, w: r.width / k, h: r.height / k });

    const letters: Rect[] = [];
    let c = 0;
    g.pieces.forEach((p, i) => {
      if (p.kind !== "letter") return;
      const n = p.text?.length ?? 1;
      let box: Rect | null = null;
      for (let j = 0; j < n; j++) {
        const el = R.rawChars[c + j];
        if (!el) continue;
        const b = local(el.getBoundingClientRect());
        box = box ? { x: box.x, y: box.y, w: b.x + b.w - box.x, h: Math.max(box.h, b.h) } : b;
      }
      c += n;
      if (box) letters[i] = box;
    });

    const links = R.rawLinks.map((el) => (el ? local(el.getBoundingClientRect()) : { x: 0, y: 0, w: 1, h: 1 }));
    const box = R.rawBox ? local(R.rawBox.getBoundingClientRect()) : null;
    this.rawSeat = { letters, links, box };
    if (R.sheet) this.sheetH = R.sheet.offsetHeight;
    R.tags.forEach((t, i) => {
      this.tagW[i] = t?.offsetWidth ?? 0;
    });
    if (page) page.style.transform = saved;
  }

  /* ---------------------------------------------------------------- frame */

  frame(p: number) {
    const g = this.g;
    if (!g) return;
    this.p = p;
    const s = story(p);
    this.s = s;
    if (s >= B.debugA) this.ensureBake();
    this.motion = Math.min(reveal(s, B.motionA, B.motionB), 1 - range(s, B.debugA, B.crash));
    this.pitchAmt = reveal(s, B.projA + (B.projB - B.projA) * 0.45, B.projB);

    this.frameGround(s, p);
    this.frameFloods(s);
    this.frameBucket(s);
    this.frameRaw(s, p);
    this.framePieces(s);
    this.frameRings(s);
    this.framePanels(s, p);
    this.framePitch(s, p);
    this.frameRepeat(p);
    this.frameStatus(s, p);
    this.writeCursors();
  }

  private frameGround(s: number, p: number) {
    const R = this.R;
    const g = this.g!;
    if (R.ground) {
      const [x, y] = g.clicks[0];
      const r = expoOut(range(s, B.clicks[0], B.clicks[0] + B.floodDur * 2.2)) * Math.hypot(g.W, g.H) * 1.05;
      vis(R.ground, r > 0.5);
      R.ground.style.clipPath = `circle(${r.toFixed(1)}px at ${x}px ${y}px)`;
    }
    const debug = reveal(s, B.debugA, B.debugB) * (1 - range(s, B.springA, B.springA + 0.018));
    if (debug !== this.dbg && R.root) {
      this.dbg = debug;
      R.root.style.setProperty("--hk-debug", debug.toFixed(3));
    }
    if (R.vignette) R.vignette.style.opacity = String(Math.min(reveal(s, B.crash, B.crash + 0.02), 1 - range(s, B.reloadA, B.reloadB)));
    if (R.grain) R.grain.style.opacity = String(0.16 * reveal(s, B.clicks[0], B.toast1) * (1 - range(p, RR.rawOutA, RR.rawOutB)));
  }

  private frameFloods(s: number) {
    const R = this.R;
    const g = this.g!;
    g.floods.forEach((f, k) => {
      const svg = R.floodSvg[k];
      if (!svg) return;
      const grow = expoOut(range(s, B.clicks[k], B.clicks[k] + B.floodDur));
      const a = B.settleA + k * B.settleStep;
      const set = easeInOutCubic(range(s, a, a + B.settleDur));
      const fade = 1 - range(s, a + B.settleDur - 0.012, a + B.settleDur);
      const shown = grow > 0 && fade > 0;
      vis(svg, shown);
      if (!shown) return;
      const r = lerp(f.r * grow, f.tr, set);
      const cx = lerp(f.x, f.tx, set);
      const cy = lerp(f.y, f.ty, set);
      const band = (1 - set) * f.r * 0.05 * Math.min(1, grow * 2);
      const put = (c: SVGCircleElement | null, rad: number) => {
        if (!c) return;
        c.setAttribute("cx", cx.toFixed(1));
        c.setAttribute("cy", cy.toFixed(1));
        c.setAttribute("r", Math.max(0, rad).toFixed(1));
      };
      put(R.floodC[k], r);
      put(R.floodA[k], r + band);
      put(R.floodB[k], r + band * 2.2);
      (svg as unknown as HTMLElement).style.opacity = String(fade);
    });
  }

  private frameBucket(s: number) {
    const R = this.R;
    const g = this.g!;
    const el = R.bucket;
    if (!el) return;
    const on = s >= B.bucketIn && s <= B.bucketOut;
    vis(el, on);
    if (!on) return;
    const size = el.offsetWidth || 80;
    const keys: { t: number; x: number; y: number }[] = [
      { t: B.bucketIn, x: g.W * 0.5, y: g.H + size },
      { t: B.clicks[0] - 0.002, x: g.clicks[0][0], y: g.clicks[0][1] },
      { t: B.clicks[1] - 0.002, x: g.clicks[1][0], y: g.clicks[1][1] },
      { t: B.clicks[2] - 0.002, x: g.clicks[2][0], y: g.clicks[2][1] },
      { t: B.bucketOut, x: g.W + size, y: g.clicks[2][1] + g.H * 0.2 },
    ];
    let px = keys[0].x;
    let py = keys[0].y;
    for (let i = 0; i < keys.length - 1; i++) {
      if (s >= keys[i].t) {
        const e = easeInOutCubic(range(s, keys[i].t, keys[i + 1].t));
        px = lerp(keys[i].x, keys[i + 1].x, e);
        py = lerp(keys[i].y, keys[i + 1].y, e);
      }
    }
    // squeezes on each click
    let press = 0;
    let ink = 0;
    B.clicks.forEach((c, i) => {
      press = Math.max(press, bell(s, c - 0.0035, c, c + 0.001, c + 0.005));
      if (s >= c) ink = Math.min(2, i + 1);
    });
    el.style.color = COLORS_BY_CLICK[ink];
    // the bucket's tip (bottom-left drip) sits on the click point
    el.style.transform = `translate3d(${(px - size * 0.08).toFixed(1)}px, ${(py - size).toFixed(1)}px, 0) scale(${(1 - press * 0.16).toFixed(3)}) rotate(${(press * 10).toFixed(2)}deg)`;
  }

  private frameRaw(s: number, p: number) {
    const R = this.R;
    const g = this.g!;
    const fade = 1 - reveal(s, B.rawFadeA, B.rawFadeB);
    R.rawFade.forEach((el) => {
      if (el) el.style.opacity = String(fade);
    });
    // each raw letter hands over to its poster piece
    let c = 0;
    g.pieces.forEach((pc) => {
      if (pc.kind !== "letter") return;
      const n = pc.text?.length ?? 1;
      const gone = s >= pc.appear;
      for (let j = 0; j < n; j++) {
        const el = R.rawChars[c + j];
        if (el) el.style.opacity = gone ? "0" : "1";
      }
      c += n;
    });
    if (R.rawBox) R.rawBox.style.opacity = p >= RR.spinA ? "0" : String(fade);
    if (R.raw) R.raw.style.opacity = String(1 - range(p, RR.rawOutA, RR.rawOutB));
  }

  private pieceTransform(i: number, def: PieceDef, s: number) {
    const g = this.g!;
    const { rect } = def;
    const cx0 = rect.x + rect.w / 2;
    const cy0 = rect.y + rect.h / 2;
    let x = cx0;
    let y = cy0;
    let rot = def.r0;
    let sx = 1;
    let sy = 1;
    let wdth = g.head.wdth;

    // entry
    const seat = this.rawSeat;
    if (def.enter === "letter") {
      const dur = B.letterDur;
      const e = clamp((s - def.appear) / dur);
      const q = easeOutCubic(e);
      const raw = seat.letters[i];
      if (raw) {
        x = lerp(raw.x + raw.w / 2, cx0, q);
        y = lerp(raw.y + raw.h * 0.56, cy0, q);
      }
      const startScale = (g.raw.h1 * 0.662) / Math.max(1, g.head.capH);
      const sc = lerp(startScale, 1, q);
      sx = sc;
      sy = sc;
      wdth = lerp(50, g.head.wdth, q);
    } else if (def.enter === "card") {
      const e = clamp((s - def.appear) / B.cardDur);
      const q = easeInOutCubic(e);
      const raw = seat.links[def.index];
      if (raw) {
        x = lerp(raw.x + raw.w / 2, cx0, q);
        y = lerp(raw.y + raw.h / 2, cy0, q);
        sx = lerp(Math.max(0.02, raw.w / rect.w), 1, q);
        sy = lerp(Math.max(0.02, raw.h / rect.h), 1, q);
      }
      const inner = this.R.cardInner[i];
      if (inner) inner.style.opacity = String(range(e, 0.62, 1));
    } else if (def.enter === "bar") {
      // the two planks grow out of the point where the flood drained
      sx = expoOut(clamp((s - def.appear) / 0.018));
      x += ((def.index === 0 ? 1 : -1) * (1 - sx) * rect.w) / 2;
    } else {
      const e = clamp((s - def.appear) / 0.016);
      const sc = backOut(e, 2.1);
      sx = sc;
      sy = sc;
    }

    // ambient (motion.css)
    const t = this.t;
    const m = this.motion;
    if (m > 0) {
      const n = i * 0.73;
      switch (def.kind) {
        case "letter":
          y += Math.sin(t * 1.7 + def.index * 0.55) * 3 * g.u * m;
          sx *= 1 + Math.sin(t * 2.3 + def.index * 0.8) * 0.03 * m;
          break;
        case "card":
          y += Math.sin(t * 1.2 + def.index * 1.1) * 4 * g.u * m;
          rot += Math.sin(t * 0.9 + def.index) * 0.55 * m;
          break;
        case "chip":
          rot += Math.sin(t * 1.6 + def.index * 1.7) * 1.6 * m;
          break;
        case "sticker":
          rot += Math.sin(t * 1.3) * 7 * m;
          break;
        case "sun":
          sx *= 1 + Math.sin(t * 1) * 0.02 * m;
          sy *= 1 + Math.sin(t * 1) * 0.02 * m;
          break;
        default:
          y += Math.sin(t * 1.4 + n) * 1.6 * g.u * m;
      }
    }

    // the crash: the recorded fall
    const bake = this.bake;
    if (bake && s >= B.crash) {
      const n = g.pieces.length;
      const sp = s - bake.springAt[i];
      if (sp <= 0) {
        const pose = samplePose(bake, n, i, s, this.poseA);
        x = pose.x;
        y = pose.y;
        rot = pose.rot;
        // heavy hits flatten a piece for a moment, standing on what it hit
        const k = pose.impact * (def.kind === "card" || def.kind === "slab" ? 0.03 : def.kind === "letter" ? 0.1 : 0.16);
        sx = 1 + k * 0.72;
        sy = 1 - k;
        y += (rect.h / 2) * k;
        wdth = g.head.wdth;
      } else {
        // hot reload: spring back into the layout
        const rest = restPose(bake, n, i, def.r0, this.poseB);
        const q = backOut(clamp(sp / B.springDur), 1.25);
        x = lerp(rest.x, cx0, q);
        y = lerp(rest.y, cy0, q);
        rot = lerp(rest.rot, def.r0, q);
        sx = 1;
        sy = 1;
        wdth = g.head.wdth;
      }
    }

    return { x: x - cx0, y: y - cy0, rot, sx, sy, wdth };
  }

  private writePiece(i: number, s: number) {
    const g = this.g!;
    const R = this.R;
    const def = g.pieces[i];
    const el = R.pieces[i];
    if (!def || !el) return;
    const on = s >= def.appear;
    vis(el, on);
    if (!on) return;
    const st = this.pieceTransform(i, def, s);
    el.style.transform = `translate3d(${st.x.toFixed(2)}px, ${st.y.toFixed(2)}px, 0) rotate(${st.rot.toFixed(2)}deg) scale(${st.sx.toFixed(3)}, ${st.sy.toFixed(3)})`;
    // inspector tags stay upright whatever the piece landed on
    if (def.tag && s >= B.debugA && s < B.reloadB) {
      const tag = R.tags[i];
      if (tag) {
        // keep it upright, and nudge it back on stage if its corner landed near an edge
        const a = (st.rot * Math.PI) / 180;
        const hw = def.rect.w / 2;
        const hh = def.rect.h / 2;
        const px = def.rect.x + hw + st.x - hw * Math.cos(a) + hh * Math.sin(a);
        const tw = this.tagW[i] ?? 0;
        const nudge = px < 8 ? 8 - px : px + tw > g.W - 8 ? g.W - 8 - px - tw : 0;
        tag.style.transform = `translateX(${nudge.toFixed(1)}px) rotate(${(-st.rot).toFixed(1)}deg)`;
      }
    }
    if (def.kind === "letter") {
      const glyph = R.glyphs[i];
      if (glyph) {
        const w = Math.round(st.wdth / 2) * 2;
        const dw = Number(glyph.dataset.w ?? "0");
        if (dw !== w) {
          glyph.dataset.w = String(w);
          glyph.style.fontVariationSettings = `"wdth" ${w}`;
        }
      }
    }
  }

  private framePieces(s: number) {
    const R = this.R;
    const g = this.g!;
    for (let i = 0; i < g.pieces.length; i++) this.writePiece(i, s);
    // chips light up as their verb happens
    const lit = [B.buildLit, B.debugA, B.projA, B.dimB];
    g.pieces.forEach((def, i) => {
      if (def.kind !== "chip") return;
      const fill = R.chipFill[i];
      if (!fill) return;
      const e = reveal(s, lit[def.index], lit[def.index] + 0.012);
      fill.style.clipPath = `inset(0 ${(100 - e * 100).toFixed(1)}% 0 0)`;
    });
  }

  /** One halftone ring per hard landing, only while it is expanding. */
  private frameRings(s: number) {
    const b = this.bake;
    this.R.rings.forEach((el, k) => {
      if (!el) return;
      const h = b?.hits[k];
      const age = h ? (s - h.s) / 0.02 : -1;
      const on = !!h && age > 0 && age < 1;
      vis(el, on);
      if (!on || !h) return;
      const e = expoOut(age);
      el.style.transform = `translate3d(${h.x.toFixed(1)}px, ${h.y.toFixed(1)}px, 0) scale(${(0.18 + e * 0.82 * (0.6 + h.p * 0.4)).toFixed(3)}, ${((0.18 + e * 0.82 * (0.6 + h.p * 0.4)) * 0.5).toFixed(3)})`;
      el.style.opacity = String((1 - age) * h.p);
    });
  }

  private framePanels(s: number, p: number) {
    const R = this.R;
    const g = this.g!;

    // toasts
    const tOut = 1 - reveal(s, B.toastsOutA, B.toastsOutB);
    [B.toast1, B.toast2, B.toast3].forEach((a, k) => {
      const el = R.toasts[k];
      if (!el) return;
      const e = reveal(s, a, a + 0.012) * tOut;
      el.style.opacity = String(e);
      el.style.transform = `translate3d(${((e - 1) * 28).toFixed(1)}px, 0, 0)`;
    });

    // editor
    const ed = R.editor;
    if (ed) {
      const on = s >= B.editorA && s <= B.editorOutB;
      vis(ed, on);
      if (on) {
        const inn = reveal(s, B.editorA, B.editorB);
        const out = easeInOutCubic(range(s, B.editorOutA, B.editorOutB));
        ed.style.opacity = String(inn);
        ed.style.transform = `translate3d(${(out * g.W * (g.mobile ? 1.1 : 0.42)).toFixed(1)}px, ${((1 - inn) * 26 - out * g.H * 0.06).toFixed(1)}px, 0) rotate(${(out * 9).toFixed(2)}deg) scale(${(0.97 + 0.03 * inn).toFixed(3)})`;
        const text = "- display: grid;";
        const n = typed(s, B.typeA, B.typeB, text.length);
        setText(R.editorTyped, text.slice(0, n));
        if (R.editorLineBg) R.editorLineBg.style.background = alpha(C.pink, 0.22 * range(n, 0, 1));
        if (R.editorDirty) R.editorDirty.style.opacity = s >= B.typeA && s < B.saveB ? "1" : "0";
        setText(R.editorStatus, s < B.saveA ? "" : s < B.saveB ? "saving…" : "saved ✓");
        if (R.editorKey) {
          const k = bell(s, B.saveA, B.saveA + 0.003, B.saveB, B.saveB + 0.004);
          const press = bell(s, B.saveA + 0.003, B.saveA + 0.005, B.saveA + 0.008, B.saveA + 0.01);
          R.editorKey.style.opacity = String(k);
          R.editorKey.style.transform = `translateY(${(press * 4 * g.u).toFixed(1)}px)`;
        }
      }
    }

    // error sheet
    const sh = R.sheet;
    if (sh) {
      const on = s >= B.sheetA && s <= B.sheetUpB;
      vis(sh, on);
      if (on) {
        const m = slam(s, B.sheetA, B.sheetHit);
        const up = easeInOutCubic(range(s, B.sheetUpA, B.sheetUpB));
        const hh = this.sheetH || g.sheet.h;
        // it comes to rest just above the top of the pile, clear of the site nav
        const shadow = Math.round(12 * g.u);
        const clearance = Math.round(14 * g.u);
        const seat = clamp((this.bake?.top ?? g.floor) - clearance - shadow - hh, g.sheet.y - 6, g.sheet.y + (g.mobile ? 26 : 44) * g.u) - g.sheet.y;
        const off = g.sheet.y + seat + hh + 60;
        const y = seat + (m.y - up) * off;
        const j = jolt(s, B.sheetHit);
        sh.style.transformOrigin = "50% 0%";
        sh.style.transform = `translate3d(0, ${(y + j).toFixed(1)}px, 0) scale(${(1 + m.squash * 0.015).toFixed(4)}, ${(1 - m.squash * 0.05).toFixed(4)})`;
      }
    }

    // the whole page carries one small jolt when the sheet lands
    if (R.reloadPill) {
      const e = bell(s, B.reloadA, B.reloadA + 0.008, B.reloadB, B.reloadB + 0.01);
      R.reloadPill.style.opacity = String(e);
      R.reloadPill.style.transform = `translate(-50%, ${((1 - e) * -12).toFixed(1)}px)`;
    }

    // terminal (p-based: it belongs to REPEAT, not to the story)
    const te = R.term;
    if (te) {
      const on = p >= RR.termA && p <= RR.termOutB;
      vis(te, on);
      if (on) {
        const inn = reveal(p, RR.termA, RR.termB);
        const out = reveal(p, RR.termOutA, RR.termOutB);
        te.style.opacity = String(inn * (1 - out));
        te.style.transform = `translate3d(0, ${((1 - inn) * 40).toFixed(1)}px, 0)`;
        const mid = lerp(RR.typeA, RR.typeB, 0.55);
        setText(R.termTyped, COPY.git.slice(0, typed(p, RR.typeA, mid, COPY.git.length)));
        const com = `  ${COPY.gitComment}`;
        setText(R.termComment, com.slice(0, typed(p, mid, RR.typeB, com.length)));
        if (R.termOut) R.termOut.style.opacity = String(reveal(p, RR.outA, RR.outB));
      }
    }
  }

  private framePitch(s: number, p: number) {
    const R = this.R;
    const g = this.g!;
    const page = R.page;
    const k = easeInOutCubic(range(s, B.projA, B.projB));
    const vhs = vhsAmount(p);
    const jx = vhs > 0 ? Math.sin(p * 913) * 4 * vhs : 0;
    const j = jolt(s, B.sheetHit);
    if (page) {
      if (k > 0.001 || vhs > 0 || j !== 0) {
        const { scale, cy, tilt, persp } = g.proj;
        const sc = lerp(1, scale, k);
        const ty = lerp(g.H / 2, cy, k) - g.H / 2;
        page.style.transform = `translate3d(${jx.toFixed(1)}px, ${(ty + j).toFixed(1)}px, 0) perspective(${persp}px) rotateX(${(tilt * k).toFixed(3)}deg) scale(${sc.toFixed(4)})`;
        page.style.boxShadow = k > 0.02 ? `0 0 ${Math.round(160 * g.u)}px ${Math.round(14 * g.u)}px ${alpha(C.paper, 0.2 * this.pitchAmt)}` : "none";
      } else {
        page.style.transform = "none";
        page.style.boxShadow = "none";
      }
    }

    // lights down, projector on
    if (R.dim) {
      const d = reveal(s, B.dimA, B.dimB) * (1 - reveal(s, lerp(B.projA, B.projB, 0.42), B.projB));
      R.dim.style.opacity = String(d * 0.86);
    }
    if (R.cone) R.cone.style.opacity = String(this.pitchAmt);
    if (R.projector) R.projector.style.opacity = String(reveal(s, B.dimB - 0.01, B.projB));
    vis(R.dust, this.pitchAmt > 0.02);

    // slides
    B.slides.forEach(([a, b], i) => {
      const el = R.slides[i];
      if (!el) return;
      const on = s >= a;
      vis(el, on);
      if (!on) return;
      const e = easeInOutCubic(range(s, a, b));
      el.style.clipPath = e >= 1 ? "none" : `inset(0 0 0 ${((1 - e) * 100).toFixed(2)}%)`;
    });
    this.frameResults(s);

    this.computeLaserTarget(s);
    this.laserAmt = reveal(s, B.slides[0][1] - 0.01, B.slides[0][1]) * (1 - vhs) * (s >= B.sEnd - 0.0001 ? 1 - range(p, RR.termB, RR.typeA + 0.02) : 1);
    this.crossAmt = Math.min(reveal(s, B.debugA, B.debugB), 1 - range(s, B.reloadA, B.reloadB));

    // VHS
    if (R.vhs) {
      vis(R.vhs, vhs > 0.002);
      R.vhs.style.opacity = String(vhs);
      if (vhs > 0.002) {
        R.vhsBars.forEach((b, i) => {
          if (!b) return;
          const v = (p * (137 + i * 83) + i * 0.37) % 1;
          b.style.transform = `translate3d(0, ${(v * g.H * 1.1 - 60).toFixed(1)}px, 0)`;
        });
        const total = Math.round(s * 480);
        const mm = String(Math.floor(total / 60)).padStart(2, "0");
        const ss = String(total % 60).padStart(2, "0");
        setText(R.vhsTime, `00:${mm}:${ss}`);
      }
    }
    if (!this.lowPower) {
      const sp = vhs > 0.002 ? vhs * (7 + 4 * Math.sin(p * 620)) * g.u : 0;
      if (sp !== this.split && R.root) {
        this.split = sp;
        R.root.style.setProperty("--hk-split", sp.toFixed(2));
      }
    }
  }

  /** Each result arrives its own way, just after its slide has wiped in. */
  private frameResults(s: number) {
    const R = this.R;
    // blueprint: drawn on from the left, its dimension line racing ahead
    const a0 = B.slides[0][1] - 0.006;
    const r0 = R.slideResult[0];
    if (r0) {
      const e = easeInOutCubic(range(s, a0, a0 + 0.02));
      r0.style.clipPath = e >= 1 ? "none" : `inset(-10% ${((1 - e) * 104).toFixed(1)}% -10% 0)`;
    }
    const dim = R.slideDim;
    if (dim) dim.style.transform = `scaleX(${expoOut(range(s, a0 - 0.006, a0 + 0.012)).toFixed(4)})`;
    // runway: stamped down, off a little scale
    const a1 = B.slides[1][1] - 0.008;
    const r1 = R.slideResult[1];
    if (r1) {
      const q = range(s, a1, a1 + 0.012);
      r1.style.opacity = q > 0 ? "1" : "0";
      r1.style.transform = q >= 1 ? "none" : `scale(${lerp(1.42, 1, backOut(q, 1.1)).toFixed(4)}) rotate(${((1 - backOut(q, 1.1)) * -5).toFixed(2)}deg)`;
    }
    // deadpan: typed, one key at a time
    const a2 = B.slides[2][1] - 0.006;
    const n2 = typed(s, a2, a2 + 0.018, R.slideChars.length);
    R.slideChars.forEach((c, i) => vis(c, i < n2));
    const note = R.slideNote;
    if (note) note.style.opacity = String(reveal(s, a2 + 0.018, a2 + 0.03));
  }

  private computeLaserTarget(s: number) {
    const g = this.g!;
    const { scale, cy } = g.proj;
    // resting points beside each result, never on top of it
    const spots = g.mobile
      ? [
          [0.84, 0.76],
          [0.2, 0.52],
          [0.5, 0.67],
        ]
      : [
          [0.93, 0.5],
          [0.72, 0.3],
          [0.84, 0.74],
        ];
    let u = spots[0];
    let v = spots[0];
    let e = 0;
    if (s >= B.slides[2][0]) {
      u = spots[1];
      v = spots[2];
      e = easeInOutCubic(range(s, B.slides[2][0], B.slides[2][1]));
    } else if (s >= B.slides[1][0]) {
      u = spots[0];
      v = spots[1];
      e = easeInOutCubic(range(s, B.slides[1][0], B.slides[1][1]));
    }
    const fx = lerp(u[0], v[0], e);
    const fy = lerp(u[1], v[1], e);
    this.laserTarget = [g.W / 2 + (fx - 0.5) * g.W * scale, cy + (fy - 0.5) * g.H * scale];
    // the inspect crosshair wanders over the heap
    const w = range(s, B.debugA, B.reloadA);
    this.crossTarget = [g.W * (0.2 + 0.55 * w), g.floor - g.H * (0.16 + 0.1 * Math.sin(w * 7))];
  }

  private frameRepeat(p: number) {
    const R = this.R;
    const g = this.g!;
    const inFinale = p >= RR.spinA;

    // whorl: the placeholder box becomes a thumbprint
    const wh = R.whorl;
    if (wh) {
      vis(wh, inFinale);
      if (inFinale) {
        const box = this.rawSeat.box;
        const mv = easeInOutCubic(range(p, RR.spinA, RR.spinB));
        const bcx = box ? box.x + box.w / 2 : g.whorl.x + g.whorl.w / 2;
        const bcy = box ? box.y + box.h / 2 : g.whorl.y + g.whorl.h / 2;
        const dx = (bcx - (g.whorl.x + g.whorl.w / 2)) * (1 - mv);
        const dy = (bcy - (g.whorl.y + g.whorl.h / 2)) * (1 - mv);
        wh.style.transform = dx === 0 && dy === 0 ? "none" : `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0)`;

        const face = R.whorlFace;
        if (face) {
          const S = g.whorl.w * 0.86;
          const bw = box?.w ?? S;
          const bh = box?.h ?? S;
          face.style.width = `${lerp(bw, S, mv).toFixed(1)}px`;
          face.style.height = `${lerp(bh, S, mv).toFixed(1)}px`;
          face.style.borderRadius = `${(mv * 50).toFixed(1)}%`;
          face.style.opacity = String(1 - range(p, RR.spinB - 0.004, RR.whorlA + 0.012));
        }
        if (R.whorlX) (R.whorlX as unknown as HTMLElement).style.transform = `rotate(${(smoothstep(range(p, RR.spinA, RR.spinB)) * 180).toFixed(1)}deg)`;

        // rings tighten in, innermost first
        R.whorlRings.forEach((ring, i) => {
          if (!ring) return;
          const a = lerp(RR.whorlA, RR.whorlB - 0.012, i / 4);
          const e = reveal(p, a, a + 0.012);
          ring.style.opacity = String(e);
          ring.style.transformOrigin = "50px 52px";
          ring.style.transformBox = "view-box";
          ring.style.transform = e >= 1 ? "" : `rotate(${((1 - e) * (i % 2 ? 90 : -90)).toFixed(1)}deg) scale(${(0.82 + 0.18 * e).toFixed(3)})`;
        });
      }
    }

    // final flood
    const ff = R.finalFlood;
    if (ff) {
      const r = expoOut(range(p, RR.floodA, RR.floodB)) * Math.hypot(g.W, g.H) * 1.05;
      vis(ff, r > 0.5);
      const cx = g.whorl.x + g.whorl.w / 2;
      const cy = g.whorl.y + g.whorl.h * 0.52;
      ff.style.clipPath = `circle(${r.toFixed(1)}px at ${cx}px ${cy}px)`;
    }

    // motto
    vis(R.motto, p >= RR.mottoA);
    R.mottoWords.forEach((w, i) => {
      if (!w) return;
      const a = RR.mottoA + i * RR.mottoStep;
      const e = reveal(p, a, a + RR.mottoDur);
      w.style.opacity = e > 0.01 ? "1" : "0";
      w.style.transform = e >= 1 ? "none" : `translate3d(0, ${((1 - e) * g.motto.fs * 0.5).toFixed(1)}px, 0)`;
      const wd = Math.round(lerp(50, g.motto.wdth, e) / 2) * 2;
      if (w.dataset.w !== String(wd)) {
        w.dataset.w = String(wd);
        w.style.fontVariationSettings = `"wdth" ${wd}`;
      }
    });
    const gl = R.gitLine;
    if (gl) {
      vis(gl, p >= RR.gitLineA);
      const e = reveal(p, RR.gitLineA, RR.gitLineB);
      gl.style.opacity = String(e);
      gl.style.transform = `translate3d(0, ${((1 - e) * 10).toFixed(1)}px, 0)`;
    }
  }

  private frameStatus(s: number, p: number) {
    const R = this.R;
    const phone = this.g!.mobile;
    let msg: string;
    if (p >= RR.rewB) msg = phone ? "working tree clean" : "nothing to commit, working tree clean";
    else if (p >= RR.rewA) msg = phone ? "rewinding…" : "git reset --hard · rewinding…";
    else if (s < B.toast3) msg = "age 18 · compiling…";
    else if (s < B.debugA) msg = "age 18 · compiled ✓";
    else if (s < B.reloadA) msg = "age 18 · 1 error";
    else msg = "age 18 · presenting";
    setText(R.statusText, msg);
  }

  private writeCursors() {
    const R = this.R;
    // own the OS cursor only while our cursors are showing
    const own = this.fine && (this.crossAmt > 0.02 || this.laserAmt > 0.02);
    if (own !== this.cursorOwned && R.root) {
      this.cursorOwned = own;
      if (own) {
        R.root.setAttribute("data-site-cursor", "hide");
        R.root.style.cursor = "none";
      } else {
        R.root.removeAttribute("data-site-cursor");
        R.root.style.cursor = "";
      }
    }
  }

  /* ----------------------------------------------------------------- tick */

  tick(t: number, dt: number, velocity: number, ptr: PointerRead) {
    const g = this.g;
    const R = this.R;
    if (!g) return;
    this.t = t;

    // carets
    const blink = Math.floor(t * 1.7) % 2 === 0;
    if (R.statusCaret) R.statusCaret.style.opacity = this.p >= RR.rewB ? "0" : blink ? "1" : "0.15";
    if (R.editorCaret) R.editorCaret.style.opacity = this.s < B.saveB && blink ? "1" : "0";
    if (R.termCaret) R.termCaret.style.opacity = this.p < RR.outA && blink ? "1" : "0";

    // commit ticker: speed and direction follow scroll velocity
    const v = Math.abs(velocity);
    const rewinding = this.p > RR.rewA && this.p < RR.rewB;
    this.tickerX += dt * (40 + v * 26) * (rewinding ? -3.2 : 1);
    if (R.tickerTrack && R.tickerA) {
      const w = R.tickerA.offsetWidth || 1;
      const x = ((this.tickerX % w) + w) % w;
      R.tickerTrack.style.transform = `translate3d(${(-x).toFixed(1)}px, 0, 0)`;
    }

    // motion.css: everything breathes
    if (this.motion > 0) {
      this.spin += dt * 26 * this.motion;
      g.pieces.forEach((_, i) => this.writePiece(i, this.s));
    } else if (this.s >= B.crash && this.s < B.reloadA && this.spin % 360 > 0.5) {
      // settle the burst's spin back without jumping
      this.spin += (360 - (this.spin % 360)) * Math.min(1, dt * 5);
    }
    if (this.motion > 0 || this.s >= B.motionA) {
      R.spinners.forEach((sp) => {
        if (sp) (sp as unknown as HTMLElement).style.transform = `rotate(${this.spin.toFixed(1)}deg)`;
      });
    }

    // inspect crosshair
    if (R.crosshair) {
      const on = !g.mobile && this.crossAmt > 0.02;
      vis(R.crosshair, on);
      if (on) {
        const [cx, cy] = ptr.inside && ptr.mouse ? [ptr.x, ptr.y] : this.crossTarget;
        R.crosshair.style.opacity = String(this.crossAmt);
        R.crosshair.style.transform = `translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, 0)`;
      }
    }

    // laser
    if (R.laser) {
      const on = this.laserAmt > 0.02;
      vis(R.laser, on);
      if (on) {
        let [lx, ly] = this.laserTarget;
        if (ptr.inside && ptr.mouse) {
          lx = ptr.x;
          ly = ptr.y;
        }
        const tremor = 1.6 * g.u;
        lx += Math.sin(t * 13.1) * tremor + Math.sin(t * 7.3) * tremor * 0.6;
        ly += Math.cos(t * 11.7) * tremor + Math.sin(t * 5.9) * tremor * 0.5;
        const was = this.laserAt ?? [lx, ly];
        const k = 1 - Math.pow(0.0005, dt);
        const nx = lerp(was[0], lx, k);
        const ny = lerp(was[1], ly, k);
        this.laserAt = [nx, ny];
        R.laser.style.opacity = String(this.laserAmt);
        R.laser.style.transform = `translate3d(${nx.toFixed(1)}px, ${ny.toFixed(1)}px, 0)`;
      }
    }

    // dust in the beam
    if (this.pitchAmt > 0.02 && this.dustCtx) {
      this.drawDust(t);
    }
  }

  private drawDust(t: number) {
    const g = this.g!;
    const ctx = this.dustCtx!;
    const { x, y, w, h } = this.dustBox;
    ctx.clearRect(0, 0, w, h);
    const [lx, ly] = g.proj.lens;
    const c = this.corners;
    ctx.fillStyle = C.paper;
    for (const d of this.dustData) {
      // along the beam (0 at the lens → 1 at the wall), slowly drifting up
      const tt = ((d.t + t * d.v) % 1 + 1) % 1;
      const across = Math.sin(d.a * 6.283 + t * 0.2) * 0.5 + 0.5;
      const yTop = lerp(c[3][1], c[0][1], 0.5);
      const py = lerp(ly, yTop, tt);
      const lxs = lerp(lx, c[0][0], tt);
      const rxs = lerp(lx, c[1][0], tt);
      const px = lerp(lxs, rxs, across);
      const alpha01 = 0.5 * Math.sin(Math.PI * tt) * this.pitchAmt;
      ctx.globalAlpha = alpha01;
      ctx.beginPath();
      ctx.arc(px - x, py - y, d.s * g.u, 0, 6.283);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

/** Debug ink for a nesting depth (kept with the renderer for the inspector tags). */
export const depthInk = (d: number) => DEPTH[d % DEPTH.length];
