/** Where everything happens on the world's 0 → 1 timeline (meta.length = 6 stage heights). */
import { clamp } from "@/components/life/multiverse/ease";

export const BEAT = {
  iconsIn: [0.012, 0.044],
  unspool: [0.044, 0.094],
  titleOut: [0.068, 0.094],
  flight: [0.09, 0.254],
  chaos: [0.112, 0.234],
  crane: [0.254, 0.329],
  scan: [0.331, 0.371],
  stamp: 0.371,
  headlineOut: [0.417, 0.433],
  // all nine lit by ~.482, held until the honest line takes the column at .50
  domains: [0.429, 0.485],
  // fully in by ~.526, held at full strength to ~.571
  honest: [0.5, 0.585],
  toValues: [0.585, 0.607],
  values: [0.603, 0.794],
  // stacked: CURRENTLY typed by ~.825 and held to .855; NEXT in by ~.893 and held to ~.938
  finale: [0.794, 0.857],
  next: [0.855, 0.94],
  story: [0.95, 0.98],
} as const;

/** Slot of value `i` inside the values beat, as [start, end]. */
export function valueSlot(i: number): [number, number] {
  const [a, b] = BEAT.values;
  const w = (b - a) / 5;
  return [a + w * i, a + w * (i + 1)];
}

export const ramp01 = (v: number, a: number, b: number) => clamp((v - a) / (b - a));
