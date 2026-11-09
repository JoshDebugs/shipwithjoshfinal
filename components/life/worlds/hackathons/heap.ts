/**
 * THE CRASH, baked.
 *
 * One deterministic matter-js run per stage size decides how every piece of
 * the poster falls and where it comes to rest. The whole run is recorded
 * (x, y, angle, impact per frame) and the engine thrown away, so at play time
 * the heap is only array lookups: scrolling back un-crashes the page exactly
 * and a resize simply re-bakes it. No physics state survives the bake.
 *
 * The pile lives on three parallel planes so a poster's worth of paper fits
 * under the error sheet: the cards at the back, the bars and chips in the
 * middle, the letters and loose bits in front. Nothing crosses inside a plane.
 */
import Matter from "matter-js";
import { clamp, hash } from "@/components/life/multiverse/ease";
import { planeOf, type Geo, type PieceDef } from "./geometry";
import { B } from "./timeline";

const { Bodies, Body, Composite, Engine, Vertices } = Matter;

/** Recorded channels per piece per frame. */
const CH = 4;
const FPS = 60;
/** Physics substeps per recorded frame: thin bars at these speeds need it. */
const SUB = 3;
/** Sim seconds the whole fall is allowed. */
const SECONDS = 2.8;
/** When the pile starts being talked down to rest (sim seconds). */
const SETTLE_FROM = 1.7;
/** The chosen rolls of the dice (picked by eye: chaos, but every letter reads). */
const SALT_DESK = 9;
const SALT_PHONE = 4;

export type Bake = {
  frames: number;
  /** frames × pieces × CH: x, y, deg, impact. */
  data: Float32Array;
  /** Story time the hot reload picks each piece up. */
  springAt: Float32Array;
  /** Highest point of the settled pile (px from the stage top). */
  top: number;
  /** The hardest landings: where a halftone ring goes off, in story time. */
  hits: Hit[];
};

export type Hit = { s: number; x: number; y: number; p: number };

const MAX_HITS = 8;

type Made = { body: Matter.Body; ox: number; oy: number };

const CATS = [0x0002, 0x0004, 0x0008, 0x0020, 0x0040, 0x0080];
/** On a phone each card is as wide as the stage, so each falls on its own plane and they fan out instead of stacking. */
const catOf = (p: PieceDef, g: Geo) => (g.mobile && p.kind === "card" ? CATS[3 + p.index] : CATS[planeOf(p.kind)]);
const CARD_CATS = CATS[0] | CATS[3] | CATS[4] | CATS[5];

type Feel = { density: number; bounce: number; friction: number; inertia: number };

const FEEL: Partial<Record<PieceDef["kind"], Feel>> = {
  card: { density: 0.0026, bounce: 0.06, friction: 0.7, inertia: 1.15 },
  slab: { density: 0.004, bounce: 0.05, friction: 0.65, inertia: 1 },
  letter: { density: 0.0022, bounce: 0.22, friction: 0.62, inertia: 1.35 },
  sun: { density: 0.0014, bounce: 0.46, friction: 0.5, inertia: 1 },
  burst: { density: 0.0014, bounce: 0.4, friction: 0.5, inertia: 1 },
  sticker: { density: 0.0014, bounce: 0.46, friction: 0.5, inertia: 1 },
};
const DEFAULT_FEEL: Feel = { density: 0.0014, bounce: 0.3, friction: 0.6, inertia: 1 };

function makeBody(p: PieceDef, g: Geo): Made {
  const { rect } = p;
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  const feel = FEEL[p.kind] ?? DEFAULT_FEEL;
  const cat = catOf(p, g);
  const common = {
    density: feel.density,
    restitution: feel.bounce,
    friction: feel.friction,
    frictionStatic: 0.9,
    frictionAir: 0.006,
    slop: 0.02,
    collisionFilter: { category: cat, mask: 0x0001 | cat, group: 0 },
  };

  const w = rect.w;
  const h = rect.h;
  let body: Matter.Body;
  let ox = 0;
  let oy = 0;

  if (p.kind === "sun" || p.kind === "sticker") {
    body = Bodies.circle(cx, cy, w / 2, common, 44);
  } else if (p.kind === "burst") {
    // the points are soft: rest on a radius just inside them
    body = Bodies.circle(cx, cy, w * 0.43, common, 32);
  } else if (p.kind === "letter" && p.text?.length === 1) {
    const ch = p.text;
    const inset = w * 0.975;
    if (ch === "A") {
      const verts = [
        { x: -inset / 2, y: h / 2 },
        { x: -w * 0.17, y: -h / 2 },
        { x: w * 0.17, y: -h / 2 },
        { x: inset / 2, y: h / 2 },
      ];
      const c = Vertices.centre(verts);
      body = Bodies.fromVertices(cx + c.x, cy + c.y, [verts], common);
      ox = -c.x;
      oy = -c.y;
    } else if (ch === "T") {
      const bar = Bodies.rectangle(cx, cy - h / 2 + h * 0.125, inset, h * 0.25, common);
      const stem = Bodies.rectangle(cx, cy + h * 0.125, w * 0.36, h * 0.75, common);
      body = Body.create({ parts: [bar, stem], ...common });
      ox = cx - body.position.x;
      oy = cy - body.position.y;
    } else {
      const round = ch === "O" || ch === "C" || ch === "S";
      body = Bodies.rectangle(cx, cy, inset, h, { ...common, chamfer: { radius: round ? h * 0.34 : h * 0.05 } });
    }
  } else {
    const r = Math.min(h * 0.12, 6);
    body = Bodies.rectangle(cx, cy, w, h, { ...common, chamfer: { radius: r } });
  }

  if (feel.inertia !== 1) Body.setInertia(body, body.inertia * feel.inertia);
  if (p.r0 !== 0) Body.setAngle(body, (p.r0 * Math.PI) / 180);
  return { body, ox, oy };
}

/** When the piece lets go (sim seconds): the layout gives way from the bottom up. */
function releaseTime(p: PieceDef, g: Geo, seed: number) {
  // the sun is round and early: it gets to the floor first and rolls to the wall
  if (p.kind === "sun") return 0.04;
  const fromBottom = 1 - clamp((p.rect.y + p.rect.h) / g.floor);
  return fromBottom * 0.34 + hash(seed + 7) * 0.05;
}

function kick(p: PieceDef, g: Geo, seed: number) {
  const { W, mobile } = g;
  const cx = p.rect.x + p.rect.w / 2;
  const side = (cx - W / 2) / (W / 2);
  const j = hash(seed + 2) - 0.5;
  const dir = hash(seed + 3) < 0.5 ? -1 : 1;
  const scale = mobile ? 0.45 : 1;
  switch (p.kind) {
    case "card":
      return { vx: j * 40 * scale, vy: 0, w: j * 1.2 };
    case "slab":
      return { vx: (p.index === 0 ? 70 : -70) * scale, vy: 0, w: (p.index === 0 ? 0.5 : -0.7) * (0.7 + hash(seed + 4) * 0.6) };
    case "letter":
      // the heading caves in toward the middle, so the pile gets a peak
      return { vx: (-side * 520 + j * 1100) * scale, vy: -110 - hash(seed + 5) * 240, w: dir * (0.6 + hash(seed + 4) * 2.2) * (mobile ? 0.4 : 1) };
    case "sun":
      return { vx: 240 * scale, vy: 0, w: 2.4 };
    case "burst":
    case "sticker":
      return { vx: (-side * 220 + j * 420) * scale, vy: -60, w: dir * 3 };
    default:
      return { vx: (j * 560 - side * 200) * scale, vy: -hash(seed + 5) * 260, w: dir * (2 + hash(seed + 4) * 4) };
  }
}

/** Hidden rubble under each card: what it comes to lean on (only the cards' plane feels it). */
function wedges(g: Geo) {
  const cards = g.pieces.filter((p) => p.kind === "card");
  const u = g.u;
  const plan = g.mobile
    ? [
        [0.82, 34],
        [0.16, 26],
        [0.74, 40],
      ]
    : [
        [0.8, 62],
        [0.2, 40],
        [0.74, 74],
      ];
  return cards.map((c, i) => ({ x: c.rect.x + c.rect.w * plan[i][0], h: plan[i][1] * u, w: 70 * u }));
}

/** A bake that can be sliced across idle time: the run is deterministic, so pausing changes nothing. */
export class BakeJob {
  private engine: Matter.Engine;
  private made: Made[];
  private release: number[];
  private added: Uint8Array;
  private lastVy: Float32Array;
  private imp: Float32Array;
  private hit: Uint8Array;
  private hits: { f: number; x: number; y: number; p: number }[] = [];
  private data: Float32Array;
  private total: number;
  private f = 0;
  private sub: number;
  private dt: number;
  private g: Geo;
  private salt: number;
  result: Bake | null = null;

  constructor(g: Geo, salt: number = g.mobile ? SALT_PHONE : SALT_DESK) {
    this.g = g;
    this.salt = salt;
    const { W, H, floor, pieces, u } = g;
    const n = pieces.length;
    this.sub = g.mobile ? 2 : SUB;
    this.dt = 1000 / (FPS * this.sub);

    const engine = Engine.create({ enableSleeping: true, positionIterations: 10, velocityIterations: 8, constraintIterations: 2 });
    engine.gravity.x = 0;
    engine.gravity.y = 1;
    // a full-stage drop in a bit over half a second: big things, heavy
    engine.gravity.scale = (2 * H * 0.8) / (0.62 * 0.62) / 1e6;
    this.engine = engine;

    const staticOpts = { isStatic: true, friction: 0.85, frictionStatic: 1, restitution: 0.1, collisionFilter: { category: 0x0001, mask: 0xffff, group: 0 } };
    const margin = (g.mobile ? 8 : 14) * u;
    const wedgeOpts = { ...staticOpts, collisionFilter: { category: 0x0010, mask: CARD_CATS, group: 0 } };
    Composite.add(engine.world, [
      Bodies.rectangle(W / 2, floor + 300, W * 3, 600, staticOpts),
      Bodies.rectangle(-margin - 300, H / 2, 600, H * 6, staticOpts),
      Bodies.rectangle(W + margin + 300, H / 2, 600, H * 6, staticOpts),
      ...wedges(g).map((w) => Bodies.rectangle(w.x, floor - w.h / 2, w.w, w.h, { ...wedgeOpts, chamfer: { radius: 8 } })),
    ]);

    this.made = pieces.map((p) => makeBody(p, g));
    this.release = pieces.map((p, i) => releaseTime(p, g, i * 7.13 + 3 + salt));
    this.added = new Uint8Array(n);
    this.lastVy = new Float32Array(n);
    this.imp = new Float32Array(n);
    this.hit = new Uint8Array(n);
    this.total = Math.ceil(SECONDS * FPS);
    this.data = new Float32Array(this.total * n * CH);
  }

  /** Advance for about `ms`. True once the result is ready. */
  run(ms: number) {
    if (this.result) return true;
    const end = performance.now() + ms;
    do {
      if (this.stepFrame()) {
        this.finishBake();
        return true;
      }
    } while (performance.now() < end);
    return false;
  }

  /** Record one frame. True if the run is over. */
  private stepFrame() {
    const { g, made, added, release, lastVy, imp, data, engine } = this;
    const { pieces } = g;
    const n = pieces.length;
    const f = this.f;
    const t = f / FPS;
    let allAdded = true;
    for (let i = 0; i < n; i++) {
      if (added[i]) continue;
      if (t < release[i]) {
        allAdded = false;
        continue;
      }
      added[i] = 1;
      const b = made[i].body;
      Composite.add(engine.world, b);
      const k = kick(pieces[i], g, i * 7.13 + 3 + this.salt);
      Body.setVelocity(b, { x: k.vx / 60, y: k.vy / 60 });
      Body.setAngularVelocity(b, k.w / 60);
    }

    // late in the fall the air thickens, so the last creep dies out instead of freezing mid-roll
    if (t > SETTLE_FROM) {
      const k = (t - SETTLE_FROM) / (SECONDS - SETTLE_FROM);
      const air = 0.006 + k * k * 0.6;
      for (let i = 0; i < n; i++) if (added[i]) made[i].body.frictionAir = air;
    }

    for (let s = 0; s < this.sub; s++) Engine.update(engine, this.dt);

    let moving = false;
    for (let i = 0; i < n; i++) {
      const { body, ox, oy } = made[i];
      const a = body.angle;
      const c = Math.cos(a);
      const si = Math.sin(a);
      const off = f * n * CH + i * CH;
      data[off] = body.position.x + ox * c - oy * si;
      data[off + 1] = body.position.y + ox * si + oy * c;
      data[off + 2] = (a * 180) / Math.PI;
      // sharp loss of downward speed = a hit
      const vy = body.velocity.y;
      // (speeds scale with the stage, so a hit is measured against its height)
      const dv = Math.max(0, lastVy[i] - vy) * (900 / g.H);
      lastVy[i] = vy;
      imp[i] = Math.max(imp[i] * 0.74, clamp(dv / 26));
      data[off + 3] = imp[i];
      // the first real landing of anything heavy
      if (!this.hit[i] && added[i] && dv > 12) {
        this.hit[i] = 1;
        const kind = pieces[i].kind;
        if (kind === "letter" || kind === "card" || kind === "sun" || kind === "slab") {
          this.hits.push({ f, x: body.position.x, y: Math.min(body.bounds.max.y, g.floor - 2), p: clamp(dv / 34, 0.35, 1) });
        }
      }
      if (added[i] && !body.isSleeping) moving = true;
    }

    this.f = f + 1;
    // everything down and asleep, or out of time
    return (allAdded && !moving && f > 30) || this.f >= this.total;
  }

  private finishBake() {
    const { g, made, data, engine } = this;
    const { W, H, floor, pieces } = g;
    const n = pieces.length;
    const frames = this.f;

    // highest point of the rest pose
    let top = floor;
    for (let i = 0; i < n; i++) {
      const v = made[i].body.bounds.min.y;
      if (v < top) top = v;
    }

    // hot reload order: nearest pieces are picked up first
    const springAt = new Float32Array(n);
    const last = (frames - 1) * n * CH;
    pieces.forEach((p, i) => {
      const off = last + i * CH;
      const cx0 = p.rect.x + p.rect.w / 2;
      const cy0 = p.rect.y + p.rect.h / 2;
      const dist = Math.hypot(data[off] - cx0, data[off + 1] - cy0) / Math.hypot(W, H);
      springAt[i] = B.springA + clamp(dist * 0.6 + hash(i * 7.13 + 11) * 0.4) * B.springSpread;
    });

    const hits = this.hits
      .slice()
      .sort((a, b) => b.p - a.p)
      .slice(0, MAX_HITS)
      .sort((a, b) => a.f - b.f)
      .map((h) => ({ s: B.crash + (h.f / Math.max(1, frames - 1)) * B.simSpan, x: h.x, y: h.y, p: h.p }));

    Engine.clear(engine);
    this.result = { frames, data, springAt, top, hits };
  }
}

/** Run the whole thing right now. */
export function bakeHeap(g: Geo): Bake {
  const job = new BakeJob(g);
  while (!job.run(1000));
  return job.result!;
}

export type Pose = { x: number; y: number; rot: number; impact: number };

/** Where piece i is at story time s (s ≥ B.crash). */
export function samplePose(b: Bake, n: number, i: number, s: number, out: Pose): Pose {
  const f = clamp((s - B.crash) / B.simSpan) * (b.frames - 1);
  const a = Math.floor(f);
  const t = f - a;
  const A = a * n * CH + i * CH;
  const C = Math.min(a + 1, b.frames - 1) * n * CH + i * CH;
  const d = b.data;
  out.x = d[A] + (d[C] - d[A]) * t;
  out.y = d[A + 1] + (d[C + 1] - d[A + 1]) * t;
  out.rot = d[A + 2] + (d[C + 2] - d[A + 2]) * t;
  out.impact = d[A + 3] + (d[C + 3] - d[A + 3]) * t;
  return out;
}

/** Rest pose of piece i, with its angle wound to the nearest turn of `r0`. */
export function restPose(b: Bake, n: number, i: number, r0: number, out: Pose): Pose {
  const A = (b.frames - 1) * n * CH + i * CH;
  const d = b.data;
  out.x = d[A];
  out.y = d[A + 1];
  out.rot = d[A + 2] - 360 * Math.round((d[A + 2] - r0) / 360);
  out.impact = 0;
  return out;
}
