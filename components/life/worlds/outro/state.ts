/** Scroll → shader uniforms that are not the camera. */
import { range, smoothstep } from "@/components/life/multiverse/ease";
import { BEAT, valueSlot } from "./beats";
import { MINUTIAE, PH } from "./field";
import { VALUE_ORDER } from "./camera";
import type { Rig } from "./rig";

const out = { dim: 0, scanY: 0, scanOn: 0, pen: 0, penStart: 0, focusX: 0, focusY: 0, focusR: 0 };

/** Chronological: Anchoring first (the core), Hackathons last (the rim). */
export function igniteAt(p: number, into: number[]) {
  const [a, b] = BEAT.unspool;
  const step = (b - a) / 13;
  for (let i = 0; i < 11; i++) into[i] = smoothstep(range(p, a + step * i, a + step * (i + 3)));
  into[11] = 0;
  into[12] = 0;
}

/** Polar angle (deg) where the live edge's pen comes to rest. */
export const penRestDeg = (stacked: boolean) => (stacked ? -96 : -14);
const PEN_TURNS = 0.97;
const penStartFor = (stacked: boolean) => penRestDeg(stacked) / 360 + (1 - PEN_TURNS);

/** Print y of the scan head (the DOM bar and the shader share it). */
export function scanYAt(p: number) {
  return PH / 2 + 0.06 - range(p, BEAT.scan[0], BEAT.scan[1]) * (PH + 0.12);
}

export function shaderState(rig: Rig) {
  const p = rig.p;
  const [sa, sb] = BEAT.scan;
  out.scanY = scanYAt(p);
  out.scanOn = p > sa && p < sb ? 1 : 0;

  // the headline owns the print for a moment
  const stampIn = range(p, BEAT.stamp - 0.004, BEAT.stamp + 0.02);
  const stampOut = range(p, BEAT.headlineOut[0], BEAT.headlineOut[1]);
  out.dim = 0.58 * smoothstep(stampIn) * (1 - smoothstep(stampOut));

  // the pen writes the live edge around the print
  // (it stops a sliver short of closing, right where the line leaves for the button)
  out.penStart = penStartFor(rig.docks.mobile);
  out.pen = p <= BEAT.finale[0] ? 0 : smoothstep(range(p, BEAT.finale[0], BEAT.next[1])) * PEN_TURNS;

  // focus on the current minutia
  const [va, vb] = BEAT.values;
  const on = range(p, va - 0.012, va + 0.006) * (1 - range(p, vb - 0.002, vb + 0.02));
  if (on > 0) {
    let i = 0;
    while (i < 4 && p >= valueSlot(i + 1)[0]) i++;
    const m = MINUTIAE[VALUE_ORDER[i]];
    const prev = i > 0 ? MINUTIAE[VALUE_ORDER[i - 1]] : m;
    const [a, b] = valueSlot(i);
    const k = smoothstep(range(p, a, a + (b - a) * 0.42));
    out.focusX = prev.x + (m.x - prev.x) * k;
    out.focusY = prev.y + (m.y - prev.y) * k;
    // opens from the print-wide light into a pool around the minutia
    out.focusR = 0.07 + (1.1 - 0.07) * (1 - on);
  } else {
    out.focusR = 0;
  }
  return out;
}
