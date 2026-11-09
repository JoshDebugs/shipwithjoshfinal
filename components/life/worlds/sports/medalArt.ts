/**
 * Medal art, all procedural.
 *
 * Each face is three square canvases in "face space" (the face circle fills
 * the canvas):
 *  - emissive: the neon state (obverse: ink + the lap rosette, exactly what
 *    the rink showed; reverse: the glowing breath strokes)
 *  - height:   black field, white raised relief (rosette, lotus, rings, beads,
 *    Cinzel rim lettering) — the bump map
 *  - albedo:   darker machine-turned field, paper-bright raised relief
 *
 * The R3F medal uses them as emissiveMap / bumpMap / map. The 2D emboss
 * renderer (phones, no-WebGL, receipts, reduced motion) derives a highlight
 * and a shade layer from the same height map and offsets them by the light.
 */
import { RISO, alpha, mix } from "@/components/life/multiverse/palette";
import { PORTAL_ICONS } from "@/components/life/multiverse/portalIcons";
import { RING_IN } from "./layout";
import { lapColor, strokeLaps, type RosetteParams } from "./rosette";

export type FaceSet = {
  size: number;
  emissive: HTMLCanvasElement;
  height: HTMLCanvasElement;
  albedo: HTMLCanvasElement;
  /** Bumped whenever any canvas changes; ve/vh/va per canvas (the 3D medal re-uploads only those). */
  version: number;
  ve: number;
  vh: number;
  va: number;
  /** Cached machine-turned field (albedo base). */
  field: HTMLCanvasElement | null;
  last: { lotus: number; relief: number; insc: number; serif: string };
};

export type Face2D = { hi: HTMLCanvasElement; lo: HTMLCanvasElement; size: number; version: number };

export const FIELD = mix(RISO.paper, RISO.ink, 0.5);
export const RAISED = RISO.paper;
const SHADE = mix(RISO.ink, RISO.cobalt, 0.25);

export function makeCanvas(w: number, h = w): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
}

export function makeFaceSet(size: number, emissiveSize = size): FaceSet {
  return {
    size,
    emissive: makeCanvas(emissiveSize),
    height: makeCanvas(size),
    albedo: makeCanvas(size),
    version: 0,
    ve: 0,
    vh: 0,
    va: 0,
    field: null,
    last: { lotus: -1, relief: -1, insc: -1, serif: "" },
  };
}

function fieldOf(face: FaceSet): HTMLCanvasElement {
  if (face.field) return face.field;
  const c = makeCanvas(face.size);
  const ctx = c.getContext("2d") as CanvasRenderingContext2D;
  ctx.translate(face.size / 2, face.size / 2);
  turnedField(ctx, face.size / 2);
  face.field = c;
  return c;
}

const ctx2 = (c: HTMLCanvasElement) => c.getContext("2d") as CanvasRenderingContext2D;

/* ------------------------------------------------------------- lettering */

/** Text set along an arc. top=true: upright on the top arc; false: reading left→right along the bottom. */
function arcText(ctx: CanvasRenderingContext2D, text: string, radius: number, fontPx: number, family: string, top: boolean, tracking = 0.16) {
  ctx.font = `700 ${fontPx}px ${family}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const chars = [...text];
  const widths = chars.map((ch) => ctx.measureText(ch).width + tracking * fontPx);
  const total = widths.reduce((s, v) => s + v, 0) - tracking * fontPx;
  const span = total / radius;
  let ang = top ? -Math.PI / 2 - span / 2 : Math.PI / 2 + span / 2;
  chars.forEach((ch, i) => {
    const step = widths[i] / radius;
    const mid = top ? ang + (widths[i] - tracking * fontPx) / 2 / radius : ang - (widths[i] - tracking * fontPx) / 2 / radius;
    ctx.save();
    if (top) {
      ctx.rotate(mid + Math.PI / 2);
      ctx.translate(0, -radius);
    } else {
      ctx.rotate(mid - Math.PI / 2);
      ctx.translate(0, radius);
    }
    ctx.fillText(ch, 0, 0);
    ctx.restore();
    ang = top ? ang + step : ang - step;
  });
}

/** Rim band: two ring lines, a beaded border and the inscription (top + bottom arcs, dots at 3 and 9). */
function rimBand(ctx: CanvasRenderingContext2D, M: number, color: string, topText: string, bottomText: string, family: string, textAlpha: number, bevel = false) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  // in the height map the ring lines get sloped shoulders: a hard 1-texel step
  // sparkles into broken dashes once the bump map is minified
  const widths: [number, number][] = bevel ? [[0.02, 0.16], [0.0135, 0.3], [0.0065, 1]] : [[0.0065, 1]];
  for (const [lw, a] of widths) {
    ctx.globalAlpha = a;
    ctx.lineWidth = lw * M;
    ctx.beginPath();
    ctx.arc(0, 0, 0.795 * M, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 0.935 * M, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // beads
  ctx.beginPath();
  const n = 96;
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    const x = Math.cos(t) * 0.958 * M;
    const y = Math.sin(t) * 0.958 * M;
    ctx.moveTo(x + 0.0085 * M, y);
    ctx.arc(x, y, 0.0085 * M, 0, Math.PI * 2);
  }
  ctx.fill();
  if (textAlpha <= 0) return;
  ctx.globalAlpha = textAlpha;
  const r = 0.866 * M;
  const px = 0.098 * M;
  arcText(ctx, topText, r, px, family, true);
  arcText(ctx, bottomText, r, px, family, false);
  // separators at 3 and 9 o'clock
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(s * r, 0, 0.016 * M, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/** Machine-turned field: fine concentric rings, very low contrast. */
function turnedField(ctx: CanvasRenderingContext2D, M: number) {
  ctx.fillStyle = FIELD;
  ctx.fillRect(-M, -M, 2 * M, 2 * M);
  ctx.strokeStyle = alpha(RISO.paper, 0.05);
  ctx.lineWidth = Math.max(0.6, 0.0016 * M);
  for (let r = 0.012 * M; r < M; r += 0.0075 * M) {
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function begin(c: HTMLCanvasElement, fill: string | null) {
  const ctx = ctx2(c);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fillRect(0, 0, c.width, c.height);
  } else ctx.clearRect(0, 0, c.width, c.height);
  ctx.translate(c.width / 2, c.height / 2);
  return ctx;
}

/* ---------------------------------------------------------------- emblem */

let SKATE: { body: Path2D; wheels: [number, number, number][]; rect: [number, number, number, number] } | null = null;

/** The skate portal silhouette, parsed from the shared icon (100×100 units). */
function skate() {
  if (SKATE) return SKATE;
  const svg = PORTAL_ICONS.skate.svg;
  const d = svg.match(/d="([^"]+)"/)?.[1] ?? "";
  const wheels = [...svg.matchAll(/<circle cx="([\d.]+)" cy="([\d.]+)" r="([\d.]+)"/g)].map((m) => [Number(m[1]), Number(m[2]), Number(m[3])] as [number, number, number]);
  const r = svg.match(/<rect x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)"/);
  SKATE = { body: new Path2D(d), wheels, rect: r ? [Number(r[1]), Number(r[2]), Number(r[3]), Number(r[4])] : [86, 77, 7, 8] };
  return SKATE;
}

/** Centre emblem: a sunburst ring and the skate that opened this world, raised. */
function emblem(ctx: CanvasRenderingContext2D, M: number, color: string, strength: number) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.55 * strength;
  ctx.lineWidth = Math.max(1, 0.0045 * M);
  ctx.beginPath();
  const n = 120;
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    ctx.moveTo(Math.cos(t) * 0.31 * M, Math.sin(t) * 0.31 * M);
    ctx.lineTo(Math.cos(t) * 0.385 * M, Math.sin(t) * 0.385 * M);
  }
  ctx.stroke();
  ctx.globalAlpha = strength;
  ctx.lineWidth = 0.006 * M;
  ctx.beginPath();
  ctx.arc(0, 0, 0.3 * M, 0, Math.PI * 2);
  ctx.stroke();
  const k = (0.42 * M) / 100;
  const S = skate();
  ctx.translate(-0.53 * 100 * k, -0.5 * 100 * k);
  ctx.scale(k, k);
  ctx.fill(S.body);
  for (const [cx, cy, r] of S.wheels) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillRect(...S.rect);
  ctx.restore();
}

/* ------------------------------------------------------------ the trail look */

/** Shared look of a finished lap (the rink trail and the neon medal face must match). */
export function trailStyle(i: number, N: number, scale: number, glow: boolean) {
  return {
    color: lapColor(i, N),
    alpha: 0.66,
    width: 1.15 * scale,
    glow: glow ? 9 * scale : undefined,
    glowAlpha: glow ? 0.07 : undefined,
  };
}

/* ------------------------------------------------------------------ faces */

export type FrontInput = { P: RosetteParams; eps: Float32Array; M0: number; glow: boolean; serif: string };

/** Obverse: the rosette the visitor drew, plus "ROLLER SKATING · STATE LEVEL". */
export function buildFront(face: FaceSet, inp: FrontInput) {
  const { P, eps, M0, glow, serif } = inp;
  // emissive: ink + neon laps, in rink pixels scaled to the face
  {
    const c = face.emissive;
    const ctx = begin(c, RISO.ink);
    const k = c.width / 2 / M0;
    ctx.scale(k, k);
    ctx.globalCompositeOperation = "lighter";
    strokeLaps(ctx, P, eps, 0, P.N, (i) => trailStyle(i, P.N, 1, glow));
  }
  const M = face.size / 2;
  const k = M / M0;
  // height
  {
    const ctx = begin(face.height, "#000");
    ctx.save();
    ctx.scale(k, k);
    ctx.globalCompositeOperation = "lighter";
    strokeLaps(ctx, P, eps, 0, P.N, () => ({ color: "#ffffff", alpha: 0.5, width: 1.9 / Math.max(1, k) + 0.9 }));
    ctx.restore();
    ctx.globalCompositeOperation = "source-over";
    rimBand(ctx, M, "#ffffff", "ROLLER SKATING", "STATE LEVEL", serif, 1, true);
    emblem(ctx, M, "#ffffff", 1);
  }
  // albedo
  {
    const ctx = begin(face.albedo, null);
    ctx.drawImage(fieldOf(face), -M, -M);
    ctx.save();
    ctx.scale(k, k);
    strokeLaps(ctx, P, eps, 0, P.N, () => ({ color: RAISED, alpha: 0.56, width: 1.9 / Math.max(1, k) + 0.9 }));
    ctx.restore();
    rimBand(ctx, M, RAISED, "ROLLER SKATING", "STATE LEVEL", serif, 1);
    emblem(ctx, M, RAISED, 1);
  }
  face.ve++;
  face.vh++;
  face.va++;
  face.version++;
}

/* ------------------------------------------------------------------ lotus */

type Petal = { pts: Float32Array; color: string };

/** Eight breath strokes: centre petal, three pairs, and the cup they sit in (face units, M = 1). */
export function lotusStrokes(): Petal[] {
  const out: Petal[] = [];
  const base = { x: 0, y: 0.29 };
  const petal = (ang: number, len: number, wid: number, color: string) => {
    const n = 44;
    const pts = new Float32Array((n * 2 + 1) * 2);
    const c = Math.cos(ang);
    const s = Math.sin(ang);
    const cubic = (p0: number, p1: number, p2: number, p3: number, t: number) => {
      const u = 1 - t;
      return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
    };
    let k = 0;
    const put = (lx: number, ly: number) => {
      pts[k++] = base.x + lx * c - ly * s;
      pts[k++] = base.y + lx * s + ly * c;
    };
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      put(cubic(0, -wid * 1.05, -wid * 0.62, 0, t), cubic(0, -len * 0.3, -len * 0.78, -len, t));
    }
    for (let i = 1; i <= n; i++) {
      const t = i / n;
      put(cubic(0, wid * 0.62, wid * 1.05, 0, t), cubic(-len, -len * 0.78, -len * 0.3, 0, t));
    }
    out.push({ pts, color });
  };
  const D = Math.PI / 180;
  petal(0, 0.6, 0.15, RISO.teal);
  petal(-24 * D, 0.54, 0.15, RISO.cobalt);
  petal(24 * D, 0.54, 0.15, RISO.cobalt);
  petal(-50 * D, 0.45, 0.135, RISO.teal);
  petal(50 * D, 0.45, 0.135, RISO.teal);
  petal(-77 * D, 0.34, 0.115, RISO.cobalt);
  petal(77 * D, 0.34, 0.115, RISO.cobalt);
  // the cup / water line
  {
    const n = 60;
    const pts = new Float32Array((n + 1) * 2);
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const x = -0.5 + t;
      pts[i * 2] = x;
      pts[i * 2 + 1] = 0.4 + 0.1 * Math.cos(t * Math.PI * 2) * 0.35 + 0.12 * Math.sin(t * Math.PI);
    }
    out.push({ pts, color: RISO.teal });
  }
  return out;
}

const LOTUS = lotusStrokes();

/** Stroke the first `amount` (0..8) breath strokes, scaled to face radius M. */
function strokeLotus(ctx: CanvasRenderingContext2D, M: number, amount: number, style: (p: Petal) => void) {
  LOTUS.forEach((p, i) => {
    const f = Math.max(0, Math.min(1, amount - i));
    if (f <= 0) return;
    const n = p.pts.length / 2;
    const upto = Math.max(1, Math.floor(f * (n - 1)));
    style(p);
    ctx.beginPath();
    ctx.moveTo(p.pts[0] * M, p.pts[1] * M);
    for (let j = 1; j <= upto; j++) ctx.lineTo(p.pts[j * 2] * M, p.pts[j * 2 + 1] * M);
    if (upto < n - 1) {
      // sub-sample the last segment so the stroke grows smoothly
      const t = f * (n - 1) - upto;
      const x = p.pts[upto * 2] + (p.pts[(upto + 1) * 2] - p.pts[upto * 2]) * t;
      const y = p.pts[upto * 2 + 1] + (p.pts[(upto + 1) * 2 + 1] - p.pts[upto * 2 + 1]) * t;
      ctx.lineTo(x * M, y * M);
    }
    ctx.stroke();
  });
}

export type BackInput = { lotus: number; relief: number; insc: number; glow: boolean; serif: string };

/** Reverse: a struck blank, then the breath lotus and "YOGA · STATE LEVEL". Redraws only what changed. */
export function buildBack(face: FaceSet, inp: BackInput) {
  const { lotus, relief, insc, glow, serif } = inp;
  const last = face.last;
  const fresh = last.serif !== serif;
  if (fresh || last.lotus !== lotus) {
    // emissive (black field: adds light only where the strokes glow)
    const c = face.emissive;
    const ctx = begin(c, "#000");
    const M = c.width / 2;
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (glow) {
      strokeLotus(ctx, M, lotus, (p) => {
        ctx.strokeStyle = p.color;
        ctx.globalAlpha = 0.22;
        ctx.lineWidth = 0.05 * M;
      });
    }
    strokeLotus(ctx, M, lotus, (p) => {
      ctx.strokeStyle = p.color;
      ctx.globalAlpha = 0.9;
      ctx.lineWidth = 0.016 * M;
    });
    strokeLotus(ctx, M, lotus, () => {
      ctx.strokeStyle = RISO.paper;
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = 0.005 * M;
    });
    face.ve++;
  }
  const reliefChanged = fresh || last.relief !== relief || last.insc !== insc || (relief > 0 && last.lotus !== lotus);
  if (reliefChanged) {
    const M = face.size / 2;
    {
      const ctx = begin(face.height, "#000");
      rimBand(ctx, M, "#ffffff", "YOGA", "STATE LEVEL", serif, insc, true);
      if (relief > 0) {
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        strokeLotus(ctx, M, lotus, () => {
          ctx.strokeStyle = "#ffffff";
          ctx.globalAlpha = relief;
          ctx.lineWidth = 0.02 * M;
        });
        ctx.globalAlpha = 1;
      }
    }
    {
      const ctx = begin(face.albedo, null);
      ctx.drawImage(fieldOf(face), -M, -M);
      rimBand(ctx, M, RAISED, "YOGA", "STATE LEVEL", serif, insc);
      if (relief > 0) {
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        strokeLotus(ctx, M, lotus, () => {
          ctx.strokeStyle = mix(FIELD, RAISED, 0.85);
          ctx.globalAlpha = relief;
          ctx.lineWidth = 0.02 * M;
        });
        ctx.globalAlpha = 1;
      }
    }
    face.vh++;
    face.va++;
  }
  face.last = { lotus, relief, insc, serif };
  face.version++;
}

/* ------------------------------------------------------------ 2D emboss */

export function makeFace2D(size: number): Face2D {
  return { hi: makeCanvas(size), lo: makeCanvas(size), size, version: -1 };
}

/** Derive the highlight (screen) and shade (multiply) layers from a height map. */
export function tint2D(face: FaceSet, out: Face2D) {
  const s = out.size;
  {
    const ctx = ctx2(out.hi);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.drawImage(face.height, 0, 0, s, s);
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = RISO.paper;
    ctx.fillRect(0, 0, s, s);
    ctx.globalCompositeOperation = "source-over";
  }
  {
    const ctx = ctx2(out.lo);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, s, s);
    ctx.globalCompositeOperation = "difference";
    ctx.drawImage(face.height, 0, 0, s, s);
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = SHADE;
    ctx.fillRect(0, 0, s, s);
    ctx.globalCompositeOperation = "source-over";
  }
  out.version = face.version;
}

export type Draw2D = {
  x: number;
  y: number;
  r: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  metal: number;
  bump: number;
  E: number;
  rim: number;
  /** Extra sheen phase (time or tilt driven). */
  sheen: number;
};

const SHEEN_STOPS = [RISO.pink, RISO.sun, RISO.teal, RISO.cobalt, RISO.pink];

/**
 * Paint one medal with the 2D emboss: coin edge, albedo, light-offset relief,
 * a riso-ink iridescent sheen, a specular band, the bevelled rim, and the neon
 * emissive state on top. `front` / `back` are the face sets for each side.
 */
export function drawMedal2D(
  ctx: CanvasRenderingContext2D,
  d: Draw2D,
  front: { face: FaceSet; flat: Face2D },
  back: { face: FaceSet; flat: Face2D } | null,
  backE = 0,
) {
  const cy = Math.cos(d.rotY);
  const sx = Math.abs(cy);
  const sy = Math.max(0.04, Math.cos(d.rotX));
  const r = d.r;
  if (r < 0.5) return;
  const showBack = cy < 0 && back;
  const side = showBack ? back : front;
  const metal = d.metal;

  ctx.save();
  ctx.translate(d.x, d.y);

  // coin edge (thickness), visible as the disc turns
  if (metal > 0.02) {
    const t = r * 0.085;
    const ox = -Math.sin(d.rotY) * t * Math.sign(cy || 1);
    const oy = -Math.sin(d.rotX) * t;
    ctx.globalAlpha = metal;
    const steps = 5;
    for (let i = steps; i >= 1; i--) {
      const f = i / steps;
      ctx.fillStyle = mix(mix(RISO.ink, RISO.paper, 0.32), RISO.ink, f * 0.6);
      ctx.beginPath();
      ctx.ellipse(ox * f, oy * f, Math.max(0.6, r * sx), r * sy, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  if (sx < 0.03) {
    ctx.restore();
    return;
  }

  ctx.save();
  ctx.scale(sx, sy);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.rotate(showBack ? -d.rotZ : d.rotZ);

  if (metal > 0) {
    ctx.globalAlpha = metal;
    ctx.drawImage(side.face.albedo, -r, -r, 2 * r, 2 * r);
    // relief: shade below-right, highlight above-left (the light follows the tilt)
    const relief = metal * d.bump;
    if (relief > 0) {
      const o = Math.max(0.7, r * 0.0075);
      const lx = (-0.62 + d.rotY * 1.2) * o;
      const ly = (-0.78 - d.rotX * 1.2) * o;
      ctx.globalAlpha = relief;
      ctx.globalCompositeOperation = "multiply";
      ctx.drawImage(side.flat.lo, -r - lx, -r - ly, 2 * r, 2 * r);
      ctx.globalCompositeOperation = "screen";
      ctx.drawImage(side.flat.hi, -r + lx, -r + ly, 2 * r, 2 * r);
    }
    ctx.globalCompositeOperation = "source-over";
  }
  ctx.rotate(showBack ? d.rotZ : -d.rotZ);

  if (metal > 0) {
    // iridescent sheen: a riso-ink spectrum laid over the metal, raked by the tilt
    const ang = 0.7 + d.sheen + d.rotY * 2.2 + d.rotX * 1.6;
    const gx = Math.cos(ang) * r;
    const gy = Math.sin(ang) * r;
    const g = ctx.createLinearGradient(-gx, -gy, gx, gy);
    SHEEN_STOPS.forEach((c, i) => g.addColorStop(i / (SHEEN_STOPS.length - 1), c));
    ctx.globalAlpha = 0.42 * metal;
    ctx.globalCompositeOperation = "overlay";
    ctx.fillStyle = g;
    ctx.fillRect(-r, -r, 2 * r, 2 * r);
    // specular band
    const band = 0.35 * Math.sin(d.sheen * 0.7) + d.rotY * 1.4 - d.rotX * 0.9;
    const bx = Math.cos(ang + Math.PI / 2) * r;
    const by = Math.sin(ang + Math.PI / 2) * r;
    const sg = ctx.createLinearGradient(-bx, -by, bx, by);
    const c0 = Math.max(0.02, Math.min(0.9, 0.42 + band * 0.4));
    sg.addColorStop(0, alpha(RISO.paper, 0));
    sg.addColorStop(Math.max(0, c0 - 0.16), alpha(RISO.paper, 0));
    sg.addColorStop(c0, alpha(RISO.paper, 0.5));
    sg.addColorStop(Math.min(1, c0 + 0.16), alpha(RISO.paper, 0));
    sg.addColorStop(1, alpha(RISO.paper, 0));
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = 0.85 * metal;
    ctx.fillStyle = sg;
    ctx.fillRect(-r, -r, 2 * r, 2 * r);
    // roundness
    const rg = ctx.createRadialGradient(-0.2 * r, -0.25 * r, 0.25 * r, 0, 0, r);
    rg.addColorStop(0, alpha(RISO.ink, 0));
    rg.addColorStop(1, alpha(RISO.ink, 0.42));
    ctx.globalCompositeOperation = "multiply";
    ctx.globalAlpha = metal;
    ctx.fillStyle = rg;
    ctx.fillRect(-r, -r, 2 * r, 2 * r);
    ctx.globalCompositeOperation = "source-over";
  }

  // neon state on top (obverse: the rosette; reverse: the breath strokes)
  const E = showBack ? backE : d.E;
  if (E > 0) {
    ctx.rotate(showBack ? -d.rotZ : d.rotZ);
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = E;
    ctx.drawImage(side.face.emissive, -r, -r, 2 * r, 2 * r);
    ctx.globalCompositeOperation = "source-over";
    ctx.rotate(showBack ? d.rotZ : -d.rotZ);
  }
  ctx.restore();

  // bevelled rim
  if (d.rim > 0 && metal > 0) {
    ctx.save();
    ctx.scale(sx, sy);
    const lg = ctx.createLinearGradient(-r * 0.7, -r * 0.7, r * 0.7, r * 0.7);
    lg.addColorStop(0, RISO.paper);
    lg.addColorStop(0.45, mix(RISO.paper, RISO.sun, 0.35));
    lg.addColorStop(1, mix(RISO.ink, RISO.cobalt, 0.35));
    ctx.globalAlpha = d.rim * metal;
    ctx.strokeStyle = lg;
    ctx.lineWidth = r * 0.06;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.968, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = alpha(RISO.ink, 0.55);
    ctx.lineWidth = Math.max(0.6, r * 0.008);
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.936, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

/** Radius of the rosette inside a face of radius M. */
export const rosetteRadius = (M: number) => M * RING_IN;
