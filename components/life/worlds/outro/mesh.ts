/**
 * A polar grid whose rows follow the ridges: every ring of vertices sits on a
 * level set of F, so each crest is resolved by construction however close the
 * camera gets. The vertex shader lifts it; the fragment shader shades it
 * analytically, so the polygon count only has to carry the silhouette.
 */
import { CX, CY, F, LAMBDA, rimAt } from "./field";

export function buildRidgeMesh(segments: number, rowsPerRidge: number, maxCrest: number) {
  const rows = Math.ceil(maxCrest * rowsPerRidge) + 1;
  const pos = new Float32Array(segments * rows * 3);
  const keep = new Uint8Array(segments * rows);
  const step = LAMBDA / rowsPerRidge;

  for (let i = 0; i < segments; i++) {
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
  }

  const idx: number[] = [];
  for (let i = 0; i < segments; i++) {
    const n = (i + 1) % segments;
    for (let j = 0; j < rows - 1; j++) {
      const a = i * rows + j;
      const b = n * rows + j;
      const c = n * rows + j + 1;
      const d = i * rows + j + 1;
      if (!keep[a] && !keep[b] && !keep[c] && !keep[d]) continue;
      idx.push(a, d, b, b, d, c);
    }
  }
  return { position: pos, index: new Uint32Array(idx) };
}
