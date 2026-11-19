/**
 * A polar grid whose rows follow the ridges: every ring of vertices sits on a
 * level set of F, so each crest is resolved by construction however close the
 * camera gets. The vertex shader lifts it; the fragment shader shades it
 * analytically, so the polygon count only has to carry the silhouette.
 *
 * The build is ~10 F() bisections per vertex, so it never runs in one go on the
 * main thread: it is sliced into idle-time chunks and cached for the session,
 * so a remount (scrolling back past Hackathons and returning) is free.
 */
import { CX, CY, F, LAMBDA, rimAt } from "./field";

export type RidgeMesh = { position: Float32Array; index: Uint32Array };

/** A resumable build: `step(ms)` works for about `ms` and returns true once done. */
function ridgeMeshJob(segments: number, rowsPerRidge: number, maxCrest: number) {
  const rows = Math.ceil(maxCrest * rowsPerRidge) + 1;
  const pos = new Float32Array(segments * rows * 3);
  const keep = new Uint8Array(segments * rows);
  const idx = new Uint32Array(segments * (rows - 1) * 6);
  const step = LAMBDA / rowsPerRidge;
  let seg = 0;
  let quadSeg = 0;
  let n = 0;
  let result: RidgeMesh | null = null;

  const ring = (i: number) => {
    const a = (i / segments) * Math.PI * 2;
    const c = Math.cos(a);
    const s = Math.sin(a);
    let r = 0;
    for (let j = 0; j < rows; j++) {
      if (j > 0) {
        const level = j * step;
        let lo = r;
        let hi = r + LAMBDA;
        let guard = 0;
        while (F(CX + c * hi, CY + s * hi) < level && guard++ < 64) hi += LAMBDA;
        for (let k = 0; k < 9; k++) {
          const m = (lo + hi) / 2;
          if (F(CX + c * m, CY + s * m) < level) lo = m;
          else hi = m;
        }
        r = (lo + hi) / 2;
      }
      const x = CX + c * r;
      const y = CY + s * r;
      const o = (i * rows + j) * 3;
      pos[o] = x;
      pos[o + 1] = y;
      keep[i * rows + j] = rimAt(x, y) < 1.05 ? 1 : 0;
    }
  };

  const quads = (i: number) => {
    const nx = (i + 1) % segments;
    for (let j = 0; j < rows - 1; j++) {
      const a = i * rows + j;
      const b = nx * rows + j;
      const c = nx * rows + j + 1;
      const d = i * rows + j + 1;
      if (!keep[a] && !keep[b] && !keep[c] && !keep[d]) continue;
      idx[n++] = a;
      idx[n++] = d;
      idx[n++] = b;
      idx[n++] = b;
      idx[n++] = d;
      idx[n++] = c;
    }
  };

  return {
    step(ms: number) {
      if (result) return true;
      const end = now() + ms;
      do {
        if (seg < segments) ring(seg++);
        else if (quadSeg < segments) {
          // the index pass is cheap: a few rings per clock check
          for (let q = 0; q < 16 && quadSeg < segments; q++) quads(quadSeg++);
        } else {
          result = { position: pos, index: idx.subarray(0, n) };
          return true;
        }
      } while (now() < end);
      return false;
    },
    get result() {
      return result;
    },
  };
}

const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());

/** Synchronous build (tools and tests). */
export function buildRidgeMesh(segments: number, rowsPerRidge: number, maxCrest: number): RidgeMesh {
  const job = ridgeMeshJob(segments, rowsPerRidge, maxCrest);
  while (!job.step(1e9));
  return job.result as RidgeMesh;
}

const cache = new Map<string, Promise<RidgeMesh>>();
const done = new Map<string, RidgeMesh>();

type Idle = { timeRemaining(): number };
type IdleWindow = Window & {
  requestIdleCallback?: (cb: (d: Idle) => void, o?: { timeout: number }) => number;
};

/** The relief for this device class, built in idle slices and cached for the session. */
export function loadRidgeMesh(lowPower: boolean): Promise<RidgeMesh> {
  const key = lowPower ? "low" : "full";
  const hit = cache.get(key);
  if (hit) return hit;
  const job = lowPower ? ridgeMeshJob(300, 5, 34) : ridgeMeshJob(620, 7, 36);
  const p = new Promise<RidgeMesh>((resolve) => {
    const w = (typeof window !== "undefined" ? window : undefined) as IdleWindow | undefined;
    const tick = (d?: Idle) => {
      // never more than one frame's worth of work at a time
      const ms = d ? Math.min(10, Math.max(4, d.timeRemaining())) : 6;
      if (job.step(ms)) {
        const r = job.result as RidgeMesh;
        done.set(key, r);
        resolve(r);
      } else schedule();
    };
    const schedule = () => {
      if (w?.requestIdleCallback) w.requestIdleCallback(tick, { timeout: 60 });
      else setTimeout(() => tick(), 0);
    };
    schedule();
  });
  cache.set(key, p);
  return p;
}

/** The cached relief, if it has finished building. */
export function readyRidgeMesh(lowPower: boolean): RidgeMesh | null {
  return done.get(lowPower ? "low" : "full") ?? null;
}
