/** Where everything happens on the world's 0 → 1 timeline (meta.length = 6 stage heights). */
import { clamp } from "@/components/life/multiverse/ease";

export const BEAT = {
  iconsIn: [0.012, 0.044],
  unspool: [0.044, 0.094],
  titleOut: [0.068, 0.094],
  flight: [0.09, 0.285],
  chaos: [0.112, 0.262],
  crane: [0.285, 0.36],
  scan: [0.362, 0.402],
  stamp: 0.402,
  headlineOut: [0.448, 0.464],
  domains: [0.46, 0.514],
  honest: [0.506, 0.56],
  toValues: [0.556, 0.578],
  values: [0.574, 0.806],
  finale: [0.806, 0.868],
  next: [0.86, 0.942],
  story: [0.938, 0.974],
} as const;

/** Slot of value `i` inside the values beat, as [start, end]. */
export function valueSlot(i: number): [number, number] {
  const [a, b] = BEAT.values;
  const w = (b - a) / 5;
  return [a + w * i, a + w * (i + 1)];
}

export const ramp01 = (v: number, a: number, b: number) => clamp((v - a) / (b - a));
